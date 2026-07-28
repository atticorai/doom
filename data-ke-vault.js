// DATA: Keches Law Group — Media Contracts Vault (NON-OOH agreements).
// A single home for the whole Keches media portfolio beyond billboards. OOH
// (Clear Channel Boston) contracts live in data-ke-contracts.js / oohContracts
// and are merged into the vault view at render by the Contracts page; this file
// holds every other medium: TV, Radio, Print, Podcast, Digital, Sponsorship
// (arena/sports), and Event. Each entry is parsed from the executed contract PDF.
//
// medium values drive the vault's category filter + color. Amounts are the
// contract/annual value as written; per-season sponsorship figures are kept in
// notes. `link` left empty (source is the uploaded PDF). Status is computed from
// dates by contractStatus(); manualStatus overrides when a deal is known ended.
//
// INGESTION STATUS: 5 contracts fully reconciled below. Still to add from the
// uploaded set (pending read): Delaware North #2611 (Bruins), Boston College
// Athletics, New England Free Jacks, New England Patriots, Worcester Railers,
// Audacy (Greg Hill Roadshow / WEEI studio), Beasley radio, BridgeTower / MA
// Lawyers Weekly, BGMP Salute to Nurses, Keches 2026 Digital, plus the creative
// Specs & Deadlines sheets. (Ciox/Datavant SmartRequest and the click-through
// terms links are operational vendor T&Cs, not media buys — excluded.)
const KE_VAULT=[
  {id:"CMG-WFXT-1277057",vendor:"CMG · Cox Media Group (WFXT Boston 25)",medium:"TV",title:"WFXT Boston 25 News — April 2026 spot buy",market:"Boston",startDate:"2026-03-30",endDate:"2026-05-03",total:44755,signed:"2026-04-09",link:"",notes:"Contract 1277057. 320 spots (:10 & :30) across daytime + local news dayparts (10a–7p, AM news), plus $0 sports/news/prime rotator bonus. 2-week cancellation notice."},
  {id:"SL-2026",vendor:"Super Lawyers · Internet Brands / Thomson Reuters",medium:"Print",title:"2026 Super Lawyers — Philadelphia Magazine + PA Super Lawyers",market:"Pennsylvania",startDate:"2026-06-01",endDate:"2026-06-30",total:16451.25,signed:"2026-03-03",link:"",notes:"June 2026 issues. Philadelphia Magazine full-page display $12,851.25 + Pennsylvania Super Lawyers half-page $3,600 (25% disc). Account #1004629248. Balance due upon publication."},
  {id:"7EQUIS-BBI-2026",vendor:"7 Equis",medium:"Podcast",title:"Better Bad Ideas with Sean O'Brien — Premier Sponsor",market:"National",startDate:"2026-04-02",endDate:"2026-12-31",total:200000,signed:"2026-04-02",link:"",notes:"52 host-read 60-sec ads (1/episode), category exclusivity, Premier Sponsor credit, URL in metadata/YouTube. Billing: $60k on execution + $35k at each 2026 quarter-end (3/31, 6/30, 9/30, 12/31). Net-7."},
  {id:"DNC-2250",vendor:"Delaware North · TD Garden / Boston Bruins",medium:"Sponsorship",title:"Bruins 'Dashers' — dasherboard signage + NESN broadcast + digital",market:"Boston",startDate:"2023-05-01",endDate:"2026-04-30",total:371315,signed:"2023-04-21",link:"",notes:"Arena Agreement #2250. Ice-level dasher signage (2 dashers, incl. Bruins Team Bench + Penalty Box), digitally-enhanced dasherboard exposure on NESN home + away broadcasts, run-of-site digital on BostonBruins.com + app, experiential. Seasons: 23-24 $350,000 · 24-25 $360,500 · 25-26 $371,315. Non-cancellable."},
  {id:"DNC-2231",vendor:"Delaware North · TD Garden / Boston Bruins",medium:"Sponsorship",title:"TD Garden / Bruins — Ice Resurfacer branding, arena LED, suites, season tickets",market:"Boston",startDate:"2022-09-01",endDate:"2026-04-30",total:315325,signed:"2022-11-04",link:"",notes:"Arena Agreement #2231. Exclusive ice-resurfacer branding (3x/game), Bowl-Dominant 360 LED, 5 luxury-suite events/yr, 4 Bruins season tickets, TD Garden $12,500 credit, VIP + youth experiences. Seasons: 22-23 $292,830 · 23-24 $301,615 · 24-25 $310,665 · extension yr to 4/30/26 $315,325 (amended 3/28/2023). Non-cancellable."},
];
if(typeof window!=="undefined")window.KE_VAULT=KE_VAULT;
