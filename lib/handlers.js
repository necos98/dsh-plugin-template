// dsh-plugin-template — pure handlers.
//
// Section-text factory and command handler, kept free of `ctx` so they are
// unit-testable in isolation. They read/write a shared mutable `state` object
// created by apply() in lib/index.js.

/**
 * Build the system-prompt section text function. The section renders only
 * while `state.enabled` is true, so a runtime flip (e.g. by the command)
 * applies from the next prompt assembly without a restart.
 * @param state Mutable plugin state ({ enabled, section }).
 * @returns text function for ctx.systemPrompt.section.
 */
export function createPolicyText(state) {
  return () => (state.enabled ? state.section : "");
}

/**
 * Build the /template command handler.
 * @param state Mutable plugin state ({ enabled, section }).
 * @param greeting Greeting text from the validated config.
 * @returns handler function ({ rawInput }) => { kind, text }.
 */
export function createCommandHandler(state, greeting) {
  return ({ rawInput }) => {
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
        text: state.enabled
          ? "Template policy section is ON."
          : "Template policy section is OFF.",
      };
    }
    if (argument === "hello") {
      return { kind: "success", text: greeting };
    }
    if (argument === "") {
      state.enabled = !state.enabled;
      return {
        kind: "success",
        text: state.enabled
          ? "Template policy section ON."
          : "Template policy section OFF.",
      };
    }
    return { kind: "error", text: "Usage: /template [on|off|status|hello]" };
  };
}
