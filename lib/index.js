// dsh-plugin-template — host node (Cordis wiring only).
//
// Blank template for a DSH plugin. One minimal example of each host surface:
//   1. systemPrompt section (text factory in lib/handlers.js)
//   2. settings namespace for the web client (lib/config.js)
//   3. lifecycle hooks
//   4. /template command (handler in lib/handlers.js)
//
// Pure logic lives in lib/config.js and lib/handlers.js so it can be unit
// tested and eval'd without booting DSH. Delete what you do not need.
// @module dsh-plugin-template

import {
  DEFAULT_SECTION,
  NS,
  resolveConfig,
  settingsNamespace,
  templateSchema,
} from "./config.js";
import { createCommandHandler, createPolicyText } from "./handlers.js";

/** Cordis plugin name. */
export const name = "dsh-plugin-template";

/** Required services: the prompt registry owns the section registration. */
export const inject = ["systemPrompt"];

/**
 * Plugin body (host).
 * @param ctx - a context carrying the prompt registry.
 * @param config - the validated template guidance.
 */
export function apply(ctx, config) {
  const resolved = resolveConfig(config);

  /** Process-wide mutable state; the single plugin instance is the deployment. */
  const state = { enabled: resolved.enabled, section: resolved.section };

  // 1) System-prompt section (policy band).
  ctx.systemPrompt.section({
    name: "template:policy",
    order: resolved.order,
    text: createPolicyText(state),
  });

  // 2) Settings namespace for the web client half.
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.settings.register(settingsNamespace(NS), templateSchema);
  });

  // 3) Lifecycle hooks: log readiness and clean up on dispose.
  ctx.on("ready", () => {
    console.log(
      "[dsh-plugin-template] active (enabled=" + state.enabled + ", order=" + resolved.order + ")"
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
      input: { hint: "[on|off|status|hello]" },
      handler: createCommandHandler(state, resolved.greeting),
    });
  });
}

export { DEFAULT_SECTION, NS, resolveConfig, settingsNamespace, templateSchema };
