// DATA: Parrish DeVaughn OOH boards (Oklahoma City + Tulsa), from the vendor plant list.
// Shape mirrors LR_PANELS / PL_PANELS so the PDV board page reuses the shared
// OOH engine (cards/table/creative-brief/size-report). Vendor tagged "CJ" per
// the buyer's rate note — correct if the plant list names a different vendor.
// The 4 rotating programs (pre-empt bulletins, digital bulletins, jr/std posters)
// have no fixed panel # or location — entered as single showing lines; specific
// units/locations get filled when the vendor assigns them. Creative not yet
// assigned (isci empty) — the creative-brief download runs off specs + run dates.
// TULSA (expansion market) — per the buyer's plan: a 45-poster showing that
// reposts every 60 days (launches 09/13/2026) and 10 bulletin faces incl.
// 2 permanents (launch 09/07/2026). Round-1 rotation: bulletins 2 Thunder /
// 8 Pepper & Murry, posters 8 Thunder / 37 Pepper & Murry (Here All Along is
// registered with creative but sits out this round). Vendor and unit #s land
// with the executed contract.
const PDV_PANELS=[
  {market:"OKC",city:"Oklahoma City",media:"Perm Poster",unit:"30666",location:"Walnut Ave, 470 ft N/O Sheridan, ES/NF",facing:"N/F",size:"10'5\"x22'8\"",flight:"10/19/2026-10/17/2027",cycles:"",impressions:0,illuminated:true,lat:0,lng:0,status:"upcoming",plan:"2026",numUnits:1,vendor:"CJ",dma:"OKC",contract:"PDV-OKC-26",contractNum:"",isci:"",isciList:[],isciPct:[],approx:false},
  {market:"OKC",city:"Oklahoma City",media:"Perm Bulletin",unit:"10185",location:"OKC Blvd, 520 SW 3rd W/O S. Walker, SS/WF",facing:"W/F",size:"14'x48'",flight:"10/19/2026-10/17/2027",cycles:"",impressions:0,illuminated:true,lat:0,lng:0,status:"upcoming",plan:"2026",numUnits:1,vendor:"CJ",dma:"OKC",contract:"PDV-OKC-26",contractNum:"",isci:"",isciList:[],isciPct:[],approx:false},
  {market:"OKC",city:"Oklahoma City",media:"Perm Bulletin",unit:"10319",location:"1301 N. Classen N/O NW 12th, WS/NF",facing:"N/F",size:"11'x44'",flight:"08/12/2026-08/10/2027",cycles:"",impressions:0,illuminated:true,lat:0,lng:0,status:"upcoming",plan:"2026",numUnits:1,vendor:"CJ",dma:"OKC",contract:"PDV-OKC-26",contractNum:"",isci:"",isciList:[],isciPct:[],approx:false},
  {market:"OKC",city:"Oklahoma City",media:"Perm Bulletin",unit:"10137",location:"2315 N Penn, WS/NF",facing:"N/F",size:"14'x48'",flight:"07/27/2026-07/25/2027",cycles:"",impressions:0,illuminated:true,lat:0,lng:0,status:"upcoming",plan:"2026",numUnits:1,vendor:"CJ",dma:"OKC",contract:"PDV-OKC-26",contractNum:"",isci:"",isciList:[],isciPct:[],approx:false},
  {market:"OKC",city:"Oklahoma City",media:"Digital Poster",unit:"9303",location:"NW Expressway & Classen Blvd, ES/WF",facing:"W/F",size:"14'x28'",flight:"03/23/2026-03/21/2027",cycles:"",impressions:0,illuminated:true,lat:0,lng:0,status:"posted",plan:"2026",numUnits:1,vendor:"CJ",dma:"OKC",contract:"PDV-OKC-26",contractNum:"",isci:"",isciList:[],isciPct:[],approx:false},
  {market:"OKC",city:"Oklahoma City",media:"Pre-empt Bulletin",unit:"OKC-PREEMPT-BLTN",location:"Pre-emptible program — locations assigned at post",facing:"",size:"14'x48'",flight:"07/06/2026-07/04/2027",cycles:"",impressions:0,illuminated:true,lat:0,lng:0,status:"posted",plan:"2026",numUnits:10,vendor:"CJ",dma:"OKC",contract:"PDV-OKC-26",contractNum:"",isci:"",isciList:[],isciPct:[],approx:false},
  {market:"OKC",city:"Oklahoma City",media:"Digital Bulletin",unit:"OKC-DIGITAL-BLTN",location:"Digital bulletin flights",facing:"",size:"14'x48'",flight:"08/03/2026-08/30/2026 & 11/02/2026-11/29/2026",cycles:"",impressions:0,illuminated:true,lat:0,lng:0,status:"upcoming",plan:"2026",numUnits:1,vendor:"CJ",dma:"OKC",contract:"PDV-OKC-26",contractNum:"",isci:"",isciList:[],isciPct:[],approx:false},
  {market:"OKC",city:"Oklahoma City",media:"Junior Poster",unit:"OKC-JR-POSTERS",location:"45 Jr. poster showing — locations assigned at post",facing:"",size:"4'11\"x10'11\"",flight:"Jan · Apr · Jul · Oct",cycles:"Quarterly",impressions:0,illuminated:false,lat:0,lng:0,status:"posted",plan:"2026",numUnits:45,vendor:"CJ",dma:"OKC",contract:"PDV-OKC-26",contractNum:"",isci:"",isciList:[],isciPct:[],approx:false},
  {market:"OKC",city:"Oklahoma City",media:"Poster",unit:"OKC-POSTERS",location:"75 poster showing — locations assigned at post",facing:"",size:"10'5\"x22'8\"",flight:"Mar · Jun · Sep · Dec",cycles:"Quarterly",impressions:0,illuminated:false,lat:0,lng:0,status:"posted",plan:"2026",numUnits:75,vendor:"CJ",dma:"OKC",contract:"PDV-OKC-26",contractNum:"",isci:"",isciList:[],isciPct:[],approx:false},
  {market:"TUL",city:"Tulsa",media:"Poster",unit:"TUL-POSTERS",location:"45 poster showing — reposts every 60 days; locations assigned at post",facing:"",size:"10'5\"x22'8\"",flight:"Launches 09/13/2026",cycles:"Every 60 days",impressions:0,illuminated:false,lat:0,lng:0,status:"upcoming",plan:"2026",numUnits:45,vendor:"TBD",dma:"TUL",contract:"PDV-TUL-26",contractNum:"",isci:"TULPDV26SP001O",isciList:["TULPDV26SP001O","TULPDV26SP003O"],isciPct:[18,82],approx:false},
  {market:"TUL",city:"Tulsa",media:"Static Bulletin",unit:"TUL-BULLETINS",location:"10 bulletin faces (incl. 2 permanent) — locations assigned by vendor",facing:"",size:"14'x48'",flight:"Launches 09/07/2026",cycles:"Rotating",impressions:0,illuminated:true,lat:0,lng:0,status:"upcoming",plan:"2026",numUnits:10,vendor:"TBD",dma:"TUL",contract:"PDV-TUL-26",contractNum:"",isci:"TULPDV26SB001O",isciList:["TULPDV26SB001O","TULPDV26SB003O"],isciPct:[20,80],approx:false},
];
if(typeof window!=="undefined")window.PDV_PANELS=PDV_PANELS;
