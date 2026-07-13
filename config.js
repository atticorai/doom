// CONFIG: Constants, derived data, helper functions, UI primitives
const CASE_TYPES=["Brand","Auto Accidents","Trucking/Commercial","Premises Liability","Workers Comp","Personal Injury (General)","Wrongful Death","Holiday/Seasonal","Testimonial","Other"];
const VALUE_PROPS=["Brand Awareness","Elite/Authority","Results/Wins","Justice/Fighting","Trust/Care","Local/Community","Process/How It Works","Case Type Awareness","Holiday/Seasonal","Other"];

// Auto-tag case type from title
const autoCase=(title)=>{
  const t=(title||"").toLowerCase();
  if(/car wreck|auto accident|mother.?s wreck|distracted|cell phone/i.test(t))return"Auto Accidents";
  if(/trucking|commercial (vehicle|accident)/i.test(t))return"Trucking/Commercial";
  if(/premise|premises/i.test(t))return"Premises Liability";
  if(/working man|on the job|worker/i.test(t))return"Workers Comp";
  if(/christmas|thanksgiving|holiday/i.test(t))return"Holiday/Seasonal";
  if(/warren|story|testimonial/i.test(t))return"Testimonial";
  if(/brand|legacy|different|award|local lawyer|more to us|personal_|weekends?_?/i.test(t))return"Brand";
  if(/strength|confidence|elite|harvard|supreme|three billion|firepower|justice|representation|fight/i.test(t))return"Brand";
  return"Personal Injury (General)";
};

const ISCIS_INIT=(()=>{const seen=new Set();return D_I.filter(r=>{if(seen.has(r[0]))return false;seen.add(r[0]);return true}).map(r=>({code:r[0],title:r[1],media:r[2],brand:r[3],dma:r[4],dur:r[5],suffix:r[6],active:r[7]!==false,caseType:r[8]||autoCase(r[1]),category:r[8]||autoCase(r[1]),valueProp:"",vo:r[3]==="Wettermark Keith"?"Chris Keith":"",fileUrl:r[9]||"",sentAt:null,sentInEst:null}))})();
const ESTIMATES=(()=>{const CABLE_NUMS=new Set(["2605","2613","2621","2629"]);return D_E.map(r=>({num:r[0],market:r[1],media:CABLE_NUMS.has(r[0])&&r[6]==="Postman Law"?"Cable":r[2],group:r[3],campaign:r[4],buyer:r[5],brand:r[6]}))})();
const STATIONS=D_S.map(r=>({market:r[0],call:r[1],media:r[2],ownership:r[3],contact:r[4],brand:r[5],buyer:r[6]}));
const CALENDAR=D_C.map(r=>({month:r[0],rotDue:r[1],bcStart:r[2],bcEnd:r[3]}));
const POSTINGS=D_P.map(r=>({boardId:r[0],submarket:r[1],dma:r[2],vendor:r[3],type:r[4],size:r[5],location:r[6],impressions:r[7],installDate:r[8],facing:r[9],brand:r[10],contact:r[11],panel:r[12],tab:r[13],contract:r[14],isci:r[15]||"",closeImg:r[16],distImg:r[17]}));
const DM={CHI:"Chicago",CIN:"Cincinnati",DEN:"Denver",MSP:"Minneapolis",BRM:"Birmingham",CHA:"Chattanooga",DHN:"Dothan",GAD:"Gadsden",HSV:"Huntsville",KNX:"Knoxville",MTG:"Montgomery",ABQ:"Albuquerque",KGB:"King/Bull",LAS:"Las Vegas",PHX:"Phoenix",RNO:"Reno",SEA:"Seattle",TUC:"Tucson",YUM:"Yuma",OKC:"Oklahoma City",TUL:"Tulsa"};
const DL=Object.entries(DM).map(([c,n])=>({code:c,name:n}));
const BRANDS=[
  {code:"PL",name:"Postman Law",agency:"Atticor Group LLC",logo:LOGO_PL,color:"#9b7bb0",colorBg:"#F0E8F8",gradientFrom:"#a855f7",gradientTo:"#9b7bb0",markets:["CHI","CIN","DEN","MSP"],airingKey:"est"},
  {code:"WK",name:"Wettermark Keith",agency:"Atticor Group LLC",logo:LOGO_WK,color:"#D4A040",colorBg:"#fffbeb",gradientFrom:"#818cf8",gradientTo:"#6366f1",markets:["BRM","HSV","KNX","CHA","MTG","DHN"],airingKey:"est|market"},
  // Lerner & Rowe — OOH-only for now (contract-level buys, no board/ISCI detail yet).
  {code:"LR",name:"Lerner & Rowe",agency:"Atticor Group LLC",logo:(typeof LOGO_LR!=="undefined"?LOGO_LR:""),color:"#2FBF71",colorBg:"#e9fbf1",gradientFrom:"#34d399",gradientTo:"#2FBF71",markets:["ABQ","CHI","KGB","LAS","PHX","RNO","SEA","TUC","YUM"],airingKey:"est"},
  // Parrish DeVaughn — Oklahoma City personal injury firm. Broadcast TV + OOH. Brand red #EE2B37 (PMS 1788 C).
  {code:"PDV",name:"Parrish DeVaughn",agency:"Atticor Group LLC",logo:(typeof LOGO_PDV!=="undefined"?LOGO_PDV:""),color:"#EE2B37",colorBg:"#FDECEE",gradientFrom:"#F45A64",gradientTo:"#EE2B37",markets:["OKC","TUL"],airingKey:"est"}
];
// Brand helpers — use these instead of hardcoded ternaries
const getBrand=(v)=>BRANDS.find(b=>b.name===v||b.code===v)||BRANDS[0];
const getBrandColor=(v)=>{const b=getBrand(v);return b?b.color:"#9B8EAD"};
const getBrandBg=(v)=>{const b=getBrand(v);return b?b.colorBg:"#F0E8F8"};
const getBrandAgency=(v)=>{const b=getBrand(v);return b?b.agency:"Atticor Group LLC"};
const MEDIA=["TV","Radio","Digital","Streaming Audio","Cable","OOH","Tagline"];const OOH_TYPES=[{code:"SB",name:"Static Billboard"},{code:"DB",name:"Digital Billboard"},{code:"SP",name:"Static Poster"},{code:"DP",name:"Digital Poster"},{code:"BS",name:"Transit / Bus Shelter"},{code:"PT",name:"Gas Pump Topper"},{code:"WS",name:"Wallscape"},{code:"TR",name:"Transit"},{code:"SF",name:"Street Furniture"},{code:"JP",name:"Junior Poster"}];
const SUFFIXES={TV:"T",Radio:"R",Digital:"D","Streaming Audio":"S",OOH:"O",Cable:"T",Tagline:"G"};const OOH_SUFFIXES={SB:"O",DB:"O",SP:"O",DP:"O",BS:"O",PT:"O",WS:"O",TR:"O",SF:"O",JP:"O"};
const OOH_TYPE_MAP=Object.fromEntries(OOH_TYPES.map(t=>[t.code,t.name]));
const EG=[...new Set(ESTIMATES.map(e=>e.group))].sort();
const SCHED=["M-F Schedule","Weekend Schedule","M-F Bookend","Weekend Bookend","All Week","Holiday Only"];
const BOOKENDS=["","Bookend :15 A","Bookend :15 B","Bookend :15 C","Bookend :15 D","Bookend :30 A","Bookend :30 B"];

