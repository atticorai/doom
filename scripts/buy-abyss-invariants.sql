-- ════════════════════════════════════════════════════════════════════
-- THE BUY ABYSS — Phase 1 acceptance invariants, run against real storage
-- ════════════════════════════════════════════════════════════════════
-- Usage (local or Supabase; nothing is left behind — the whole run is
-- one transaction that ends in ROLLBACK):
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/buy-abyss-invariants.sql
--
-- Requires supabase/schema.sql + supabase/buy_abyss.sql already applied.
-- Every check prints PASS; any failure aborts with the reason.
--
-- The three invariants from the integration review:
--   1. After approved v1, altering/inserting a confirmation cannot change
--      any approved-v1 output.
--   2. Accepting a confirmation changes Schedule of Record and variance only.
--   3. A re-approval creates v2; it never mutates v1.
-- plus the two database-enforced rules from the brief:
--   • nothing writes to ba_approved_plan except approval
--   • a confirmation never writes to ba_working_plan
-- ════════════════════════════════════════════════════════════════════

\set ON_ERROR_STOP on
begin;

-- Scratch scenario: Chicago 2027, two TV stations, one radio station.
-- Figures are placeholders for the mechanics; the prototype's numbers
-- replace them once TheBuyAbyss.html / app.py are ported.
create temp table t (k text primary key, v text);
insert into t values ('my', (select id::text from ba_market_year where market = 'Chicago' and year = 2027));

do $$
declare my uuid := (select v::uuid from t where k = 'my');
begin
  assert my is not null, 'seed: Chicago 2027 market_year missing';
  -- isolate from anything already in this market/year
  delete from ba_note where entity_type = 'market_year' and entity_id = my::text;
  assert not exists (select 1 from ba_approved_plan where market_year_id = my), 'scenario expects a fresh Chicago 2027 (no approved versions yet)';
end $$;

insert into ba_vendor_group (market_year_id, name) select v::uuid, 'Paramount' from t where k='my';
insert into ba_vendor_group (market_year_id, name) select v::uuid, 'Nexstar'   from t where k='my';
insert into ba_vendor_group (market_year_id, name) select v::uuid, 'iHeart'    from t where k='my';

insert into ba_station (market_year_id, vendor_group_id, call_sign, media, owner, owner_source, on_buy)
select my.id, vg.id, s.call, s.media, vg.name, 'OWN', true
from ba_market_year my
join (values ('WBBM-TV','TV','Paramount'), ('WGN-TV','TV','Nexstar'), ('WLS-FM','Radio','iHeart')) s(call, media, grp) on true
join ba_vendor_group vg on vg.market_year_id = my.id and vg.name = s.grp
where my.id = (select v::uuid from t where k='my');

insert into ba_budget (market_year_id, amount, set_by, entered_by, source)
select v::uuid, 1000000, 'Finance', 'Jessica Flynn', 'invariant test' from t where k='my';

update ba_working_plan set
  plan = '{"lines":[
     {"key":"WBBM-TV|TV|EM|30","station":"WBBM-TV","media":"TV","daypart":"EM","len":"30","spots":52,"rate":1000,"gross":52000,"net":44200},
     {"key":"WBBM-TV|TV|PR|BE15","station":"WBBM-TV","media":"TV","daypart":"PR","len":"BE15","spots":104,"rate":750,"gross":78000,"net":66300},
     {"key":"WGN-TV|TV|EN|30","station":"WGN-TV","media":"TV","daypart":"EN","len":"30","spots":52,"rate":800,"gross":41600,"net":35360},
     {"key":"WLS-FM|Radio|AMD|60","station":"WLS-FM","media":"Radio","daypart":"AMD","len":"60","spots":260,"rate":150,"gross":39000,"net":33150}
  ]}'::jsonb,
  flighting = '{"weeks":52,"hiatus":[]}'::jsonb,
  demo = 'A25-54', goals = '{"cpm_net_max":5}'::jsonb, posting = '100%', approver = 'Jessica Flynn', updated_by = 'Lynn Cortelezzi'
