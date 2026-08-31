// dsh-plugin-template — metà browser (web).
//
// Minimal client module: reads the `dsh-plugin-template` settings namespace
// (registered by the host half) and renders one row in the General settings
// with a toggle and a text field. Shows the three client services you will
// need most: settingsScope (shared config), locale (i18n dictionaries) and
// slots (UI injection points).
//
// The factory is CommonJS-style on purpose: the client bundle is loaded by
// window.__ModuleLoader__ and gets react through require(), not import.
// No build step: this file is served as-is.

window.__ModuleLoader__.load({
  id: "dsh-plugin-template",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");

    // #region configurazione (default + namespace impostazioni)
    const NS = "dsh-plugin-template";
    const DEFAULT_CONFIG = {
      enabled: true,
      greeting: "Hello from dsh-plugin-template",
    };

    let config = { ...DEFAULT_CONFIG };

    function readConfig(snapshot) {
      const v = snapshot.value ?? {};
      config = {
        enabled: v.enabled !== false,
        greeting:
          typeof v.greeting === "string" && v.greeting.trim().length > 0
            ? v.greeting.trim()
            : DEFAULT_CONFIG.greeting,
      };
    }
    // #endregion

    // #region riga impostazioni (settings.general.item)
    function TemplateRow({ scope, t }) {
      if (scope === undefined) return null;
      // subscribe must be called with the right receiver (React calls the
      // callback without `this` and the controller uses this.store).
      const snapshot = React.useSyncExternalStore(
        (listener) => scope.subscribe(listener),
        () => scope.getSnapshot()
      );
      const v = snapshot.value ?? {};
      const enabled = v.enabled !== false;
      const greeting =
        typeof v.greeting === "string" ? v.greeting : DEFAULT_CONFIG.greeting;
      const set = (field, value) => {
        scope.set(field, value).catch(() => {});
      };
      const row = {
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "16px 0",
        borderBottom: "1px solid var(--dsw-alias-border-l2)",
      };
      const head = { display: "flex", alignItems: "center", gap: 8 };
      const text = { flex: 1, minWidth: 0 };
      const title = { color: "var(--dsw-alias-label-primary)", fontSize: 14, lineHeight: "22px" };
      const desc = { color: "var(--dsw-alias-label-tertiary)", fontSize: 12, lineHeight: "18px" };
      const controls = { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" };
      const toggle = {
        background: enabled ? "var(--dsw-alias-brand-primary)" : "var(--dsw-alias-label-tertiary)",
        border: "none",
        borderRadius: 10,
        width: 36,
        height: 20,
        position: "relative",
        cursor: "pointer",
        padding: 0,
      };
      const knob = {
        background: "var(--dsw-alias-bg-base)",
        borderRadius: "50%",
        width: 16,
        height: 16,
        position: "absolute",
        top: 2,
        left: enabled ? 18 : 2,
        transition: "left .15s",
      };
      const input = {
        background: "var(--dsw-alias-bg-module-platform)",
        color: "var(--dsw-alias-label-primary)",
        border: "1px solid var(--dsw-alias-border-l2)",
        borderRadius: 8,
        padding: "4px 8px",
        fontSize: 12,
        minWidth: 200,
      };
      return React.createElement(
        "div",
        { style: row },
        React.createElement(
          "div",
          { style: head },
          React.createElement(
            "div",
            { style: text },
            React.createElement("div", { style: title }, t("row.title")),
            React.createElement("div", { style: desc }, t("row.desc"))
          )
        ),
        React.createElement(
          "div",
          { style: controls },
          React.createElement(
            "button",
            {
              type: "button",
              role: "switch",
              "aria-checked": enabled,
              style: toggle,
              onClick: () => set("enabled", !enabled),
            },
            React.createElement("span", { style: knob })
          ),
          React.createElement("span", { style: { color: "var(--dsw-alias-label-secondary)", fontSize: 12 } }, t("enabled.label")),
          React.createElement("input", {
            type: "text",
            maxLength: 120,
            style: input,
            value: greeting,
            onChange: (event) => set("greeting", event.target.value),
            placeholder: DEFAULT_CONFIG.greeting,
          })
        )
      );
    }
    // #endregion

    // #region plugin body
    const inject = ["slots", "locale", "settingsScope"];

    function apply(ctx) {
      console.log("[dsh-plugin-template] client attivato");

      // 1) Configurazione: sincronizza la config col namespace host.
      const scope = ctx.settingsScope.bind({ namespace: NS });
      const sync = () => readConfig(scope.getSnapshot());
      sync();
      const unsubScope = scope.subscribe(sync);
      ctx.effect(() => unsubScope, "dsh-plugin-template: settings sync");

      // 2) Dizionari i18n.
      const locale = ctx.get("locale");
      if (locale !== undefined) {
        ctx.effect(
          () =>
            locale.register(NS, {
              en: {
                "row.title": "Template settings",
                "row.desc": "Example row: toggle the policy section and edit the greeting.",
                "enabled.label": "Policy section enabled",
              },
              it: {
                "row.title": "Impostazioni template",
                "row.desc": "Riga di esempio: attiva la sezione policy e modifica il saluto.",
                "enabled.label": "Sezione policy attiva",
              },
            }),
          "dsh-plugin-template: dictionaries"
        );
      }

      // 3) Slot UI: una riga nel General settings.
      const slots = ctx.get("slots");
      if (slots !== undefined) {
        const t = locale !== undefined ? locale.bind(NS) : (key) => key;
        slots.inject("settings.general.item", () =>
          slots.register(
            {
              name: "settings.general.item",
              id: "dsh-plugin-template",
              order: 90,
              locale: NS,
              inject: () => ({ scope }),
            },
            TemplateRow
          )
        );
      }
    }
    // #endregion

    exports.inject = inject;
    exports.apply = apply;
    return module.exports;
  },
});
