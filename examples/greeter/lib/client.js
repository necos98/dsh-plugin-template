// dsh-plugin-greeter-example — browser half (web). One settings row with the
// default greeting name. Same three client services as the template:
// settingsScope (shared config), locale (dictionaries), slots (UI).

window.__ModuleLoader__.load({
  id: "dsh-plugin-greeter-example",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");
    const NS = "greeter-example";
    const DEFAULT_NAME = "friend";

    function GreeterRow({ scope, t }) {
      if (scope === undefined) return null;
      const snapshot = React.useSyncExternalStore(
        (listener) => scope.subscribe(listener),
        () => scope.getSnapshot()
      );
      const v = snapshot.value ?? {};
      const name = typeof v.name === "string" ? v.name : DEFAULT_NAME;
      const set = (field, value) => scope.set(field, value).catch(() => {});
      return React.createElement(
        "label",
        { style: { display: "flex", gap: 12, alignItems: "center", padding: "16px 0" } },
        React.createElement("span", null, t("row.title")),
        React.createElement("input", {
          type: "text",
          maxLength: 40,
          value: name,
          onChange: (event) => set("name", event.target.value),
          style: {
            background: "var(--dsw-alias-bg-module-platform)",
            color: "var(--dsw-alias-label-primary)",
            border: "1px solid var(--dsw-alias-border-l2)",
            borderRadius: 8,
            padding: "4px 8px",
            fontSize: 12,
            minWidth: 200,
          },
        })
      );
    }

    const inject = ["slots", "locale", "settingsScope"];

    function apply(ctx) {
      const scope = ctx.settingsScope.bind({ namespace: NS });
      ctx.effect(() => scope.subscribe(() => {}), "greeter: settings sync");

      const locale = ctx.get("locale");
      if (locale !== undefined) {
        ctx.effect(
          () =>
            locale.register(NS, {
              en: { "row.title": "Greeting name" },
              // Add more locales here as needed.
            }),
          "greeter: dictionaries"
        );
      }

      const slots = ctx.get("slots");
      if (slots !== undefined) {
        const t = locale !== undefined ? locale.bind(NS) : (key) => key;
        slots.inject("settings.general.item", () =>
          slots.register(
            {
              name: "settings.general.item",
              id: "greeter-example",
              order: 90,
              locale: NS,
              inject: () => ({ scope }),
            },
            GreeterRow
          )
        );
      }
    }

    exports.inject = inject;
    exports.apply = apply;
    return module.exports;
  },
});
