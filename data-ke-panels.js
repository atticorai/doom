// DATA: Keches Law Group OOH boards (Boston), from the executed Clear Channel
// Outdoor sales contracts. Shape mirrors PDV_PANELS / LR_PANELS / PL_PANELS so
// the Keches board page reuses the shared OOH engine (cards/table/creative-brief/
// size-report/board-list). All boards are Clear Channel Outdoor, market Boston.
// Digital bulletins are always-on 8-slot dominations; static bulletins run in
// 8-week segments. Creative not yet assigned (isci empty).
//
// COORDINATES: lat/lng are APPROXIMATE, knowledge-based estimates placed at the
// described highway cross-street (a live geocoder was policy-blocked in this
// environment). approx:true flags them so the map's bunching check marks them
// "verify location." Boards to double-check first: the I-93 Medford/Somerville
// cluster (Fulbright St / Middlesex St / Exit 22) and Rt 1 @ Washington St.
const KE_PANELS=[
  // ── Digital bulletins (8-slot dominations, always on) ──
  {market:"BOS",city:"Boston",media:"Digital Bulletin",unit:"BOS005398",location:"I-93/SE Expwy ES 382ft N/O Columbia Rd",facing:"F/N",size:"14'x48'",slots:8,flight:"12/29/2025-12/27/2026",cycles:"",impressions:0,illuminated:true,lat:42.31995,lng:-71.05435,status:"posted",plan:"2026",numUnits:1,vendor:"Clear Channel Outdoor",dma:"BOS",contract:"1259038-BOS",contractNum:"1259038-BOS",isci:"",isciList:[],isciPct:[],approx:true},
  {market:"BOS",city:"Boston",media:"Digital Bulletin",unit:"BOS011533",location:"I-93 WS 1890ft N/O Fulbright",facing:"F/N",size:"14'x48'",slots:8,flight:"06/15/2026-06/13/2027",cycles:"",impressions:0,illuminated:true,lat:42.40300,lng:-71.08700,status:"posted",plan:"2026",numUnits:1,vendor:"Clear Channel Outdoor",dma:"BOS",contract:"1256715-BOS",contractNum:"1256715-BOS",isci:"",isciList:[],isciPct:[],approx:true},
  // ── Static bulletins (6/1/2026 segment, 4 boards) ──
  {market:"BOS",city:"Boston",media:"Bulletin",unit:"BOS005360",location:"I-93/SE Expwy WS 60ft N/O Freeport St",facing:"F/S",size:"14'x48'",flight:"06/01/2026-07/26/2026",cycles:"8-wk segment",impressions:0,illuminated:true,lat:42.31080,lng:-71.05050,status:"expired",plan:"2026",numUnits:1,vendor:"Clear Channel Outdoor",dma:"BOS",contract:"1295545-BOS",contractNum:"1295545-BOS",isci:"",isciList:[],isciPct:[],approx:true},
  {market:"BOS",city:"Boston",media:"Bulletin",unit:"BOS010370",location:"Rt 1/NE Expwy WS 200ft N/O Washington St",facing:"F/N",size:"14'x48'",flight:"06/01/2026-07/26/2026",cycles:"8-wk segment",impressions:0,illuminated:true,lat:42.40100,lng:-71.03150,status:"expired",plan:"2026",numUnits:1,vendor:"Clear Channel Outdoor",dma:"BOS",contract:"1295545-BOS",contractNum:"1295545-BOS",isci:"",isciList:[],isciPct:[],approx:true},
  {market:"BOS",city:"Boston",media:"Bulletin",unit:"BOS011524",location:"I-93 ES 148ft N/O Middlesex St",facing:"F/S",size:"14'x48'",flight:"06/01/2026-07/26/2026",cycles:"8-wk segment",impressions:0,illuminated:true,lat:42.38950,lng:-71.07850,status:"expired",plan:"2026",numUnits:1,vendor:"Clear Channel Outdoor",dma:"BOS",contract:"1295545-BOS",contractNum:"1295545-BOS",isci:"",isciList:[],isciPct:[],approx:true},
  {market:"BOS",city:"Boston",media:"Bulletin",unit:"BOS045521",location:"I-195 SS 1200ft W/O Rt 24S Ent Ramp",facing:"F/W",size:"14'x48'",flight:"06/01/2026-07/26/2026",cycles:"8-wk segment",impressions:0,illuminated:true,lat:41.70150,lng:-71.15400,status:"expired",plan:"2026",numUnits:1,vendor:"Clear Channel Outdoor",dma:"BOS",contract:"1295545-BOS",contractNum:"1295545-BOS",isci:"",isciList:[],isciPct:[],approx:true},
];
if(typeof window!=="undefined")window.KE_PANELS=KE_PANELS;