where market_year_id = (select v::uuid from t where k='my');

-- ── Guard: QA gate ──────────────────────────────────────────────────
do $$
declare my uuid := (select v::uuid from t where k='my'); r uuid;
begin
  begin
    r := ba_approve_plan(my, '', 'Emm Caban');
    raise exception using errcode = 'P0099', message = 'approve with blank approver did not fail';
  exception when others then
    if sqlstate = 'P0099' then raise; end if;
    assert sqlerrm like 'QA: no approver%', sqlerrm;
  end;
  begin
    r := ba_approve_plan(my, 'Jessica Flynn', 'Emm Caban');
    raise exception using errcode = 'P0099', message = 'approve with unassigned estimates did not fail';
  exception when others then
    if sqlstate = 'P0099' then raise; end if;
    assert sqlerrm like 'QA: unassigned estimates%', sqlerrm;
  end;
  raise notice 'PASS  QA gate blocks: blank approver, unassigned estimates';
end $$;

insert into ba_estimate (market_year_id, media, number, assigned_by)
select v::uuid, m.media, m.num, 'Jessica Flynn' from t, (values ('TV','LR27-CHI-TV'), ('Radio','LR27-CHI-RA')) m(media, num) where k='my';

do $$
declare my uuid := (select v::uuid from t where k='my'); r uuid;
begin
  update ba_budget set amount = 100000 where market_year_id = my and media is null and superseded_at is null;
  begin
    r := ba_approve_plan(my, 'Jessica Flynn', 'Emm Caban');
    raise exception using errcode = 'P0099', message = 'over-budget approve without override did not fail';
  exception when others then
    if sqlstate = 'P0099' then raise; end if;
    assert sqlerrm like 'QA: plan net % exceeds budget%', sqlerrm;
  end;
  update ba_budget set amount = 1000000 where market_year_id = my and media is null and superseded_at is null;
  raise notice 'PASS  QA gate blocks: over budget without Finance override';
end $$;

-- ── Guard: nothing writes to ba_approved_plan except approval ──────
do $$
declare my uuid := (select v::uuid from t where k='my');
begin
  begin
    insert into ba_approved_plan (market_year_id, version, snapshot, snapshot_sha256, approver, approved_by)
    values (my, 99, '{}'::jsonb, 'x', 'nobody', 'nobody');
    raise exception using errcode = 'P0099', message = 'bare insert into ba_approved_plan succeeded';
  exception when others then
    if sqlstate = 'P0099' then raise; end if;
    assert sqlerrm like '%only from ba_approve_plan()%', sqlerrm;
  end;
  raise notice 'PASS  ba_approved_plan refuses a bare INSERT';
end $$;

-- ── Approve v1 ─────────────────────────────────────────────────────
insert into t select 'v1', ba_approve_plan((select v::uuid from t where k='my'), 'Jessica Flynn', 'Emm Caban', false, 'invariant test v1')::text;

create temp table v1_before as select * from ba_approved_plan where id = (select v::uuid from t where k='v1');
create temp table variance_before as select * from ba_variance where market_year_id = (select v::uuid from t where k='my') order by call_sign;

do $$
declare v ba_approved_plan%rowtype;
begin
  select * into v from v1_before;
  assert v.version = 1, 'v1 version';
  assert (v.snapshot->'totals'->>'net')::numeric = 179010, 'v1 total net = ' || (v.snapshot->'totals'->>'net');
  assert (v.snapshot->'totals'->'by_station'->'WBBM-TV'->>'net')::numeric = 110500, 'WBBM net';
  assert v.snapshot_sha256 = encode(digest(v.snapshot::text, 'sha256'), 'hex'), 'sha matches snapshot';
  assert jsonb_array_length(v.snapshot->'estimates') = 2 and jsonb_array_length(v.snapshot->'stations') = 3, 'snapshot carries estimates + stations';
  assert (select status from ba_market_year where id = v.market_year_id) = 'approved', 'market_year status';
  assert (select base_approved_plan_id from ba_working_plan where market_year_id = v.market_year_id) = v.id, 'working plan now departs from v1';
  raise notice 'PASS  approved v1 = % (net % vs budget %)', v.id, v.snapshot->'totals'->>'net', v.budget_total;
