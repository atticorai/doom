import B, { forwardRef as A, createElement as T, useState as k, useEffect as z, useContext as E, createContext as H, useMemo as K } from "react";
import { motion as y, AnimatePresence as W } from "framer-motion";
var R = { exports: {} }, C = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var G = B, q = Symbol.for("react.element"), F = Symbol.for("react.fragment"), U = Object.prototype.hasOwnProperty, X = G.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, J = { key: !0, ref: !0, __self: !0, __source: !0 };
function S(t, s, a) {
  var r, n = {}, d = null, p = null;
  a !== void 0 && (d = "" + a), s.key !== void 0 && (d = "" + s.key), s.ref !== void 0 && (p = s.ref);
  for (r in s) U.call(s, r) && !J.hasOwnProperty(r) && (n[r] = s[r]);
  if (t && t.defaultProps) for (r in s = t.defaultProps, s) n[r] === void 0 && (n[r] = s[r]);
  return { $$typeof: q, type: t, key: d, ref: p, props: n, _owner: X.current };
}
C.Fragment = F;
C.jsx = S;
C.jsxs = S;
R.exports = C;
var e = R.exports;
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Y = (t) => t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), Z = (t) => t.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (s, a, r) => r ? r.toUpperCase() : a.toLowerCase()
), M = (t) => {
  const s = Z(t);
  return s.charAt(0).toUpperCase() + s.slice(1);
}, P = (...t) => t.filter((s, a, r) => !!s && s.trim() !== "" && r.indexOf(s) === a).join(" ").trim(), Q = (t) => {
  for (const s in t)
    if (s.startsWith("aria-") || s === "role" || s === "title")
      return !0;
};
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
var ee = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const te = A(
  ({
    color: t = "currentColor",
    size: s = 24,
    strokeWidth: a = 2,
    absoluteStrokeWidth: r,
    className: n = "",
    children: d,
    iconNode: p,
    ...i
  }, o) => T(
    "svg",
    {
      ref: o,
      ...ee,
      width: s,
      height: s,
      stroke: t,
      strokeWidth: r ? Number(a) * 24 / Number(s) : a,
      className: P("lucide", n),
      ...!d && !Q(i) && { "aria-hidden": "true" },
      ...i
    },
    [
      ...p.map(([m, g]) => T(m, g)),
      ...Array.isArray(d) ? d : [d]
    ]
  )
);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const x = (t, s) => {
  const a = A(
    ({ className: r, ...n }, d) => T(te, {
      ref: d,
      iconNode: s,
      className: P(
        `lucide-${Y(M(t))}`,
        `lucide-${t}`,
        r
      ),
      ...n
    })
  );
  return a.displayName = M(t), a;
};
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ae = [
  ["rect", { width: "20", height: "5", x: "2", y: "3", rx: "1", key: "1wp1u1" }],
  ["path", { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8", key: "1s80jp" }],
  ["path", { d: "M10 12h4", key: "a56b0p" }]
], re = x("archive", ae);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const se = [
  ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0", key: "vwvbt9" }],
  [
    "path",
    {
      d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
      key: "11g9vi"
    }
  ]
], oe = x("bell", se);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ne = [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }]
], ie = x("calendar", ne);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const le = [["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]], de = x("chevron-down", le);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ce = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
], pe = x("copy", ce);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const me = [
  ["path", { d: "M12 15V3", key: "m9g1x1" }],
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["path", { d: "m7 10 5 5 5-5", key: "brsn70" }]
], ge = x("download", me);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const xe = [
  [
    "path",
    {
      d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
      key: "1nclc0"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
], be = x("eye", xe);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ue = [
  [
    "path",
    {
      d: "M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 1 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C8 4.5 11 2 12 2Z",
      key: "1ir223"
    }
  ],
  ["path", { d: "m5 22 14-4", key: "1brv4h" }],
  ["path", { d: "m5 18 14 4", key: "lgyyje" }]
], he = x("flame-kindling", ue);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ve = [
  [
    "path",
    {
      d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
      key: "96xj49"
    }
  ]
], ye = x("flame", ve);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const fe = [
  [
    "path",
    {
      d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      key: "1a8usu"
    }
  ]
], we = x("pen", fe);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ke = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
], je = x("plus", ke);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Ne = [
  [
    "path",
    {
      d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",
      key: "143wyd"
    }
  ],
  ["path", { d: "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6", key: "1itne7" }],
  ["rect", { x: "6", y: "14", width: "12", height: "8", rx: "1", key: "1ue0tg" }]
], _e = x("printer", Ne);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Ce = [
  ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }]
], $e = x("search", Ce);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Te = [
  [
    "path",
    {
      d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
      key: "1ffxy3"
    }
  ],
  ["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }]
], ze = x("send", Te);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Ie = [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
], Le = x("trash-2", Ie);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Me = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
], Ae = x("x", Me);
function Re({
  isLightMode: t,
  toggleTheme: s,
  brand: a,
  onBrandChange: r,
  brandCounts: n,
  totalInstructions: d,
  totalMarkets: p,
  archivedCount: i,
  showArchived: o,
  onToggleArchived: m
}) {
  const g = [
    "I remember every version. Every mistake.",
    "Everything you've ever sent. Archived. By me. Obviously.",
    "People do crazy things... like forgetting to send traffic.",
    "It's all Greek to them. But not to me.",
    `I don't do "lost files." Try someone else.`,
    "Megara doesn't forget. Megara doesn't forgive late sends."
  ], [b, f] = k(0), c = t;
  return z(() => {
    const h = setInterval(() => {
      f((w) => (w + 1) % g.length);
    }, 8e3);
    return () => clearInterval(h);
  }, []), /* @__PURE__ */ e.jsxs("header", { className: "w-full py-6 px-8 flex flex-col gap-5 relative z-10", children: [
    /* @__PURE__ */ e.jsx(
      "div",
      {
        className: `absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent ${c ? "via-purple-400/30" : "via-magic-gold/30"} to-transparent`
      }
    ),
    /* @__PURE__ */ e.jsxs("div", { className: "flex justify-between items-start", children: [
      /* @__PURE__ */ e.jsxs("div", { className: "flex items-end gap-5", children: [
        /* @__PURE__ */ e.jsxs("div", { className: "hidden lg:flex items-center gap-2 mb-2 opacity-40", children: [
          /* @__PURE__ */ e.jsx(
            "div",
            {
              className: `w-8 h-px ${c ? "bg-purple-600" : "bg-magic-gold"}`
            }
          ),
          /* @__PURE__ */ e.jsx(
            "div",
            {
              className: `w-2 h-2 rotate-45 border ${c ? "border-purple-600" : "border-magic-gold"}`
            }
          ),
          /* @__PURE__ */ e.jsx(
            "div",
            {
              className: `w-4 h-px ${c ? "bg-purple-600" : "bg-magic-gold"}`
            }
          )
        ] }),
        /* @__PURE__ */ e.jsx(
          "h1",
          {
            className: `font-serif font-bold text-4xl tracking-wide ${c ? "text-purple-800 drop-shadow-sm" : "title-shimmer"}`,
            children: "Traffic Library"
          }
        ),
        /* @__PURE__ */ e.jsxs(
          "p",
          {
            className: `font-serif italic text-base mb-1 transition-opacity duration-1000 ${c ? "text-purple-600/70" : "text-megara-light/60"}`,
            children: [
              '"',
              g[b],
              '"'
            ]
          },
          b
        )
      ] }),
      /* @__PURE__ */ e.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ e.jsxs(
          "button",
          {
            className: `px-4 py-2 rounded border transition-all text-sm flex items-center gap-2 ${c ? "border-purple-300 text-purple-700 hover:bg-purple-100" : "border-megara-dark/40 text-megara-light/70 hover:bg-megara-dark/20 hover:text-megara-light"}`,
            children: [
              /* @__PURE__ */ e.jsx(ge, { size: 16 }),
              " Export CSV"
            ]
          }
        ),
        /* @__PURE__ */ e.jsxs(
          "button",
          {
            className: `px-4 py-2 rounded border transition-all text-sm flex items-center gap-2 ${c ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100" : "bg-magic-gold/10 border-magic-gold/40 text-magic-gold hover:bg-magic-gold/20 hover:shadow-glow-gold"}`,
            children: [
              /* @__PURE__ */ e.jsx(oe, { size: 16 }),
              " Send Reminders"
            ]
          }
        ),
        /* @__PURE__ */ e.jsxs(
          "button",
          {
            className: `px-4 py-2 rounded border transition-all text-sm flex items-center gap-2 ${c ? "bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200" : "bg-megara-primary/20 border-megara-primary/50 text-megara-light hover:bg-megara-primary/30 hover:shadow-glow-purple"}`,
            children: [
              /* @__PURE__ */ e.jsx(je, { size: 16 }),
              " Import"
            ]
          }
        ),
        /* @__PURE__ */ e.jsxs(
          "button",
          {
            onClick: s,
            className: `ml-3 p-2.5 rounded-full transition-all relative group ${c ? "text-amber-600 hover:bg-amber-100 hover:shadow-[0_0_20px_4px_rgba(217,119,6,0.2)]" : "text-magic-gold hover:bg-white/10 hover:shadow-[0_0_20px_4px_rgba(255,215,0,0.3)]"}`,
            title: "Toggle Illumination",
            children: [
              t ? /* @__PURE__ */ e.jsx(he, { size: 22 }) : /* @__PURE__ */ e.jsx(ye, { size: 22 }),
              /* @__PURE__ */ e.jsx(
                "div",
                {
                  className: `absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity ${c ? "bg-amber-400/20" : "bg-magic-gold/10"}`
                }
              )
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ e.jsxs(
      "div",
      {
        className: `font-serif text-xs flex gap-2 tracking-wider uppercase ${c ? "text-purple-500/60" : "text-megara-light/40"}`,
        children: [
          /* @__PURE__ */ e.jsxs("span", { children: [
            d,
            " instructions"
          ] }),
          " · ",
          /* @__PURE__ */ e.jsx("span", { children: "2 brands" }),
          " ·",
          " ",
          /* @__PURE__ */ e.jsxs("span", { children: [
            p,
            " markets"
          ] })
        ]
      }
    ),
    /* @__PURE__ */ e.jsx("div", { className: "flex gap-4 items-center", children: /* @__PURE__ */ e.jsx(
      "div",
      {
        className: `flex rounded-t-lg border-b overflow-hidden backdrop-blur-sm ${c ? "bg-white/60 border-purple-200" : "bg-underworld-800/60 border-megara-dark/40"}`,
        children: ["Postman Law", "Wettermark Keith"].map((h) => {
          const w = a === h, j = c ? "text-purple-800 border-purple-600 bg-purple-50" : "text-megara-light border-magic-gold bg-magic-gold/5", N = c ? "text-purple-400 border-transparent hover:text-purple-600 hover:bg-purple-50/50" : "text-megara-light/40 border-transparent hover:text-megara-light/70 hover:bg-white/5";
          return /* @__PURE__ */ e.jsxs(
            "button",
            {
              onClick: () => r(h),
              className: `font-serif px-6 py-3 font-medium text-sm border-b-2 transition-colors ${w ? j : N}`,
              children: [
                h,
                /* @__PURE__ */ e.jsxs("span", { className: "text-xs opacity-50 ml-1", children: [
                  "(",
                  n[h],
                  ")"
                ] })
              ]
            },
            h
          );
        })
      }
    ) }),
    /* @__PURE__ */ e.jsxs("div", { className: "flex gap-4 items-center w-full", children: [
      /* @__PURE__ */ e.jsxs("div", { className: "relative flex-1 group", children: [
        /* @__PURE__ */ e.jsx(
          $e,
          {
            className: `absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${c ? "text-purple-400 group-focus-within:text-purple-600" : "text-magic-teal/50 group-focus-within:text-magic-teal"}`,
            size: 18
          }
        ),
        /* @__PURE__ */ e.jsx(
          "input",
          {
            type: "text",
            placeholder: "Search the archives — ISCIs, markets, buyers, incantations...",
            className: `w-full rounded-lg py-3 pl-12 pr-4 focus:outline-none transition-all backdrop-blur-sm ${c ? "bg-white/70 border border-purple-200 text-purple-900 placeholder:text-purple-400/50 focus:border-purple-400 focus:shadow-[0_0_15px_2px_rgba(147,51,234,0.1)]" : "bg-underworld-800/40 border border-megara-dark/25 text-megara-light placeholder:text-megara-light/30 focus:border-magic-teal/50 focus:shadow-[0_0_20px_2px_rgba(0,206,209,0.1)]"}`
          }
        ),
        /* @__PURE__ */ e.jsx(
          "div",
          {
            className: `absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity ${c ? "via-purple-400/30" : "via-magic-teal/20"}`
          }
        )
      ] }),
      /* @__PURE__ */ e.jsxs(
        "button",
        {
          onClick: m,
          className: `flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm backdrop-blur-sm transition-colors cursor-pointer ${c ? o ? "border-amber-400 bg-amber-50" : "border-purple-200 bg-white/60 hover:border-purple-400" : o ? "border-magic-gold/60 bg-magic-gold/10" : "border-megara-dark/25 bg-underworld-800/40 hover:border-magic-gold/40"}`,
          children: [
            /* @__PURE__ */ e.jsx(
              re,
              {
                size: 16,
                className: c ? "text-amber-600/70" : "text-magic-gold/70"
              }
            ),
            /* @__PURE__ */ e.jsxs(
              "span",
              {
                className: `text-xs ${c ? "text-purple-600/60" : "text-megara-light/60"}`,
                children: [
                  i,
                  " archived"
                ]
              }
            ),
            /* @__PURE__ */ e.jsx("span", { className: c ? "text-purple-300" : "text-megara-light/20", children: "|" }),
            /* @__PURE__ */ e.jsxs(
              "span",
              {
                className: `text-xs ${c ? "text-purple-600/60" : "text-megara-light/60"}`,
                children: [
                  d,
                  " shown"
                ]
              }
            ),
            o && /* @__PURE__ */ e.jsx(
              "span",
              {
                className: `text-[10px] font-bold tracking-widest uppercase ml-1 ${c ? "text-amber-700" : "text-magic-gold"}`,
                children: "ON"
              }
            )
          ]
        }
      )
    ] }),
    /* @__PURE__ */ e.jsx(
      "div",
      {
        className: `absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent ${c ? "via-purple-300/30" : "via-megara-dark/30"} to-transparent`
      }
    )
  ] });
}
const Se = {
  April: "001.04",
  March: "001.03",
  December: "001.12"
};
function Pe({
  instructions: t,
  months: s,
  light: a = !1
}) {
  const r = (n) => {
    const d = document.getElementById(`month-${n}`);
    d && d.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };
  return /* @__PURE__ */ e.jsx("div", { className: "relative z-10 px-8 pb-6", children: /* @__PURE__ */ e.jsx("div", { className: "flex gap-3 flex-wrap", children: s.map((n, d) => {
    const p = t.filter(
      (i) => i.month === n
    ).length;
    return /* @__PURE__ */ e.jsxs(
      y.button,
      {
        initial: {
          opacity: 0,
          y: 10
        },
        animate: {
          opacity: 1,
          y: 0
        },
        transition: {
          delay: d * 0.06
        },
        onClick: () => r(n),
        className: `relative group flex flex-col w-32 rounded-t-sm rounded-b-md overflow-hidden transition-all ${a ? "bg-white/70 border border-purple-200 hover:border-purple-400 hover:bg-white hover:shadow-[0_0_15px_rgba(147,51,234,0.15)]" : "bg-underworld-800/80 border border-megara-dark/30 hover:border-magic-teal/40 hover:bg-underworld-700/50 hover:shadow-glow-teal"}`,
        children: [
          /* @__PURE__ */ e.jsx(
            "div",
            {
              className: `h-1.5 w-full transition-colors ${a ? "bg-purple-300/50 group-hover:bg-purple-400/70" : "bg-magic-teal/30 group-hover:bg-magic-teal/60"}`
            }
          ),
          /* @__PURE__ */ e.jsxs("div", { className: "px-3 py-2.5 flex flex-col gap-1.5", children: [
            /* @__PURE__ */ e.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ e.jsx(
                "span",
                {
                  className: `font-mono text-[10px] font-bold tracking-wider ${a ? "text-purple-400 group-hover:text-purple-600" : "text-magic-teal/40 group-hover:text-magic-teal/70"}`,
                  children: Se[n] || "001"
                }
              ),
              /* @__PURE__ */ e.jsx(
                ie,
                {
                  size: 14,
                  className: `transition-colors ${a ? "text-purple-300 group-hover:text-purple-500" : "text-magic-teal/30 group-hover:text-magic-teal/60"}`
                }
              )
            ] }),
            /* @__PURE__ */ e.jsx(
              "span",
              {
                className: `font-serif text-sm font-medium text-left transition-colors ${a ? "text-purple-700/70 group-hover:text-purple-800" : "text-megara-light/60 group-hover:text-megara-light/80"}`,
                children: n
              }
            ),
            /* @__PURE__ */ e.jsxs(
              "span",
              {
                className: `text-[10px] font-mono ${a ? "text-purple-400/50" : "text-megara-light/25"}`,
                children: [
                  p,
                  " ",
                  p === 1 ? "scroll" : "scrolls"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ e.jsx(
            "div",
            {
              className: `absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent ${a ? "via-purple-200/40" : "via-megara-dark/20"}`
            }
          )
        ]
      },
      n
    );
  }) }) });
}
const Oe = [
  // Postman Law - April - TV
  {
    id: "1",
    brand: "Postman Law",
    market: "Chicago",
    mediaType: "TV",
    month: "April",
    estimate: "2609 + 2610 + 2611 + 2612 + 2613 + 2614",
    version: "v1",
    iscis: "10 ISCIs",
    dateRange: "3/30 - 4/26",
    buyer: "Lynn Cortelezzi",
    status: "sent"
  },
  {
    id: "2",
    brand: "Postman Law",
    market: "Cincinnati",
    mediaType: "TV",
    month: "April",
    estimate: "2617 + 2618 + 2619 + 2620 + 2621 + 2622",
    version: "v1",
    iscis: "10 ISCIs",
    dateRange: "3/30 - 4/26",
    buyer: "Lynn Cortelezzi",
    status: "sent"
  },
  {
    id: "3",
    brand: "Postman Law",
    market: "Denver",
    mediaType: "TV",
    month: "April",
    estimate: "2625 + 2626 + 2627 + 2628 + 2629 + 2630",
    version: "v1",
    iscis: "10 ISCIs",
    dateRange: "3/30 - 4/26",
    buyer: "Lynn Cortelezzi",
    status: "sent"
  },
  {
    id: "4",
    brand: "Postman Law",
    market: "Minneapolis",
    mediaType: "TV",
    month: "April",
    estimate: "2601 + 2602 + 2603 + 2605 + 2606 + 2633",
    version: "v1",
    iscis: "10 ISCIs",
    dateRange: "3/30 - 4/26",
    buyer: "Ken Lazar",
    status: "sent"
  },
  // Postman Law - April - Radio
  {
    id: "5",
    brand: "Postman Law",
    market: "Chicago",
    mediaType: "Radio",
    month: "April",
    estimate: "2615",
    version: "v1",
    iscis: "8 ISCIs",
    dateRange: "3/30 - 4/26",
    buyer: "Lynn Cortelezzi",
    status: "sent"
  },
  {
    id: "6",
    brand: "Postman Law",
    market: "Cincinnati",
    mediaType: "Radio",
    month: "April",
    estimate: "2623",
    version: "v1",
    iscis: "8 ISCIs",
    dateRange: "3/30 - 4/26",
    buyer: "Lynn Cortelezzi",
    status: "sent"
  },
  {
    id: "7",
    brand: "Postman Law",
    market: "Denver",
    mediaType: "Radio",
    month: "April",
    estimate: "2631",
    version: "v1",
    iscis: "8 ISCIs",
    dateRange: "3/30 - 4/26",
    buyer: "Lynn Cortelezzi",
    status: "sent"
  },
  {
    id: "8",
    brand: "Postman Law",
    market: "Minneapolis",
    mediaType: "Radio",
    month: "April",
    estimate: "2607",
    version: "v1",
    iscis: "8 ISCIs",
    dateRange: "3/30 - 4/26",
    buyer: "Ken Lazar",
    status: "pending"
  },
  // Postman Law - April - Streaming Audio
  {
    id: "9",
    brand: "Postman Law",
    market: "Chicago",
    mediaType: "Streaming Audio",
    month: "April",
    estimate: "2616",
    version: "v1",
    iscis: "8 ISCIs 1 stations",
    dateRange: "3/30 - 4/26",
    buyer: "Lynn Cortelezzi",
    status: "sent"
  },
  {
    id: "10",
    brand: "Postman Law",
    market: "Denver",
    mediaType: "Streaming Audio",
    month: "April",
    estimate: "2632",
    version: "v1",
    iscis: "8 ISCIs 1 stations",
    dateRange: "3/30 - 4/26",
    buyer: "Lynn Cortelezzi",
    status: "sent"
  },
  // Postman Law - April - Cable
  {
    id: "11",
    brand: "Postman Law",
    market: "Chicago",
    mediaType: "Cable",
    month: "April",
    estimate: "2613",
    version: "v1",
    iscis: "10 ISCIs 1 stations",
    dateRange: "3/30 - 4/26",
    buyer: "Lynn Cortelezzi",
    status: "pending"
  },
  {
    id: "12",
    brand: "Postman Law",
    market: "Cincinnati",
    mediaType: "Cable",
    month: "April",
    estimate: "2621",
    version: "v1",
    iscis: "10 ISCIs 1 stations",
    dateRange: "3/30 - 4/26",
    buyer: "Lynn Cortelezzi",
    status: "pending"
  },
  {
    id: "13",
    brand: "Postman Law",
    market: "Denver",
    mediaType: "Cable",
    month: "April",
    estimate: "2629",
    version: "v1",
    iscis: "10 ISCIs 1 stations",
    dateRange: "3/30 - 4/26",
    buyer: "Lynn Cortelezzi",
    status: "pending"
  },
  {
    id: "14",
    brand: "Postman Law",
    market: "Minneapolis",
    mediaType: "Cable",
    month: "April",
    estimate: "2605",
    version: "v1",
    iscis: "10 ISCIs 1 stations",
    dateRange: "3/30 - 4/26",
    buyer: "Ken Lazar",
    status: "pending"
  },
  // Postman Law - April - OOH
  {
    id: "15",
    brand: "Postman Law",
    market: "Minneapolis",
    mediaType: "OOH",
    month: "April",
    estimate: "OOH-MSP-PL",
    version: "v1",
    iscis: "3 creatives 3 units",
    dateRange: "3/30",
    buyer: "Ken Lazar",
    status: "sent"
  },
  // Postman Law - March - TV
  {
    id: "16",
    brand: "Postman Law",
    market: "Chicago",
    mediaType: "TV",
    month: "March",
    estimate: "2609",
    version: "v1",
    iscis: "10 ISCIs",
    dateRange: "2/23 - 3/29",
    buyer: "Lynn Cortelezzi",
    status: "pending"
  },
  {
    id: "17",
    brand: "Postman Law",
    market: "Cincinnati",
    mediaType: "TV",
    month: "March",
    estimate: "2617",
    version: "v1",
    iscis: "10 ISCIs",
    dateRange: "2/23 - 3/29",
    buyer: "Lynn Cortelezzi",
    status: "pending"
  },
  {
    id: "18",
    brand: "Postman Law",
    market: "Denver",
    mediaType: "TV",
    month: "March",
    estimate: "2625",
    version: "v1",
    iscis: "8 ISCIs",
    dateRange: "2/23 - 3/29",
    buyer: "Lynn Cortelezzi",
    status: "pending"
  },
  {
    id: "19",
    brand: "Postman Law",
    market: "Minneapolis",
    mediaType: "TV",
    month: "March",
    estimate: "2601",
    version: "v1",
    iscis: "10 ISCIs",
    dateRange: "2/23 - 3/29",
    buyer: "Ken Lazar",
    status: "pending"
  },
  // Postman Law - March - Radio
  {
    id: "20",
    brand: "Postman Law",
    market: "Chicago",
    mediaType: "Radio",
    month: "March",
    estimate: "2615",
    version: "v1",
    iscis: "8 ISCIs",
    dateRange: "2/23 - 3/29",
    buyer: "Lynn Cortelezzi",
    status: "pending"
  },
  {
    id: "21",
    brand: "Postman Law",
    market: "Cincinnati",
    mediaType: "Radio",
    month: "March",
    estimate: "2623",
    version: "v1",
    iscis: "8 ISCIs",
    dateRange: "2/23 - 3/29",
    buyer: "Lynn Cortelezzi",
    status: "pending"
  },
  {
    id: "22",
    brand: "Postman Law",
    market: "Denver",
    mediaType: "Radio",
    month: "March",
    estimate: "2631",
    version: "v1",
    iscis: "8 ISCIs",
    dateRange: "2/23 - 3/29",
    buyer: "Lynn Cortelezzi",
    status: "pending"
  },
  {
    id: "23",
    brand: "Postman Law",
    market: "Minneapolis",
    mediaType: "Radio",
    month: "March",
    estimate: "2607",
    version: "v1",
    iscis: "8 ISCIs",
    dateRange: "2/23 - 3/29",
    buyer: "Ken Lazar",
    status: "pending"
  },
  // Postman Law - December - Radio
  {
    id: "24",
    brand: "Postman Law",
    market: "Chicago",
    mediaType: "Radio",
    month: "December",
    estimate: "2615",
    version: "v1",
    iscis: "8 ISCIs",
    dateRange: "12/01 - 12/28",
    buyer: "Lynn Cortelezzi",
    status: "pending"
  }
], _ = () => typeof window < "u" && window.MegaraLibraryData ? window.MegaraLibraryData : Oe, $ = new Proxy([], {
  get(t, s) {
    const a = _(), r = a[s];
    return typeof r == "function" ? r.bind(a) : r;
  },
  has(t, s) {
    return s in _();
  },
  ownKeys() {
    return Reflect.ownKeys(_());
  },
  getOwnPropertyDescriptor(t, s) {
    return Object.getOwnPropertyDescriptor(_(), s);
  }
}), O = {
  Chicago: "text-market-chicago",
  Cincinnati: "text-market-cincinnati",
  Denver: "text-market-denver",
  Minneapolis: "text-market-minneapolis",
  Birmingham: "text-market-birmingham",
  Huntsville: "text-market-huntsville",
  Knoxville: "text-market-knoxville",
  Chattanooga: "text-market-chattanooga",
  Montgomery: "text-market-montgomery",
  Dothan: "text-market-dothan",
  Gadsden: "text-market-gadsden"
}, Ve = {
  Chicago: "bg-market-chicago",
  Cincinnati: "bg-market-cincinnati",
  Denver: "bg-market-denver",
  Minneapolis: "bg-market-minneapolis",
  Birmingham: "bg-market-birmingham",
  Huntsville: "bg-market-huntsville",
  Knoxville: "bg-market-knoxville",
  Chattanooga: "bg-market-chattanooga",
  Montgomery: "bg-market-montgomery",
  Dothan: "bg-market-dothan",
  Gadsden: "bg-market-gadsden"
};
function De({ instruction: t, onClick: s }) {
  const a = E(V), r = t.status === "sent", n = parseInt(t.iscis) || 5, d = n > 8 ? "h-48" : n > 5 ? "h-44" : "h-40", p = {
    TV: "from-[#2a1540] to-[#1a0d2e]",
    Radio: "from-[#1a2040] to-[#0d1530]",
    "Streaming Audio": "from-[#1a3030] to-[#0d2020]",
    Cable: "from-[#2a1a30] to-[#1a1020]",
    OOH: "from-[#2a2a1a] to-[#1a1a0d]"
  }, i = {
    TV: "from-[#e8daf0] to-[#d4c0e0]",
    Radio: "from-[#d5dff0] to-[#c0cfe0]",
    "Streaming Audio": "from-[#d0e8e8] to-[#bcd8d8]",
    Cable: "from-[#e0d5e8] to-[#d0c0d8]",
    OOH: "from-[#e8e5d0] to-[#d8d5c0]"
  }, o = a ? i[t.mediaType] || i.TV : p[t.mediaType] || p.TV;
  return /* @__PURE__ */ e.jsxs(
    y.div,
    {
      whileHover: {
        y: -14,
        scale: 1.04
      },
      whileTap: {
        scale: 0.98
      },
      onClick: s,
      className: `
        relative w-14 ${d} cursor-pointer group
        rounded-l-sm rounded-r-md
        flex flex-col items-center justify-between py-3
        bg-gradient-to-b ${o}
        ${a ? "" : r ? "book-glow-sent" : "book-glow-pending"}
        ${a ? "shadow-[2px_2px_8px_rgba(0,0,0,0.1),-1px_0_3px_rgba(0,0,0,0.05)]" : ""}
      `,
      style: a ? {} : void 0,
      children: [
        /* @__PURE__ */ e.jsx(
          "div",
          {
            className: `absolute inset-0 rounded-l-sm rounded-r-md ${a ? "opacity-10" : "opacity-20"} bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]`
          }
        ),
        /* @__PURE__ */ e.jsx(
          "div",
          {
            className: `absolute left-1 top-4 bottom-4 w-px ${a ? "bg-black/10" : "bg-white/10"}`
          }
        ),
        /* @__PURE__ */ e.jsx(
          "div",
          {
            className: `absolute right-1.5 top-4 bottom-4 w-px ${a ? "bg-black/5" : "bg-black/30"}`
          }
        ),
        /* @__PURE__ */ e.jsx(
          "div",
          {
            className: `w-10 h-0.5 rounded-full mb-1 relative z-10 ${a ? "bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" : "bg-gradient-to-r from-transparent via-magic-gold/40 to-transparent"}`
          }
        ),
        /* @__PURE__ */ e.jsx(
          "div",
          {
            className: `w-full h-3 ${Ve[t.market]} opacity-90 shadow-inner relative z-10`,
            children: /* @__PURE__ */ e.jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" })
          }
        ),
        /* @__PURE__ */ e.jsx("div", { className: "flex-1 flex items-center justify-center writing-vertical-rl text-orientation-mixed rotate-180 relative z-10", children: /* @__PURE__ */ e.jsx(
          "span",
          {
            className: `font-serif text-[10px] font-bold tracking-[0.2em] whitespace-nowrap ${a ? "text-purple-900/80" : "text-megara-light/90"}`,
            children: t.market.toUpperCase()
          }
        ) }),
        r ? /* @__PURE__ */ e.jsx(
          "div",
          {
            className: `w-2.5 h-2.5 rounded-full mt-2 mb-1 relative z-10 ${a ? "bg-green-500 shadow-[0_0_6px_1px_rgba(34,197,94,0.4)]" : "bg-magic-teal shadow-[0_0_8px_2px_rgba(0,206,209,0.5)]"}`,
            children: /* @__PURE__ */ e.jsx("div", { className: "absolute inset-0.5 rounded-full bg-white/30" })
          }
        ) : /* @__PURE__ */ e.jsx(
          "div",
          {
            className: `w-2.5 h-2.5 rounded-full mt-2 mb-1 relative z-10 ${a ? "bg-purple-400 shadow-[0_0_4px_1px_rgba(147,51,234,0.3)]" : "bg-megara-primary/60 shadow-[0_0_6px_1px_rgba(200,80,192,0.3)]"}`,
            children: /* @__PURE__ */ e.jsx("div", { className: "absolute inset-0.5 rounded-full bg-white/20" })
          }
        ),
        /* @__PURE__ */ e.jsx(
          "div",
          {
            className: `w-10 h-0.5 rounded-full mt-1 relative z-10 ${a ? "bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" : "bg-gradient-to-r from-transparent via-magic-gold/30 to-transparent"}`
          }
        ),
        /* @__PURE__ */ e.jsx(
          "div",
          {
            className: "absolute inset-0 rounded-l-sm rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
            style: {
              boxShadow: a ? r ? "0 0 20px 4px rgba(34,197,94,0.2)" : "0 0 18px 3px rgba(147,51,234,0.2)" : r ? "0 0 25px 5px rgba(0,206,209,0.3), inset 0 0 15px rgba(0,206,209,0.1)" : "0 0 20px 4px rgba(200,80,192,0.25), inset 0 0 12px rgba(200,80,192,0.1)"
            }
          }
        ),
        /* @__PURE__ */ e.jsxs(
          "div",
          {
            className: `absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max px-4 py-2.5 rounded-lg text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 backdrop-blur-sm ${a ? "bg-white/95 border border-purple-200 text-purple-900 shadow-lg" : "bg-underworld-900/95 border border-megara-primary/30 text-megara-light shadow-[0_0_20px_rgba(200,80,192,0.2)]"}`,
            children: [
              /* @__PURE__ */ e.jsx(
                "div",
                {
                  className: `font-bold text-sm ${O[t.market]}`,
                  children: t.market
                }
              ),
              /* @__PURE__ */ e.jsxs(
                "div",
                {
                  className: `mt-0.5 ${a ? "text-purple-600/60" : "text-megara-light/60"}`,
                  children: [
                    "Est: ",
                    t.estimate
                  ]
                }
              ),
              /* @__PURE__ */ e.jsxs(
                "div",
                {
                  className: `mt-0.5 ${a ? "text-purple-500/50" : "text-megara-light/40"}`,
                  children: [
                    t.iscis,
                    " · ",
                    t.dateRange
                  ]
                }
              ),
              /* @__PURE__ */ e.jsx(
                "div",
                {
                  className: `mt-1 text-[10px] font-medium ${r ? a ? "text-green-600" : "text-magic-teal" : a ? "text-purple-500" : "text-megara-primary/70"}`,
                  children: t.status.toUpperCase()
                }
              )
            ]
          }
        )
      ]
    }
  );
}
function Be({
  month: t,
  instructions: s,
  onBookClick: a,
  light: r = !1
}) {
  if (s.length === 0) return null;
  const n = s.reduce(
    (i, o) => (i[o.mediaType] || (i[o.mediaType] = []), i[o.mediaType].push(o), i),
    {}
  ), p = [
    "TV",
    "Radio",
    "Streaming Audio",
    "Cable",
    "OOH"
  ].filter((i) => {
    var o;
    return ((o = n[i]) == null ? void 0 : o.length) > 0;
  });
  return /* @__PURE__ */ e.jsxs(
    y.div,
    {
      initial: {
        opacity: 0,
        y: 20
      },
      animate: {
        opacity: 1,
        y: 0
      },
      transition: {
        duration: 0.5
      },
      className: "mb-20 relative",
      children: [
        /* @__PURE__ */ e.jsxs("div", { className: "flex items-center gap-4 mb-8 px-4", children: [
          /* @__PURE__ */ e.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ e.jsx(
              "div",
              {
                className: `w-2 h-2 rotate-45 ${r ? "bg-purple-500/60" : "bg-magic-gold/60"}`
              }
            ),
            /* @__PURE__ */ e.jsx(
              "div",
              {
                className: `w-6 h-px ${r ? "bg-purple-400/40" : "bg-magic-gold/40"}`
              }
            )
          ] }),
          /* @__PURE__ */ e.jsx(
            "h2",
            {
              className: `font-serif font-bold text-3xl ${r ? "text-purple-800 drop-shadow-sm" : "text-magic-gold drop-shadow-[0_0_12px_rgba(255,215,0,0.3)]"}`,
              children: t
            }
          ),
          /* @__PURE__ */ e.jsxs(
            "span",
            {
              className: `font-serif text-xs tracking-wider uppercase ${r ? "text-purple-500/50" : "text-megara-light/40"}`,
              children: [
                "(",
                s.length,
                " ",
                s.length === 1 ? "instruction" : "instructions",
                ")"
              ]
            }
          ),
          /* @__PURE__ */ e.jsx(
            "div",
            {
              className: `flex-1 h-px bg-gradient-to-r ${r ? "from-purple-400/30 via-purple-300/10" : "from-magic-gold/30 via-magic-gold/10"} to-transparent`
            }
          ),
          /* @__PURE__ */ e.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ e.jsx(
              "div",
              {
                className: `w-6 h-px ${r ? "bg-purple-300/20" : "bg-magic-gold/20"}`
              }
            ),
            /* @__PURE__ */ e.jsx(
              "div",
              {
                className: `w-1.5 h-1.5 rotate-45 ${r ? "bg-purple-400/30" : "bg-magic-gold/30"}`
              }
            )
          ] })
        ] }),
        p.map((i, o) => {
          const m = n[i], g = new Set(m.map((b) => b.market)).size;
          return /* @__PURE__ */ e.jsxs(
            y.div,
            {
              initial: {
                opacity: 0,
                x: -10
              },
              animate: {
                opacity: 1,
                x: 0
              },
              transition: {
                delay: o * 0.1,
                duration: 0.4
              },
              className: "mb-12 relative",
              children: [
                /* @__PURE__ */ e.jsxs(
                  "div",
                  {
                    className: `absolute -top-5 left-8 border px-5 py-1.5 rounded z-10 ${r ? "bg-gradient-to-b from-purple-200 to-purple-300 border-purple-300/60 shadow-md" : "brass-plate border-yellow-500/50 shadow-[0_2px_10px_rgba(218,165,32,0.3)]"}`,
                    children: [
                      /* @__PURE__ */ e.jsxs(
                        "h3",
                        {
                          className: `font-serif text-xs font-bold tracking-widest uppercase drop-shadow-md ${r ? "text-purple-800" : "text-yellow-100"}`,
                          children: [
                            i,
                            /* @__PURE__ */ e.jsxs(
                              "span",
                              {
                                className: `opacity-50 normal-case ml-2 font-sans text-[10px] ${r ? "text-purple-600" : ""}`,
                                children: [
                                  g,
                                  " ",
                                  g === 1 ? "market" : "markets"
                                ]
                              }
                            )
                          ]
                        }
                      ),
                      /* @__PURE__ */ e.jsx(
                        "div",
                        {
                          className: `absolute top-1/2 -translate-y-1/2 left-1.5 w-2 h-2 rounded-full border shadow-inner ${r ? "bg-gradient-to-br from-purple-200 to-purple-400 border-purple-400/50" : "bg-gradient-to-br from-yellow-300 to-yellow-700 border-yellow-600/50"}`
                        }
                      ),
                      /* @__PURE__ */ e.jsx(
                        "div",
                        {
                          className: `absolute top-1/2 -translate-y-1/2 right-1.5 w-2 h-2 rounded-full border shadow-inner ${r ? "bg-gradient-to-br from-purple-200 to-purple-400 border-purple-400/50" : "bg-gradient-to-br from-yellow-300 to-yellow-700 border-yellow-600/50"}`
                        }
                      )
                    ]
                  }
                ),
                /* @__PURE__ */ e.jsx(
                  "div",
                  {
                    className: `absolute inset-x-0 top-4 bottom-7 rounded-t-sm ${r ? "bg-gradient-to-b from-purple-100/40 to-white/20 border-t border-purple-200/30" : "bg-gradient-to-b from-underworld-900/80 to-underworld-800/40 border-t border-megara-dark/10"}`
                  }
                ),
                /* @__PURE__ */ e.jsx("div", { className: "flex items-end gap-1 px-12 pt-10 pb-1 min-h-[210px] relative z-10 overflow-x-auto hide-scrollbar", children: m.map(
                  (b, f) => /* @__PURE__ */ e.jsx(
                    y.div,
                    {
                      initial: {
                        opacity: 0,
                        y: 20
                      },
                      animate: {
                        opacity: 1,
                        y: 0
                      },
                      transition: {
                        delay: o * 0.1 + f * 0.03
                      },
                      children: /* @__PURE__ */ e.jsx(
                        De,
                        {
                          instruction: b,
                          onClick: () => a(b)
                        }
                      )
                    },
                    b.id
                  )
                ) }),
                /* @__PURE__ */ e.jsxs("div", { className: "shelf-wood h-8 w-full rounded-sm relative z-0", children: [
                  /* @__PURE__ */ e.jsx(
                    "div",
                    {
                      className: `absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent ${r ? "via-purple-300/30" : "via-megara-dark/40"}`
                    }
                  ),
                  /* @__PURE__ */ e.jsx("div", { className: "absolute top-full left-4 right-4 h-12 bg-black/20 blur-md rounded-[100%]" })
                ] }),
                /* @__PURE__ */ e.jsx(
                  "div",
                  {
                    className: `absolute -bottom-4 left-1/4 right-1/4 h-8 blur-xl rounded-full shelf-ambient pointer-events-none ${r ? "bg-purple-400/5" : "bg-magic-teal/5"}`
                  }
                )
              ]
            },
            i
          );
        })
      ]
    }
  );
}
const I = () => new (window.AudioContext || window.webkitAudioContext)();
function Ee() {
  try {
    const t = I(), s = t.currentTime;
    [880, 1320].forEach((d, p) => {
      const i = t.createOscillator();
      i.type = "sine", i.frequency.value = d;
      const o = t.createGain(), m = s + p * 0.06;
      o.gain.setValueAtTime(0, m), o.gain.linearRampToValueAtTime(0.07, m + 0.01), o.gain.exponentialRampToValueAtTime(1e-3, m + 0.8), i.connect(o), o.connect(t.destination), i.start(m), i.stop(m + 0.8);
    });
    const r = t.createOscillator();
    r.type = "sine", r.frequency.value = 2640;
    const n = t.createGain();
    n.gain.setValueAtTime(0, s + 0.1), n.gain.linearRampToValueAtTime(0.025, s + 0.12), n.gain.exponentialRampToValueAtTime(1e-3, s + 0.5), r.connect(n), n.connect(t.destination), r.start(s + 0.1), r.stop(s + 0.5), setTimeout(() => t.close(), 1200);
  } catch {
  }
}
function He() {
  try {
    const t = I(), s = t.currentTime, a = t.createOscillator();
    a.type = "sine", a.frequency.setValueAtTime(440, s), a.frequency.exponentialRampToValueAtTime(220, s + 0.08);
    const r = t.createGain();
    r.gain.setValueAtTime(0.06, s), r.gain.exponentialRampToValueAtTime(1e-3, s + 0.1), a.connect(r), r.connect(t.destination), a.start(s), a.stop(s + 0.1), setTimeout(() => t.close(), 300);
  } catch {
  }
}
function Ke() {
  try {
    const t = I(), s = t.currentTime;
    [1047, 1319, 1568, 2093].forEach((p, i) => {
      const o = t.createOscillator();
      o.type = "sine", o.frequency.value = p;
      const m = t.createGain(), g = s + i * 0.1;
      m.gain.setValueAtTime(0, g), m.gain.linearRampToValueAtTime(0.06, g + 0.01), m.gain.exponentialRampToValueAtTime(1e-3, g + 0.6), o.connect(m), m.connect(t.destination), o.start(g), o.stop(g + 0.6);
    });
    const r = t.createOscillator();
    r.type = "sine", r.frequency.value = 3136;
    const n = t.createGain(), d = s + 0.4;
    n.gain.setValueAtTime(0, d), n.gain.linearRampToValueAtTime(0.04, d + 0.01), n.gain.exponentialRampToValueAtTime(1e-3, d + 0.5), r.connect(n), n.connect(t.destination), r.start(d), r.stop(d + 0.5), setTimeout(() => t.close(), 1500);
  } catch {
  }
}
function We(t) {
  if (t.iscisDetail && t.iscisDetail.length)
    return t.iscisDetail.map((o) => ({
      dates: o.sched || t.dateRange,
      code: o.code + (o.title ? " - " + o.title : ""),
      length: o.dur ? o.dur.startsWith(":") ? o.dur : ":" + o.dur : o.units ? o.units + " units" : "",
      pct: o.pct || "",
      notes: o.bookend || o.sched || ""
    }));
  const a = {
    Chicago: "CHI",
    Cincinnati: "CIN",
    Denver: "DEN",
    Minneapolis: "MSP",
    Birmingham: "BRM",
    Huntsville: "HSV",
    Knoxville: "KNX",
    Chattanooga: "CHA",
    Montgomery: "MTG",
    Dothan: "DHN",
    Gadsden: "GAD"
  }[t.market] || "XXX", r = t.brand === "Postman Law" ? "PL" : "WK";
  if (t.mediaType === "OOH")
    return [
      {
        dates: t.dateRange,
        code: `${a}${r}OOH001 - Billboard_Main`,
        length: "Static",
        pct: "34%",
        notes: "All Week"
      },
      {
        dates: t.dateRange,
        code: `${a}${r}OOH002 - Digital_Board`,
        length: "Digital",
        pct: "33%",
        notes: "All Week"
      },
      {
        dates: t.dateRange,
        code: `${a}${r}OOH003 - Transit_Shelter`,
        length: "Static",
        pct: "33%",
        notes: "All Week"
      }
    ];
  const d = t.mediaType === "TV" || t.mediaType === "Cable" ? "T" : t.mediaType === "Radio" ? "R" : "S", p = [
    {
      name: "Why Postman_60",
      length: ":60",
      pct: "50%"
    },
    {
      name: "Supreme Court_60",
      length: ":60",
      pct: "50%"
    },
    {
      name: "Warren's Story_30",
      length: ":30",
      pct: "25%"
    },
    {
      name: "Local Lawyers_30",
      length: ":30",
      pct: "25%"
    },
    {
      name: "Legal Firepower_30",
      length: ":30",
      pct: "25%"
    },
    {
      name: "Justice & Representation_30",
      length: ":30",
      pct: "25%"
    },
    {
      name: "Warren's Story_15",
      length: ":15",
      pct: "25%"
    },
    {
      name: "Local Lawyers_15",
      length: ":15",
      pct: "25%"
    }
  ], i = parseInt(t.iscis) || 8;
  return p.slice(0, i).map((o, m) => ({
    dates: t.dateRange,
    code: `${a}${r}${266e4 + m}${d} - ${o.name}`,
    length: o.length,
    pct: o.pct,
    notes: o.length === ":15" ? ":15 A" : "All Week"
  }));
}
function Ge({
  instruction: t,
  onClose: s,
  light: a = !1
}) {
  if (z(() => {
    t && Ee();
  }, [t]), !t) return null;
  const r = We(t), n = t.market === "Chicago" ? "CHI" : t.market === "Cincinnati" ? "CIN" : t.market === "Denver" ? "DEN" : "MSP", d = () => {
    He(), s();
  }, p = () => {
    Ke();
  };
  return /* @__PURE__ */ e.jsx(W, { children: /* @__PURE__ */ e.jsx(
    "div",
    {
      className: `fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-6 ${a ? "bg-black/40" : "bg-black/70"}`,
      onClick: d,
      children: /* @__PURE__ */ e.jsxs(
        y.div,
        {
          initial: {
            scale: 0.85,
            opacity: 0,
            rotateY: -15
          },
          animate: {
            scale: 1,
            opacity: 1,
            rotateY: 0
          },
          exit: {
            scale: 0.85,
            opacity: 0,
            rotateY: 15
          },
          transition: {
            type: "spring",
            damping: 22,
            stiffness: 180
          },
          className: `w-full max-w-6xl h-[85vh] flex rounded-lg overflow-hidden ${a ? "shadow-[0_0_40px_rgba(147,51,234,0.1),0_25px_50px_rgba(0,0,0,0.2)]" : "shadow-[0_0_60px_rgba(200,80,192,0.15),0_25px_50px_rgba(0,0,0,0.5)]"}`,
          onClick: (i) => i.stopPropagation(),
          children: [
            /* @__PURE__ */ e.jsxs("div", { className: "flex-1 bg-white overflow-y-auto relative", children: [
              /* @__PURE__ */ e.jsx("div", { className: "absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-gray-300 to-transparent z-10 pointer-events-none" }),
              /* @__PURE__ */ e.jsxs("div", { className: "px-10 pt-8 pb-8", children: [
                /* @__PURE__ */ e.jsx("div", { className: "text-center mb-6", children: /* @__PURE__ */ e.jsx("div", { className: "inline-block border-2 border-gray-800 px-5 py-1.5", children: /* @__PURE__ */ e.jsx("span", { className: "font-bold text-gray-900 tracking-wider text-lg uppercase", children: t.brand.toUpperCase() }) }) }),
                /* @__PURE__ */ e.jsxs("div", { className: "grid grid-cols-[140px_1fr] gap-y-2.5 text-sm max-w-2xl mb-8", children: [
                  /* @__PURE__ */ e.jsx("span", { className: "font-bold text-gray-700", children: "Agency:" }),
                  /* @__PURE__ */ e.jsx("span", { className: "text-gray-900", children: "Blackacre Services" }),
                  /* @__PURE__ */ e.jsx("span", { className: "font-bold text-gray-700", children: "Client:" }),
                  /* @__PURE__ */ e.jsx("span", { className: "text-purple-600 font-medium", children: t.brand }),
                  /* @__PURE__ */ e.jsx("span", { className: "font-bold text-gray-700", children: "Market:" }),
                  /* @__PURE__ */ e.jsxs("span", { className: "text-gray-900 font-medium", children: [
                    t.market,
                    " (",
                    n,
                    ")"
                  ] }),
                  /* @__PURE__ */ e.jsx("span", { className: "font-bold text-gray-700", children: "Buyer:" }),
                  /* @__PURE__ */ e.jsx("span", { className: "text-purple-600 font-medium", children: t.buyer }),
                  /* @__PURE__ */ e.jsx("span", { className: "font-bold text-gray-700", children: "Media:" }),
                  /* @__PURE__ */ e.jsx("span", { className: "text-green-600 font-medium", children: t.mediaType }),
                  /* @__PURE__ */ e.jsx("span", { className: "font-bold text-gray-700", children: "Broadcast Month:" }),
                  /* @__PURE__ */ e.jsx("span", { className: "text-red-500 font-medium", children: t.month }),
                  /* @__PURE__ */ e.jsx("span", { className: "font-bold text-gray-700", children: "Flight Dates:" }),
                  /* @__PURE__ */ e.jsx("span", { className: "text-gray-900 font-medium", children: t.dateRange }),
                  /* @__PURE__ */ e.jsx("span", { className: "font-bold text-gray-700", children: "Version / Links:" }),
                  /* @__PURE__ */ e.jsxs("span", { className: "text-gray-900", children: [
                    "Version 1 / ",
                    n,
                    " Assets"
                  ] }),
                  /* @__PURE__ */ e.jsx("span", { className: "font-bold text-gray-700", children: "Comments:" }),
                  /* @__PURE__ */ e.jsx("span", { className: "text-gray-600 text-xs leading-relaxed", children: "If you buy has no bookends, run as standalones, if you have stand alones run Legal Firepower :15" })
                ] }),
                /* @__PURE__ */ e.jsxs("table", { className: "w-full text-sm", children: [
                  /* @__PURE__ */ e.jsx("thead", { children: /* @__PURE__ */ e.jsxs("tr", { className: "border-b-2 border-gray-300", children: [
                    /* @__PURE__ */ e.jsx("th", { className: "text-left py-2.5 px-3 text-gray-500 font-semibold uppercase text-[10px] tracking-wider w-24", children: "Flight Dates" }),
                    /* @__PURE__ */ e.jsx("th", { className: "text-left py-2.5 px-3 text-gray-500 font-semibold uppercase text-[10px] tracking-wider", children: "ISCI Codes & Title" }),
                    /* @__PURE__ */ e.jsx("th", { className: "text-left py-2.5 px-3 text-gray-500 font-semibold uppercase text-[10px] tracking-wider w-16", children: "Length" }),
                    /* @__PURE__ */ e.jsx("th", { className: "text-left py-2.5 px-3 text-gray-500 font-semibold uppercase text-[10px] tracking-wider w-12", children: "%" }),
                    /* @__PURE__ */ e.jsx("th", { className: "text-left py-2.5 px-3 text-gray-500 font-semibold uppercase text-[10px] tracking-wider w-20", children: "Notes" })
                  ] }) }),
                  /* @__PURE__ */ e.jsxs("tbody", { children: [
                    /* @__PURE__ */ e.jsx("tr", { className: "bg-green-100 border-b border-green-200", children: /* @__PURE__ */ e.jsx(
                      "td",
                      {
                        colSpan: 5,
                        className: "py-1.5 px-3 font-bold text-gray-800 uppercase text-xs",
                        children: "All Week"
                      }
                    ) }),
                    r.map(
                      (i, o) => /* @__PURE__ */ e.jsxs(
                        "tr",
                        {
                          className: `border-b border-gray-100 ${o % 2 === 0 ? "bg-green-50/40" : "bg-white"} hover:bg-green-50 transition-colors`,
                          children: [
                            /* @__PURE__ */ e.jsx("td", { className: "py-2 px-3 text-gray-600 font-mono text-xs", children: i.dates }),
                            /* @__PURE__ */ e.jsx("td", { className: "py-2 px-3 text-gray-900 font-mono text-xs", children: i.code }),
                            /* @__PURE__ */ e.jsx("td", { className: "py-2 px-3 text-gray-700 font-mono text-xs", children: i.length }),
                            /* @__PURE__ */ e.jsx("td", { className: "py-2 px-3 text-gray-700 font-mono text-xs", children: i.pct }),
                            /* @__PURE__ */ e.jsx("td", { className: "py-2 px-3 text-gray-500 text-xs", children: i.notes })
                          ]
                        },
                        o
                      )
                    )
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ e.jsx(
              "div",
              {
                className: `w-4 flex-shrink-0 ${a ? "bg-gradient-to-r from-purple-200 via-purple-300 to-purple-200 shadow-[inset_0_0_8px_rgba(0,0,0,0.15)]" : "bg-gradient-to-r from-underworld-700 via-underworld-900 to-underworld-700 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"}`
              }
            ),
            /* @__PURE__ */ e.jsxs(
              "div",
              {
                className: `w-80 flex flex-col relative overflow-hidden ${a ? "bg-[#f8f0fc]" : "bg-underworld-800"}`,
                children: [
                  /* @__PURE__ */ e.jsx(
                    "div",
                    {
                      className: `absolute inset-0 opacity-5 pointer-events-none ${a ? "bg-[radial-gradient(circle_at_30%_50%,rgba(147,51,234,0.2),transparent_70%)]" : "bg-[radial-gradient(circle_at_30%_50%,rgba(200,80,192,0.3),transparent_70%)]"}`
                    }
                  ),
                  /* @__PURE__ */ e.jsx(
                    "div",
                    {
                      className: `absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 rounded-tr-lg ${a ? "border-purple-300/30" : "border-megara-dark/30"}`
                    }
                  ),
                  /* @__PURE__ */ e.jsx(
                    "div",
                    {
                      className: `absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 rounded-br-lg ${a ? "border-purple-300/30" : "border-megara-dark/30"}`
                    }
                  ),
                  /* @__PURE__ */ e.jsx("div", { className: "p-4 flex justify-end relative z-10", children: /* @__PURE__ */ e.jsx(
                    "button",
                    {
                      onClick: d,
                      className: `p-2 rounded-full transition-colors ${a ? "text-purple-400 hover:text-purple-700 hover:bg-purple-100" : "text-megara-light/60 hover:text-megara-light hover:bg-white/10"}`,
                      children: /* @__PURE__ */ e.jsx(Ae, { size: 20 })
                    }
                  ) }),
                  /* @__PURE__ */ e.jsxs(
                    "div",
                    {
                      className: `px-6 pb-6 border-b relative z-10 ${a ? "border-purple-200/40" : "border-megara-dark/20"}`,
                      children: [
                        /* @__PURE__ */ e.jsx(
                          "span",
                          {
                            className: `font-serif text-2xl font-bold ${O[t.market]}`,
                            children: t.market
                          }
                        ),
                        /* @__PURE__ */ e.jsxs("div", { className: "mt-2 space-y-1", children: [
                          /* @__PURE__ */ e.jsxs("div", { className: "flex items-center gap-2", children: [
                            /* @__PURE__ */ e.jsxs(
                              "span",
                              {
                                className: `text-xs px-2 py-0.5 rounded font-mono ${a ? "bg-purple-100 text-purple-700" : "bg-underworld-700 text-megara-light/70"}`,
                                children: [
                                  "Est ",
                                  t.estimate.split("+")[0].trim()
                                ]
                              }
                            ),
                            /* @__PURE__ */ e.jsx(
                              "span",
                              {
                                className: `text-xs ${a ? "text-purple-500/50" : "text-megara-light/40"}`,
                                children: t.version
                              }
                            )
                          ] }),
                          /* @__PURE__ */ e.jsxs(
                            "div",
                            {
                              className: `text-xs ${a ? "text-purple-600/50" : "text-megara-light/50"}`,
                              children: [
                                t.iscis,
                                " · ",
                                t.dateRange
                              ]
                            }
                          ),
                          /* @__PURE__ */ e.jsx(
                            "div",
                            {
                              className: `text-xs ${a ? "text-purple-600/50" : "text-megara-light/50"}`,
                              children: t.buyer
                            }
                          ),
                          t.status === "sent" && /* @__PURE__ */ e.jsx(
                            "span",
                            {
                              className: `inline-block text-[10px] px-2 py-0.5 rounded border mt-1 ${a ? "bg-green-50 text-green-600 border-green-200" : "bg-green-900/40 text-green-400 border-green-700/50"}`,
                              children: "sent"
                            }
                          )
                        ] })
                      ]
                    }
                  ),
                  /* @__PURE__ */ e.jsxs("div", { className: "flex-1 px-6 py-6 flex flex-col gap-3 relative z-10", children: [
                    /* @__PURE__ */ e.jsx(
                      "h3",
                      {
                        className: `font-serif text-lg mb-2 tracking-wide ${a ? "text-purple-700" : "text-magic-gold/80"}`,
                        children: "Actions"
                      }
                    ),
                    /* @__PURE__ */ e.jsxs(
                      "button",
                      {
                        className: `w-full py-2.5 px-4 rounded border text-sm flex items-center gap-3 transition-colors group ${a ? "border-purple-200 text-purple-700 hover:bg-purple-100" : "border-megara-dark/40 text-megara-light hover:bg-megara-dark/20"}`,
                        children: [
                          /* @__PURE__ */ e.jsx(
                            we,
                            {
                              size: 16,
                              className: "text-megara-primary group-hover:scale-110 transition-transform"
                            }
                          ),
                          " ",
                          "Edit"
                        ]
                      }
                    ),
                    /* @__PURE__ */ e.jsxs(
                      "button",
                      {
                        className: `w-full py-2.5 px-4 rounded border text-sm flex items-center gap-3 transition-colors group font-medium ${a ? "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100" : "border-magic-teal/40 bg-magic-teal/10 text-magic-teal hover:bg-magic-teal/20"}`,
                        children: [
                          /* @__PURE__ */ e.jsx(
                            be,
                            {
                              size: 16,
                              className: "group-hover:scale-110 transition-transform"
                            }
                          ),
                          " ",
                          "View"
                        ]
                      }
                    ),
                    /* @__PURE__ */ e.jsxs(
                      "button",
                      {
                        className: `w-full py-2.5 px-4 rounded border text-sm flex items-center gap-3 transition-colors group ${a ? "border-purple-200 text-purple-700 hover:bg-purple-100" : "border-megara-dark/40 text-megara-light hover:bg-megara-dark/20"}`,
                        children: [
                          /* @__PURE__ */ e.jsx(
                            _e,
                            {
                              size: 16,
                              className: `group-hover:scale-110 transition-transform ${a ? "text-amber-600" : "text-magic-gold"}`
                            }
                          ),
                          " ",
                          "Print"
                        ]
                      }
                    ),
                    /* @__PURE__ */ e.jsxs(
                      "button",
                      {
                        onClick: p,
                        className: `w-full py-2.5 px-4 rounded border text-sm flex items-center gap-3 transition-colors group ${a ? "border-purple-200 text-purple-700 hover:bg-purple-100" : "border-megara-dark/40 text-megara-light hover:bg-megara-dark/20"}`,
                        children: [
                          /* @__PURE__ */ e.jsx(
                            ze,
                            {
                              size: 16,
                              className: "text-megara-primary group-hover:scale-110 transition-transform group-hover:translate-x-0.5"
                            }
                          ),
                          " ",
                          "Send"
                        ]
                      }
                    ),
                    /* @__PURE__ */ e.jsxs(
                      "button",
                      {
                        className: `w-full py-2.5 px-4 rounded border text-sm flex items-center gap-3 transition-colors group ${a ? "border-purple-200 text-purple-700 hover:bg-purple-100" : "border-megara-dark/40 text-megara-light hover:bg-megara-dark/20"}`,
                        children: [
                          /* @__PURE__ */ e.jsx(
                            pe,
                            {
                              size: 16,
                              className: `group-hover:scale-110 transition-transform ${a ? "text-purple-400" : "text-megara-light/60"}`
                            }
                          ),
                          " ",
                          "Copy to...",
                          /* @__PURE__ */ e.jsx(
                            de,
                            {
                              size: 14,
                              className: `ml-auto ${a ? "text-purple-300" : "text-megara-light/40"}`
                            }
                          )
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ e.jsx("div", { className: "px-6 pb-6 relative z-10", children: /* @__PURE__ */ e.jsxs(
                    "button",
                    {
                      className: `w-full py-2.5 px-4 rounded border text-sm flex items-center justify-center gap-2 transition-colors ${a ? "border-red-200 text-red-500 hover:bg-red-50" : "border-red-900/40 text-red-400 hover:bg-red-900/20"}`,
                      children: [
                        /* @__PURE__ */ e.jsx(Le, { size: 16 }),
                        " Delete"
                      ]
                    }
                  ) })
                ]
              }
            )
          ]
        }
      )
    }
  ) });
}
const V = H(!1);
function Ue() {
  const [t, s] = k(!1), [a, r] = k("Postman Law"), [n, d] = k(!1), [p, i] = k(null);
  z(() => {
    t ? document.body.classList.add("light") : document.body.classList.remove("light");
  }, [t]);
  const o = K(() => {
    const l = [
      "soul-teal",
      "soul-purple",
      "soul-gold",
      "soul-ember"
    ];
    return Array.from({
      length: 60
    }).map((v, L) => ({
      id: L,
      left: `${Math.random() * 100}vw`,
      bottom: `${-10 + Math.random() * 20}px`,
      size: 1 + Math.random() * 4,
      type: l[L % l.length],
      delay: `${Math.random() * 20}s`,
      duration: `${8 + Math.random() * 18}s`
    }));
  }, []), m = {
    "Postman Law": $.filter((l) => l.brand === "Postman Law").length,
    "Wettermark Keith": $.filter((l) => l.brand === "Wettermark Keith").length
  }, g = $.filter((l) => l.brand === a), b = n ? g : g.filter((l) => !l.archived), f = g.filter((l) => l.archived).length, c = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ], h = Array.from(new Set(b.map((l) => l.month))), w = c.filter((l) => h.includes(l)).reverse(), j = b.reduce(
    (l, v) => (l[v.month] || (l[v.month] = []), l[v.month].push(v), l),
    {}
  ), N = w.filter((l) => {
    var v;
    return ((v = j[l]) == null ? void 0 : v.length) > 0;
  }), D = new Set(b.map((l) => l.market)).size, u = t;
  return /* @__PURE__ */ e.jsx(V.Provider, { value: t, children: /* @__PURE__ */ e.jsxs(
    "div",
    {
      className: `min-h-screen w-full flex flex-col relative overflow-hidden font-sans transition-colors duration-700 ${u ? "bg-[#f5eef8]" : ""}`,
      children: [
        /* @__PURE__ */ e.jsx(
          "div",
          {
            className: `absolute inset-0 pointer-events-none z-0 transition-all duration-700 ${u ? "bg-[radial-gradient(ellipse_at_top,#f8f0fc,#ede4f3,#e0d4ec)]" : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-underworld-800 via-underworld-900 to-black"}`
          }
        ),
        /* @__PURE__ */ e.jsx(
          "div",
          {
            className: `absolute inset-0 pointer-events-none z-[1] ${u ? "library-vignette-light" : "library-vignette"}`
          }
        ),
        /* @__PURE__ */ e.jsx("div", { className: "absolute inset-0 pointer-events-none z-[1] library-fog" }),
        /* @__PURE__ */ e.jsx(
          "div",
          {
            className: `absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none z-0 transition-colors duration-700 ${u ? "bg-purple-300/20" : "bg-megara-primary/5"}`
          }
        ),
        /* @__PURE__ */ e.jsx(
          "div",
          {
            className: `absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-[100px] pointer-events-none z-0 transition-colors duration-700 ${u ? "bg-pink-200/20" : "bg-magic-teal/5"}`
          }
        ),
        /* @__PURE__ */ e.jsx(
          "div",
          {
            className: `absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 rounded-full blur-[80px] pointer-events-none z-0 transition-colors duration-700 ${u ? "bg-amber-200/15" : "bg-magic-gold/3"}`
          }
        ),
        o.map(
          (l) => /* @__PURE__ */ e.jsx(
            "div",
            {
              className: `soul-particle ${l.type}`,
              style: {
                left: l.left,
                bottom: l.bottom,
                width: `${l.size}px`,
                height: `${l.size}px`,
                "--delay": l.delay,
                "--duration": l.duration
              }
            },
            l.id
          )
        ),
        /* @__PURE__ */ e.jsx(
          Re,
          {
            isLightMode: t,
            toggleTheme: () => s(!t),
            brand: a,
            onBrandChange: r,
            brandCounts: m,
            totalInstructions: b.length,
            totalMarkets: D,
            archivedCount: f,
            showArchived: n,
            onToggleArchived: () => d((l) => !l)
          }
        ),
        /* @__PURE__ */ e.jsx(
          Pe,
          {
            instructions: b,
            months: N,
            light: u
          }
        ),
        /* @__PURE__ */ e.jsx("main", { className: "flex-1 overflow-y-auto hide-scrollbar flex flex-col relative z-10", children: /* @__PURE__ */ e.jsxs("div", { className: "px-8 pb-32 flex-1 relative", children: [
          /* @__PURE__ */ e.jsxs(
            "div",
            {
              className: "absolute inset-0 pointer-events-none opacity-[0.06] flex justify-between px-16",
              children: [
                /* @__PURE__ */ e.jsx(
                  "div",
                  {
                    className: `w-20 h-full bg-gradient-to-b ${u ? "from-purple-400/30 via-purple-300/10" : "from-megara-dark/50 via-megara-dark/20"} to-transparent border-x ${u ? "border-purple-300/20" : "border-megara-dark/30"}`
                  }
                ),
                /* @__PURE__ */ e.jsx(
                  "div",
                  {
                    className: `w-20 h-full bg-gradient-to-b ${u ? "from-purple-400/30 via-purple-300/10" : "from-megara-dark/50 via-megara-dark/20"} to-transparent border-x ${u ? "border-purple-300/20" : "border-megara-dark/30"}`
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ e.jsx("div", { className: "max-w-6xl mx-auto relative z-10", children: N.map(
            (l) => /* @__PURE__ */ e.jsx("div", { id: `month-${l}`, children: /* @__PURE__ */ e.jsx(
              Be,
              {
                month: l,
                instructions: j[l],
                onBookClick: i,
                light: u
              }
            ) }, l)
          ) })
        ] }) }),
        /* @__PURE__ */ e.jsx(
          Ge,
          {
            instruction: p,
            onClose: () => i(null),
            light: u
          }
        )
      ]
    }
  ) });
}
export {
  Ue as App,
  V as ThemeContext
};
