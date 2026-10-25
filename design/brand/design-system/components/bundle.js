/* @ds-bundle: {"format":4,"namespace":"PressUp","components":[{"name":"Button"},{"name":"Chip"},{"name":"Badge"},{"name":"Tagline"},{"name":"BracketTitle"},{"name":"EchoHeadline"},{"name":"Rings"},{"name":"StatTile"},{"name":"ProgressRing"},{"name":"RestTimer"},{"name":"Stepper"},{"name":"SetTable"},{"name":"ExerciseCard"},{"name":"ProgrammeCard"},{"name":"TabBar"},{"name":"Icon"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;

  function cx() {
    return Array.prototype.slice.call(arguments).filter(Boolean).join(" ");
  }

  /* Icons: 24px grid, 2px stroke, round caps and joins, like the logo's line. */
  var PATHS = {
    home: ["M4 11.5 12 5l8 6.5", "M6.5 10v9h11v-9"],
    list: ["M9 7h11", "M9 12h11", "M9 17h11", "M4.5 7h.01", "M4.5 12h.01", "M4.5 17h.01"],
    plus: ["M12 5v14", "M5 12h14"],
    minus: ["M5 12h14"],
    chart: ["M4 19h16", "M7 15v-3", "M12 15V8", "M17 15v-6"],
    user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4.5 20c1.2-3.5 4-5 7.5-5s6.3 1.5 7.5 5"],
    play: ["M8 5.5v13l10-6.5-10-6.5Z"],
    pause: ["M9 6v12", "M15 6v12"],
    check: ["M5 12.5 10 17l9-10"],
    x: ["M6 6l12 12", "M18 6 6 18"],
    timer: ["M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z", "M12 9v4l2.5 2", "M10 2.5h4"],
    "chevron-right": ["M9 5l7 7-7 7"],
    "arrow-up": ["M12 19V5", "M6 11l6-6 6 6"],
    "arrow-down": ["M12 5v14", "M6 13l6 6 6-6"],
    flame: ["M12 21c3.9 0 6.5-2.6 6.5-6.2 0-3.6-2.6-5.6-3.6-8.8-1.6 1.6-2.2 3.2-2.4 4.5C11.6 8.3 9.9 6 8.4 3.5 6.8 6.6 5.5 9.6 5.5 13c0 4.9 2.6 8 6.5 8Z"],
    dumbbell: ["M3 12h2", "M19 12h2", "M8 12h8", "M5 8.5v7", "M8 7v10", "M16 7v10", "M19 8.5v7"]
  };

  function Icon(props) {
    var size = props.size || 24;
    var paths = PATHS[props.name] || [];
    return h("svg", {
      className: cx("pu-icon", props.className),
      width: size, height: size, viewBox: "0 0 24 24", fill: "none",
      stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
      "aria-hidden": props.title ? undefined : "true", role: props.title ? "img" : undefined
    }, props.title ? h("title", null, props.title) : null, paths.map(function (d, i) { return h("path", { key: i, d: d }); }));
  }

  function Button(props) {
    var variant = props.variant || "primary";
    var size = props.size || "md";
    var rest = Object.assign({}, props);
    ["variant", "size", "block", "icon", "className", "children"].forEach(function (k) { delete rest[k]; });
    return h("button", Object.assign({ type: "button" }, rest, {
      className: cx("pu-btn", "pu-btn-" + variant, size !== "md" && "pu-btn-" + size, props.block && "pu-btn-block", props.className)
    }), props.icon ? h(Icon, { name: props.icon }) : null, props.children);
  }

  function Chip(props) {
    var interactive = props.onClick || props.selected !== undefined;
    if (!interactive) return h("span", { className: "pu-chip pu-chip-static" }, props.children);
    return h("button", { type: "button", className: "pu-chip", "aria-pressed": props.selected ? "true" : "false", onClick: props.onClick }, props.children);
  }

  var BADGE_ICON = { done: "check", missed: "x", pr: "flame" };
  function Badge(props) {
    var tone = props.tone || "neutral";
    return h("span", { className: "pu-badge pu-badge-" + tone }, BADGE_ICON[tone] ? h(Icon, { name: BADGE_ICON[tone] }) : null, props.children);
  }

  function Tagline(props) {
    var words = props.words || ["Challenge", "Motivate", "Succeed"];
    var out = [];
    words.forEach(function (w, i) {
      if (i) out.push(h("span", { key: "s" + i, className: "pu-tagline-sep", "aria-hidden": "true" }));
      out.push(h("span", { key: "w" + i }, w));
    });
    return h("p", { className: "pu-tagline", style: props.size ? { fontSize: props.size } : undefined, "aria-label": words.join(", ") }, out);
  }

  function BracketTitle(props) {
    var Tag = props.as || "h2";
    return h(Tag, { className: cx("pu-bracket", "pu-bracket-" + (props.size || "m"), props.className) },
      h("span", { className: "pu-bracket-mark", "aria-hidden": "true" }, "["),
      h("span", null, props.children),
      h("span", { className: "pu-bracket-mark", "aria-hidden": "true" }, "]"));
  }

  var ECHO = ["var(--echo-1)", "var(--echo-2)", "var(--echo-3)", "var(--echo-4)", "var(--echo-5)"];
  function EchoHeadline(props) {
    var lines = props.lines || 5;
    var spans = [];
    for (var i = 0; i < lines; i++) {
      spans.push(h("span", { key: i, "aria-hidden": i ? "true" : undefined, style: { opacity: ECHO[Math.min(i, 4)] } }, props.text));
    }
    return h("h2", { className: "pu-echo", style: props.size ? { fontSize: props.size } : undefined }, spans);
  }

  function Rings(props) {
    var count = props.count || 3;
    var size = props.size || 640;
    var circles = [];
    for (var i = 0; i < count; i++) {
      circles.push(h("circle", { key: i, cx: size / 2, cy: size / 2, r: (size / 2 - 1) * (i + 1) / count }));
    }
    return h("div", { className: "pu-rings", "aria-hidden": "true", style: props.offset ? { transform: "translate(" + props.offset + ")" } : undefined },
      h("svg", { width: size, height: size, viewBox: "0 0 " + size + " " + size }, circles));
  }

  function StatTile(props) {
    var delta = props.delta;
    var dir = props.trend || (typeof delta === "string" && delta.charAt(0) === "-" ? "down" : "up");
    return h("div", { className: cx("pu-stat", props.highlight && "pu-stat-hl") },
      h("span", { className: "pu-stat-label" }, props.label),
      h("span", { className: "pu-stat-value" }, props.value, props.unit ? h("span", { className: "pu-stat-unit" }, props.unit) : null),
      delta ? h("span", { className: "pu-stat-delta " + dir }, h(Icon, { name: dir === "down" ? "arrow-down" : "arrow-up" }), delta) : null);
  }

  /* The arc starts at 12 o'clock and runs clockwise. A small ring rides on its leading end,
     the way the logo's dot sits at the end of its arc. */
  function ProgressRing(props) {
    var size = props.size || 120;
    var stroke = props.stroke || 10;
    var v = Math.max(0, Math.min(1, props.value || 0));
    var r = (size - stroke) / 2 - stroke * 0.6;
    var c = 2 * Math.PI * r;
    var a = -Math.PI / 2 + v * 2 * Math.PI;
    var hx = size / 2 + r * Math.cos(a), hy = size / 2 + r * Math.sin(a);
    return h("div", { className: cx("pu-ring", props.className), style: { "--pu-ring-size": size + "px" }, role: "img", "aria-label": props.ariaLabel || Math.round(v * 100) + "% complete" },
      h("svg", { width: size, height: size, viewBox: "0 0 " + size + " " + size },
        h("circle", { className: "pu-ring-track", cx: size / 2, cy: size / 2, r: r, strokeWidth: stroke }),
        v > 0 ? h("circle", { className: "pu-ring-arc", cx: size / 2, cy: size / 2, r: r, strokeWidth: stroke, strokeDasharray: c, strokeDashoffset: c * (1 - v), transform: "rotate(-90 " + size / 2 + " " + size / 2 + ")" }) : null,
        v > 0 && v < 1 ? h("circle", { className: "pu-ring-head", cx: hx, cy: hy, r: stroke * 0.9, strokeWidth: stroke * 0.55 }) : null),
      h("div", { className: "pu-ring-center" },
        props.value !== undefined && props.children === undefined ? h("span", { className: "pu-ring-value" }, Math.round(v * 100) + "%") : props.children,
        props.label ? h("span", { className: "pu-ring-label" }, props.label) : null));
  }

  function fmt(s) {
    s = Math.max(0, Math.round(s));
    var m = Math.floor(s / 60), r = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r;
  }

  function RestTimer(props) {
    var total = props.total || 90;
    var st = React.useState(props.seconds !== undefined ? props.seconds : total);
    var left = st[0], setLeft = st[1];
    return h("div", { className: "pu-timer" },
      h(ProgressRing, { size: props.size || 240, stroke: 12, value: left / total, ariaLabel: fmt(left) + " rest remaining" },
        h("span", { className: "pu-ring-value" }, fmt(left)),
        h("span", { className: "pu-ring-label" }, props.label || "Rest")),
      h("div", { className: "pu-timer-actions" },
        h(Button, { variant: "secondary", size: "sm", onClick: function () { setLeft(Math.max(0, left - 15)); } }, "−15s"),
        h(Button, { variant: "secondary", size: "sm", onClick: function () { setLeft(Math.min(total, left + 15)); } }, "+15s"),
        h(Button, { variant: "primary", size: "sm", onClick: props.onSkip || function () { setLeft(0); } }, "Skip")));
  }

  function Stepper(props) {
    var step = props.step || 2.5;
    var st = React.useState(props.value || 0);
    var val = st[0], setVal = st[1];
    function set(n) { n = Math.max(props.min || 0, Math.round(n * 100) / 100); setVal(n); if (props.onChange) props.onChange(n); }
    return h("div", { className: "pu-stepper", role: "group", "aria-label": props.label || props.unit },
      h("button", { type: "button", "aria-label": "Decrease by " + step, onClick: function () { set(val - step); } }, h(Icon, { name: "minus" })),
      h("div", { className: "pu-stepper-value", "aria-live": "polite" }, val, props.unit ? h("span", { className: "pu-stepper-unit" }, props.unit) : null),
      h("button", { type: "button", "aria-label": "Increase by " + step, onClick: function () { set(val + step); } }, h(Icon, { name: "plus" })));
  }

  function SetTable(props) {
    var st = React.useState(props.sets || []);
    var sets = st[0], setSets = st[1];
    function toggle(i) {
      var next = sets.map(function (s, j) { return j === i ? Object.assign({}, s, { done: !s.done }) : s; });
      setSets(next);
      if (props.onChange) props.onChange(next);
    }
    var current = sets.findIndex(function (s) { return !s.done; });
    return h("table", { className: "pu-sets" },
      h("thead", null, h("tr", null,
        h("th", null, "Set"), h("th", null, "Previous"), h("th", null, props.unit || "kg"), h("th", null, "Reps"), h("th", null, h("span", { className: "sr-only", style: { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" } }, "Done")))),
      h("tbody", null, sets.map(function (s, i) {
        return h("tr", { key: i, className: s.done ? "is-done" : i === current ? "is-current" : undefined },
          h("td", null, i + 1),
          h("td", { className: "pu-prev" }, s.prev || "–"),
          h("td", null, s.weight),
          h("td", null, s.reps),
          h("td", null, h("button", { type: "button", className: cx("pu-check", s.done && "is-on"), "aria-pressed": s.done ? "true" : "false", "aria-label": "Mark set " + (i + 1) + " done", onClick: function () { toggle(i); } }, h(Icon, { name: "check" }))));
      })));
  }

  function ExerciseCard(props) {
    var Tag = props.onClick ? "button" : "div";
    return h(Tag, { className: "pu-ex", onClick: props.onClick, type: props.onClick ? "button" : undefined, style: props.onClick ? { border: 0, width: "100%", textAlign: "left", font: "inherit", cursor: "pointer" } : undefined },
      h("span", { className: "pu-ex-index", "aria-hidden": "true" }, props.index < 10 ? "0" + props.index : props.index),
      h("span", { className: "pu-ex-body" },
        h("span", { className: "pu-ex-name" }, props.name),
        h("span", { className: "pu-ex-detail" }, props.detail),
        props.muscles && props.muscles.length ? h("span", { className: "pu-ex-tags" }, props.muscles.map(function (m) { return h("span", { key: m, className: "pu-ex-tag" }, m); })) : null),
      props.status ? h(Badge, { tone: props.status }, props.status === "done" ? "Done" : props.status === "pr" ? "PR" : props.status === "missed" ? "Missed" : props.status) : h("span", { className: "pu-ex-go" }, h(Icon, { name: "chevron-right" })));
  }

  function ProgrammeCard(props) {
    var meta = [props.weeks && props.weeks + " weeks", props.perWeek && props.perWeek + "× / week", props.level].filter(Boolean);
    var metaNodes = [];
    meta.forEach(function (m, i) {
      if (i) metaNodes.push(h("span", { key: "s" + i, className: "pu-tagline-sep", "aria-hidden": "true" }));
      metaNodes.push(h("span", { key: "m" + i }, m));
    });
    return h("article", { className: "pu-prog", style: props.width ? { width: props.width } : undefined },
      props.image ? h("img", { src: props.image, alt: props.imageAlt || "" }) : null,
      props.rings !== false ? h(Rings, { count: 2, size: 520, offset: "20%, -25%" }) : null,
      h("div", { className: "pu-prog-body" },
        h("span", { className: "pu-prog-meta" }, metaNodes),
        h(BracketTitle, { size: "m", as: "h3" }, props.title),
        props.description ? h("p", { className: "pu-prog-desc", style: { margin: 0 } }, props.description) : null,
        props.action ? h("div", { style: { marginTop: "var(--space-2)" } }, props.action) : null));
  }

  var DEFAULT_TABS = [
    { id: "today", label: "Today", icon: "home" },
    { id: "programmes", label: "Plans", icon: "list" },
    { id: "log", label: "Log", icon: "plus", primary: true },
    { id: "progress", label: "Progress", icon: "chart" },
    { id: "me", label: "Me", icon: "user" }
  ];
  function TabBar(props) {
    var items = props.items || DEFAULT_TABS;
    var st = React.useState(props.active || items[0].id);
    var active = st[0], setActive = st[1];
    return h("nav", { className: "pu-tabs", "aria-label": "Main" }, items.map(function (t) {
      return h("button", {
        key: t.id, type: "button", className: cx("pu-tab", t.primary && "pu-tab-primary"),
        "aria-current": active === t.id ? "page" : undefined,
        onClick: function () { setActive(t.id); if (props.onChange) props.onChange(t.id); }
      }, h("span", { className: "pu-tab-icon" }, h(Icon, { name: t.icon })), t.label);
    }));
  }

  window.PressUp = Object.assign(window.PressUp || {}, {
    Button: Button, Chip: Chip, Badge: Badge, Tagline: Tagline, BracketTitle: BracketTitle,
    EchoHeadline: EchoHeadline, Rings: Rings, StatTile: StatTile, ProgressRing: ProgressRing,
    RestTimer: RestTimer, Stepper: Stepper, SetTable: SetTable, ExerciseCard: ExerciseCard,
    ProgrammeCard: ProgrammeCard, TabBar: TabBar, Icon: Icon
  });
})();