const mc=m=>({TV:"#2563eb",Radio:"#7c3aed",Digital:"#059669","Streaming Audio":"#0891b2",Cable:"#6366f1",OOH:"#d97706",Tagline:"#C4A0C8"})[m]||"#64748b";
const fD=d=>d?new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}):"—";
const fDs=d=>d?new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"numeric",day:"numeric"}):"";

// UI atoms
const B=({l,c})=><span style={{display:"inline-flex",padding:"2px 6px",borderRadius:99,fontSize:14,fontWeight:600,background:c+"14",color:c,border:`1px solid ${c}30`,whiteSpace:"nowrap"}}>{l}</span>;
const Btn=({children,onClick,primary,small,disabled,color,danger})=><button disabled={disabled} onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:4,padding:small?"4px 8px":"8px 14px",borderRadius:6,border:primary||danger?"none":"1px solid #d1d5db",background:disabled?"#e2e8f0":danger?"#dc2626":primary?color||"#0f172a":"#fff",color:disabled?"#94a3b8":primary||danger?"#fff":"#334155",fontSize:small?11:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer"}}>{children}</button>;
const Inp=({label,...p})=><div style={{display:"flex",flexDirection:"column",gap:2,flex:1}}>{label&&<label style={{fontSize:10,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:.3}}>{label}</label>}<input {...p} style={{padding:"6px 9px",borderRadius:5,border:"1px solid #d1d5db",fontSize:13,outline:"none",width:"100%",...(p.style||{})}}/></div>;
const Sel=({label,options,value,onChange,placeholder})=><div style={{display:"flex",flexDirection:"column",gap:2,flex:1}}>{label&&<label style={{fontSize:10,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:.3}}>{label}</label>}<select value={value} onChange={e=>onChange(e.target.value)} style={{padding:"6px 9px",borderRadius:5,border:"1px solid #d1d5db",fontSize:13,background:"#0f172a",color:"#e2e8f0"}}>{placeholder&&<option value="">{placeholder}</option>}{options.map(o=><option key={typeof o==="string"?o:o.v} value={typeof o==="string"?o:o.v}>{typeof o==="string"?o:o.l}</option>)}</select></div>;
const TH=({children,a,w})=><th style={{padding:"4px 6px",fontSize:10,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:.4,borderBottom:"2px solid #334155",textAlign:a||"left",whiteSpace:"nowrap",position:"sticky",top:0,background:"#1e293b",zIndex:1,width:w||"auto"}}>{children}</th>;
const TD=({children,m,b,c,a})=><td style={{padding:"5px 7px",fontSize:13,color:c||"#334155",fontFamily:m?"monospace":"inherit",borderBottom:"1px solid #f1f5f9",whiteSpace:"nowrap",fontWeight:b?600:400,textAlign:a||"left"}}>{children}</td>;
const Cd=({children,style:sx})=><div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:9,overflow:"hidden",...(sx||{})}}>{children}</div>;
const Pill=({l,a:ac,c,n,onClick})=><button onClick={onClick} style={{padding:"3px 8px",borderRadius:99,border:ac?`2px solid ${c}`:"1px solid #e2e8f0",background:ac?c+"10":"#fff",color:ac?c:"#64748b",fontSize:14,fontWeight:600,cursor:"pointer",display:"inline-flex",gap:3,alignItems:"center"}}>{l}{n!=null&&<span style={{background:ac?c+"22":"#f1f5f9",padding:"0 4px",borderRadius:99,fontSize:13}}>{n}</span>}</button>;
const Mod=({title,onClose,children,wide})=><div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e3,backdropFilter:"blur(2px)"}} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{background:"#1e293b",borderRadius:12,padding:18,border:"1px solid #334155",width:wide?900:540,maxWidth:"96vw",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 50px rgba(0,0,0,.12)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h3 style={{margin:0,fontSize:16,fontWeight:700}}>{title}</h3><button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:15,color:"#94a3b8"}}>✕</button></div>{children}</div></div>;
const StatC=({label,value,sub,color,onClick})=><div onClick={onClick} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:9,padding:"10px 12px",cursor:onClick?"pointer":"default",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:color}}/><div style={{fontSize:10,fontWeight:600,color:"#a89ed4",textTransform:"uppercase",letterSpacing:.5}}>{label}</div><div style={{fontSize:24,fontWeight:700,color:"#f1f5f9",marginTop:1}}>{value}</div>{sub&&<div style={{fontSize:10,color:"#a89ed4",marginTop:1}}>{sub}</div>}</div>;

