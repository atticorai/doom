// DATA: Keches Law Group OOH Contracts (seed)
// Parsed from the executed Clear Channel Outdoor sales contracts (Boston market).
// Advertiser: Keches Law Group P.C (#282333), 2 Granite Ave, Milton, MA 02186.
// Vendor AE: Michael Bentle (michaelbentle@clearchannel.com), CCO Stoneham MA.
// Signer (Keches): John Uniac. Every contract carries a 60-day no-penalty
// cancellation right and (for the always-on digital bulletins) a 90-day RFR
// renewal window. Shape mirrors LR_CONTRACTS / OOH_CONTRACTS_INIT so these merge
// into oohContracts on load and render in the Keches OOH contracts section.
// `link` left empty — no Drive PDF yet (contract source is the uploaded CCO PDFs).
const KE_CONTRACTS={
  // ── Active always-on digital dominations ──
  "1259038-BOS":{num:"1259038-BOS",vendor:"Clear Channel Outdoor",brand:"Keches Law Group",dmas:["BOS"],category:"Billboards",mediaType:"Digital Bulletin (8 slots)",qty:1,slots:8,total:548600,startDate:"2025-12-29",endDate:"2026-12-27",link:"",notes:"Domination — #BOS005398 I-93/SE Expwy ES 382ft N/O Columbia Rd F/N (14'x48'). 8 slots · $42,200/4-wk × 13. 90-day RFR expires 12/27/2026 → renewal Order 1259709-BOS. Executed 5/6/2025."},
  "1256715-BOS":{num:"1256715-BOS",vendor:"Clear Channel Outdoor",brand:"Keches Law Group",dmas:["BOS"],category:"Billboards",mediaType:"Digital Bulletin (8 slots)",qty:1,slots:8,total:239200,startDate:"2026-06-15",endDate:"2027-06-13",link:"",notes:"Full Digital RENEWAL of 1255701-BOS — #BOS011533 I-93 WS 1890ft N/O Fulbright F/N (14'x48'). 8 slots · $18,400/4-wk × 13. 90-day RFR expires 6/14/2027 → renewal Order 1296102-BOS. Executed 5/1/2026."},
  // ── Static bulletin segment (recurring 8-week flights, 4 boards each) ──
  "1295545-BOS":{num:"1295545-BOS",vendor:"Clear Channel Outdoor",brand:"Keches Law Group",dmas:["BOS"],category:"Billboards",mediaType:"Static Bulletins",qty:4,total:33210,startDate:"2026-06-01",endDate:"2026-07-26",link:"",notes:"4 static bulletins · $3,620/4-wk × 2 periods + $4,000 production. Boards: BOS005360 (I-93/SE Expwy @ Freeport St), BOS010370 (Rt 1/NE Expwy @ Washington St), BOS011524 (I-93 @ Middlesex St), BOS045521 (I-195 @ Rt 24S ramp). Segmented buy — next 8-week segment TBD. Executed 5/1/2026."},
  // ── Expired / historical ──
  "1255701-BOS":{num:"1255701-BOS",vendor:"Clear Channel Outdoor",brand:"Keches Law Group",dmas:["BOS"],category:"Billboards",mediaType:"Digital Bulletin (8 slots)",qty:1,slots:8,total:239200,startDate:"2025-06-16",endDate:"2026-06-14",link:"",manualStatus:"expired",notes:"Full Digital — #BOS011533 I-93 @ Fulbright. Superseded by renewal 1256715-BOS (6/15/2026). Executed 4/9/2025."},
  "1252074-BOS":{num:"1252074-BOS",vendor:"Clear Channel Outdoor",brand:"Keches Law Group",dmas:["BOS"],category:"Billboards",mediaType:"2025 Campaign (Digital + Static Bulletins)",qty:20,total:213474.18,startDate:"2025-02-17",endDate:"2026-02-01",link:"",manualStatus:"expired",notes:"2025 master campaign — 4 digital bulletins (BOS005398/011533/011535/051561), a rotating static bulletin program (4 boards per 8-wk segment, Mar/May/Jun/Aug/Oct/Dec starts), full-market quantity bulletins, and bonus digital. Includes a ~25-board 'Quantity B' eligible-display pool. $200,724 media + $12,000 production."}
};
if(typeof window!=="undefined")window.KE_CONTRACTS=KE_CONTRACTS;