end $$;

-- ── Guard: v1 is immutable ─────────────────────────────────────────
do $$
declare v1 uuid := (select v::uuid from t where k='v1');
begin
  begin
    update ba_approved_plan set note = 'tampered' where id = v1;
    raise exception using errcode = 'P0099', message = 'UPDATE on ba_approved_plan succeeded';
  exception when others then
    if sqlstate = 'P0099' then raise; end if;
    assert sqlerrm like '%insert-only%', sqlerrm;
  end;
  begin
    delete from ba_approved_plan where id = v1;
    raise exception using errcode = 'P0099', message = 'DELETE on ba_approved_plan succeeded';
  exception when others then
    if sqlstate = 'P0099' then raise; end if;
    assert sqlerrm like '%insert-only%', sqlerrm;
  end;
  raise notice 'PASS  ba_approved_plan refuses UPDATE and DELETE';
end $$;

-- ── Confirmations arrive ───────────────────────────────────────────
insert into ba_order_document (market_year_id, approved_plan_id, station_id, vendor_group_id, kind, status, reader, file_name,
                               printed_gross, printed_net, parsed_lines, foot_checks, foot_ok, parsed_at, created_by)
select s.market_year_id, (select v::uuid from t where k='v1'), s.id, s.vendor_group_id, 'confirmation', 'footed', 'wideorbit-v1',
       s.call_sign || '-2027-confirmation.pdf', 129000, 109650, '[]'::jsonb, '{"lines_ok":true,"order_ok":true}'::jsonb, true, now(), 'Emm Caban'
from ba_station s where s.market_year_id = (select v::uuid from t where k='my') and s.call_sign = 'WBBM-TV';
insert into t select 'conf1', id::text from ba_order_document where file_name = 'WBBM-TV-2027-confirmation.pdf';

-- Guard: an unfooted confirmation cannot become the record
insert into ba_order_document (market_year_id, approved_plan_id, station_id, kind, status, file_name, printed_gross, printed_net, foot_ok, created_by)
select s.market_year_id, (select v::uuid from t where k='v1'), s.id, 'confirmation', 'foot_failed', 'WGN-TV-bad.pdf', 41600, 35360, false, 'Emm Caban'
from ba_station s where s.market_year_id = (select v::uuid from t where k='my') and s.call_sign = 'WGN-TV';
do $$
declare bad uuid := (select id from ba_order_document where file_name = 'WGN-TV-bad.pdf'); r uuid;
begin
  begin
    r := ba_apply_confirmation(bad, 'Emm Caban');
    raise exception using errcode = 'P0099', message = 'unfooted confirmation was applied';
  exception when others then
    if sqlstate = 'P0099' then raise; end if;
    assert sqlerrm like '%has not footed%', sqlerrm;
  end;
  begin
    insert into ba_schedule_of_record (market_year_id, station_id, order_document_id, approved_plan_id, applied_by)
    select market_year_id, station_id, id, approved_plan_id, 'nobody' from ba_order_document where id = bad;
    raise exception using errcode = 'P0099', message = 'bare insert into ba_schedule_of_record succeeded';
  exception when others then
    if sqlstate = 'P0099' then raise; end if;
    assert sqlerrm like '%only by ba_apply_confirmation()%', sqlerrm;
  end;
  raise notice 'PASS  unfooted confirmation refused; ba_schedule_of_record refuses a bare INSERT';
end $$;

-- ── Invariant 2: accepting a confirmation touches SoR + variance only ──
create temp table wp_before as select id, plan, flighting, demo, goals, posting, approver, base_approved_plan_id, updated_by, updated_at from ba_working_plan where market_year_id = (select v::uuid from t where k='my');
create temp table edits_before as select count(*) n from ba_working_plan_edit;
create temp table ap_before as select id, version, snapshot, snapshot_sha256 from ba_approved_plan where market_year_id = (select v::uuid from t where k='my');
create temp table od_before as select id, status, applied_at, applied_by from ba_order_document where market_year_id = (select v::uuid from t where k='my');

