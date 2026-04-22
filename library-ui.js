import Oe, { forwardRef as ze, createElement as ee, useState as te, useEffect as ae, useContext as _t, createContext as kt, useMemo as Nt } from "react";
import { motion as O, AnimatePresence as Ct } from "framer-motion";
var re = { exports: {} }, M = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ee;
function Rt() {
  if (Ee) return M;
  Ee = 1;
  var r = Oe, i = Symbol.for("react.element"), n = Symbol.for("react.fragment"), s = Object.prototype.hasOwnProperty, m = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, d = { key: !0, ref: !0, __self: !0, __source: !0 };
  function h(c, l, p) {
    var f, j = {}, T = null, V = null;
    p !== void 0 && (T = "" + p), l.key !== void 0 && (T = "" + l.key), l.ref !== void 0 && (V = l.ref);
    for (f in l) s.call(l, f) && !d.hasOwnProperty(f) && (j[f] = l[f]);
    if (c && c.defaultProps) for (f in l = c.defaultProps, l) j[f] === void 0 && (j[f] = l[f]);
    return { $$typeof: i, type: c, key: T, ref: V, props: j, _owner: m.current };
  }
  return M.Fragment = n, M.jsx = h, M.jsxs = h, M;
}
var D = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Pe;
function Tt() {
  return Pe || (Pe = 1, process.env.NODE_ENV !== "production" && function() {
    var r = Oe, i = Symbol.for("react.element"), n = Symbol.for("react.portal"), s = Symbol.for("react.fragment"), m = Symbol.for("react.strict_mode"), d = Symbol.for("react.profiler"), h = Symbol.for("react.provider"), c = Symbol.for("react.context"), l = Symbol.for("react.forward_ref"), p = Symbol.for("react.suspense"), f = Symbol.for("react.suspense_list"), j = Symbol.for("react.memo"), T = Symbol.for("react.lazy"), V = Symbol.for("react.offscreen"), se = Symbol.iterator, Ve = "@@iterator";
    function Fe(e) {
      if (e === null || typeof e != "object")
        return null;
      var a = se && e[se] || e[Ve];
      return typeof a == "function" ? a : null;
    }
    var P = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    function k(e) {
      {
        for (var a = arguments.length, o = new Array(a > 1 ? a - 1 : 0), u = 1; u < a; u++)
          o[u - 1] = arguments[u];
        We("error", e, o);
      }
    }
    function We(e, a, o) {
      {
        var u = P.ReactDebugCurrentFrame, b = u.getStackAddendum();
        b !== "" && (a += "%s", o = o.concat([b]));
        var v = o.map(function(x) {
          return String(x);
        });
        v.unshift("Warning: " + a), Function.prototype.apply.call(console[e], console, v);
      }
    }
    var Be = !1, Ye = !1, Ue = !1, Ke = !1, qe = !1, oe;
    oe = Symbol.for("react.module.reference");
    function He(e) {
      return !!(typeof e == "string" || typeof e == "function" || e === s || e === d || qe || e === m || e === p || e === f || Ke || e === V || Be || Ye || Ue || typeof e == "object" && e !== null && (e.$$typeof === T || e.$$typeof === j || e.$$typeof === h || e.$$typeof === c || e.$$typeof === l || // This needs to include all possible module reference object
      // types supported by any Flight configuration anywhere since
      // we don't know which Flight build this will end up being used
      // with.
      e.$$typeof === oe || e.getModuleId !== void 0));
    }
    function Ge(e, a, o) {
      var u = e.displayName;
      if (u)
        return u;
      var b = a.displayName || a.name || "";
      return b !== "" ? o + "(" + b + ")" : o;
    }
    function ie(e) {
      return e.displayName || "Context";
    }
    function $(e) {
      if (e == null)
        return null;
      if (typeof e.tag == "number" && k("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof e == "function")
        return e.displayName || e.name || null;
      if (typeof e == "string")
        return e;
      switch (e) {
        case s:
          return "Fragment";
        case n:
          return "Portal";
        case d:
          return "Profiler";
        case m:
          return "StrictMode";
        case p:
          return "Suspense";
        case f:
          return "SuspenseList";
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case c:
            var a = e;
            return ie(a) + ".Consumer";
          case h:
            var o = e;
            return ie(o._context) + ".Provider";
          case l:
            return Ge(e, e.render, "ForwardRef");
          case j:
            var u = e.displayName || null;
            return u !== null ? u : $(e.type) || "Memo";
          case T: {
            var b = e, v = b._payload, x = b._init;
            try {
              return $(x(v));
            } catch {
              return null;
            }
          }
        }
      return null;
    }
    var S = Object.assign, z = 0, le, de, ce, pe, ue, me, ge;
    function xe() {
    }
    xe.__reactDisabledLog = !0;
    function Je() {
      {
        if (z === 0) {
          le = console.log, de = console.info, ce = console.warn, pe = console.error, ue = console.group, me = console.groupCollapsed, ge = console.groupEnd;
          var e = {
            configurable: !0,
            enumerable: !0,
            value: xe,
            writable: !0
          };
          Object.defineProperties(console, {
            info: e,
            log: e,
            warn: e,
            error: e,
            group: e,
            groupCollapsed: e,
            groupEnd: e
          });
        }
        z++;
      }
    }
    function Xe() {
      {
        if (z--, z === 0) {
          var e = {
            configurable: !0,
            enumerable: !0,
            writable: !0
          };
          Object.defineProperties(console, {
            log: S({}, e, {
              value: le
            }),
            info: S({}, e, {
              value: de
            }),
            warn: S({}, e, {
              value: ce
            }),
            error: S({}, e, {
              value: pe
            }),
            group: S({}, e, {
              value: ue
            }),
            groupCollapsed: S({}, e, {
              value: me
            }),
            groupEnd: S({}, e, {
              value: ge
            })
          });
        }
        z < 0 && k("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
      }
    }
    var K = P.ReactCurrentDispatcher, q;
    function F(e, a, o) {
      {
        if (q === void 0)
          try {
            throw Error();
          } catch (b) {
            var u = b.stack.trim().match(/\n( *(at )?)/);
            q = u && u[1] || "";
          }
        return `
` + q + e;
      }
    }
    var H = !1, W;
    {
      var Ze = typeof WeakMap == "function" ? WeakMap : Map;
      W = new Ze();
    }
    function fe(e, a) {
      if (!e || H)
        return "";
      {
        var o = W.get(e);
        if (o !== void 0)
          return o;
      }
      var u;
      H = !0;
      var b = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      var v;
      v = K.current, K.current = null, Je();
      try {
        if (a) {
          var x = function() {
            throw Error();
          };
          if (Object.defineProperty(x.prototype, "props", {
            set: function() {
              throw Error();
            }
          }), typeof Reflect == "object" && Reflect.construct) {
            try {
              Reflect.construct(x, []);
            } catch (C) {
              u = C;
            }
            Reflect.construct(e, [], x);
          } else {
            try {
              x.call();
            } catch (C) {
              u = C;
            }
            e.call(x.prototype);
          }
        } else {
          try {
            throw Error();
          } catch (C) {
            u = C;
          }
          e();
        }
      } catch (C) {
        if (C && u && typeof C.stack == "string") {
          for (var g = C.stack.split(`
`), N = u.stack.split(`
`), y = g.length - 1, w = N.length - 1; y >= 1 && w >= 0 && g[y] !== N[w]; )
            w--;
          for (; y >= 1 && w >= 0; y--, w--)
            if (g[y] !== N[w]) {
              if (y !== 1 || w !== 1)
                do
                  if (y--, w--, w < 0 || g[y] !== N[w]) {
                    var R = `
` + g[y].replace(" at new ", " at ");
                    return e.displayName && R.includes("<anonymous>") && (R = R.replace("<anonymous>", e.displayName)), typeof e == "function" && W.set(e, R), R;
                  }
                while (y >= 1 && w >= 0);
              break;
            }
        }
      } finally {
        H = !1, K.current = v, Xe(), Error.prepareStackTrace = b;
      }
      var A = e ? e.displayName || e.name : "", E = A ? F(A) : "";
      return typeof e == "function" && W.set(e, E), E;
    }
    function Qe(e, a, o) {
      return fe(e, !1);
    }
    function et(e) {
      var a = e.prototype;
      return !!(a && a.isReactComponent);
    }
    function B(e, a, o) {
      if (e == null)
        return "";
      if (typeof e == "function")
        return fe(e, et(e));
      if (typeof e == "string")
        return F(e);
      switch (e) {
        case p:
          return F("Suspense");
        case f:
          return F("SuspenseList");
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case l:
            return Qe(e.render);
          case j:
            return B(e.type, a, o);
          case T: {
            var u = e, b = u._payload, v = u._init;
            try {
              return B(v(b), a, o);
            } catch {
            }
          }
        }
      return "";
    }
    var L = Object.prototype.hasOwnProperty, be = {}, he = P.ReactDebugCurrentFrame;
    function Y(e) {
      if (e) {
        var a = e._owner, o = B(e.type, e._source, a ? a.type : null);
        he.setExtraStackFrame(o);
      } else
        he.setExtraStackFrame(null);
    }
    function tt(e, a, o, u, b) {
      {
        var v = Function.call.bind(L);
        for (var x in e)
          if (v(e, x)) {
            var g = void 0;
            try {
              if (typeof e[x] != "function") {
                var N = Error((u || "React class") + ": " + o + " type `" + x + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof e[x] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                throw N.name = "Invariant Violation", N;
              }
              g = e[x](a, x, u, o, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
            } catch (y) {
              g = y;
            }
            g && !(g instanceof Error) && (Y(b), k("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", u || "React class", o, x, typeof g), Y(null)), g instanceof Error && !(g.message in be) && (be[g.message] = !0, Y(b), k("Failed %s type: %s", o, g.message), Y(null));
          }
      }
    }
    var rt = Array.isArray;
    function G(e) {
      return rt(e);
    }
    function at(e) {
      {
        var a = typeof Symbol == "function" && Symbol.toStringTag, o = a && e[Symbol.toStringTag] || e.constructor.name || "Object";
        return o;
      }
    }
    function nt(e) {
      try {
        return ve(e), !1;
      } catch {
        return !0;
      }
    }
    function ve(e) {
      return "" + e;
    }
    function ye(e) {
      if (nt(e))
        return k("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", at(e)), ve(e);
    }
    var we = P.ReactCurrentOwner, st = {
      key: !0,
      ref: !0,
      __self: !0,
      __source: !0
    }, je, _e;
    function ot(e) {
      if (L.call(e, "ref")) {
        var a = Object.getOwnPropertyDescriptor(e, "ref").get;
        if (a && a.isReactWarning)
          return !1;
      }
      return e.ref !== void 0;
    }
    function it(e) {
      if (L.call(e, "key")) {
        var a = Object.getOwnPropertyDescriptor(e, "key").get;
        if (a && a.isReactWarning)
          return !1;
      }
      return e.key !== void 0;
    }
    function lt(e, a) {
      typeof e.ref == "string" && we.current;
    }
    function dt(e, a) {
      {
        var o = function() {
          je || (je = !0, k("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", a));
        };
        o.isReactWarning = !0, Object.defineProperty(e, "key", {
          get: o,
          configurable: !0
        });
      }
    }
    function ct(e, a) {
      {
        var o = function() {
          _e || (_e = !0, k("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", a));
        };
        o.isReactWarning = !0, Object.defineProperty(e, "ref", {
          get: o,
          configurable: !0
        });
      }
    }
    var pt = function(e, a, o, u, b, v, x) {
      var g = {
        // This tag allows us to uniquely identify this as a React Element
        $$typeof: i,
        // Built-in properties that belong on the element
        type: e,
        key: a,
        ref: o,
        props: x,
        // Record the component responsible for creating this element.
        _owner: v
      };
      return g._store = {}, Object.defineProperty(g._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: !1
      }), Object.defineProperty(g, "_self", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: u
      }), Object.defineProperty(g, "_source", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: b
      }), Object.freeze && (Object.freeze(g.props), Object.freeze(g)), g;
    };
    function ut(e, a, o, u, b) {
      {
        var v, x = {}, g = null, N = null;
        o !== void 0 && (ye(o), g = "" + o), it(a) && (ye(a.key), g = "" + a.key), ot(a) && (N = a.ref, lt(a, b));
        for (v in a)
          L.call(a, v) && !st.hasOwnProperty(v) && (x[v] = a[v]);
        if (e && e.defaultProps) {
          var y = e.defaultProps;
          for (v in y)
            x[v] === void 0 && (x[v] = y[v]);
        }
        if (g || N) {
          var w = typeof e == "function" ? e.displayName || e.name || "Unknown" : e;
          g && dt(x, w), N && ct(x, w);
        }
        return pt(e, g, N, b, u, we.current, x);
      }
    }
    var J = P.ReactCurrentOwner, ke = P.ReactDebugCurrentFrame;
    function I(e) {
      if (e) {
        var a = e._owner, o = B(e.type, e._source, a ? a.type : null);
        ke.setExtraStackFrame(o);
      } else
        ke.setExtraStackFrame(null);
    }
    var X;
    X = !1;
    function Z(e) {
      return typeof e == "object" && e !== null && e.$$typeof === i;
    }
    function Ne() {
      {
        if (J.current) {
          var e = $(J.current.type);
          if (e)
            return `

Check the render method of \`` + e + "`.";
        }
        return "";
      }
    }
    function mt(e) {
      return "";
    }
    var Ce = {};
    function gt(e) {
      {
        var a = Ne();
        if (!a) {
          var o = typeof e == "string" ? e : e.displayName || e.name;
          o && (a = `

Check the top-level render call using <` + o + ">.");
        }
        return a;
      }
    }
    function Re(e, a) {
      {
        if (!e._store || e._store.validated || e.key != null)
          return;
        e._store.validated = !0;
        var o = gt(a);
        if (Ce[o])
          return;
        Ce[o] = !0;
        var u = "";
        e && e._owner && e._owner !== J.current && (u = " It was passed a child from " + $(e._owner.type) + "."), I(e), k('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', o, u), I(null);
      }
    }
    function Te(e, a) {
      {
        if (typeof e != "object")
          return;
        if (G(e))
          for (var o = 0; o < e.length; o++) {
            var u = e[o];
            Z(u) && Re(u, a);
          }
        else if (Z(e))
          e._store && (e._store.validated = !0);
        else if (e) {
          var b = Fe(e);
          if (typeof b == "function" && b !== e.entries)
            for (var v = b.call(e), x; !(x = v.next()).done; )
              Z(x.value) && Re(x.value, a);
        }
      }
    }
    function xt(e) {
      {
        var a = e.type;
        if (a == null || typeof a == "string")
          return;
        var o;
        if (typeof a == "function")
          o = a.propTypes;
        else if (typeof a == "object" && (a.$$typeof === l || // Note: Memo only checks outer props here.
        // Inner props are checked in the reconciler.
        a.$$typeof === j))
          o = a.propTypes;
        else
          return;
        if (o) {
          var u = $(a);
          tt(o, e.props, "prop", u, e);
        } else if (a.PropTypes !== void 0 && !X) {
          X = !0;
          var b = $(a);
          k("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", b || "Unknown");
        }
        typeof a.getDefaultProps == "function" && !a.getDefaultProps.isReactClassApproved && k("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
      }
    }
    function ft(e) {
      {
        for (var a = Object.keys(e.props), o = 0; o < a.length; o++) {
          var u = a[o];
          if (u !== "children" && u !== "key") {
            I(e), k("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", u), I(null);
            break;
          }
        }
        e.ref !== null && (I(e), k("Invalid attribute `ref` supplied to `React.Fragment`."), I(null));
      }
    }
    var $e = {};
    function Se(e, a, o, u, b, v) {
      {
        var x = He(e);
        if (!x) {
          var g = "";
          (e === void 0 || typeof e == "object" && e !== null && Object.keys(e).length === 0) && (g += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
          var N = mt();
          N ? g += N : g += Ne();
          var y;
          e === null ? y = "null" : G(e) ? y = "array" : e !== void 0 && e.$$typeof === i ? (y = "<" + ($(e.type) || "Unknown") + " />", g = " Did you accidentally export a JSX literal instead of a component?") : y = typeof e, k("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", y, g);
        }
        var w = ut(e, a, o, b, v);
        if (w == null)
          return w;
        if (x) {
          var R = a.children;
          if (R !== void 0)
            if (u)
              if (G(R)) {
                for (var A = 0; A < R.length; A++)
                  Te(R[A], e);
                Object.freeze && Object.freeze(R);
              } else
                k("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
            else
              Te(R, e);
        }
        if (L.call(a, "key")) {
          var E = $(e), C = Object.keys(a).filter(function(jt) {
            return jt !== "key";
          }), Q = C.length > 0 ? "{key: someKey, " + C.join(": ..., ") + ": ...}" : "{key: someKey}";
          if (!$e[E + Q]) {
            var wt = C.length > 0 ? "{" + C.join(": ..., ") + ": ...}" : "{}";
            k(`A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`, Q, E, wt, E), $e[E + Q] = !0;
          }
        }
        return e === s ? ft(w) : xt(w), w;
      }
    }
    function bt(e, a, o) {
      return Se(e, a, o, !0);
    }
    function ht(e, a, o) {
      return Se(e, a, o, !1);
    }
    var vt = ht, yt = bt;
    D.Fragment = s, D.jsx = vt, D.jsxs = yt;
  }()), D;
}
process.env.NODE_ENV === "production" ? re.exports = Rt() : re.exports = Tt();
var t = re.exports;
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const $t = (r) => r.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), St = (r) => r.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (i, n, s) => s ? s.toUpperCase() : n.toLowerCase()
), Ie = (r) => {
  const i = St(r);
  return i.charAt(0).toUpperCase() + i.slice(1);
}, Le = (...r) => r.filter((i, n, s) => !!i && i.trim() !== "" && s.indexOf(i) === n).join(" ").trim(), Et = (r) => {
  for (const i in r)
    if (i.startsWith("aria-") || i === "role" || i === "title")
      return !0;
};
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
var Pt = {
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
const It = ze(
  ({
    color: r = "currentColor",
    size: i = 24,
    strokeWidth: n = 2,
    absoluteStrokeWidth: s,
    className: m = "",
    children: d,
    iconNode: h,
    ...c
  }, l) => ee(
    "svg",
    {
      ref: l,
      ...Pt,
      width: i,
      height: i,
      stroke: r,
      strokeWidth: s ? Number(n) * 24 / Number(i) : n,
      className: Le("lucide", m),
      ...!d && !Et(c) && { "aria-hidden": "true" },
      ...c
    },
    [
      ...h.map(([p, f]) => ee(p, f)),
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
const _ = (r, i) => {
  const n = ze(
    ({ className: s, ...m }, d) => ee(It, {
      ref: d,
      iconNode: i,
      className: Le(
        `lucide-${$t(Ie(r))}`,
        `lucide-${r}`,
        s
      ),
      ...m
    })
  );
  return n.displayName = Ie(r), n;
};
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const At = [
  ["rect", { width: "20", height: "5", x: "2", y: "3", rx: "1", key: "1wp1u1" }],
  ["path", { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8", key: "1s80jp" }],
  ["path", { d: "M10 12h4", key: "a56b0p" }]
], Ot = _("archive", At);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const zt = [
  ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0", key: "vwvbt9" }],
  [
    "path",
    {
      d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
      key: "11g9vi"
    }
  ]
], Lt = _("bell", zt);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Mt = [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }]
], Dt = _("calendar", Mt);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Vt = [["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]], Ft = _("chevron-down", Vt);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Wt = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
], Bt = _("copy", Wt);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Yt = [
  ["path", { d: "M12 15V3", key: "m9g1x1" }],
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["path", { d: "m7 10 5 5 5-5", key: "brsn70" }]
], Ut = _("download", Yt);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Kt = [
  [
    "path",
    {
      d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
      key: "1nclc0"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
], qt = _("eye", Kt);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Ht = [
  [
    "path",
    {
      d: "M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 1 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C8 4.5 11 2 12 2Z",
      key: "1ir223"
    }
  ],
  ["path", { d: "m5 22 14-4", key: "1brv4h" }],
  ["path", { d: "m5 18 14 4", key: "lgyyje" }]
], Gt = _("flame-kindling", Ht);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Jt = [
  [
    "path",
    {
      d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
      key: "96xj49"
    }
  ]
], Xt = _("flame", Jt);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Zt = [
  [
    "path",
    {
      d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      key: "1a8usu"
    }
  ]
], Qt = _("pen", Zt);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const er = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
], tr = _("plus", er);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const rr = [
  [
    "path",
    {
      d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",
      key: "143wyd"
    }
  ],
  ["path", { d: "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6", key: "1itne7" }],
  ["rect", { x: "6", y: "14", width: "12", height: "8", rx: "1", key: "1ue0tg" }]
], ar = _("printer", rr);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const nr = [
  ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }]
], sr = _("search", nr);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const or = [
  [
    "path",
    {
      d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
      key: "1ffxy3"
    }
  ],
  ["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }]
], ir = _("send", or);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const lr = [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
], dr = _("trash-2", lr);
/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const cr = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
], pr = _("x", cr);
function ur({
  isLightMode: r,
  toggleTheme: i
}) {
  const n = [
    "I remember every version. Every mistake.",
    "Everything you've ever sent. Archived. By me. Obviously.",
    "People do crazy things... like forgetting to send traffic.",
    "It's all Greek to them. But not to me.",
    `I don't do "lost files." Try someone else.`,
    "Megara doesn't forget. Megara doesn't forgive late sends."
  ], [s, m] = te(0), d = r;
  return ae(() => {
    const h = setInterval(() => {
      m((c) => (c + 1) % n.length);
    }, 8e3);
    return () => clearInterval(h);
  }, []), /* @__PURE__ */ t.jsxs("header", { className: "w-full py-6 px-8 flex flex-col gap-5 relative z-10", children: [
    /* @__PURE__ */ t.jsx(
      "div",
      {
        className: `absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent ${d ? "via-purple-400/30" : "via-magic-gold/30"} to-transparent`
      }
    ),
    /* @__PURE__ */ t.jsxs("div", { className: "flex justify-between items-start", children: [
      /* @__PURE__ */ t.jsxs("div", { className: "flex items-end gap-5", children: [
        /* @__PURE__ */ t.jsxs("div", { className: "hidden lg:flex items-center gap-2 mb-2 opacity-40", children: [
          /* @__PURE__ */ t.jsx(
            "div",
            {
              className: `w-8 h-px ${d ? "bg-purple-600" : "bg-magic-gold"}`
            }
          ),
          /* @__PURE__ */ t.jsx(
            "div",
            {
              className: `w-2 h-2 rotate-45 border ${d ? "border-purple-600" : "border-magic-gold"}`
            }
          ),
          /* @__PURE__ */ t.jsx(
            "div",
            {
              className: `w-4 h-px ${d ? "bg-purple-600" : "bg-magic-gold"}`
            }
          )
        ] }),
        /* @__PURE__ */ t.jsx(
          "h1",
          {
            className: `font-serif font-bold text-4xl tracking-wide ${d ? "text-purple-800 drop-shadow-sm" : "title-shimmer"}`,
            children: "Traffic Library"
          }
        ),
        /* @__PURE__ */ t.jsxs(
          "p",
          {
            className: `font-serif italic text-base mb-1 transition-opacity duration-1000 ${d ? "text-purple-600/70" : "text-megara-light/60"}`,
            children: [
              '"',
              n[s],
              '"'
            ]
          },
          s
        )
      ] }),
      /* @__PURE__ */ t.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ t.jsxs(
          "button",
          {
            className: `px-4 py-2 rounded border transition-all text-sm flex items-center gap-2 ${d ? "border-purple-300 text-purple-700 hover:bg-purple-100" : "border-megara-dark/40 text-megara-light/70 hover:bg-megara-dark/20 hover:text-megara-light"}`,
            children: [
              /* @__PURE__ */ t.jsx(Ut, { size: 16 }),
              " Export CSV"
            ]
          }
        ),
        /* @__PURE__ */ t.jsxs(
          "button",
          {
            className: `px-4 py-2 rounded border transition-all text-sm flex items-center gap-2 ${d ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100" : "bg-magic-gold/10 border-magic-gold/40 text-magic-gold hover:bg-magic-gold/20 hover:shadow-glow-gold"}`,
            children: [
              /* @__PURE__ */ t.jsx(Lt, { size: 16 }),
              " Send Reminders"
            ]
          }
        ),
        /* @__PURE__ */ t.jsxs(
          "button",
          {
            className: `px-4 py-2 rounded border transition-all text-sm flex items-center gap-2 ${d ? "bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200" : "bg-megara-primary/20 border-megara-primary/50 text-megara-light hover:bg-megara-primary/30 hover:shadow-glow-purple"}`,
            children: [
              /* @__PURE__ */ t.jsx(tr, { size: 16 }),
              " Import"
            ]
          }
        ),
        /* @__PURE__ */ t.jsxs(
          "button",
          {
            onClick: i,
            className: `ml-3 p-2.5 rounded-full transition-all relative group ${d ? "text-amber-600 hover:bg-amber-100 hover:shadow-[0_0_20px_4px_rgba(217,119,6,0.2)]" : "text-magic-gold hover:bg-white/10 hover:shadow-[0_0_20px_4px_rgba(255,215,0,0.3)]"}`,
            title: "Toggle Illumination",
            children: [
              r ? /* @__PURE__ */ t.jsx(Gt, { size: 22 }) : /* @__PURE__ */ t.jsx(Xt, { size: 22 }),
              /* @__PURE__ */ t.jsx(
                "div",
                {
                  className: `absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity ${d ? "bg-amber-400/20" : "bg-magic-gold/10"}`
                }
              )
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ t.jsxs(
      "div",
      {
        className: `font-serif text-xs flex gap-2 tracking-wider uppercase ${d ? "text-purple-500/60" : "text-megara-light/40"}`,
        children: [
          /* @__PURE__ */ t.jsx("span", { children: "91 instructions" }),
          " · ",
          /* @__PURE__ */ t.jsx("span", { children: "2 brands" }),
          " ·",
          " ",
          /* @__PURE__ */ t.jsx("span", { children: "11 markets" })
        ]
      }
    ),
    /* @__PURE__ */ t.jsx("div", { className: "flex gap-4 items-center", children: /* @__PURE__ */ t.jsxs(
      "div",
      {
        className: `flex rounded-t-lg border-b overflow-hidden backdrop-blur-sm ${d ? "bg-white/60 border-purple-200" : "bg-underworld-800/60 border-megara-dark/40"}`,
        children: [
          /* @__PURE__ */ t.jsxs(
            "button",
            {
              className: `font-serif px-6 py-3 font-medium text-sm border-b-2 ${d ? "text-purple-800 border-purple-600 bg-purple-50" : "text-megara-light border-magic-gold bg-magic-gold/5"}`,
              children: [
                "Postman Law ",
                /* @__PURE__ */ t.jsx("span", { className: "text-xs opacity-50 ml-1", children: "(55)" })
              ]
            }
          ),
          /* @__PURE__ */ t.jsxs(
            "button",
            {
              className: `font-serif px-6 py-3 font-medium text-sm transition-colors ${d ? "text-purple-400 hover:text-purple-600 hover:bg-purple-50/50" : "text-megara-light/40 hover:text-megara-light/70 hover:bg-white/5"}`,
              children: [
                "Wettermark Keith",
                " ",
                /* @__PURE__ */ t.jsx("span", { className: "text-xs opacity-40 ml-1", children: "(36)" })
              ]
            }
          )
        ]
      }
    ) }),
    /* @__PURE__ */ t.jsxs("div", { className: "flex gap-4 items-center w-full", children: [
      /* @__PURE__ */ t.jsxs("div", { className: "relative flex-1 group", children: [
        /* @__PURE__ */ t.jsx(
          sr,
          {
            className: `absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${d ? "text-purple-400 group-focus-within:text-purple-600" : "text-magic-teal/50 group-focus-within:text-magic-teal"}`,
            size: 18
          }
        ),
        /* @__PURE__ */ t.jsx(
          "input",
          {
            type: "text",
            placeholder: "Search the archives — ISCIs, markets, buyers, incantations...",
            className: `w-full rounded-lg py-3 pl-12 pr-4 focus:outline-none transition-all backdrop-blur-sm ${d ? "bg-white/70 border border-purple-200 text-purple-900 placeholder:text-purple-400/50 focus:border-purple-400 focus:shadow-[0_0_15px_2px_rgba(147,51,234,0.1)]" : "bg-underworld-800/40 border border-megara-dark/25 text-megara-light placeholder:text-megara-light/30 focus:border-magic-teal/50 focus:shadow-[0_0_20px_2px_rgba(0,206,209,0.1)]"}`
          }
        ),
        /* @__PURE__ */ t.jsx(
          "div",
          {
            className: `absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity ${d ? "via-purple-400/30" : "via-magic-teal/20"}`
          }
        )
      ] }),
      /* @__PURE__ */ t.jsxs(
        "div",
        {
          className: `flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm backdrop-blur-sm ${d ? "border-purple-200 bg-white/60" : "border-megara-dark/25 bg-underworld-800/40"}`,
          children: [
            /* @__PURE__ */ t.jsx(
              Ot,
              {
                size: 16,
                className: d ? "text-amber-600/70" : "text-magic-gold/70"
              }
            ),
            /* @__PURE__ */ t.jsx(
              "span",
              {
                className: `text-xs ${d ? "text-purple-600/60" : "text-megara-light/60"}`,
                children: "30 archived"
              }
            ),
            /* @__PURE__ */ t.jsx("span", { className: d ? "text-purple-300" : "text-megara-light/20", children: "|" }),
            /* @__PURE__ */ t.jsx(
              "span",
              {
                className: `text-xs ${d ? "text-purple-600/60" : "text-megara-light/60"}`,
                children: "25 shown"
              }
            )
          ]
        }
      )
    ] }),
    /* @__PURE__ */ t.jsx(
      "div",
      {
        className: `absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent ${d ? "via-purple-300/30" : "via-megara-dark/30"} to-transparent`
      }
    )
  ] });
}
const mr = {
  April: "001.04",
  March: "001.03",
  December: "001.12"
};
function gr({
  instructions: r,
  months: i,
  light: n = !1
}) {
  const s = (m) => {
    const d = document.getElementById(`month-${m}`);
    d && d.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };
  return /* @__PURE__ */ t.jsx("div", { className: "relative z-10 px-8 pb-6", children: /* @__PURE__ */ t.jsx("div", { className: "flex gap-3 flex-wrap", children: i.map((m, d) => {
    const h = r.filter(
      (c) => c.month === m
    ).length;
    return /* @__PURE__ */ t.jsxs(
      O.button,
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
        onClick: () => s(m),
        className: `relative group flex flex-col w-32 rounded-t-sm rounded-b-md overflow-hidden transition-all ${n ? "bg-white/70 border border-purple-200 hover:border-purple-400 hover:bg-white hover:shadow-[0_0_15px_rgba(147,51,234,0.15)]" : "bg-underworld-800/80 border border-megara-dark/30 hover:border-magic-teal/40 hover:bg-underworld-700/50 hover:shadow-glow-teal"}`,
        children: [
          /* @__PURE__ */ t.jsx(
            "div",
            {
              className: `h-1.5 w-full transition-colors ${n ? "bg-purple-300/50 group-hover:bg-purple-400/70" : "bg-magic-teal/30 group-hover:bg-magic-teal/60"}`
            }
          ),
          /* @__PURE__ */ t.jsxs("div", { className: "px-3 py-2.5 flex flex-col gap-1.5", children: [
            /* @__PURE__ */ t.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ t.jsx(
                "span",
                {
                  className: `font-mono text-[10px] font-bold tracking-wider ${n ? "text-purple-400 group-hover:text-purple-600" : "text-magic-teal/40 group-hover:text-magic-teal/70"}`,
                  children: mr[m] || "001"
                }
              ),
              /* @__PURE__ */ t.jsx(
                Dt,
                {
                  size: 14,
                  className: `transition-colors ${n ? "text-purple-300 group-hover:text-purple-500" : "text-magic-teal/30 group-hover:text-magic-teal/60"}`
                }
              )
            ] }),
            /* @__PURE__ */ t.jsx(
              "span",
              {
                className: `font-serif text-sm font-medium text-left transition-colors ${n ? "text-purple-700/70 group-hover:text-purple-800" : "text-megara-light/60 group-hover:text-megara-light/80"}`,
                children: m
              }
            ),
            /* @__PURE__ */ t.jsxs(
              "span",
              {
                className: `text-[10px] font-mono ${n ? "text-purple-400/50" : "text-megara-light/25"}`,
                children: [
                  h,
                  " ",
                  h === 1 ? "scroll" : "scrolls"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ t.jsx(
            "div",
            {
              className: `absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent ${n ? "via-purple-200/40" : "via-megara-dark/20"}`
            }
          )
        ]
      },
      m
    );
  }) }) });
}
const xr = [
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
], U = () => typeof window < "u" && window.MegaraLibraryData ? window.MegaraLibraryData : xr, Ae = new Proxy([], {
  get(r, i) {
    const n = U(), s = n[i];
    return typeof s == "function" ? s.bind(n) : s;
  },
  has(r, i) {
    return i in U();
  },
  ownKeys() {
    return Reflect.ownKeys(U());
  },
  getOwnPropertyDescriptor(r, i) {
    return Object.getOwnPropertyDescriptor(U(), i);
  }
}), Me = {
  Chicago: "text-market-chicago",
  Cincinnati: "text-market-cincinnati",
  Denver: "text-market-denver",
  Minneapolis: "text-market-minneapolis"
}, fr = {
  Chicago: "bg-market-chicago",
  Cincinnati: "bg-market-cincinnati",
  Denver: "bg-market-denver",
  Minneapolis: "bg-market-minneapolis"
};
function br({ instruction: r, onClick: i }) {
  const n = _t(De), s = r.status === "sent", m = parseInt(r.iscis) || 5, d = m > 8 ? "h-48" : m > 5 ? "h-44" : "h-40", h = {
    TV: "from-[#2a1540] to-[#1a0d2e]",
    Radio: "from-[#1a2040] to-[#0d1530]",
    "Streaming Audio": "from-[#1a3030] to-[#0d2020]",
    Cable: "from-[#2a1a30] to-[#1a1020]",
    OOH: "from-[#2a2a1a] to-[#1a1a0d]"
  }, c = {
    TV: "from-[#e8daf0] to-[#d4c0e0]",
    Radio: "from-[#d5dff0] to-[#c0cfe0]",
    "Streaming Audio": "from-[#d0e8e8] to-[#bcd8d8]",
    Cable: "from-[#e0d5e8] to-[#d0c0d8]",
    OOH: "from-[#e8e5d0] to-[#d8d5c0]"
  }, l = n ? c[r.mediaType] || c.TV : h[r.mediaType] || h.TV;
  return /* @__PURE__ */ t.jsxs(
    O.div,
    {
      whileHover: {
        y: -14,
        scale: 1.04
      },
      whileTap: {
        scale: 0.98
      },
      onClick: i,
      className: `
        relative w-14 ${d} cursor-pointer group
        rounded-l-sm rounded-r-md
        flex flex-col items-center justify-between py-3
        bg-gradient-to-b ${l}
        ${n ? "" : s ? "book-glow-sent" : "book-glow-pending"}
        ${n ? "shadow-[2px_2px_8px_rgba(0,0,0,0.1),-1px_0_3px_rgba(0,0,0,0.05)]" : ""}
      `,
      style: n ? {} : void 0,
      children: [
        /* @__PURE__ */ t.jsx(
          "div",
          {
            className: `absolute inset-0 rounded-l-sm rounded-r-md ${n ? "opacity-10" : "opacity-20"} bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]`
          }
        ),
        /* @__PURE__ */ t.jsx(
          "div",
          {
            className: `absolute left-1 top-4 bottom-4 w-px ${n ? "bg-black/10" : "bg-white/10"}`
          }
        ),
        /* @__PURE__ */ t.jsx(
          "div",
          {
            className: `absolute right-1.5 top-4 bottom-4 w-px ${n ? "bg-black/5" : "bg-black/30"}`
          }
        ),
        /* @__PURE__ */ t.jsx(
          "div",
          {
            className: `w-10 h-0.5 rounded-full mb-1 relative z-10 ${n ? "bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" : "bg-gradient-to-r from-transparent via-magic-gold/40 to-transparent"}`
          }
        ),
        /* @__PURE__ */ t.jsx(
          "div",
          {
            className: `w-full h-3 ${fr[r.market]} opacity-90 shadow-inner relative z-10`,
            children: /* @__PURE__ */ t.jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" })
          }
        ),
        /* @__PURE__ */ t.jsx("div", { className: "flex-1 flex items-center justify-center writing-vertical-rl text-orientation-mixed rotate-180 relative z-10", children: /* @__PURE__ */ t.jsx(
          "span",
          {
            className: `font-serif text-[10px] font-bold tracking-[0.2em] whitespace-nowrap ${n ? "text-purple-900/80" : "text-megara-light/90"}`,
            children: r.market.toUpperCase()
          }
        ) }),
        s ? /* @__PURE__ */ t.jsx(
          "div",
          {
            className: `w-2.5 h-2.5 rounded-full mt-2 mb-1 relative z-10 ${n ? "bg-green-500 shadow-[0_0_6px_1px_rgba(34,197,94,0.4)]" : "bg-magic-teal shadow-[0_0_8px_2px_rgba(0,206,209,0.5)]"}`,
            children: /* @__PURE__ */ t.jsx("div", { className: "absolute inset-0.5 rounded-full bg-white/30" })
          }
        ) : /* @__PURE__ */ t.jsx(
          "div",
          {
            className: `w-2.5 h-2.5 rounded-full mt-2 mb-1 relative z-10 ${n ? "bg-purple-400 shadow-[0_0_4px_1px_rgba(147,51,234,0.3)]" : "bg-megara-primary/60 shadow-[0_0_6px_1px_rgba(200,80,192,0.3)]"}`,
            children: /* @__PURE__ */ t.jsx("div", { className: "absolute inset-0.5 rounded-full bg-white/20" })
          }
        ),
        /* @__PURE__ */ t.jsx(
          "div",
          {
            className: `w-10 h-0.5 rounded-full mt-1 relative z-10 ${n ? "bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" : "bg-gradient-to-r from-transparent via-magic-gold/30 to-transparent"}`
          }
        ),
        /* @__PURE__ */ t.jsx(
          "div",
          {
            className: "absolute inset-0 rounded-l-sm rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
            style: {
              boxShadow: n ? s ? "0 0 20px 4px rgba(34,197,94,0.2)" : "0 0 18px 3px rgba(147,51,234,0.2)" : s ? "0 0 25px 5px rgba(0,206,209,0.3), inset 0 0 15px rgba(0,206,209,0.1)" : "0 0 20px 4px rgba(200,80,192,0.25), inset 0 0 12px rgba(200,80,192,0.1)"
            }
          }
        ),
        /* @__PURE__ */ t.jsxs(
          "div",
          {
            className: `absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max px-4 py-2.5 rounded-lg text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 backdrop-blur-sm ${n ? "bg-white/95 border border-purple-200 text-purple-900 shadow-lg" : "bg-underworld-900/95 border border-megara-primary/30 text-megara-light shadow-[0_0_20px_rgba(200,80,192,0.2)]"}`,
            children: [
              /* @__PURE__ */ t.jsx(
                "div",
                {
                  className: `font-bold text-sm ${Me[r.market]}`,
                  children: r.market
                }
              ),
              /* @__PURE__ */ t.jsxs(
                "div",
                {
                  className: `mt-0.5 ${n ? "text-purple-600/60" : "text-megara-light/60"}`,
                  children: [
                    "Est: ",
                    r.estimate
                  ]
                }
              ),
              /* @__PURE__ */ t.jsxs(
                "div",
                {
                  className: `mt-0.5 ${n ? "text-purple-500/50" : "text-megara-light/40"}`,
                  children: [
                    r.iscis,
                    " · ",
                    r.dateRange
                  ]
                }
              ),
              /* @__PURE__ */ t.jsx(
                "div",
                {
                  className: `mt-1 text-[10px] font-medium ${s ? n ? "text-green-600" : "text-magic-teal" : n ? "text-purple-500" : "text-megara-primary/70"}`,
                  children: r.status.toUpperCase()
                }
              )
            ]
          }
        )
      ]
    }
  );
}
function hr({
  month: r,
  instructions: i,
  onBookClick: n,
  light: s = !1
}) {
  if (i.length === 0) return null;
  const m = i.reduce(
    (c, l) => (c[l.mediaType] || (c[l.mediaType] = []), c[l.mediaType].push(l), c),
    {}
  ), h = [
    "TV",
    "Radio",
    "Streaming Audio",
    "Cable",
    "OOH"
  ].filter((c) => {
    var l;
    return ((l = m[c]) == null ? void 0 : l.length) > 0;
  });
  return /* @__PURE__ */ t.jsxs(
    O.div,
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
        /* @__PURE__ */ t.jsxs("div", { className: "flex items-center gap-4 mb-8 px-4", children: [
          /* @__PURE__ */ t.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ t.jsx(
              "div",
              {
                className: `w-2 h-2 rotate-45 ${s ? "bg-purple-500/60" : "bg-magic-gold/60"}`
              }
            ),
            /* @__PURE__ */ t.jsx(
              "div",
              {
                className: `w-6 h-px ${s ? "bg-purple-400/40" : "bg-magic-gold/40"}`
              }
            )
          ] }),
          /* @__PURE__ */ t.jsx(
            "h2",
            {
              className: `font-serif font-bold text-3xl ${s ? "text-purple-800 drop-shadow-sm" : "text-magic-gold drop-shadow-[0_0_12px_rgba(255,215,0,0.3)]"}`,
              children: r
            }
          ),
          /* @__PURE__ */ t.jsxs(
            "span",
            {
              className: `font-serif text-xs tracking-wider uppercase ${s ? "text-purple-500/50" : "text-megara-light/40"}`,
              children: [
                "(",
                i.length,
                " ",
                i.length === 1 ? "instruction" : "instructions",
                ")"
              ]
            }
          ),
          /* @__PURE__ */ t.jsx(
            "div",
            {
              className: `flex-1 h-px bg-gradient-to-r ${s ? "from-purple-400/30 via-purple-300/10" : "from-magic-gold/30 via-magic-gold/10"} to-transparent`
            }
          ),
          /* @__PURE__ */ t.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ t.jsx(
              "div",
              {
                className: `w-6 h-px ${s ? "bg-purple-300/20" : "bg-magic-gold/20"}`
              }
            ),
            /* @__PURE__ */ t.jsx(
              "div",
              {
                className: `w-1.5 h-1.5 rotate-45 ${s ? "bg-purple-400/30" : "bg-magic-gold/30"}`
              }
            )
          ] })
        ] }),
        h.map((c, l) => {
          const p = m[c], f = new Set(p.map((j) => j.market)).size;
          return /* @__PURE__ */ t.jsxs(
            O.div,
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
                delay: l * 0.1,
                duration: 0.4
              },
              className: "mb-12 relative",
              children: [
                /* @__PURE__ */ t.jsxs(
                  "div",
                  {
                    className: `absolute -top-5 left-8 border px-5 py-1.5 rounded z-10 ${s ? "bg-gradient-to-b from-purple-200 to-purple-300 border-purple-300/60 shadow-md" : "brass-plate border-yellow-500/50 shadow-[0_2px_10px_rgba(218,165,32,0.3)]"}`,
                    children: [
                      /* @__PURE__ */ t.jsxs(
                        "h3",
                        {
                          className: `font-serif text-xs font-bold tracking-widest uppercase drop-shadow-md ${s ? "text-purple-800" : "text-yellow-100"}`,
                          children: [
                            c,
                            /* @__PURE__ */ t.jsxs(
                              "span",
                              {
                                className: `opacity-50 normal-case ml-2 font-sans text-[10px] ${s ? "text-purple-600" : ""}`,
                                children: [
                                  f,
                                  " ",
                                  f === 1 ? "market" : "markets"
                                ]
                              }
                            )
                          ]
                        }
                      ),
                      /* @__PURE__ */ t.jsx(
                        "div",
                        {
                          className: `absolute top-1/2 -translate-y-1/2 left-1.5 w-2 h-2 rounded-full border shadow-inner ${s ? "bg-gradient-to-br from-purple-200 to-purple-400 border-purple-400/50" : "bg-gradient-to-br from-yellow-300 to-yellow-700 border-yellow-600/50"}`
                        }
                      ),
                      /* @__PURE__ */ t.jsx(
                        "div",
                        {
                          className: `absolute top-1/2 -translate-y-1/2 right-1.5 w-2 h-2 rounded-full border shadow-inner ${s ? "bg-gradient-to-br from-purple-200 to-purple-400 border-purple-400/50" : "bg-gradient-to-br from-yellow-300 to-yellow-700 border-yellow-600/50"}`
                        }
                      )
                    ]
                  }
                ),
                /* @__PURE__ */ t.jsx(
                  "div",
                  {
                    className: `absolute inset-x-0 top-4 bottom-7 rounded-t-sm ${s ? "bg-gradient-to-b from-purple-100/40 to-white/20 border-t border-purple-200/30" : "bg-gradient-to-b from-underworld-900/80 to-underworld-800/40 border-t border-megara-dark/10"}`
                  }
                ),
                /* @__PURE__ */ t.jsx("div", { className: "flex items-end gap-1 px-12 pt-10 pb-1 min-h-[210px] relative z-10 overflow-x-auto hide-scrollbar", children: p.map(
                  (j, T) => /* @__PURE__ */ t.jsx(
                    O.div,
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
                        delay: l * 0.1 + T * 0.03
                      },
                      children: /* @__PURE__ */ t.jsx(
                        br,
                        {
                          instruction: j,
                          onClick: () => n(j)
                        }
                      )
                    },
                    j.id
                  )
                ) }),
                /* @__PURE__ */ t.jsxs("div", { className: "shelf-wood h-8 w-full rounded-sm relative z-0", children: [
                  /* @__PURE__ */ t.jsx(
                    "div",
                    {
                      className: `absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent ${s ? "via-purple-300/30" : "via-megara-dark/40"}`
                    }
                  ),
                  /* @__PURE__ */ t.jsx("div", { className: "absolute top-full left-4 right-4 h-12 bg-black/20 blur-md rounded-[100%]" })
                ] }),
                /* @__PURE__ */ t.jsx(
                  "div",
                  {
                    className: `absolute -bottom-4 left-1/4 right-1/4 h-8 blur-xl rounded-full shelf-ambient pointer-events-none ${s ? "bg-purple-400/5" : "bg-magic-teal/5"}`
                  }
                )
              ]
            },
            c
          );
        })
      ]
    }
  );
}
const ne = () => new (window.AudioContext || window.webkitAudioContext)();
function vr() {
  try {
    const r = ne(), i = r.currentTime;
    [880, 1320].forEach((d, h) => {
      const c = r.createOscillator();
      c.type = "sine", c.frequency.value = d;
      const l = r.createGain(), p = i + h * 0.06;
      l.gain.setValueAtTime(0, p), l.gain.linearRampToValueAtTime(0.07, p + 0.01), l.gain.exponentialRampToValueAtTime(1e-3, p + 0.8), c.connect(l), l.connect(r.destination), c.start(p), c.stop(p + 0.8);
    });
    const s = r.createOscillator();
    s.type = "sine", s.frequency.value = 2640;
    const m = r.createGain();
    m.gain.setValueAtTime(0, i + 0.1), m.gain.linearRampToValueAtTime(0.025, i + 0.12), m.gain.exponentialRampToValueAtTime(1e-3, i + 0.5), s.connect(m), m.connect(r.destination), s.start(i + 0.1), s.stop(i + 0.5), setTimeout(() => r.close(), 1200);
  } catch {
  }
}
function yr() {
  try {
    const r = ne(), i = r.currentTime, n = r.createOscillator();
    n.type = "sine", n.frequency.setValueAtTime(440, i), n.frequency.exponentialRampToValueAtTime(220, i + 0.08);
    const s = r.createGain();
    s.gain.setValueAtTime(0.06, i), s.gain.exponentialRampToValueAtTime(1e-3, i + 0.1), n.connect(s), s.connect(r.destination), n.start(i), n.stop(i + 0.1), setTimeout(() => r.close(), 300);
  } catch {
  }
}
function wr() {
  try {
    const r = ne(), i = r.currentTime;
    [1047, 1319, 1568, 2093].forEach((h, c) => {
      const l = r.createOscillator();
      l.type = "sine", l.frequency.value = h;
      const p = r.createGain(), f = i + c * 0.1;
      p.gain.setValueAtTime(0, f), p.gain.linearRampToValueAtTime(0.06, f + 0.01), p.gain.exponentialRampToValueAtTime(1e-3, f + 0.6), l.connect(p), p.connect(r.destination), l.start(f), l.stop(f + 0.6);
    });
    const s = r.createOscillator();
    s.type = "sine", s.frequency.value = 3136;
    const m = r.createGain(), d = i + 0.4;
    m.gain.setValueAtTime(0, d), m.gain.linearRampToValueAtTime(0.04, d + 0.01), m.gain.exponentialRampToValueAtTime(1e-3, d + 0.5), s.connect(m), m.connect(r.destination), s.start(d), s.stop(d + 0.5), setTimeout(() => r.close(), 1500);
  } catch {
  }
}
function jr(r) {
  const i = r.market, n = i === "Chicago" ? "CHI" : i === "Cincinnati" ? "CIN" : i === "Denver" ? "DEN" : "MSP", s = r.brand === "Postman Law" ? "PL" : "WK";
  if (r.mediaType === "OOH")
    return [
      {
        dates: r.dateRange,
        code: `${n}${s}OOH001 - Billboard_Main`,
        length: "Static",
        pct: "34%",
        notes: "All Week"
      },
      {
        dates: r.dateRange,
        code: `${n}${s}OOH002 - Digital_Board`,
        length: "Digital",
        pct: "33%",
        notes: "All Week"
      },
      {
        dates: r.dateRange,
        code: `${n}${s}OOH003 - Transit_Shelter`,
        length: "Static",
        pct: "33%",
        notes: "All Week"
      }
    ];
  const d = r.mediaType === "TV" || r.mediaType === "Cable" ? "T" : r.mediaType === "Radio" ? "R" : "S", h = [
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
  ], c = parseInt(r.iscis) || 8;
  return h.slice(0, c).map((l, p) => ({
    dates: r.dateRange,
    code: `${n}${s}${266e4 + p}${d} - ${l.name}`,
    length: l.length,
    pct: l.pct,
    notes: l.length === ":15" ? ":15 A" : "All Week"
  }));
}
function _r({
  instruction: r,
  onClose: i,
  light: n = !1
}) {
  if (ae(() => {
    r && vr();
  }, [r]), !r) return null;
  const s = jr(r), m = r.market === "Chicago" ? "CHI" : r.market === "Cincinnati" ? "CIN" : r.market === "Denver" ? "DEN" : "MSP", d = () => {
    yr(), i();
  }, h = () => {
    wr();
  };
  return /* @__PURE__ */ t.jsx(Ct, { children: /* @__PURE__ */ t.jsx(
    "div",
    {
      className: `fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-6 ${n ? "bg-black/40" : "bg-black/70"}`,
      onClick: d,
      children: /* @__PURE__ */ t.jsxs(
        O.div,
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
          className: `w-full max-w-6xl h-[85vh] flex rounded-lg overflow-hidden ${n ? "shadow-[0_0_40px_rgba(147,51,234,0.1),0_25px_50px_rgba(0,0,0,0.2)]" : "shadow-[0_0_60px_rgba(200,80,192,0.15),0_25px_50px_rgba(0,0,0,0.5)]"}`,
          onClick: (c) => c.stopPropagation(),
          children: [
            /* @__PURE__ */ t.jsxs("div", { className: "flex-1 bg-white overflow-y-auto relative", children: [
              /* @__PURE__ */ t.jsx("div", { className: "absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-gray-300 to-transparent z-10 pointer-events-none" }),
              /* @__PURE__ */ t.jsxs("div", { className: "px-10 pt-8 pb-8", children: [
                /* @__PURE__ */ t.jsx("div", { className: "text-center mb-6", children: /* @__PURE__ */ t.jsx("div", { className: "inline-block border-2 border-gray-800 px-5 py-1.5", children: /* @__PURE__ */ t.jsx("span", { className: "font-bold text-gray-900 tracking-wider text-lg uppercase", children: r.brand.toUpperCase() }) }) }),
                /* @__PURE__ */ t.jsxs("div", { className: "grid grid-cols-[140px_1fr] gap-y-2.5 text-sm max-w-2xl mb-8", children: [
                  /* @__PURE__ */ t.jsx("span", { className: "font-bold text-gray-700", children: "Agency:" }),
                  /* @__PURE__ */ t.jsx("span", { className: "text-gray-900", children: "Blackacre Services" }),
                  /* @__PURE__ */ t.jsx("span", { className: "font-bold text-gray-700", children: "Client:" }),
                  /* @__PURE__ */ t.jsx("span", { className: "text-purple-600 font-medium", children: r.brand }),
                  /* @__PURE__ */ t.jsx("span", { className: "font-bold text-gray-700", children: "Market:" }),
                  /* @__PURE__ */ t.jsxs("span", { className: "text-gray-900 font-medium", children: [
                    r.market,
                    " (",
                    m,
                    ")"
                  ] }),
                  /* @__PURE__ */ t.jsx("span", { className: "font-bold text-gray-700", children: "Buyer:" }),
                  /* @__PURE__ */ t.jsx("span", { className: "text-purple-600 font-medium", children: r.buyer }),
                  /* @__PURE__ */ t.jsx("span", { className: "font-bold text-gray-700", children: "Media:" }),
                  /* @__PURE__ */ t.jsx("span", { className: "text-green-600 font-medium", children: r.mediaType }),
                  /* @__PURE__ */ t.jsx("span", { className: "font-bold text-gray-700", children: "Broadcast Month:" }),
                  /* @__PURE__ */ t.jsx("span", { className: "text-red-500 font-medium", children: r.month }),
                  /* @__PURE__ */ t.jsx("span", { className: "font-bold text-gray-700", children: "Flight Dates:" }),
                  /* @__PURE__ */ t.jsx("span", { className: "text-gray-900 font-medium", children: r.dateRange }),
                  /* @__PURE__ */ t.jsx("span", { className: "font-bold text-gray-700", children: "Version / Links:" }),
                  /* @__PURE__ */ t.jsxs("span", { className: "text-gray-900", children: [
                    "Version 1 / ",
                    m,
                    " Assets"
                  ] }),
                  /* @__PURE__ */ t.jsx("span", { className: "font-bold text-gray-700", children: "Comments:" }),
                  /* @__PURE__ */ t.jsx("span", { className: "text-gray-600 text-xs leading-relaxed", children: "If you buy has no bookends, run as standalones, if you have stand alones run Legal Firepower :15" })
                ] }),
                /* @__PURE__ */ t.jsxs("table", { className: "w-full text-sm", children: [
                  /* @__PURE__ */ t.jsx("thead", { children: /* @__PURE__ */ t.jsxs("tr", { className: "border-b-2 border-gray-300", children: [
                    /* @__PURE__ */ t.jsx("th", { className: "text-left py-2.5 px-3 text-gray-500 font-semibold uppercase text-[10px] tracking-wider w-24", children: "Flight Dates" }),
                    /* @__PURE__ */ t.jsx("th", { className: "text-left py-2.5 px-3 text-gray-500 font-semibold uppercase text-[10px] tracking-wider", children: "ISCI Codes & Title" }),
                    /* @__PURE__ */ t.jsx("th", { className: "text-left py-2.5 px-3 text-gray-500 font-semibold uppercase text-[10px] tracking-wider w-16", children: "Length" }),
                    /* @__PURE__ */ t.jsx("th", { className: "text-left py-2.5 px-3 text-gray-500 font-semibold uppercase text-[10px] tracking-wider w-12", children: "%" }),
                    /* @__PURE__ */ t.jsx("th", { className: "text-left py-2.5 px-3 text-gray-500 font-semibold uppercase text-[10px] tracking-wider w-20", children: "Notes" })
                  ] }) }),
                  /* @__PURE__ */ t.jsxs("tbody", { children: [
                    /* @__PURE__ */ t.jsx("tr", { className: "bg-green-100 border-b border-green-200", children: /* @__PURE__ */ t.jsx(
                      "td",
                      {
                        colSpan: 5,
                        className: "py-1.5 px-3 font-bold text-gray-800 uppercase text-xs",
                        children: "All Week"
                      }
                    ) }),
                    s.map(
                      (c, l) => /* @__PURE__ */ t.jsxs(
                        "tr",
                        {
                          className: `border-b border-gray-100 ${l % 2 === 0 ? "bg-green-50/40" : "bg-white"} hover:bg-green-50 transition-colors`,
                          children: [
                            /* @__PURE__ */ t.jsx("td", { className: "py-2 px-3 text-gray-600 font-mono text-xs", children: c.dates }),
                            /* @__PURE__ */ t.jsx("td", { className: "py-2 px-3 text-gray-900 font-mono text-xs", children: c.code }),
                            /* @__PURE__ */ t.jsx("td", { className: "py-2 px-3 text-gray-700 font-mono text-xs", children: c.length }),
                            /* @__PURE__ */ t.jsx("td", { className: "py-2 px-3 text-gray-700 font-mono text-xs", children: c.pct }),
                            /* @__PURE__ */ t.jsx("td", { className: "py-2 px-3 text-gray-500 text-xs", children: c.notes })
                          ]
                        },
                        l
                      )
                    )
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ t.jsx(
              "div",
              {
                className: `w-4 flex-shrink-0 ${n ? "bg-gradient-to-r from-purple-200 via-purple-300 to-purple-200 shadow-[inset_0_0_8px_rgba(0,0,0,0.15)]" : "bg-gradient-to-r from-underworld-700 via-underworld-900 to-underworld-700 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"}`
              }
            ),
            /* @__PURE__ */ t.jsxs(
              "div",
              {
                className: `w-80 flex flex-col relative overflow-hidden ${n ? "bg-[#f8f0fc]" : "bg-underworld-800"}`,
                children: [
                  /* @__PURE__ */ t.jsx(
                    "div",
                    {
                      className: `absolute inset-0 opacity-5 pointer-events-none ${n ? "bg-[radial-gradient(circle_at_30%_50%,rgba(147,51,234,0.2),transparent_70%)]" : "bg-[radial-gradient(circle_at_30%_50%,rgba(200,80,192,0.3),transparent_70%)]"}`
                    }
                  ),
                  /* @__PURE__ */ t.jsx(
                    "div",
                    {
                      className: `absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 rounded-tr-lg ${n ? "border-purple-300/30" : "border-megara-dark/30"}`
                    }
                  ),
                  /* @__PURE__ */ t.jsx(
                    "div",
                    {
                      className: `absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 rounded-br-lg ${n ? "border-purple-300/30" : "border-megara-dark/30"}`
                    }
                  ),
                  /* @__PURE__ */ t.jsx("div", { className: "p-4 flex justify-end relative z-10", children: /* @__PURE__ */ t.jsx(
                    "button",
                    {
                      onClick: d,
                      className: `p-2 rounded-full transition-colors ${n ? "text-purple-400 hover:text-purple-700 hover:bg-purple-100" : "text-megara-light/60 hover:text-megara-light hover:bg-white/10"}`,
                      children: /* @__PURE__ */ t.jsx(pr, { size: 20 })
                    }
                  ) }),
                  /* @__PURE__ */ t.jsxs(
                    "div",
                    {
                      className: `px-6 pb-6 border-b relative z-10 ${n ? "border-purple-200/40" : "border-megara-dark/20"}`,
                      children: [
                        /* @__PURE__ */ t.jsx(
                          "span",
                          {
                            className: `font-serif text-2xl font-bold ${Me[r.market]}`,
                            children: r.market
                          }
                        ),
                        /* @__PURE__ */ t.jsxs("div", { className: "mt-2 space-y-1", children: [
                          /* @__PURE__ */ t.jsxs("div", { className: "flex items-center gap-2", children: [
                            /* @__PURE__ */ t.jsxs(
                              "span",
                              {
                                className: `text-xs px-2 py-0.5 rounded font-mono ${n ? "bg-purple-100 text-purple-700" : "bg-underworld-700 text-megara-light/70"}`,
                                children: [
                                  "Est ",
                                  r.estimate.split("+")[0].trim()
                                ]
                              }
                            ),
                            /* @__PURE__ */ t.jsx(
                              "span",
                              {
                                className: `text-xs ${n ? "text-purple-500/50" : "text-megara-light/40"}`,
                                children: r.version
                              }
                            )
                          ] }),
                          /* @__PURE__ */ t.jsxs(
                            "div",
                            {
                              className: `text-xs ${n ? "text-purple-600/50" : "text-megara-light/50"}`,
                              children: [
                                r.iscis,
                                " · ",
                                r.dateRange
                              ]
                            }
                          ),
                          /* @__PURE__ */ t.jsx(
                            "div",
                            {
                              className: `text-xs ${n ? "text-purple-600/50" : "text-megara-light/50"}`,
                              children: r.buyer
                            }
                          ),
                          r.status === "sent" && /* @__PURE__ */ t.jsx(
                            "span",
                            {
                              className: `inline-block text-[10px] px-2 py-0.5 rounded border mt-1 ${n ? "bg-green-50 text-green-600 border-green-200" : "bg-green-900/40 text-green-400 border-green-700/50"}`,
                              children: "sent"
                            }
                          )
                        ] })
                      ]
                    }
                  ),
                  /* @__PURE__ */ t.jsxs("div", { className: "flex-1 px-6 py-6 flex flex-col gap-3 relative z-10", children: [
                    /* @__PURE__ */ t.jsx(
                      "h3",
                      {
                        className: `font-serif text-lg mb-2 tracking-wide ${n ? "text-purple-700" : "text-magic-gold/80"}`,
                        children: "Actions"
                      }
                    ),
                    /* @__PURE__ */ t.jsxs(
                      "button",
                      {
                        className: `w-full py-2.5 px-4 rounded border text-sm flex items-center gap-3 transition-colors group ${n ? "border-purple-200 text-purple-700 hover:bg-purple-100" : "border-megara-dark/40 text-megara-light hover:bg-megara-dark/20"}`,
                        children: [
                          /* @__PURE__ */ t.jsx(
                            Qt,
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
                    /* @__PURE__ */ t.jsxs(
                      "button",
                      {
                        className: `w-full py-2.5 px-4 rounded border text-sm flex items-center gap-3 transition-colors group font-medium ${n ? "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100" : "border-magic-teal/40 bg-magic-teal/10 text-magic-teal hover:bg-magic-teal/20"}`,
                        children: [
                          /* @__PURE__ */ t.jsx(
                            qt,
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
                    /* @__PURE__ */ t.jsxs(
                      "button",
                      {
                        className: `w-full py-2.5 px-4 rounded border text-sm flex items-center gap-3 transition-colors group ${n ? "border-purple-200 text-purple-700 hover:bg-purple-100" : "border-megara-dark/40 text-megara-light hover:bg-megara-dark/20"}`,
                        children: [
                          /* @__PURE__ */ t.jsx(
                            ar,
                            {
                              size: 16,
                              className: `group-hover:scale-110 transition-transform ${n ? "text-amber-600" : "text-magic-gold"}`
                            }
                          ),
                          " ",
                          "Print"
                        ]
                      }
                    ),
                    /* @__PURE__ */ t.jsxs(
                      "button",
                      {
                        onClick: h,
                        className: `w-full py-2.5 px-4 rounded border text-sm flex items-center gap-3 transition-colors group ${n ? "border-purple-200 text-purple-700 hover:bg-purple-100" : "border-megara-dark/40 text-megara-light hover:bg-megara-dark/20"}`,
                        children: [
                          /* @__PURE__ */ t.jsx(
                            ir,
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
                    /* @__PURE__ */ t.jsxs(
                      "button",
                      {
                        className: `w-full py-2.5 px-4 rounded border text-sm flex items-center gap-3 transition-colors group ${n ? "border-purple-200 text-purple-700 hover:bg-purple-100" : "border-megara-dark/40 text-megara-light hover:bg-megara-dark/20"}`,
                        children: [
                          /* @__PURE__ */ t.jsx(
                            Bt,
                            {
                              size: 16,
                              className: `group-hover:scale-110 transition-transform ${n ? "text-purple-400" : "text-megara-light/60"}`
                            }
                          ),
                          " ",
                          "Copy to...",
                          /* @__PURE__ */ t.jsx(
                            Ft,
                            {
                              size: 14,
                              className: `ml-auto ${n ? "text-purple-300" : "text-megara-light/40"}`
                            }
                          )
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ t.jsx("div", { className: "px-6 pb-6 relative z-10", children: /* @__PURE__ */ t.jsxs(
                    "button",
                    {
                      className: `w-full py-2.5 px-4 rounded border text-sm flex items-center justify-center gap-2 transition-colors ${n ? "border-red-200 text-red-500 hover:bg-red-50" : "border-red-900/40 text-red-400 hover:bg-red-900/20"}`,
                      children: [
                        /* @__PURE__ */ t.jsx(dr, { size: 16 }),
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
const De = kt(!1);
function Cr() {
  const [r, i] = te(!1), [n, s] = te(null);
  ae(() => {
    r ? document.body.classList.add("light") : document.body.classList.remove("light");
  }, [r]);
  const m = Nt(() => {
    const p = [
      "soul-teal",
      "soul-purple",
      "soul-gold",
      "soul-ember"
    ];
    return Array.from({
      length: 60
    }).map((f, j) => ({
      id: j,
      left: `${Math.random() * 100}vw`,
      bottom: `${-10 + Math.random() * 20}px`,
      size: 1 + Math.random() * 4,
      type: p[j % p.length],
      delay: `${Math.random() * 20}s`,
      duration: `${8 + Math.random() * 18}s`
    }));
  }, []), d = ["April", "March", "December"], h = Ae.reduce(
    (p, f) => (p[f.month] || (p[f.month] = []), p[f.month].push(f), p),
    {}
  ), c = d.filter((p) => {
    var f;
    return ((f = h[p]) == null ? void 0 : f.length) > 0;
  }), l = r;
  return /* @__PURE__ */ t.jsx(De.Provider, { value: r, children: /* @__PURE__ */ t.jsxs(
    "div",
    {
      className: `min-h-screen w-full flex flex-col relative overflow-hidden font-sans transition-colors duration-700 ${l ? "bg-[#f5eef8]" : ""}`,
      children: [
        /* @__PURE__ */ t.jsx(
          "div",
          {
            className: `fixed inset-0 pointer-events-none z-0 transition-all duration-700 ${l ? "bg-[radial-gradient(ellipse_at_top,#f8f0fc,#ede4f3,#e0d4ec)]" : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-underworld-800 via-underworld-900 to-black"}`
          }
        ),
        /* @__PURE__ */ t.jsx(
          "div",
          {
            className: `fixed inset-0 pointer-events-none z-[1] ${l ? "library-vignette-light" : "library-vignette"}`
          }
        ),
        /* @__PURE__ */ t.jsx("div", { className: "fixed inset-0 pointer-events-none z-[1] library-fog" }),
        /* @__PURE__ */ t.jsx(
          "div",
          {
            className: `fixed top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none z-0 transition-colors duration-700 ${l ? "bg-purple-300/20" : "bg-megara-primary/5"}`
          }
        ),
        /* @__PURE__ */ t.jsx(
          "div",
          {
            className: `fixed top-1/3 right-1/4 w-80 h-80 rounded-full blur-[100px] pointer-events-none z-0 transition-colors duration-700 ${l ? "bg-pink-200/20" : "bg-magic-teal/5"}`
          }
        ),
        /* @__PURE__ */ t.jsx(
          "div",
          {
            className: `fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 rounded-full blur-[80px] pointer-events-none z-0 transition-colors duration-700 ${l ? "bg-amber-200/15" : "bg-magic-gold/3"}`
          }
        ),
        m.map(
          (p) => /* @__PURE__ */ t.jsx(
            "div",
            {
              className: `soul-particle ${p.type}`,
              style: {
                left: p.left,
                bottom: p.bottom,
                width: `${p.size}px`,
                height: `${p.size}px`,
                "--delay": p.delay,
                "--duration": p.duration
              }
            },
            p.id
          )
        ),
        /* @__PURE__ */ t.jsx(
          ur,
          {
            isLightMode: r,
            toggleTheme: () => i(!r)
          }
        ),
        /* @__PURE__ */ t.jsx(
          gr,
          {
            instructions: Ae,
            months: c,
            light: l
          }
        ),
        /* @__PURE__ */ t.jsx("main", { className: "flex-1 overflow-y-auto hide-scrollbar flex flex-col relative z-10", children: /* @__PURE__ */ t.jsxs("div", { className: "px-8 pb-32 flex-1 relative", children: [
          /* @__PURE__ */ t.jsxs(
            "div",
            {
              className: "absolute inset-0 pointer-events-none opacity-[0.06] flex justify-between px-16",
              children: [
                /* @__PURE__ */ t.jsx(
                  "div",
                  {
                    className: `w-20 h-full bg-gradient-to-b ${l ? "from-purple-400/30 via-purple-300/10" : "from-megara-dark/50 via-megara-dark/20"} to-transparent border-x ${l ? "border-purple-300/20" : "border-megara-dark/30"}`
                  }
                ),
                /* @__PURE__ */ t.jsx(
                  "div",
                  {
                    className: `w-20 h-full bg-gradient-to-b ${l ? "from-purple-400/30 via-purple-300/10" : "from-megara-dark/50 via-megara-dark/20"} to-transparent border-x ${l ? "border-purple-300/20" : "border-megara-dark/30"}`
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ t.jsx("div", { className: "max-w-6xl mx-auto relative z-10", children: c.map(
            (p) => /* @__PURE__ */ t.jsx("div", { id: `month-${p}`, children: /* @__PURE__ */ t.jsx(
              hr,
              {
                month: p,
                instructions: h[p],
                onBookClick: s,
                light: l
              }
            ) }, p)
          ) })
        ] }) }),
        /* @__PURE__ */ t.jsx(
          _r,
          {
            instruction: n,
            onClose: () => s(null),
            light: l
          }
        )
      ]
    }
  ) });
}
export {
  Cr as App,
  De as ThemeContext
};
