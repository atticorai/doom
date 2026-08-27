// DATA: Parrish DeVaughn OOH creative-spec reference — per market, per vendor.
// Source: Lamar spec sheets (Tulsa bulletins/posters + OKC Jr. posters) emailed
// by the vendor 8/2026. The PDFs are checked into the repo under /specs/ and
// served with the app, so links work inside Doom. `note` carries the production
// facts pulled from each sheet. Surfaced on the PDV OOH page (📎 Vendor Specs).
const PDV_SPECS={
  TUL:[
    {company:"Lamar",spec:"14'x48' Bulletin (perm 24892 + 10 rotary)",link:"/specs/Lamar_Bulletin_14x48_Specs.pdf",note:"Live 14'x48'; overall with bleed 15'x49' (6\" all four sides); 3\" pockets on back. Build at 9ppi @ 300 doc resolution — live doc 5.04\"x17.28\", overall 5.40\"x17.64\". Native files or PDF (fonts embedded), links .EPS/.TIF CMYK, fonts converted to outline. Front-lit PE or PVC, 7 oz preferred, 1-year minimum warranty."},
    {company:"Lamar",spec:"10'x40' Bulletin (perm 24992)",link:"/specs/Lamar_Bulletin_10x40.pdf",note:"Live 10'x40'; with bleed 11'x41' (6\" all four sides). Template scale 1/2\" = 1' @ 300ppi. NEEDS ITS OWN ART — the 14x48 files don't fit this face."},
    {company:"Lamar",spec:"Static Poster 10'5\"x22'8\" (45 showing · Panel 1591 sheet)",link:"/specs/Lamar_Poster_Spec_Tulsa.pdf",note:"Live 10'5\"(h) x 22'8\"(w); finished 10'6.5\" x 22'9.5\" (3/4\" bleed all sides); 3\" pockets. Build 1\"=1' @ 216ppi — live doc 10.42\"x22.66\", overall 10.644\"x22.894\"; keep critical elements 0.5\" (=6\" actual) off live-area edges. PSD/AI/InDesign natives or .PDF/.TIFF/.EPS. Lamar Poster Flex 2.9oz (60-day) or PVC Vinyl Flex 7oz (up to 2 yrs). MATERIALS DUE 10 DAYS BEFORE START DATE. Ship: Lamar Advertising, Attn: Posting Department, 7777 E. 38th Street, Tulsa OK 74145 · 888.308.5060."},
  ],
  OKC:[
    {company:"Lamar",spec:"Jr. Poster — Vinyl 4'11\"x10'10\"",link:"/specs/Lamar_Jr_Poster_Specs_OKC.pdf",note:"Image 4'11\" x 10'10\", NO bleed; final production adds 2\" mechanical pockets. Build 5.446\"x12\" @ 260ppi. PSD/PDF/TIFF/AI/EPS · CMYK U.S. Web Coated (SWOP) v2. Files under 25MB email to the AE; larger upload to lamarokc.wetransfer.com (put the AE's name in the notes). Contact: Carla Osmus · cosmus@lamar.com · Lamar OKC."},
  ],
};
if(typeof window!=='undefined')window.PDV_SPECS=PDV_SPECS;
