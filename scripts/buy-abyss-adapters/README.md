# Buy Abyss import adapters

One module per **source format**, not per station or agency. An adapter turns one raw
source into normalized 2026-history rows and, separately, reads the source's *own* totals
so the importer can foot the normalized rows back to them.

```js
module.exports = {
  describe: 'L&R 2026 media sheet (OTM) — lr2026.json',
  // raw → rows. Every row: market (full name), media (TV | Cable | Radio | Streaming Audio | Digital Video),
  // station or vendor, year, month (1-12), booked, actual (null if the source has none), spots,
  // source_ref (where in the source, e.g. "Chicago!B14"), raw (the source row).
  normalize(raw) { /* … */ },
  // raw → the totals the SOURCE states (read them, never recompute them):
  // { by_market, by_media, by_station, by_month, annual, actual_annual, actual_by_market }
  // Leave a key out if the source has no such total; the importer reports it as unverifiable.
  expected(raw) { /* … */ },
};
```

`lr2026.js` is written against `lr2026.json` itself once that file is in the repo. Its shape is
not guessed in advance.