insert into t select 'sor1', ba_apply_confirmation((select v::uuid from t where k='conf1'), 'Emm Caban')::text;

do $$
declare my uuid := (select v::uuid from t where k='my'); conf1 uuid := (select v::uuid from t where k='conf1');
        wb record; wa record; vr record; n_changed int;
begin
  -- working plan: byte-identical
  select * into wb from wp_before;
  select id, plan, flighting, demo, goals, posting, approver, base_approved_plan_id, updated_by, updated_at into wa from ba_working_plan where market_year_id = my;
  assert to_jsonb(wb) = to_jsonb(wa), 'working plan changed when a confirmation was applied';
  assert (select count(*) from ba_working_plan_edit) = (select n from edits_before), 'working plan edit log grew';
  -- approved snapshot: byte-identical
  assert not exists (
    select 1 from ap_before b join ba_approved_plan a on a.id = b.id
    where a.snapshot is distinct from b.snapshot or a.snapshot_sha256 <> b.snapshot_sha256 or a.version <> b.version), 'approved plan changed when a confirmation was applied';
  -- order documents: only the applied one changed
  select count(*) into n_changed from od_before b join ba_order_document a on a.id = b.id
    where a.status is distinct from b.status or a.applied_at is distinct from b.applied_at or a.applied_by is distinct from b.applied_by;
  assert n_changed = 1, 'expected exactly one order document to change, got ' || n_changed;
  assert (select status from ba_order_document where id = conf1) = 'applied', 'conf1 applied';
  assert (select applied_by from ba_order_document where id = conf1) = 'Emm Caban', 'provenance: applied_by';
  -- schedule of record: one current row, with provenance
  assert (select count(*) from ba_schedule_of_record where market_year_id = my and superseded_at is null) = 1, 'one current SoR row';
  assert (select approved_plan_id from ba_schedule_of_record where order_document_id = conf1) = (select v::uuid from t where k='v1'), 'SoR states which approved version was confirmed';
  -- variance: approved side unchanged; confirmed side now populated for WBBM only
  for vr in select b.call_sign, b.approved_net as before_net, a.approved_net as after_net, a.confirmed_net, a.variance_net
            from variance_before b join ba_variance a on a.station_id = b.station_id loop
    assert vr.before_net is not distinct from vr.after_net, 'approved_net changed for ' || vr.call_sign;
    if vr.call_sign = 'WBBM-TV' then
      assert vr.confirmed_net = 109650 and vr.variance_net = -850, 'WBBM variance ' || coalesce(vr.variance_net::text, 'null');
    else
      assert vr.confirmed_net is null, vr.call_sign || ' should have no confirmation yet';
    end if;
  end loop;
  assert (select count(*) from ba_event where action = 'apply_confirmation' and entity_id = (select v::uuid from t where k='sor1')) = 1, 'event logged';
  raise notice 'PASS  invariant 2: apply changed SoR + variance only (WBBM-TV variance net -850)';
end $$;

-- ── Guard: nothing inside an apply may touch the working plan ──────
do $$
declare my uuid := (select v::uuid from t where k='my');
begin
  perform set_config('ba.context', 'apply_confirmation', true);
  begin
    update ba_working_plan set demo = 'A18-49' where market_year_id = my;
    raise exception using errcode = 'P0099', message = 'working plan written during apply_confirmation';
  exception when others then
    if sqlstate = 'P0099' then raise; end if;
    assert sqlerrm like '%never writes to ba_working_plan%', sqlerrm;
  end;
  perform set_config('ba.context', '', true);
  raise notice 'PASS  ba_working_plan refuses writes inside apply_confirmation';
end $$;