// ── WK OOH COORDINATE LOOKUP (Reagan Chattanooga from Geopath Photo Sheets) ──
const WK_ZIPS={"Anniston":"36201","Benton":"37307","Birmingham":"35203","Bonny Oaks / Tyner":"37421","Brainerd / Midtown":"37411","Chattanooga":"37402","Childersburg":"35044","Cleveland":"37311","Decatur":"37322","Downtown Chatt":"37402","Dunlap":"37327","East Brainerd":"37421","East Ridge":"37412","Fort Oglethorpe":"30742","Gadsden":"35901","Greenville":"36037","Hixson":"37343","Hwy 58/Harrison":"37341","Jasper":"35501","Lafayette":"30728","Lakesite":"37379","Lookout Valley":"37350","Middle Valley":"37343","Montgomery":"36104","N. Shore/N. Chatt":"37405","Ooltewah":"37363","Pell City":"35125","Red Bank":"37415","Ringgold":"30736","Riverside/Amnicola":"37406","Rossville":"30741","Sale Creek":"37373","Selma":"36701","Signal Mtn/Mtn Creek":"37377","South Pittsburg":"37380","St. Elmo":"37409","Talladega":"35160","Trenton":"30752","Whitwell":"37397"};
const PL_ZIPS={"Chicago":"60601","Minneapolis":"55401","Cincinnati":"45202","Denver":"80202","Countryside":"60525","Bridgeview":"60455","Cicero":"60804","Berwyn":"60402","Summit":"60501","Melrose Park":"60160","Bellwood":"60104","Harvey":"60426","Blue Island":"60406","Calumet City":"60409","Schiller Park":"60176","Franklin Park":"60131","Broadview":"60155","Maywood":"60153","Stickney":"60402","Bedford Park":"60499","Lyons":"60534"};
const WK_COORDS={"CHA-RGN-4010":[35.177601,-84.914373],"CHA-RGN-6005":[35.016692,-85.162505],"CHA-RGN-7494":[35.223438,-84.883059],"CHA-RGN-8531":[35.088734,-85.187028],"CHA-RGN-9346":[34.971694,-85.268766],"CHA-RGN-9348":[35.113019,-85.265048],"CHA-RGN-9354":[35.373917,-85.113959],"CHA-RGN-9454":[35.039466,-85.150667],"CHA-RGN-9683":[34.928278,-85.155382],"CHA-RGN-2410":[35.1735,-84.9312],"CHA-RGN-89244":[35.0825,-85.222],"CHA-RGN-85364":[35.098,-85.209],"CHA-RGN-84022":[35.0365,-85.254],"CHA-RGN-85019":[35.162,-84.878],"CHA-RGN-89201":[35.1715,-84.871],"CHA-RGN-85026":[35.167,-84.874],"CHA-RGN-2472":[35.168,-84.862],"CHA-RGN-89192":[35.218,-84.884],"CHA-RGN-2401":[35.16,-84.877],"CHA-RGN-89188":[35.17,-84.873],"CHA-RGN-7489":[35.174,-84.875],"CHA-RGN-89194":[35.156,-84.876],"CHA-RGN-2343":[35.523,-84.648],"CHA-RGN-83242":[35.055,-85.295],"CHA-RGN-85547":[35.025,-85.312],"CHA-RGN-83165":[35.021,-85.305],"CHA-RGN-89234":[35.0185,-85.29],"CHA-RGN-2213":[35.047,-85.293],"CHA-RGN-84004":[35.045,-85.318],"CHA-RGN-85407":[35.054,-85.313],"CHA-RGN-84064":[35.0435,-85.297],"CHA-RGN-83169":[35.026,-85.302],"CHA-RGN-89210":[35.373,-85.393],"CHA-RGN-9371":[35.019,-85.156],"CHA-RGN-83084":[34.993,-85.212],"CHA-RGN-85097":[34.951,-85.258],"CHA-RGN-85393":[35.131,-85.258],"CHA-RGN-2182":[35.134,-85.236],"CHA-RGN-9369":[35.121,-85.264],"CHA-RGN-81075":[35.11,-85.298],"CHA-RGN-84254":[35.115,-85.148],"CHA-RGN-2480":[34.721,-85.29],"CHA-RGN-2271":[35.154,-85.247],"CHA-RGN-82080":[35.018,-85.378],"CHA-RGN-89150":[35.158,-85.212],"CHA-RGN-81113":[35.072,-85.322],"CHA-RGN-89175":[35.082,-85.063],"CHA-RGN-81072":[35.11,-85.303],"CHA-RGN-81221":[35.118,-85.3],"CHA-RGN-2461":[34.916,-85.108],"CHA-RGN-2397":[34.921,-85.113],"CHA-RGN-89080":[35.075,-85.267],"CHA-RGN-89179":[34.978,-85.285],"CHA-RGN-2234":[34.974,-85.279],"CHA-RGN-85554":[35.107,-85.345],"CHA-RGN-85413":[35.012,-85.703],"CHA-RGN-82094":[35.001,-85.321],"CHA-RGN-85514":[34.874,-85.512],"CHA-RGN-89226":[35.197,-85.526],"MTG-LMR-75756":[32.3682,-86.2488],"MTG-LMR-75766":[32.3974,-86.2627],"MTG-LMR-76262":[32.3345,-86.2062],"MTG-LMR-76305":[32.4073,-87.0214],"MTG-LMR-76325":[31.831,-86.6178],"MTG-LMR-76347":[32.3471,-86.2688],"MTG-LMR-76807":[32.369,-86.241],"MTG-LMR-76013":[32.3625,-86.3135],"BRM-LMR-5410":[33.8313,-87.2775],"BRM-LMR-2935":[33.5205,-86.8985],"BRM-LMR-4405":[33.5215,-86.8504],"BRM-LMR-2081":[33.502,-86.948],"BRM-LMR-13230":[33.4635,-86.8738],"BRM-LMR-2003":[33.4954,-86.812],"BRM-LMR-1965":[33.3905,-86.8115],"BRM-LMR-3005":[33.453,-86.842],"BRM-LMR-5051":[33.4685,-86.826],"BRM-LMR-3163":[33.4488,-86.806],"BRM-LMR-3227":[33.4823,-86.8302],"BRM-LMR-4673":[33.508,-86.806],"BRM-LMR-617":[33.5215,-86.794],"BRM-LMR-296":[33.5398,-86.7613],"BRM-LMR-3971":[33.6198,-86.711],"BRM-LMR-4941":[33.572,-86.736],"BRM-LMR-3021":[33.565,-86.738],"BRM-LMR-3662":[33.629,-86.752],"BRM-LMR-2821":[33.6045,-86.715],"BRM-LMR-4703":[33.5605,-86.835],"BRM-LMR-2981":[33.556,-86.832],"BRM-LMR-2485":[33.5175,-86.7735],"BRM-LMR-1417":[33.5285,-86.6855],"BRM-LMR-4613":[33.48,-86.7505],"BRM-LMR-10809":[33.5862,-86.2868],"BRM-LMR-10911":[33.448,-86.108],"BRM-LMR-10921":[33.431,-86.107],"BRM-LMR-11092":[33.281,-86.325],"GAD-LMR-4032":[33.996,-86.007],"BRM-LMR-4097":[33.574,-85.829],"BRM-LMR-94151":[33.559,-85.875]};

