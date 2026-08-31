// Behavior evals: scenario-level checks that run the plugin's apply() against
// a fake ctx. Deterministic and free. Run with `npm run eval`.
export const cases = [
  {
    name: "policy section renders only while enabled",
    run(t) {
      const off = t.fakeCtx({ enabled: false, allowCommand: false });
      t.assert.equal(off.sections[0].text(), "");
      const on = t.fakeCtx({ enabled: true, allowCommand: false });
      t.assert.notEqual(on.sections[0].text(), "");
    },
  },
  {
    name: "command toggles the section and greets",
    run(t) {
      const ctx = t.fakeCtx({ greeting: "Hello from eval" });
      t.runCommand(ctx, "template", "on");
      t.assert.ok(ctx.sections[0].text() !== "");
      const off = t.runCommand(ctx, "template", "off");
      t.assert.equal(off.text, "Template policy section OFF.");
      t.assert.equal(ctx.sections[0].text(), "");
      const hello = t.runCommand(ctx, "template", "hello");
      t.assert.equal(hello.text, "Hello from eval");
    },
  },
  {
    name: "config validation rejects unknown keys",
    run(t) {
      t.assert.throws(() => t.fakeCtx({ nope: true }), /unknown key\(s\) nope/);
    },
  },
  {
    name: "settings namespace is registered and resolves for the client",
    run(t) {
      const ctx = t.fakeCtx({});
      t.assert.equal(ctx.namespaces[0].ns, "dsh-plugin-template");
      const resolved = ctx.namespaces[0].schema({ greeting: "  x " });
      t.assert.deepEqual(resolved, { enabled: true, greeting: "x" });
    },
  },
];
