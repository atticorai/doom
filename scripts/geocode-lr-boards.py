#!/usr/bin/env python3
# geocode-lr-boards.py — resolve Lerner & Rowe OOH board locations (cross-street
# / landmark descriptions from the executed contract PDFs) into lat/lng.
# Method: Chicago address-grid math (calibrated to known reference points) for
# grid intersections, plus a curated table for named suburban roads, malls, and
# Will-County corridors. Grid results are precise (~0.15-0.25 mi); curated ones
# are knowledge-based estimates (flagged approx). Extend CUR / W / S / N tables
# for new markets. Used to populate data-lr-panels.js lat/lng.

import re, math
OLAT,OLNG=41.8820,-87.6278
LATU=1.6989e-5  # deg latitude per south grid unit (calibrated Madison->95th St)
LNGU=2.4225e-5  # deg longitude per west grid unit (calibrated State->Pulaski)
def g(S,W):
    return round(OLAT-S*LATU,6), round(OLNG-W*LNGU,6)
def gn(N,W):
    return round(OLAT+N*LATU,6), round(OLNG-W*LNGU,6)
# Avenues -> West grid number (Cook County)
W={'state':0,'halsted':800,'racine':1200,'ashland':1600,'damen':2000,'western':2400,'california':2800,
 'kedzie':3200,'homan':3400,'pulaski':4000,'crawford':4000,'kostner':4400,'cicero':4800,'lacrosse':5000,
 'la crosse':5000,'laramie':5200,'lockwood':5300,'central':5600,'menard':5800,'austin':6000,'narragansett':6400,
 'nagle':6600,'oak park':6800,'sayre':7000,'nordica':7100,'harlem':7200,'oketo':7350,'cumberland':8400,
 'east ave':7800,'lawndale':3700,'mccormick':3600,'nashville':6700,'roberts':8500,'88th ave':8800,'75th ave':7550,
 '86th ave':8650,'58th ave':5850,'vernon':500,'first ave':10400,'thatcher':8100,'prospect':7000,'opal':7300,
 'nagle ':6600}
# E-W streets -> South grid (positive) ; North handled separately
S={'cermak':2200,'22nd':2200,'roosevelt':1200,'ogden':None,'pershing':3900,'garfield':5500,'47th':4700,
 '61st':6100,'63rd':6300,'74th court':7400,'79th':7900,'87th':8700,'91st':9100,'95th':9500,'103rd':10300,
 '111th':11100,'113th':11300,'115th':11500,'119th':11900,'123rd':12300,'127th':12700,'159th':15900,'167th':16700,'lawn':7300}
N={'lawrence':4800,'foster':5200,'touhy':7200,'oakton':8000,'belmont':3200,'north ave':1600,'wilson':4600,
 'pratt':6800,'oakton ':8000,'foster ':5200}