// ── PL OOH PoP CONFIRMATIONS (from Wilkins PoP PPTXs) ──
const PL_POPS={"2084":{popDate:"2/5/2026",contract:"2026-41440"},"7061O":{popDate:"2/6/2026",contract:"2026-41440"},"1640":{popDate:"2/4/2026",contract:"2026-41440"},"2015":{popDate:"2/18/2026",contract:"2026-41440"},"1398":{popDate:"12/15/2025",contract:"2025-40749"},"IM009":{popDate:"12/11/2025",contract:"2025-40749"},"IM010":{popDate:"12/11/2025",contract:"2025-40749"},"1569":{popDate:"12/11/2025",contract:"2025-40749"},"1512O":{popDate:"12/11/2025",contract:"2025-40749"},"1565O":{popDate:"12/11/2025",contract:"2025-40749"},"8313RO":{popDate:"12/2/2025",contract:"2025-40749"},"8520KO":{popDate:"12/2/2025",contract:"2025-40749"},"1282":{popDate:"12/11/2025",contract:"2025-40749"},"1070":{popDate:"12/11/2025",contract:"2025-40749"},"1636":{popDate:"12/11/2025",contract:"2025-40749"},"1084":{popDate:"12/11/2025",contract:"2025-40749"},"1304":{popDate:"12/11/2025",contract:"2025-40749"},"156A":{popDate:"11/12/2025",contract:"2025-37862"},"410A":{popDate:"11/12/2025",contract:"2025-37862"}};
// ── OOH CONTRACT STATUS TRACKING ──
const contractStatus=(c,now)=>{if(!c||!c.endDate)return{status:"unknown",color:"#a89ed4",bg:"#f1f5f9",label:"Unknown"};const end=new Date(c.endDate);const start=new Date(c.startDate||"2025-01-01");const today=now||new Date();const daysLeft=Math.ceil((end-today)/(1000*60*60*24));if(c.manualStatus)return c.manualStatus==="renewal"?{status:"renewal",color:"#d97706",bg:"#fffbeb",label:"Pending Renewal",daysLeft}:c.manualStatus==="expired"?{status:"expired",color:"#dc2626",bg:"#fef2f2",label:"Expired",daysLeft}:{status:"active",color:"#16a34a",bg:"#dcfce7",label:"Active",daysLeft};if(today<start)return{status:"upcoming",color:"#2563eb",bg:"#dbeafe",label:"Not Started",daysLeft};if(daysLeft<0)return{status:"expired",color:"#dc2626",bg:"#fef2f2",label:"Expired",daysLeft};if(daysLeft<=30)return{status:"expiring",color:"#ea580c",bg:"#fff7ed",label:`Expiring (${daysLeft}d)`,daysLeft};if(daysLeft<=60)return{status:"expiring-soon",color:"#d97706",bg:"#fffbeb",label:`${daysLeft}d remaining`,daysLeft};return{status:"active",color:"#16a34a",bg:"#dcfce7",label:"Active",daysLeft};};
// ── OOH CREATIVE SWITCH CALENDAR (from Outlook + Wilkins Spec Sheet FY26) ──
const OOH_CREATIVE_CAL=[
  // === PAST (Jan-Feb 2026) ===
  {dmas:["CIN"],title:"Bulletin creative due",due:"2026-01-12",type:"creative",units:"Various",size:"14x48",spec:"Static Bulletin · CMYK 408dpi · Contract 2026-41376",start:"2026-02-02"},
  {dmas:["CHI"],title:"Creative due — 3 boards",due:"2026-01-19",type:"creative",units:"2084 (20x60), 7061O (14x48), 1640 (14x48)",size:"20x60 / 14x48",spec:"Static Bulletin · CMYK · Contract 2026-41440",start:"2026-02-02"},
  {dmas:["CHI"],title:"View Chicago boards launch",due:"2026-01-05",type:"launch",units:"",size:"",spec:""},
  {dmas:["CHI"],title:"Digital Bulletin creative due",due:"2026-01-26",type:"creative",units:"BONUS (3 sizes)",size:"288x288 / 160x552 / 304x912px",spec:"Digital Bulletin · RGB 72dpi · JPG",start:"2026-02-02"},
  {dmas:["CIN"],title:"Digital Poster creative due",due:"2026-01-26",type:"creative",units:"Various",size:"400x840px",spec:"Digital Poster · RGB 72dpi · JPG · Contract 2026-41376",start:"2026-02-02"},
  {dmas:["CIN"],title:"1st round 2025 boards dark",due:"2026-02-02",type:"dark",units:"",size:"",spec:""},
  {dmas:["CHI"],title:"Creative due — Unit 2015",due:"2026-02-02",type:"creative",units:"2015",size:"20x60",spec:"Static Bulletin · CMYK · Contract 2026-41440",start:"2026-02-16"},
  {dmas:["DEN"],title:"All OOH dark",due:"2026-02-02",type:"dark",units:"",size:"",spec:""},
  {dmas:["CHI"],title:"Creative due",due:"2026-02-17",type:"creative",units:"1282, 1070",size:"14x48",spec:"Static Bulletin · CMYK · Contract 2026-41440",start:"2026-03-02"},
  {dmas:["CIN"],title:"All OOH dark (minus 1 board)",due:"2026-02-17",type:"dark",units:"Unit 708 stays",size:"",spec:"All boards dark minus Unit 708 · Poster Rotary launches 4/20"},
  // === CIN ROTARY FLIGHT (Mar 2026 from POPS) ===
  {dmas:["CIN"],title:"Rotary Bulletin flight begins",due:"2026-03-02",type:"launch",units:"630, 539, 570, 518, 512, 2456 (Static) + 8016 (10x21 Dig), 8013 (12x24 Dig)",size:"14x48 / 10x21 / 12x24",spec:"8 boards · 3/2-3/29 · Wilkins Media"},
  // === UPCOMING (Mar-Jun 2026) ===
  {dmas:["CHI"],title:"Creative due — Unit 1636",due:"2026-03-09",type:"creative",units:"1636",size:"14x48",spec:"Static Bulletin · CMYK · Contract 2026-41440",start:"2026-03-23"},
  {dmas:["CHI"],title:"Creative due — Unit 1084",due:"2026-03-16",type:"creative",units:"1084",size:"14x48",spec:"Static Bulletin · CMYK · Contract 2026-41440",start:"2026-03-30"},
  {dmas:["MSP"],title:"Digital creative due",due:"2026-03-23",type:"creative",units:"156A, DDA Bonus",size:"208x720px",spec:"Digital Bulletin · RGB 72dpi · JPG · Contract 2026-41357",start:"2026-03-30"},
  {dmas:["CIN"],title:"Poster creative due",due:"2026-03-30",type:"creative",units:"Various Posters",size:"10.5x22.8",spec:"Static Poster · CMYK 300dpi · Contract 2026-41376",start:"2026-04-20"},
  {dmas:["MSP"],title:"1st round 2025 boards dark",due:"2026-03-31",type:"dark",units:"",size:"",spec:""},
  {dmas:["MSP"],title:"2nd round 2025 boards dark",due:"2026-04-06",type:"dark",units:"",size:"",spec:""},
  {dmas:["CIN"],title:"Poster Rotary program launch",due:"2026-04-20",type:"launch",units:"",size:"",spec:"Rotary poster program begins"},
  {dmas:["CIN"],title:"Poster creative due",due:"2026-04-27",type:"creative",units:"Various Posters",size:"10.5x22.8",spec:"Static Poster · CMYK 300dpi",start:"2026-05-18"},
  {dmas:["CIN"],title:"All OOH dark",due:"2026-05-05",type:"dark",units:"",size:"",spec:""},
  {dmas:["CHI"],title:"1st round 2025 boards dark",due:"2026-05-11",type:"dark",units:"",size:"",spec:""},
  {dmas:["CHI"],title:"Creative due — ALL CHI boards (13)",due:"2026-05-18",type:"creative",units:"1569 (20x60), 1512O (20x60), 1565O (20x60), 8520KO (20x60), 2084 (20x60), 2015 (20x60), 8313RO (14x48), 1282 (14x48), 1636 (14x48), 1070 (14x48), 1084 (14x48), 7061O (14x48), 1640 (14x48)",size:"20x60 / 14x48",spec:"13 Static Bulletins · CMYK · Contract 2026-41440",start:"2026-06-01"},
  {dmas:["MSP"],title:"Creative due — 4 MSP boards",due:"2026-05-18",type:"creative",units:"127O (14x48), 166O (14x48), 174O (10.5x36), 112O (14x48)",size:"14x48 / 10.5x36",spec:"Static Bulletins · CMYK 408dpi · Contract 2026-41357",start:"2026-06-01"},
  {dmas:["MSP"],title:"Creative due — Unit 93035",due:"2026-05-25",type:"creative",units:"93035",size:"14x48",spec:"Static Bulletin · CMYK 408dpi · Contract 2026-41357",start:"2026-06-08"},
  {dmas:["DEN"],title:"Pump Topper creative due",due:"2026-05-25",type:"creative",units:"Clip Frame (12.5x20.6\"), Chevron Frame (10.75x25\"), Eclipse Frame (21x21.5\")",size:"3 frame types",spec:"Gas Pump Toppers · CMYK 408dpi · Contract 2026-41356",start:"2026-06-22"},
  {dmas:["DEN"],title:"Transit Shelter creative due",due:"2026-06-01",type:"creative",units:"Transit Shelters",size:"68.25x47.5\"",spec:"Transit Shelters · CMYK 600dpi · Contract 2026-41356",start:"2026-06-22"},
  {dmas:["MSP"],title:"3rd round 2025 boards dark",due:"2026-06-08",type:"dark",units:"",size:"",spec:""},
  {dmas:["DEN"],title:"Bus Shelters & Gas Toppers launch",due:"2026-06-22",type:"launch",units:"",size:"",spec:"Transit Shelters + Pump Toppers go live"},
  // === FALL 2026 ===
  {dmas:["MSP"],title:"Creative due — Unit 113O",due:"2026-09-14",type:"creative",units:"113O",size:"14x48",spec:"Static Bulletin · CMYK 408dpi · Contract 2026-41357",start:"2026-09-28"},
  {dmas:["MSP"],title:"Creative due — 2 boards",due:"2026-09-21",type:"creative",units:"92890, MN-2004B",size:"14x48",spec:"Static Bulletin · CMYK 408dpi · Contract 2026-41357",start:"2026-10-05"},
  {dmas:["MSP"],title:"Digital creative due — Unit 410A",due:"2026-09-28",type:"creative",units:"410A",size:"208x720px",spec:"Digital Bulletin · RGB 72dpi · JPG · Contract 2026-41357",start:"2026-10-05"},
  {dmas:["DEN"],title:"Bus Shelters & Gas Toppers end",due:"2026-12-07",type:"dark",units:"",size:"",spec:""},
  {dmas:["CIN"],title:"Poster Rotary program ends",due:"2026-12-21",type:"dark",units:"",size:"",spec:""}
];
const oohCalType=(t)=>({creative:{label:"Creative Due",color:"#dc2626",bg:"#fef2f2",icon:"🎨"},switch:{label:"Board Switch",color:"#2563eb",bg:"#dbeafe",icon:"🔄"},dark:{label:"Going Dark",color:"#a89ed4",bg:"#f1f5f9",icon:"🌑"},launch:{label:"Launch",color:"#16a34a",bg:"#dcfce7",icon:"🚀"}})[t]||{label:t,color:"#a89ed4",bg:"#f1f5f9",icon:"📅"};
const oohCalStatus=(due)=>{const d=new Date(due+"T12:00:00");const today=new Date();const days=Math.ceil((d-today)/(1000*60*60*24));if(days<0)return{status:"past",days,label:"Completed"};if(days===0)return{status:"today",days,label:"TODAY"};if(days<=7)return{status:"urgent",days,label:`${days}d`};if(days<=14)return{status:"soon",days,label:`${days}d`};return{status:"future",days,label:`${days}d`};};


