// dsh-plugin-template — host node (Cordis).
//
// Blank template for a DSH plugin. One minimal example of each host surface:
//   1. systemPrompt section  — deployment-wide guidance, rendered only while
//      config `enabled` is true (the text is a function, so a runtime flip
//      applies from the next step, no restart).
//   2. settings namespace    — shared config the web client reads/writes
//      through `settingsScope`.
//   3. lifecycle hooks       — ctx.on("ready" / "dispose") and ctx.effect for
//      cleanup when the plugin is removed.
//   4. command               — /template, registered via optional injection so
//      a composition without `commands` still gets the rest.
//
// Delete what you do not need. Keep `resolveConfig` strict: unknown or
// mistyped config must fail at load, not be silently ignored.
// @module dsh-plugin-template

/** Cordis plugin name. */
const name = "dsh-plugin-template";

/** Required services: the prompt registry owns the section registration. */
const inject = ["systemPrompt"];

/** Default policy prose, used when the patch config omits `section`. */
const DEFAULT_SECTION =
  "Follow the project conventions: small focused files, meaningful comments, no placeholder stubs left behind.";

/** Accepted config keys, for the unknown-key guard. */
const CONFIG_KEYS = ["section", "order", "enabled", "allowCommand", "greeting"];

/**
 * Validate deployment-owned config. Missing, mistyped, or unknown fields fail
 * at plugin load rather than being ignored.
 * @param config Raw plugin config.
 * @returns A detached validated config with defaults applied.
 */
function resolveConfig(config) {
  const section = config.section ?? DEFAULT_SECTION;
  if (typeof section !== "string") throw new Error("TemplateConfig needs a string `section`");
  if (section.trim() === "") throw new Error("TemplateConfig needs a non-empty `section`");
  const order = config.order ?? 50;
  if (typeof order !== "number" || !Number.isFinite(order)) throw new Error("TemplateConfig needs a finite number `order`");
  const enabled = config.enabled ?? false;
  if (typeof enabled !== "boolean") throw new Error("TemplateConfig needs a boolean `enabled`");
  const allowCommand = config.allowCommand ?? true;
  if (typeof allowCommand !== "boolean") throw new Error("TemplateConfig needs a boolean `allowCommand`");
  const greeting = config.greeting ?? "Hello from dsh-plugin-template";
  if (typeof greeting !== "string") throw new Error("TemplateConfig needs a string `greeting`");
  const unknown = Object.keys(config).filter((key) => !CONFIG_KEYS.includes(key));
  if (unknown.length > 0) {
    throw new Error(
      `TemplateConfig has unknown key(s) ${unknown.join(", ")} — config is { section, order, enabled, allowCommand, greeting }`
    );
  }
  return { section, order, enabled, allowCommand, greeting };
}

// settingsNamespace() in @deepseek-ai/dsh-settings is only a branded string
// with a validation pattern; inlined so the host module stays free of imports
// that the profile node_modules might not resolve.
function settingsNamespace(value) {
  if (!/^[a-z][a-z0-9-]*$/.test(value)) {
    throw new TypeError(
      'settings namespace "' + value + '" must match /^[a-z][a-z0-9-]*$/'
    );
  }
  return value;
}

// Schema of the settings namespace, written as a callable function
// (schemastery schemas are invoked as functions): settings.register(ns, schema)
// resolves the value with schema(section), so a function with toJSON is enough
// and needs no @deepseek-ai/schemastery import.
function templateSchema(section) {
  const v = section ?? {};
  return {
    enabled: typeof v.enabled === "boolean" ? v.enabled : true,
    greeting:
      typeof v.greeting === "string" && v.greeting.trim().length > 0
        ? v.greeting.trim().slice(0, 120)
        : "Hello from dsh-plugin-template",
  };
}
templateSchema.toJSON = () => ({ type: "object", dict: {} });

/** Namespace shared with the web client (lib/client.js). */
const NS = "dsh-plugin-template";

/**
 * Plugin body (host).
 * @param ctx - a context carrying the prompt registry.
 * @param config - the validated template guidance.
 */
function apply(ctx, config) {
  const resolved = resolveConfig(config);

  /** Process-wide flag; the single plugin instance is the deployment. */
  const state = { enabled: resolved.enabled };

  // 1) System-prompt section (policy band).
  ctx.systemPrompt.section({
    name: "template:policy",
    order: resolved.order,
    text: () => (state.enabled ? resolved.section : ""),
  });

  // 2) Settings namespace for the web client half.
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.settings.register(settingsNamespace(NS), templateSchema);
  });

  // 3) Lifecycle hooks: log readiness and clean up on dispose.
  ctx.on("ready", () => {
    console.log(
      `[dsh-plugin-template] active (enabled=${state.enabled}, order=${resolved.order})`
    );
  });
  ctx.on("dispose", () => {
    console.log("[dsh-plugin-template] removed");
  });
  ctx.effect(
    () => () => console.log("[dsh-plugin-template] effect cleanup"),
    "dsh-plugin-template: demo effect"
  );

  // 4) Command, through optional injection: a composition without
  //    `commands` still gets everything else.
  if (!resolved.allowCommand) return;
  ctx.inject(["commands"], (commandCtx) => {
    commandCtx.commands.register({
      name: "template",
      description: "Demo command: toggle the template policy section or say hello",
      input: {
        hint: "[on|off|status|hello]",
      },
      handler: ({ rawInput }) => {
        const argument = rawInput.trim();
        if (argument === "on") {
          state.enabled = true;
          return { kind: "success", text: "Template policy section ON." };
        }
        if (argument === "off") {
          state.enabled = false;
          return { kind: "success", text: "Template policy section OFF." };
        }
        if (argument === "status") {
          return {
            kind: "success",
            text: state.enabled ? "Template policy section is ON." : "Template policy section is OFF.",
          };
        }
        if (argument === "hello") {
          return { kind: "success", text: resolved.greeting };
        }
        if (argument === "") {
          state.enabled = !state.enabled;
          return {
            kind: "success",
            text: state.enabled ? "Template policy section ON." : "Template policy section OFF.",
          };
        }
        return { kind: "error", text: "Usage: /template [on|off|status|hello]" };
      },
    });
  });
}

export { DEFAULT_SECTION, NS, apply, inject, name, resolveConfig, templateSchema };
