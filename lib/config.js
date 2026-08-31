// dsh-plugin-template — pure config domain.
//
// resolveConfig, templateSchema and settingsNamespace live here (not in
// index.js) so unit tests and evals can import them without booting Cordis.
// This module must stay free of `ctx` and of package imports.

/** Default policy prose, used when the patch config omits `section`. */
export const DEFAULT_SECTION =
  "Follow the project conventions: small focused files, meaningful comments, no placeholder stubs left behind.";

/** Accepted config keys, for the unknown-key guard. */
export const CONFIG_KEYS = ["section", "order", "enabled", "allowCommand", "greeting"];

/** Settings namespace shared with the web client (lib/client.js). */
export const NS = "dsh-plugin-template";

/**
 * settingsNamespace() in @deepseek-ai/dsh-settings is only a branded string
 * with a validation pattern; inlined so the host module stays free of imports
 * that the profile node_modules might not resolve.
 */
export function settingsNamespace(value) {
  if (!/^[a-z][a-z0-9-]*$/.test(value)) {
    throw new TypeError(
      'settings namespace "' + value + '" must match /^[a-z][a-z0-9-]*$/'
    );
  }
  return value;
}

/**
 * Validate deployment-owned config. Missing, mistyped, or unknown fields fail
 * at plugin load rather than being ignored.
 * @param config Raw plugin config.
 * @returns A detached validated config with defaults applied.
 */
export function resolveConfig(config) {
  const section = config.section ?? DEFAULT_SECTION;
  if (typeof section !== "string") throw new Error("TemplateConfig needs a string `section`");
  if (section.trim() === "") throw new Error("TemplateConfig needs a non-empty `section`");
  const order = config.order ?? 50;
  if (typeof order !== "number" || !Number.isFinite(order)) {
    throw new Error("TemplateConfig needs a finite number `order`");
  }
  const enabled = config.enabled ?? false;
  if (typeof enabled !== "boolean") throw new Error("TemplateConfig needs a boolean `enabled`");
  const allowCommand = config.allowCommand ?? true;
  if (typeof allowCommand !== "boolean") {
    throw new Error("TemplateConfig needs a boolean `allowCommand`");
  }
  const greeting = config.greeting ?? "Hello from dsh-plugin-template";
  if (typeof greeting !== "string") throw new Error("TemplateConfig needs a string `greeting`");
  const unknown = Object.keys(config).filter((key) => !CONFIG_KEYS.includes(key));
  if (unknown.length > 0) {
    throw new Error(
      "TemplateConfig has unknown key(s) " + unknown.join(", ") +
        " — config is { section, order, enabled, allowCommand, greeting }"
    );
  }
  return { section, order, enabled, allowCommand, greeting };
}

// Schema of the settings namespace, written as a callable function
// (schemastery schemas are invoked as functions): settings.register(ns, schema)
// resolves the value with schema(section), so a function with toJSON is enough
// and needs no @deepseek-ai/schemastery import.
export function templateSchema(section) {
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
