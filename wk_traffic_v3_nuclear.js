// ═══════════════════════════════════════════════════════════════
// WK TRAFFIC INJECTION v3 — NUCLEAR CLEAN + INJECT
// Wipes ALL entries that match any WK market+month combos we're
// importing, then adds the 16 correct entries.
// Paste into browser console at https://atticor-doom.vercel.app
// ═══════════════════════════════════════════════════════════════

(async () => {
  try {
    const now = Date.now();
    let c = 0;

    const imports = [
      {ts:new Date(now- ++c).toISOString(),est:"MTG-WK-TV",brand:"Wettermark Keith",market:"MTG",media:"TV",buyer:"Amy Coffey",month:"March",flight:"2/23 - 3/29",version:"1",comments:"Version 1 / Montgomery Assets",stations:[],status:"imported",iscis:[
        {code:"MTGWK2630015T",title:"Auto Accident_30",dur:"30",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"MTGWK2630003T",title:"Mother's Wreck_30",dur:"30",pct:"25",sched:"2/23 - 3/29",bookend:""},
        {code:"MTGWK2630005T",title:"Working Man_30",dur:"30",pct:"25",sched:"2/23 - 3/29",bookend:""},
        {code:"MTGWK2630006T",title:"Weekends_30",dur:"30",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"MTGWK2630015T",title:"Auto Accident_30",dur:"30",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"MTGWK2615012T",title:"On the Job Injury_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"MTGWK2615010T",title:"Strength in Confidence_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"MTGWK2615014T",title:"Auto Accident_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"MTGWK2615009T",title:"Commercial Vehicle_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"MTGWK2615003T",title:"Trucking Two_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 C"},
        {code:"MTGWK2615013T",title:"Premises Liability_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 C"},
        {code:"MTGWK2615014T",title:"Auto Accident_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"MTGWK2515008T",title:"Commercial Accident_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"MTGWK2615008T",title:"Trucking One_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"MTGWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"MTGWK2615007T",title:"Mother's Wreck_15",dur:"15",pct:"100",sched:"2/23 - 3/29",bookend:""},
        {code:"MTGWK2610002T",title:"Premise Injury_10",dur:"10",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"MTGWK2610001T",title:"Car Wreck_10",dur:"10",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"MTGWK2605002T",title:"Premise Injury_5",dur:"05",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"MTGWK2605001T",title:"Car Wreck_05",dur:"05",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"MTGWK2604001T",title:"Personal_04",dur:"04",pct:"100",sched:"2/23 - 3/29",bookend:""}
      ]},
      {ts:new Date(now- ++c).toISOString(),est:"BRM-WK-TV",brand:"Wettermark Keith",market:"BRM",media:"TV",buyer:"Amy Coffey",month:"March",flight:"2/23 - 3/29",version:"1",comments:"Version 1 / Birmingham Assets",stations:[],status:"imported",iscis:[
        {code:"BRMWK2630002T",title:"Award Winning_30",dur:"30",pct:"30",sched:"2/23 - 3/29",bookend:""},
        {code:"BRMWK2630003T",title:"Mother's Wreck_30",dur:"30",pct:"20",sched:"2/23 - 3/29",bookend:""},
        {code:"BRMWK2630015T",title:"Auto Accident_30",dur:"30",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"BRMWK2630006T",title:"Weekends_30",dur:"30",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"BRMWK2630015T",title:"Auto Accident_30",dur:"30",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"BRMWK2615010T",title:"Strength in Confidence_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"BRMWK2615014T",title:"Auto Accident_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"BRMWK2515007T",title:"Branding Legacy_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"BRMWK2615011T",title:"More to Us_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"BRMWK2515009T",title:"Distracted Cell Phones_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 C"},
        {code:"BRMWK2615012T",title:"On the Job Injury_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 C"},
        {code:"BRMWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"BRMWK2615014T",title:"Auto Accident_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"BRMWK2615001T",title:"Car Wreck_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"BRMWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"BRMWK2615007T",title:"Mother's Wreck_15",dur:"15",pct:"100",sched:"2/23 - 3/29",bookend:""},
        {code:"BRMWK2610002T",title:"Premise Injury_10",dur:"10",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"BRMWK2610001T",title:"Car Wreck_10",dur:"10",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"BRMWK2605002T",title:"Premise Injury_5",dur:"05",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"BRMWK2605001T",title:"Car Wreck_05",dur:"05",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"BRMWK2604001T",title:"Personal_04",dur:"04",pct:"100",sched:"2/23 - 3/29",bookend:""}
      ]},
      {ts:new Date(now- ++c).toISOString(),est:"DHN-WK-TV",brand:"Wettermark Keith",market:"DHN",media:"TV",buyer:"Amy Coffey",month:"March",flight:"2/23 - 3/29",version:"1",comments:"Version 1 / Dothan Assets",stations:[],status:"imported",iscis:[
        {code:"DHNWK2630015T",title:"Auto Accident_30",dur:"30",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"DHNWK2630003T",title:"Mother's Wreck_30",dur:"30",pct:"25",sched:"2/23 - 3/29",bookend:""},
        {code:"DHNWK2630013T",title:"Insurance Experts_30",dur:"30",pct:"25",sched:"2/23 - 3/29",bookend:""},
        {code:"DHNWK2630006T",title:"Weekends_30",dur:"30",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"DHNWK2530007T",title:"Different_30",dur:"30",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"DHNWK2615014T",title:"Auto Accident_15 Bookend",dur:"15",pct:"12.5",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"DHNWK2515007T",title:"Branding Legacy_15 Bookend",dur:"15",pct:"12.5",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"DHNWK2615011T",title:"More to Us_15 Bookend",dur:"15",pct:"12.5",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"DHNWK2615003T",title:"Trucking Two_15 Bookend",dur:"15",pct:"12.5",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"DHNWK2515010T",title:"Different_15 Bookend",dur:"15",pct:"12.5",sched:"2/23 - 3/29",bookend:"Bookend :15 C"},
        {code:"DHNWK2615012T",title:"On the Job Injury_15 Bookend",dur:"15",pct:"12.5",sched:"2/23 - 3/29",bookend:"Bookend :15 C"},
        {code:"DHNWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"DHNWK2615003T",title:"Trucking Two_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"DHNWK2615014T",title:"Auto Accident_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"DHNWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"DHNWK2615007T",title:"Mother's Wreck_15",dur:"15",pct:"100",sched:"2/23 - 3/29",bookend:""},
        {code:"DHNWK2610002T",title:"Premise Injury_10",dur:"10",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"DHNWK2610001T",title:"Car Wreck_10",dur:"10",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"DHNWK2605002T",title:"Premise Injury_5",dur:"05",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"DHNWK2605001T",title:"Car Wreck_05",dur:"05",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"DHNWK2604001T",title:"Personal_04",dur:"04",pct:"100",sched:"2/23 - 3/29",bookend:""}
      ]},
      {ts:new Date(now- ++c).toISOString(),est:"CHA-WK-TV",brand:"Wettermark Keith",market:"CHA",media:"TV",buyer:"Amy Coffey",month:"March",flight:"2/23 - 3/29",version:"1",comments:"Version 1 / Chattanooga Assets",stations:[],status:"imported",iscis:[
        {code:"CHAWK2630004T",title:"Personal_30",dur:"30",pct:"33",sched:"2/23 - 3/29",bookend:""},
        {code:"CHAWK2630003T",title:"Mother's Wreck_30",dur:"30",pct:"33",sched:"2/23 - 3/29",bookend:""},
        {code:"CHAWK2630002T",title:"Award Winning_30",dur:"30",pct:"34",sched:"2/23 - 3/29",bookend:""},
        {code:"CHAWK2630006T",title:"Weekends_30",dur:"30",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"CHAWK2630004T",title:"Personal_30",dur:"30",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"CHAWK2615011T",title:"More to Us_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"CHAWK2615004T",title:"Premise Injury_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"CHAWK2615009T",title:"Commercial Vehicle_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"CHAWK2615011T",title:"More to Us_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"CHAWK2515007T",title:"Branding Legacy_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 C"},
        {code:"CHAWK2615012T",title:"On the Job Injury_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 C"},
        {code:"CHAWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"CHAWK2615004T",title:"Premise Injury_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"CHAWK2615014T",title:"Auto Accident_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"CHAWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"CHAWK2515001T",title:"Car Wreck_15",dur:"15",pct:"100",sched:"2/23 - 3/29",bookend:""},
        {code:"CHAWK2610002T",title:"Premise Injury_10",dur:"10",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"CHAWK2610001T",title:"Car Wreck_10",dur:"10",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"CHAWK2605002T",title:"Premise Injury_5",dur:"05",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"CHAWK2605001T",title:"Car Wreck_05",dur:"05",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"CHAWK2604001T",title:"Personal_04",dur:"04",pct:"100",sched:"2/23 - 3/29",bookend:""}
      ]},
      {ts:new Date(now- ++c).toISOString(),est:"KNX-WK-TV",brand:"Wettermark Keith",market:"KNX",media:"TV",buyer:"Amy Coffey",month:"March",flight:"2/23 - 3/29",version:"1",comments:"Version 1 / Knoxville Assets",stations:[],status:"imported",iscis:[
        {code:"KNXWK2630004T",title:"Personal_30",dur:"30",pct:"33",sched:"2/23 - 3/29",bookend:""},
        {code:"KNXWK2630003T",title:"Mother's Wreck_30",dur:"30",pct:"33",sched:"2/23 - 3/29",bookend:""},
        {code:"KNXWK2630002T",title:"Award Winning_30",dur:"30",pct:"34",sched:"2/23 - 3/29",bookend:""},
        {code:"KNXWK2630004T",title:"Personal_30",dur:"30",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"KNXWK2630006T",title:"Weekends_30",dur:"30",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"KNXWK2615011T",title:"More to Us_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"KNXWK2615004T",title:"Premise Injury_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"KNXWK2615009T",title:"Commercial Vehicle_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"KNXWK2615011T",title:"More to Us_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"KNXWK2515007T",title:"Branding Legacy_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 C"},
        {code:"KNXWK2615012T",title:"On the Job Injury_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 C"},
        {code:"KNXWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"KNXWK2615004T",title:"Premise Injury_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"KNXWK2615014T",title:"Auto Accident_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"KNXWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"KNXWK2615007T",title:"Mother's Wreck_15",dur:"15",pct:"100",sched:"2/23 - 3/29",bookend:""},
        {code:"KNXWK2610002T",title:"Premise Injury_10",dur:"10",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"KNXWK2610001T",title:"Car Wreck_10",dur:"10",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"KNXWK2605002T",title:"Premise Injury_5",dur:"05",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"KNXWK2605001T",title:"Car Wreck_05",dur:"05",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"KNXWK2604001T",title:"Personal_04",dur:"04",pct:"100",sched:"2/23 - 3/29",bookend:""}
      ]},
      {ts:new Date(now- ++c).toISOString(),est:"HSV-WK-TV",brand:"Wettermark Keith",market:"HSV",media:"TV",buyer:"Amy Coffey",month:"March",flight:"2/23 - 3/29",version:"1",comments:"Version 1 / Huntsville Assets",stations:[],status:"imported",iscis:[
        {code:"HSVWK2630015T",title:"Auto Accident_30",dur:"30",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"HSVWK2630003T",title:"Mother's Wreck_30",dur:"30",pct:"20",sched:"2/23 - 3/29",bookend:""},
        {code:"HSVWK2630002T",title:"Award Winning_30",dur:"30",pct:"30",sched:"2/23 - 3/29",bookend:""},
        {code:"HSVWK2630006T",title:"Weekends_30",dur:"30",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"HSVWK2630004T",title:"Personal_30",dur:"30",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"HSVWK2515007T",title:"Branding Legacy_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"HSVWK2615014T",title:"Auto Accident_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"HSVWK2615003T",title:"Trucking Two_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"HSVWK2615011T",title:"More to Us_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"HSVWK2515009T",title:"Distracted Cell Phones_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 C"},
        {code:"HSVWK2515010T",title:"Different_15 Bookend",dur:"15",pct:"16.5",sched:"2/23 - 3/29",bookend:"Bookend :15 C"},
        {code:"HSVWK2615014T",title:"Auto Accident_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"HSVWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 A"},
        {code:"HSVWK2615008T",title:"Trucking One_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"HSVWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"2/23 - 3/29",bookend:"Bookend :15 B"},
        {code:"HSVWK2615007T",title:"Mother's Wreck_15",dur:"15",pct:"100",sched:"2/23 - 3/29",bookend:""},
        {code:"HSVWK2610002T",title:"Premise Injury_10",dur:"10",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"HSVWK2610001T",title:"Car Wreck_10",dur:"10",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"HSVWK2605002T",title:"Premise Injury_5",dur:"05",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"HSVWK2605001T",title:"Car Wreck_05",dur:"05",pct:"50",sched:"2/23 - 3/29",bookend:""},
        {code:"HSVWK2604001T",title:"Personal_04",dur:"04",pct:"100",sched:"2/23 - 3/29",bookend:""}
      ]},
      {ts:new Date(now- ++c).toISOString(),est:"DHN-WK-RAD",brand:"Wettermark Keith",market:"DHN",media:"Radio",buyer:"Amy Coffey",month:"February",flight:"2/2 - 2/22",version:"1",comments:"Dothan Radio Assets",stations:[],status:"imported",iscis:[
        {code:"DHNWK2630005R",title:"Twenty Years_V1_30",dur:"30",pct:"50",sched:"2/2 - 2/22",bookend:""},
        {code:"DHNWK2630001R",title:"Blue Collar Roots_30",dur:"30",pct:"50",sched:"2/2 - 2/22",bookend:""},
        {code:"DHNWK2615002R",title:"Twenty Years_15",dur:"15",pct:"50",sched:"2/2 - 2/22",bookend:""},
        {code:"DHNWK2615003R",title:"Right Lawyer_15",dur:"15",pct:"50",sched:"2/2 - 2/22",bookend:""}
      ]},
      {ts:new Date(now- ++c).toISOString(),est:"MTG-WK-RAD",brand:"Wettermark Keith",market:"MTG",media:"Radio",buyer:"Amy Coffey",month:"February",flight:"2/2 - 2/22",version:"1",comments:"Montgomery Radio Assets",stations:[],status:"imported",iscis:[
        {code:"MTGWK2630005R",title:"Twenty Years_V1_30",dur:"30",pct:"50",sched:"2/2 - 2/22",bookend:""},
        {code:"MTGWK2630001R",title:"Blue Collar Roots_30",dur:"30",pct:"50",sched:"2/2 - 2/22",bookend:""},
        {code:"MTGWK2615002R",title:"Twenty Years_15",dur:"15",pct:"50",sched:"2/2 - 2/22",bookend:""},
        {code:"MTGWK2615003R",title:"Right Lawyer_15",dur:"15",pct:"50",sched:"2/2 - 2/22",bookend:""}
      ]},
      {ts:new Date(now- ++c).toISOString(),est:"HSV-WK-RAD",brand:"Wettermark Keith",market:"HSV",media:"Radio",buyer:"Amy Coffey",month:"February",flight:"2/2 - 2/22",version:"1",comments:"Huntsville Radio Assets",stations:[],status:"imported",iscis:[
        {code:"HSVWK2630005R",title:"Twenty Years_V1_30",dur:"30",pct:"50",sched:"2/2 - 2/22",bookend:""},
        {code:"HSVWK2630001R",title:"Blue Collar Roots_30",dur:"30",pct:"50",sched:"2/2 - 2/22",bookend:""},
        {code:"HSVWK2615002R",title:"Twenty Years_15",dur:"15",pct:"50",sched:"2/2 - 2/22",bookend:""},
        {code:"HSVWK2615003R",title:"Right Lawyer_15",dur:"15",pct:"50",sched:"2/2 - 2/22",bookend:""}
      ]},
      {ts:new Date(now- ++c).toISOString(),est:"BRM-WK-RAD",brand:"Wettermark Keith",market:"BRM",media:"Radio",buyer:"Amy Coffey",month:"February",flight:"2/2 - 2/22",version:"1",comments:"Birmingham Radio Assets",stations:[],status:"imported",iscis:[
        {code:"BRMWK2630006R",title:"Twenty Years_V2_30",dur:"30",pct:"50",sched:"2/2 - 2/22",bookend:""},
        {code:"BRMWK2630001R",title:"Blue Collar Roots_30",dur:"30",pct:"50",sched:"2/2 - 2/22",bookend:""},
        {code:"BRMWK2615002R",title:"Twenty Years_15",dur:"15",pct:"50",sched:"2/2 - 2/22",bookend:""},
        {code:"BRMWK2615003R",title:"Right Lawyer_15",dur:"15",pct:"50",sched:"2/2 - 2/22",bookend:""}
      ]},
      {ts:new Date(now- ++c).toISOString(),est:"BRM-WK-TV",brand:"Wettermark Keith",market:"BRM",media:"TV",buyer:"Amy Coffey",month:"February",flight:"1/26 - 2/22",version:"1",comments:"Version 1 / Birmingham Assets",stations:[],status:"imported",iscis:[
        {code:"BRMWK2630010T",title:"Strength in Confidence_30",dur:"30",pct:"30",sched:"1/26 - 2/22",bookend:""},
        {code:"BRMWK2630003T",title:"Mother's Wreck_30",dur:"30",pct:"20",sched:"1/26 - 2/22",bookend:""},
        {code:"BRMWK2630014T",title:"Trucking Two_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"BRMWK2630006T",title:"Weekends_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"BRMWK2530007T",title:"Different_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"BRMWK2615010T",title:"Strength in Confidence_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"BRMWK2615003T",title:"Trucking Two_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"BRMWK2615009T",title:"Commercial Vehicle_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"BRMWK2615011T",title:"More to Us_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"BRMWK2515009T",title:"Distracted Cell Phones_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 C"},
        {code:"BRMWK2615012T",title:"On the Job Injury_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 C"},
        {code:"BRMWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"BRMWK2515008T",title:"Commercial Accident_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"BRMWK2615008T",title:"Trucking One_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"BRMWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"BRMWK2615007T",title:"Mother's Wreck_15",dur:"15",pct:"100",sched:"1/26 - 2/22",bookend:""},
        {code:"BRMWK2610002T",title:"Premise Injury_10",dur:"10",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"BRMWK2610001T",title:"Car Wreck_10",dur:"10",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"BRMWK2605002T",title:"Premise Injury_5",dur:"05",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"BRMWK2605001T",title:"Car Wreck_05",dur:"05",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"BRMWK2604001T",title:"Personal_04",dur:"04",pct:"100",sched:"1/26 - 2/22",bookend:""}
      ]},
      {ts:new Date(now- ++c).toISOString(),est:"MTG-WK-TV",brand:"Wettermark Keith",market:"MTG",media:"TV",buyer:"Amy Coffey",month:"February",flight:"1/26 - 2/22",version:"1",comments:"Version 1 / Montgomery Assets",stations:[],status:"imported",iscis:[
        {code:"MTGWK2630010T",title:"Strength in Confidence_30",dur:"30",pct:"30",sched:"1/26 - 2/22",bookend:""},
        {code:"MTGWK2630003T",title:"Mother's Wreck_30",dur:"30",pct:"20",sched:"1/26 - 2/22",bookend:""},
        {code:"MTGWK2630005T",title:"Working Man_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"MTGWK2630006T",title:"Weekends_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"MTGWK2530007T",title:"Different_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"MTGWK2615012T",title:"On the Job Injury_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"MTGWK2615010T",title:"Strength in Confidence_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"MTGWK2615006T",title:"Working Man_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"MTGWK2615009T",title:"Commercial Vehicle_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"MTGWK2515009T",title:"Distracted Cell Phones_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 C"},
        {code:"MTGWK2615013T",title:"Premises Liability_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 C"},
        {code:"MTGWK2615014T",title:"Auto Accident_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"MTGWK2515008T",title:"Commercial Accident_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"MTGWK2615008T",title:"Trucking One_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"MTGWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"MTGWK2615007T",title:"Mother's Wreck_15",dur:"15",pct:"100",sched:"1/26 - 2/22",bookend:""},
        {code:"MTGWK2610002T",title:"Premise Injury_10",dur:"10",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"MTGWK2610001T",title:"Car Wreck_10",dur:"10",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"MTGWK2605002T",title:"Premise Injury_5",dur:"05",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"MTGWK2605001T",title:"Car Wreck_05",dur:"05",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"MTGWK2604001T",title:"Personal_04",dur:"04",pct:"100",sched:"1/26 - 2/22",bookend:""}
      ]},
      {ts:new Date(now- ++c).toISOString(),est:"KNX-WK-TV",brand:"Wettermark Keith",market:"KNX",media:"TV",buyer:"Amy Coffey",month:"February",flight:"1/26 - 2/22",version:"1",comments:"Version 1 / Knoxville Assets",stations:[],status:"imported",iscis:[
        {code:"KNXWK2630010T",title:"Strength in Confidence_30",dur:"30",pct:"30",sched:"1/26 - 2/22",bookend:""},
        {code:"KNXWK2630003T",title:"Mother's Wreck_30",dur:"30",pct:"20",sched:"1/26 - 2/22",bookend:""},
        {code:"KNXWK2630014T",title:"Trucking Two_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"KNXWK2530007T",title:"Different_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"KNXWK2630006T",title:"Weekends_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"KNXWK2615010T",title:"Strength in Confidence_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"KNXWK2615003T",title:"Trucking Two_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"KNXWK2615009T",title:"Commercial Vehicle_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"KNXWK2615011T",title:"More to Us_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"KNXWK2515009T",title:"Distracted Cell Phones_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 C"},
        {code:"KNXWK2615012T",title:"On the Job Injury_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 C"},
        {code:"KNXWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"KNXWK2515008T",title:"Commercial Accident_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"KNXWK2615008T",title:"Trucking One_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"KNXWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"KNXWK2615007T",title:"Mother's Wreck_15",dur:"15",pct:"100",sched:"1/26 - 2/22",bookend:""},
        {code:"KNXWK2610002T",title:"Premise Injury_10",dur:"10",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"KNXWK2610001T",title:"Car Wreck_10",dur:"10",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"KNXWK2605002T",title:"Premise Injury_5",dur:"05",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"KNXWK2605001T",title:"Car Wreck_05",dur:"05",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"KNXWK2604001T",title:"Personal_04",dur:"04",pct:"100",sched:"1/26 - 2/22",bookend:""}
      ]},
      {ts:new Date(now- ++c).toISOString(),est:"HSV-WK-TV",brand:"Wettermark Keith",market:"HSV",media:"TV",buyer:"Amy Coffey",month:"February",flight:"1/26 - 2/22",version:"1",comments:"Version 1 / Huntsville Assets",stations:[],status:"imported",iscis:[
        {code:"HSVWK2630005T",title:"Working Man_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"HSVWK2630003T",title:"Mother's Wreck_30",dur:"30",pct:"20",sched:"1/26 - 2/22",bookend:""},
        {code:"HSVWK2630010T",title:"Strength in Confidence_30",dur:"30",pct:"30",sched:"1/26 - 2/22",bookend:""},
        {code:"HSVWK2630006T",title:"Weekends_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"HSVWK2530007T",title:"Different_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"HSVWK2615010T",title:"Strength in Confidence_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"HSVWK2615012T",title:"On the Job Injury_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"HSVWK2615006T",title:"Working Man_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"HSVWK2615011T",title:"More to Us_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"HSVWK2515009T",title:"Distracted Cell Phones_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 C"},
        {code:"HSVWK2615013T",title:"Premises Liability_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 C"},
        {code:"HSVWK2615014T",title:"Auto Accident_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"HSVWK2515008T",title:"Commercial Accident_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"HSVWK2615008T",title:"Trucking One_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"HSVWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"HSVWK2615007T",title:"Mother's Wreck_15",dur:"15",pct:"100",sched:"1/26 - 2/22",bookend:""},
        {code:"HSVWK2610002T",title:"Premise Injury_10",dur:"10",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"HSVWK2610001T",title:"Car Wreck_10",dur:"10",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"HSVWK2605002T",title:"Premise Injury_5",dur:"05",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"HSVWK2605001T",title:"Car Wreck_05",dur:"05",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"HSVWK2604001T",title:"Personal_04",dur:"04",pct:"100",sched:"1/26 - 2/22",bookend:""}
      ]},
      {ts:new Date(now- ++c).toISOString(),est:"DHN-WK-TV",brand:"Wettermark Keith",market:"DHN",media:"TV",buyer:"Amy Coffey",month:"February",flight:"1/26 - 2/22",version:"1",comments:"Version 1 / Dothan Assets",stations:[],status:"imported",iscis:[
        {code:"DHNWK2630010T",title:"Strength in Confidence_30",dur:"30",pct:"30",sched:"1/26 - 2/22",bookend:""},
        {code:"DHNWK2630003T",title:"Mother's Wreck_30",dur:"30",pct:"30",sched:"1/26 - 2/22",bookend:""},
        {code:"DHNWK2630013T",title:"Insurance Experts_30",dur:"30",pct:"40",sched:"1/26 - 2/22",bookend:""},
        {code:"DHNWK2630006T",title:"Weekends_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"DHNWK2530007T",title:"Different_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"DHNWK2615010T",title:"Strength in Confidence_15 Bookend",dur:"15",pct:"12.5",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"DHNWK2515008T",title:"Commercial Accident_15 Bookend",dur:"15",pct:"12.5",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"DHNWK2615011T",title:"More to Us_15 Bookend",dur:"15",pct:"12.5",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"DHNWK2615013T",title:"Premises Liability_15 Bookend",dur:"15",pct:"12.5",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"DHNWK2515009T",title:"Distracted Cell Phones_15 Bookend",dur:"15",pct:"12.5",sched:"1/26 - 2/22",bookend:"Bookend :15 C"},
        {code:"DHNWK2615012T",title:"On the Job Injury_15 Bookend",dur:"15",pct:"12.5",sched:"1/26 - 2/22",bookend:"Bookend :15 C"},
        {code:"DHNWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"DHNWK2615009T",title:"Commercial Vehicle_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"DHNWK2615006T",title:"Working Man_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"DHNWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"DHNWK2615007T",title:"Mother's Wreck_15",dur:"15",pct:"100",sched:"1/26 - 2/22",bookend:""},
        {code:"DHNWK2610002T",title:"Premise Injury_10",dur:"10",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"DHNWK2610001T",title:"Car Wreck_10",dur:"10",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"DHNWK2605002T",title:"Premise Injury_5",dur:"05",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"DHNWK2605001T",title:"Car Wreck_05",dur:"05",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"DHNWK2604001T",title:"Personal_04",dur:"04",pct:"100",sched:"1/26 - 2/22",bookend:""}
      ]},
      {ts:new Date(now- ++c).toISOString(),est:"CHA-WK-TV",brand:"Wettermark Keith",market:"CHA",media:"TV",buyer:"Amy Coffey",month:"February",flight:"1/26 - 2/22",version:"1",comments:"Version 1 / Chattanooga Assets",stations:[],status:"imported",iscis:[
        {code:"CHAWK2630010T",title:"Strength in Confidence_30",dur:"30",pct:"30",sched:"1/26 - 2/22",bookend:""},
        {code:"CHAWK2630003T",title:"Mother's Wreck_30",dur:"30",pct:"20",sched:"1/26 - 2/22",bookend:""},
        {code:"CHAWK2630014T",title:"Trucking Two_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"CHAWK2630006T",title:"Weekends_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"CHAWK2530007T",title:"Different_30",dur:"30",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"CHAWK2615010T",title:"Strength in Confidence_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"CHAWK2615003T",title:"Trucking Two_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"CHAWK2615009T",title:"Commercial Vehicle_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"CHAWK2615011T",title:"More to Us_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"CHAWK2515009T",title:"Distracted Cell Phones_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 C"},
        {code:"CHAWK2615012T",title:"On the Job Injury_15 Bookend",dur:"15",pct:"16.5",sched:"1/26 - 2/22",bookend:"Bookend :15 C"},
        {code:"CHAWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"CHAWK2515008T",title:"Commercial Accident_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 A"},
        {code:"CHAWK2515011T",title:"Trucking One_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"CHAWK2615002T",title:"Weekends_15 Bookend",dur:"15",pct:"25",sched:"1/26 - 2/22",bookend:"Bookend :15 B"},
        {code:"CHAWK2615007T",title:"Mother's Wreck_15",dur:"15",pct:"100",sched:"1/26 - 2/22",bookend:""},
        {code:"CHAWK2610002T",title:"Premise Injury_10",dur:"10",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"CHAWK2610001T",title:"Car Wreck_10",dur:"10",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"CHAWK2605002T",title:"Premise Injury_5",dur:"05",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"CHAWK2605001T",title:"Car Wreck_05",dur:"05",pct:"50",sched:"1/26 - 2/22",bookend:""},
        {code:"CHAWK2604001T",title:"Personal_04",dur:"04",pct:"100",sched:"1/26 - 2/22",bookend:""}
      ]}
    ];

    // Build list of est+month+media combos we're importing so we can remove ANY old versions
    const importKeys = new Set(imports.map(e => e.est + "|" + e.month + "|" + e.media));

    // Read current Firestore data
    const snap = await db.collection("appData").doc("trafficHistory").get();
    const current = snap.exists ? JSON.parse(snap.data().data) : [];

    // Remove any existing entries that match our import keys OR have status "imported"
    const kept = current.filter(e => {
      const key = (e.est||"") + "|" + (e.month||"") + "|" + (e.media||"");
      if (importKeys.has(key)) return false;
      if (e.status === "imported") return false;
      return true;
    });

    const final = [...imports, ...kept];

    // Write to Firestore
    await db.collection("appData").doc("trafficHistory").set({
      data: JSON.stringify(final),
      ts: Date.now()
    });

    console.log("═══════════════════════════════════════");
    console.log("✅ SUCCESS — Traffic History Updated");
    console.log("   Imported: " + imports.length + " entries");
    console.log("   Kept from existing: " + kept.length + " entries");
    console.log("   Removed: " + (current.length - kept.length) + " old/duplicate entries");
    console.log("   TOTAL: " + final.length + " entries");
    console.log("═══════════════════════════════════════");
    console.log("⚠️  REFRESH THE PAGE to see changes.");

  } catch (err) {
    console.error("❌ INJECTION FAILED:", err);
    console.error("Full error:", err.message, err.stack);
  }
})();