// ── REUSABLE LEAFLET MAP COMPONENT ──
const OohMap=({pins,colorFn,labelFn,height,showHeat})=>{
  const mapRef=React.useRef(null);const mapInst=React.useRef(null);
  const[heatOn,setHeatOn]=React.useState(showHeat||false);
  React.useEffect(()=>{
    if(!mapRef.current||!window.L)return;
    if(mapInst.current){mapInst.current.remove();mapInst.current=null}
    const valid=pins.filter(p=>p.lat&&p.lng&&p.lat!==0&&p.lng!==0);
    if(!valid.length)return;
    const map=window.L.map(mapRef.current,{scrollWheelZoom:true,zoomControl:true});
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM',maxZoom:18}).addTo(map);
    // Heatmap layer
    if(heatOn&&window.L.heatLayer){
      const heatData=valid.map(p=>[p.lat,p.lng,p.impressions?(p.impressions/10000):1]);
      window.L.heatLayer(heatData,{radius:25,blur:20,maxZoom:12,gradient:{0.2:'#3b82f6',0.4:'#7c3aed',0.6:'#f59e0b',0.8:'#ea580c',1.0:'#dc2626'}}).addTo(map);
    }
    valid.forEach(p=>{
      const c=colorFn?colorFn(p):"#dc2626";
      let icon,mopts;
      if(p.hi){
        // Highlighted board — larger gold marker with a ★ + unit label, drawn on top.
        const sz=22;
        icon=window.L.divIcon({className:'',html:'<div style="position:relative;display:flex;justify-content:center"><div style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:#D4A040;border:3px solid #fff;box-shadow:0 0 0 4px rgba(212,160,64,.4),0 2px 6px rgba(0,0,0,.45)"></div><div style="position:absolute;top:'+(sz+3)+'px;white-space:nowrap;font:800 10px \'DM Sans\',sans-serif;color:#1e1233;background:#D4A040;padding:1px 6px;border-radius:7px;box-shadow:0 1px 3px rgba(0,0,0,.35)">★ '+p.id+'</div></div>',iconSize:[sz,sz],iconAnchor:[sz/2,sz/2]});
        mopts={icon,zIndexOffset:1000};
      }else{
        const sz=heatOn?8:12;
        icon=window.L.divIcon({className:'',html:'<div style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+c+';border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);opacity:'+(heatOn?'.6':'1')+'"></div>',iconSize:[12,12],iconAnchor:[6,6]});
        mopts={icon};
      }
      const m=window.L.marker([p.lat,p.lng],mopts).addTo(map);
      const label=labelFn?labelFn(p):p.id;
      const popPhoto=typeof POP_PHOTOS!=='undefined'&&POP_PHOTOS[p.id]?POP_PHOTOS[p.id]:(typeof POP_IMGS!=='undefined'&&p.closeImg?POP_IMGS[p.closeImg]:null);
      m.bindPopup('<div style="font-family:DM Sans,sans-serif;min-width:200px;max-width:320px"><div style="font-weight:700;font-size:13px">'+p.id+'</div>'+(p.vendor?'<div style="font-size:10px;color:#7c3aed;font-weight:600">'+p.vendor+'</div>':'')+'<div style="font-size:10px;color:#475569;margin-top:4px">'+p.location+'</div>'+(p.size?'<div style="font-size:10px;color:#64748b">'+p.size+'</div>':'')+(p.status?'<div style="font-size:10px;margin-top:4px;font-weight:600;color:#16a34a">'+p.status+'</div>':'')+(p.impressions?'<div style="font-size:10px;color:#2563eb;font-weight:600">'+(p.impressions).toLocaleString()+' wkly</div>':'')+(popPhoto?'<div style="margin-top:6px;border-top:1px solid #e2e8f0;padding-top:6px"><div style="font-size:9px;font-weight:600;color:#2563eb;margin-bottom:3px">📸 PoP Photo</div><img src="'+popPhoto+'" style="width:100%;border-radius:4px;border:1px solid #e2e8f0"/></div>':'')+'</div>',{maxWidth:340});
    });
    const bounds=window.L.latLngBounds(valid.map(p=>[p.lat,p.lng]));
    map.fitBounds(bounds,{padding:[30,30]});
    mapInst.current=map;
    return()=>{if(mapInst.current){mapInst.current.remove();mapInst.current=null}};
  },[pins,heatOn]);
  const valid=pins.filter(p=>p.lat&&p.lng&&p.lat!==0&&p.lng!==0);
  if(!valid.length)return<div style={{padding:20,textAlign:"center",color:"#a89ed4",fontSize:14}}>No coordinates available for map view</div>;
  return<div style={{position:"relative"}}>
    <div ref={mapRef} style={{height:height||380,borderRadius:9,border:"1px solid #e0d9f7"}}/>
    <button onClick={()=>setHeatOn(h=>!h)} style={{position:"absolute",top:10,right:10,zIndex:1000,padding:"5px 10px",borderRadius:6,border:"1px solid "+(heatOn?"#dc2626":"#334155"),background:heatOn?"rgba(220,38,38,.9)":"rgba(15,23,42,.85)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",backdropFilter:"blur(4px)"}}>
      {heatOn?"🔥 Heat On":"🔥 Heatmap"}
    </button>
  </div>;
};

// Defensive: explicitly attach commonly-referenced top-level identifiers
// to window so app.js can find them regardless of how Babel-standalone
// scopes module-typed scripts. Without this, OohMap was throwing
// "ReferenceError: OohMap is not defined" inside OohPg render.
if (typeof window !== "undefined") {
  if (typeof B !== "undefined") window.B = B;
  if (typeof Btn !== "undefined") window.Btn = Btn;
  if (typeof Inp !== "undefined") window.Inp = Inp;
  if (typeof Sel !== "undefined") window.Sel = Sel;
  if (typeof OohMap !== "undefined") window.OohMap = OohMap;
  if (typeof CASE_TYPES !== "undefined") window.CASE_TYPES = CASE_TYPES;
  if (typeof VALUE_PROPS !== "undefined") window.VALUE_PROPS = VALUE_PROPS;
  if (typeof ISCIS_INIT !== "undefined") window.ISCIS_INIT = ISCIS_INIT;
  if (typeof ESTIMATES !== "undefined") window.ESTIMATES = ESTIMATES;
  if (typeof STATIONS !== "undefined") window.STATIONS = STATIONS;
  if (typeof CALENDAR !== "undefined") window.CALENDAR = CALENDAR;
  if (typeof POSTINGS !== "undefined") window.POSTINGS = POSTINGS;
  if (typeof DM !== "undefined") window.DM = DM;
  if (typeof DL !== "undefined") window.DL = DL;
  if (typeof BRANDS !== "undefined") window.BRANDS = BRANDS;
  if (typeof MEDIA !== "undefined") window.MEDIA = MEDIA;
  if (typeof OOH_TYPES !== "undefined") window.OOH_TYPES = OOH_TYPES;
  if (typeof SUFFIXES !== "undefined") window.SUFFIXES = SUFFIXES;
  if (typeof OOH_SUFFIXES !== "undefined") window.OOH_SUFFIXES = OOH_SUFFIXES;
  if (typeof OOH_TYPE_MAP !== "undefined") window.OOH_TYPE_MAP = OOH_TYPE_MAP;
  if (typeof EG !== "undefined") window.EG = EG;
  if (typeof SCHED !== "undefined") window.SCHED = SCHED;
  if (typeof BOOKENDS !== "undefined") window.BOOKENDS = BOOKENDS;
  if (typeof OOH_CREATIVE_CAL !== "undefined") window.OOH_CREATIVE_CAL = OOH_CREATIVE_CAL;
  if (typeof oohCalType !== "undefined") window.oohCalType = oohCalType;
  if (typeof oohCalStatus !== "undefined") window.oohCalStatus = oohCalStatus;
}

