#!/usr/bin/env python3
"""
Generate a FILLABLE PDF "creative resend spec" sheet for an OOH vendor kickback.

When a vendor (e.g. Lamar) rejects creative that was linked at the wrong size,
this builds a one-page hand-off for the creative team: every column pre-filled
from our board data, plus a typeable "Delivered file name" field + Done checkbox
per panel, and a notes box. They fill it in, send it back, you bulk-upload the
new files, and the vendor-sheet "ART NEEDED" flags turn back into working links.

Usage:
    python3 scripts/gen-creative-resend-spec.py            # uses the ROWS below
    # edit ROWS / TITLE / SUBTITLE for a new kickback, then re-run.

Output: WK_Creative_Resend_Spec_Lamar_BhamGad.pdf (gitignored)
Requires: reportlab  (pip install reportlab)
"""
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

OUT = "WK_Creative_Resend_Spec_Lamar_BhamGad.pdf"
TITLE = "WETTERMARK KEITH — OOH CREATIVE RESEND SPEC"
SUBTITLE = ("Vendor: Lamar (Birmingham & Gadsden)  ·  Per Lamar proof review — art was linked at "
            "poster size; these are junior/bulletin units.")
INSTRUCT = ("Build each creative at the EXACT size below, then return the file. Fields are fillable — "
            "type the delivered file name and check Done.")
FOOTNOTE = ("5 of 8 are Cause CK Gold — gold currently only exists at poster size, so every "
            "junior/bulletin gold unit needs a new build at the size shown above.")

# panel, unit type, BUILD SIZE, market, creative, location
ROWS = [
    ("7508",  "Junior Poster",   '12" x 12"',      "BRM",        "Cause CK Gold",    "Hueytown Rd W/L 150' S/O Virginia Dr"),
    ("7529",  "Junior Poster",   "5'5\" x 11'5\"",  "BRM",        "It's Personal CK", "Main St E/L 10' N/O 3rd Ave Graysville"),
    ("7538",  "Junior Poster",   "5'5\" x 11'5\"",  "BRM",        "Cause CK Blue",    "Park Rd S/L 200' E/O Pleasant Grove Rd"),
    ("7548",  "Junior Poster",   "5'4\" x 11'4\"",  "BRM",        "Cause CK Gold",    "5th Ave W/L 200' S/O 18th"),
    ("11831", "Junior Bulletin", '12" x 25"',      "BRM",        "Cause CK Gold",    "I-65 E/L 5.2mi S/O Hwy 69 S FS"),
    ("40173", "Perm Bulletin",   '10" x 40"',      "HSV (Boaz)", "It's Personal CK", "US 431 E/L 250' S/O Vickie Dr"),
    ("60069", "Junior Bulletin", '10" x 30"',      "GAD",        "Cause CK Gold",    "Hwy 21 E/L 1535' N/O MM 263"),
    ("78656", "Junior Bulletin", '10" x 30"',      "BRM",        "Cause CK Gold",    "RT 77 ES .5mi S/O I-20"),
]


def build(out=OUT):
    W, H = landscape(letter)  # 792 x 612
    c = canvas.Canvas(out, pagesize=(W, H))
    form = c.acroForm
    PLUM = HexColor("#2d1f42"); GOLD = HexColor("#b8860b"); GREY = HexColor("#555555")
    LINE = HexColor("#cccccc"); HEADBG = HexColor("#2d1f42"); GOLDBG = HexColor("#fff7e6")

    c.setFillColor(PLUM); c.setFont("Helvetica-Bold", 18)
    c.drawString(34, H - 44, TITLE)
    c.setFillColor(GREY); c.setFont("Helvetica", 10)
    c.drawString(34, H - 60, SUBTITLE)
    c.drawString(34, H - 74, INSTRUCT)

    cols = [("Panel", 34, 42), ("Unit Type", 80, 80), ("BUILD SIZE", 164, 74), ("Mkt", 240, 58),
            ("Creative", 300, 96), ("Location", 398, 196), ("Delivered file name", 598, 150), ("Done", 752, 28)]
    top = H - 96; rowh = 42; hh = 20
    c.setFillColor(HEADBG); c.rect(34, top - hh, W - 68, hh, fill=1, stroke=0)
    c.setFillColor(HexColor("#ffffff")); c.setFont("Helvetica-Bold", 8.5)
    for name, x, wd in cols:
        c.drawString(x + 3, top - hh + 6, name)

    y = top - hh
    for panel, utype, size, mkt, creative, loc in ROWS:
        y0 = y - rowh
        if "Gold" in creative:
            c.setFillColor(GOLDBG); c.rect(34, y0, W - 68, rowh, fill=1, stroke=0)
        c.setStrokeColor(LINE); c.setLineWidth(0.5); c.line(34, y0, W - 34, y0)
        c.setFillColor(PLUM); c.setFont("Helvetica-Bold", 11); c.drawString(cols[0][1] + 3, y0 + rowh - 16, panel)
        c.setFillColor(HexColor("#333333")); c.setFont("Helvetica", 8.5); c.drawString(cols[1][1] + 3, y0 + rowh - 15, utype)
        c.setFillColor(HexColor("#b00000")); c.setFont("Helvetica-Bold", 11); c.drawString(cols[2][1] + 3, y0 + rowh - 17, size)
        c.setFillColor(HexColor("#333333")); c.setFont("Helvetica", 8.5); c.drawString(cols[3][1] + 3, y0 + rowh - 15, mkt)
        c.setFont("Helvetica-Bold", 8.5); c.setFillColor(GOLD if "Gold" in creative else HexColor("#333333"))
        c.drawString(cols[4][1] + 3, y0 + rowh - 15, creative)
        c.setFillColor(HexColor("#444444")); c.setFont("Helvetica", 7.5)
        ln1 = ""; ln2 = ""
        for w_ in loc.split():
            if c.stringWidth((ln1 + " " + w_).strip(), "Helvetica", 7.5) < cols[5][2] - 6:
                ln1 = (ln1 + " " + w_).strip()
            else:
                ln2 = (ln2 + " " + w_).strip()
        c.drawString(cols[5][1] + 3, y0 + rowh - 14, ln1)
        if ln2:
            c.drawString(cols[5][1] + 3, y0 + rowh - 25, ln2)
        form.textfield(name=f"file_{panel}", tooltip=f"Delivered file name for panel {panel}",
                       x=cols[6][1] + 1, y=y0 + 8, width=cols[6][2] - 4, height=20,
                       borderColor=HexColor("#999999"), fillColor=HexColor("#ffffff"),
                       textColor=PLUM, fontSize=8, borderWidth=0.7)
        form.checkbox(name=f"done_{panel}", tooltip=f"Done — panel {panel}",
                      x=cols[7][1] + 4, y=y0 + 12, size=16,
                      borderColor=HexColor("#999999"), fillColor=HexColor("#ffffff"),
                      checked=False, borderWidth=0.7)
        y = y0

    fy = y - 18
    c.setFillColor(PLUM); c.setFont("Helvetica-Bold", 9); c.drawString(34, fy, "Notes / questions:")
    form.textfield(name="notes", tooltip="Notes", x=130, y=fy - 30, width=W - 170, height=40,
                   borderColor=HexColor("#999999"), fillColor=HexColor("#fcfcfc"),
                   fieldFlags="multiline", fontSize=8, borderWidth=0.7)
    c.setFillColor(GREY); c.setFont("Helvetica-Oblique", 7.5); c.drawString(34, 28, FOOTNOTE)
    c.showPage(); c.save()
    return out


if __name__ == "__main__":
    print("wrote", build())