-- ── Invariant 1: later confirmations cannot change any v1 output ──
insert into ba_order_document (market_year_id, approved_plan_id, station_id, vendor_group_id, kind, status, reader, file_name,
                               printed_gross, printed_net, foot_ok, parsed_at, created_by)
select s.market_year_id, (select v::uuid from t where k='v1'), s.id, s.vendor_group_id, 'confirmation', 'footed', 'wideorbit-v1',
       'WLS-FM-2027-confirmation.pdf', 40000, 34000, true, now(), 'Emm Caban'
from ba_station s where s.market_year_id = (select v::uuid from t where k='my') and s.call_sign = 'WLS-FM';
update ba_order_document set printed_net = 33999, printed_gross = 39999 where file_name = 'WLS-FM-2027-confirmation.pdf';
do $$ begin perform ba_apply_confirmation(id, 'Emm Caban') from ba_order_document where file_name = 'WLS-FM-2027-confirmation.pdf'; end $$;
update ba_order_document set printed_net = 109000 where id = (select v::uuid from t where k='conf1');   -- even editing an applied one

do $$
declare b v1_before%rowtype; a ba_approved_plan%rowtype;
begin
  select * into b from v1_before;
  select * into a from ba_approved_plan where id = b.id;
  assert to_jsonb(a) = to_jsonb(b), 'approved v1 row changed after confirmations were inserted/altered';
  assert not exists (
    select 1 from variance_before vb join ba_variance va on va.station_id = vb.station_id
    where va.approved_plan_id <> vb.approved_plan_id or va.approved_net is distinct from vb.approved_net or va.approved_gross is distinct from vb.approved_gross),
    'approved side of variance changed';
  raise notice 'PASS  invariant 1: v1 row + approved outputs byte-identical after 2 confirmations inserted, 2 altered';
end $$;

-- ── Invariant 3: re-approval creates v2, never mutates v1 ─────────
update ba_working_plan set
  plan = jsonb_set(plan, '{lines,2,net}', '30000'::jsonb), updated_by = 'Lynn Cortelezzi'
where market_year_id = (select v::uuid from t where k='my');
insert into t select 'v2', ba_approve_plan((select v::uuid from t where k='my'), 'Jessica Flynn', 'Emm Caban', false, 'invariant test v2')::text;

do $$
declare my uuid := (select v::uuid from t where k='my'); v1 uuid := (select v::uuid from t where k='v1'); v2 uuid := (select v::uuid from t where k='v2');
        b v1_before%rowtype; a ba_approved_plan%rowtype; c ba_approved_plan%rowtype;
begin
  select * into b from v1_before; select * into a from ba_approved_plan where id = v1; select * into c from ba_approved_plan where id = v2;
  assert v2 <> v1, 'v2 has its own approved_plan_id';
  assert c.version = 2 and a.version = 1, 'versions';
  assert to_jsonb(a) = to_jsonb(b), 'v1 mutated by re-approval';
  assert c.snapshot_sha256 <> a.snapshot_sha256, 'v2 snapshot differs from v1';
  assert (c.snapshot->'totals'->>'net')::numeric = 173650, 'v2 net = ' || (c.snapshot->'totals'->>'net');
  assert (select id from ba_approved_current where market_year_id = my) = v2, 'current = v2';
  assert (select base_approved_plan_id from ba_working_plan where market_year_id = my) = v2, 'working plan departs from v2';
  assert (select count(*) from ba_approved_plan where market_year_id = my) = 2, 'exactly two versions';
  -- confirmations keep pointing at the version they confirmed
  assert (select approved_plan_id from ba_order_document where id = (select v::uuid from t where k='conf1')) = v1, 'conf1 still records v1';
  assert (select approved_plan_id from ba_schedule_of_record where order_document_id = (select v::uuid from t where k='conf1')) = v1, 'SoR still records v1';
  -- variance now reads against v2 for the approved side; WGN moved 35360 -> 30000
  assert (select approved_net from ba_variance where market_year_id = my and call_sign = 'WGN-TV') = 30000, 'variance reads v2';
  assert (select count(*) from ba_working_plan_edit where working_plan_id = (select id from ba_working_plan where market_year_id = my)) >= 2, 'working plan edits logged was/now';
  raise notice 'PASS  invariant 3: v2 = % created, v1 untouched, confirmations still cite v1', v2;
