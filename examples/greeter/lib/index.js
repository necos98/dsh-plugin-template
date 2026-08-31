// dsh-plugin-greeter-example — host node (Cordis).
//
// Complete worked example of a plugin built from the template: a
// system-prompt section, a /greet command, a settings namespace shared with
// the browser half, and lifecycle hooks. Read it top to bottom: every block
// maps to one surface of the template.
// @module dsh-plugin-greeter-example

/** Cordis plugin name. */
const name = "dsh-plugin-greeter-example";

/** Required services: the prompt registry owns the section registration. */
const inject = ["systemPrompt"];

/** Settings namespace shared with lib/client.js. */
const NS = "greeter-example";

/** Default greeting name, used when config omits `name`. */
const DEFAULT_NAME = "friend";

// Brand validators inlined (no @deepseek-ai/dsh-settings import needed).
function settingsNamespace(value) {
  if (!/^[a-z][a-z0-9-]*$/.test(value)) {
    throw new TypeError(
      'settings namespace "' + value + '" must match /^[a-z][a-z0-9-]*$/'
    );
  }
  return value;
}

/**
 * Validate deployment-owned config: { section, name, order }.
 */
function resolveConfig(config) {
  const section = config.section ?? "Be warm and friendly. Keep answers short but kind.";
  if (typeof section !== "string" || section.trim() === "") {
    throw new Error("GreeterConfig needs a non-empty string `section`");
  }
  const nameValue = config.name ?? DEFAULT_NAME;
  if (typeof nameValue !== "string" || nameValue.trim() === "") {
    throw new Error("GreeterConfig needs a non-empty string `name`");
  }
  const order = config.order ?? 60;
  if (typeof order !== "number" || !Number.isFinite(order)) {
    throw new Error("GreeterConfig needs a finite number `order`");
  }
  const unknown = Object.keys(config).filter((key) => !["section", "name", "order"].includes(key));
  if (unknown.length > 0) {
    throw new Error(
      "GreeterConfig has unknown key(s) " + unknown.join(", ") +
        " — config is { section, name, order }"
    );
  }
  return { section, name: nameValue.trim(), order };
}

// Settings namespace schema (callable + toJSON, no schemastery import).
function greeterSchema(section) {
  const v = section ?? {};
  return {
    name:
      typeof v.name === "string" && v.name.trim().length > 0
        ? v.name.trim().slice(0, 40)
        : DEFAULT_NAME,
  };
}
greeterSchema.toJSON = () => ({ type: "object", dict: {} });

/**
 * Plugin body (host).
 * @param ctx - a context carrying the prompt registry.
 * @param config - the validated greeter guidance.
 */
function apply(ctx, config) {
  const resolved = resolveConfig(config);
  const state = { enabled: true };

  // 1) System-prompt section (policy band).
  ctx.systemPrompt.section({
    name: "greeter:policy",
    order: resolved.order,
    text: () => (state.enabled ? resolved.section : ""),
  });

  // 2) Settings namespace for the browser half.
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.settings.register(settingsNamespace(NS), greeterSchema);
  });

  // 3) Lifecycle hooks.
  ctx.on("ready", () => console.log("[dsh-plugin-greeter-example] ready"));
  ctx.on("dispose", () => console.log("[dsh-plugin-greeter-example] removed"));

  // 4) Command.
  ctx.inject(["commands"], (commandCtx) => {
    commandCtx.commands.register({
      name: "greet",
      description: "Say hello",
      input: { hint: "[name]" },
      handler: ({ rawInput }) => {
        const who = rawInput.trim() || resolved.name;
        return { kind: "success", text: "Hello, " + who + "!" };
      },
    });
  });
}

export { DEFAULT_NAME, NS, apply, inject, name, resolveConfig };