# curated coords for named suburban roads / landmarks / off-grid features (lat,lng)
CUR={
 'ford city':(41.746900,-87.739600),          # 76th & Cicero, Burbank
 'target store':(41.762300,-87.741500),        # Bedford Park Target ~7100 S Cicero
 'chicago ridge mall':(41.703000,-87.771700),  # 95th & Ridgeland
 'ridgeland avenue @ chicago ridge':(41.703300,-87.771800),
 'randhurst':(42.080700,-87.918700),           # Mount Prospect
 'thatcher woods':(41.927000,-87.825000),      # River Grove Belmont & Thatcher
 'thatcher avenue':(41.923000,-87.824500),
 'hillcreek plaza':(41.713900,-87.825600),     # 95th & 88th Ave Hickory Hills
 'hickory-palos square':(41.713900,-87.834000),# 95th & Roberts Rd
 'southfield shopping':(41.749000,-87.804800), # Bridgeview Harlem
 'bolingbrook golf club':(41.672000,-88.033000),
 # NW suburbs arterials
 'roselle road':(42.049000,-88.079000),        # Hoffman Estates near Algonquin
 'algonquin road and linneman':(42.048000,-87.930000),
 'golf road w/o elmhurst':(42.058500,-87.941000), # Mount Prospect Golf/Rt83
 'golf road and mary':(42.056000,-87.884000),  # Des Plaines
 'golf road and country lane':(42.056500,-87.905000),
 'touhy avenue w/o wolf':(42.011000,-87.895000),
 'touhy avenue and lawndale':(42.012000,-87.716000), # Lincolnwood
 'touhy avenue w/o lyndon':(42.010000,-87.865000),   # Rosemont
 'mccormick boulevard and pratt':(42.003000,-87.733000),
 'oakton street and nagle':(42.021000,-87.796000),   # Morton Grove
 '9016 waukegan':(42.055000,-87.782000),             # Morton Grove
 'cumberland avenue and foster':(41.975000,-87.837000),# Norridge
 'lawrence avenue and prospect':(41.968000,-87.827000),# Norridge
 'lawrence avenue and opal':(41.968000,-87.818000),
 'harlem avenue and lawrence':(41.968000,-87.806000),  # Harwood Heights
 'harlem avenue and wilson':(41.964000,-87.806000),
 'cicero avenue n/o arthur':(41.995000,-87.747000),    # Lincolnwood
 'lake street e/o mannheim':(41.913000,-87.878000),    # Melrose Park
 'north avenue and wolf':(41.909500,-87.900000),       # Northlake
 'wolf road and north avenue':(41.909500,-87.900500),
 'wolf road and piper':(42.093000,-87.898000),         # Prospect Heights
 'apple drive e/o plaza':(42.097000,-87.905000),
 'e business center drive and bishop':(42.061000,-87.945000), # Mount Prospect
 'elmhurst road and euclid':(42.080000,-87.918700),    # Randhurst area
 'joliet road and lagrange':(41.768000,-87.868000),    # Hodgkins
 'east ave':(41.767000,-87.885000),                    # Hodgkins East Ave
 'oak park avenue and 74th':(41.748000,-87.792800),    # Bedford Park
 '159th street and debra':(41.606000,-87.744000),      # Oak Forest
 'roselle':(42.049000,-88.079000),
 # Will County (Community Digital)
 'boughton road and preston':(41.699000,-88.088000),
 'falcon ridge way and boughton':(41.699500,-88.104000),
 'bolingbrook drive (53) and robinhood':(41.706000,-88.075000),
 'weber rd, ws, at remington':(41.678000,-88.089000),
 'weber rd, ws, 1500':(41.712000,-88.089500),
 'weber rd':(41.695000,-88.089000),
 'hassert dr':(41.660000,-88.164000),                  # 111th St Plainfield/Naperville
 'rt 53, ws, 25':(41.700000,-88.075000),
 'route 53 and alexander':(41.645000,-88.084000),      # Romeoville
 'route 53 and belmont':(41.652000,-88.082000),
 'route 53 and romeo':(41.647000,-88.083000),
 '167th st, ss, at pulaski':(41.601000,-87.723000),
 'cermak (22nd st), ns, 25\' e/o first':(41.851200,-87.828000), # Berwyn/Cicero First Ave
 'renwick':(41.640000,-88.089000),
 '119th st (rodeo dr), ns, at bolingbrook golf':(41.672000,-88.033000),
 'cicero ave, es, at 103rd':(41.706500,-87.741000),
 'ridgeland ave, ws, s/o metra':(41.700000,-87.771700),
 '47th st, ss, at vernon':(41.809000,-87.617000),
 '87th st, ss, at 88th ave':(41.732000,-87.887000),
 'rt 59, ws, .25 mile n/o caton farm':(41.617000,-88.199000),
 '95th st, ss, at nashville':(41.720900,-87.796000),
 'essington, ws, at theodore':(41.560000,-88.120000),  # Joliet
 'maple ave (hwy 6), ss, at walnut':(41.525000,-88.085000),
 'cicero ave (hwy 50), es, at 123rd':(41.663000,-87.741000),
 '127th st, ns, w/o i-57':(41.663000,-87.700000),
 'harlem ave, ws, at 115th':(41.685000,-87.803000),
 'harlem ave, ws, at archer':(41.735000,-87.803000),
 'pulaski, es, at 115th':(41.685000,-87.723000),
 'theodore, ns, at gaylord':(41.556000,-88.118000),
 'caton farm, ns, at len kubinski':(41.617000,-88.170000),
 'cicero ave, ws, at 115th':(41.685000,-87.742000),
 'harlem avenue and 75th':(41.752500,-87.803500),
 'boughton rd, ns, e/o janes':(41.699000,-88.108000),
}
def find_cur(loc):
    l=loc.lower()
    for k,v in CUR.items():
        if k in l: return v
    return None
def parse(loc):
    parts=[p.strip() for p in re.split(r'\band\b|@|&', loc, 1, flags=re.I)]
    return parts
def southnum(s):
    s=s.lower()
    m=re.search(r'\b(\d{1,3})(?:st|nd|rd|th)\b', s)
    if m and 40<=int(m.group(1))<=200 and 'ave' not in s: return int(m.group(1))*100
    for k,v in S.items():
        if v and k in s: return v
    return None
def westnum(s):
    s=s.lower()
    for k,v in sorted(W.items(),key=lambda x:-len(x[0])):
        if k in s: return v
    m=re.search(r'\b(\d{1,3})(?:st|nd|rd|th)\s+(ave|court)', s)
    if m and 40<=int(m.group(1))<=140: return int(m.group(1))*100
    return None
def northnum(s):
    s=s.lower()
    for k,v in N.items():
        if v and k in s: return v
    return None
def geocode(loc):
    c=find_cur(loc)
    if c: return c[0],c[1],True   # curated estimate -> flagged approx
    a=parse(loc); Sn=Wn=Nn=None
    for seg in a:
        s=southnum(seg); w=westnum(seg); n=northnum(seg)
        if s is not None and Sn is None: Sn=s
        if w is not None and Wn is None: Wn=w
        if n is not None and Nn is None: Nn=n
    if Wn is not None and Sn is not None:
        lat,lng=g(Sn,Wn); return lat,lng,False
    if Wn is not None and Nn is not None:
        lat,lng=gn(Nn,Wn); return lat,lng,False
    return None,None,True