end $$;

-- ── Re-confirmation supersedes, never edits ────────────────────────
insert into ba_revision (market_year_id, approved_plan_id, station_id, order_document_id, rev_number, kind, changes, logged_by)
select od.market_year_id, (select v::uuid from t where k='v2'), od.station_id, od.id, 1, 'rate',
       '[{"line":"WBBM-TV|TV|EM|30","field":"rate","was":1000,"now":950,"delta":-50}]'::jsonb, 'Lynn Cortelezzi'
from ba_order_document od where od.id = (select v::uuid from t where k='conf1');

insert into ba_order_document (market_year_id, approved_plan_id, station_id, vendor_group_id, kind, status, reader, file_name,
                               printed_gross, printed_net, foot_ok, parsed_at, revision_id, created_by)
select s.market_year_id, (select v::uuid from t where k='v2'), s.id, s.vendor_group_id, 'confirmation', 'footed', 'wideorbit-v1',
       'WBBM-TV-2027-rev1-confirmation.pdf', 126400, 107440, true, now(), (select id from ba_revision where rev_number = 1), 'Emm Caban'
from ba_station s where s.market_year_id = (select v::uuid from t where k='my') and s.call_sign = 'WBBM-TV';
do $$ begin perform ba_apply_confirmation(id, 'Emm Caban') from ba_order_document where file_name = 'WBBM-TV-2027-rev1-confirmation.pdf'; end $$;

do $$
declare my uuid := (select v::uuid from t where k='my'); conf1 uuid := (select v::uuid from t where k='conf1');
        conf2 uuid := (select id from ba_order_document where file_name = 'WBBM-TV-2027-rev1-confirmation.pdf');
begin
  assert (select count(*) from ba_schedule_of_record where market_year_id = my and superseded_at is null) = 2, 'two current SoR rows (WBBM, WLS)';
  assert (select superseded_by_id from ba_schedule_of_record where order_document_id = conf1) = (select id from ba_schedule_of_record where order_document_id = conf2), 'old SoR superseded by new';
  assert (select status from ba_order_document where id = conf1) = 'superseded', 'conf1 superseded';
  assert (select superseded_by_id from ba_order_document where id = conf1) = conf2, 'conf1 points at conf2';
  assert (select confirmation_id from ba_variance where market_year_id = my and call_sign = 'WBBM-TV') = conf2, 'variance reads the new confirmation';
  assert (select count(*) from ba_schedule_of_record where order_document_id = conf1) = 1, 'history kept';
  -- chain is reconstructible: v1 -> conf1 -> Rev 1 -> conf2
  assert (select approved_plan_id from ba_revision where rev_number = 1) = (select v::uuid from t where k='v2')
     and (select order_document_id from ba_revision where rev_number = 1) = conf1
     and (select revision_id from ba_order_document where id = conf2) = (select id from ba_revision where rev_number = 1), 'approved → confirmation → Rev 1 → re-confirmation chain';
  raise notice 'PASS  re-confirmation supersedes the record; approved → confirmation → Rev 1 → re-confirmation reconstructs';
end $$;

-- ── Notes are typed ────────────────────────────────────────────────
do $$
begin
  begin
    insert into ba_note (entity_type, entity_id, text, author) values ('spreadsheet', 'x', 'nope', 'Emm Caban');
    raise exception using errcode = 'P0099', message = 'untyped note accepted';
  exception when others then
    if sqlstate = 'P0099' then raise; end if;
  end;
  insert into ba_note (entity_type, entity_id, text, author) values ('line', 'WBBM-TV|TV|EM|30', 'news is prime on this station', 'Lynn Cortelezzi');
  raise notice 'PASS  notes carry entity_type/entity_id';
end $$;

select 'ALL INVARIANTS PASS — rolling back scratch data' as result;
rollback;
