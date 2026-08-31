// Unit tests for the host wiring (lib/index.js) run against a fake ctx.
import { test } from "node:test";
import assert from "node:assert/strict";
import { apply, inject, name, NS, templateSchema } from "../lib/index.js";
import { createFakeCtx, runCommand } from "./helpers.mjs";

test("module exports the Cordis contract", () => {
  assert.equal(name, "dsh-plugin-template");
  assert.ok(inject.includes("systemPrompt"));
  assert.equal(typeof apply, "function");
});

test("apply registers the policy section, namespace and hooks", () => {
  const ctx = createFakeCtx();
  apply(ctx, { enabled: false });
  assert.equal(ctx.sections.length, 1);
  assert.equal(ctx.sections[0].name, "template:policy");
  assert.equal(ctx.sections[0].order, 50);
  assert.equal(ctx.sections[0].text(), ""); // disabled → empty text
  assert.equal(ctx.namespaces.length, 1);
  assert.equal(ctx.namespaces[0].ns, NS);
  assert.equal(typeof ctx.namespaces[0].schema, "function");
  assert.ok((ctx.lifecycle.ready ?? []).length >= 1);
  assert.ok((ctx.lifecycle.dispose ?? []).length >= 1);
  assert.ok(ctx.effects.length >= 1);
});

test("section text follows the enabled flag and the command toggles it", () => {
  const ctx = createFakeCtx();
  apply(ctx, { enabled: true });
  const text = ctx.sections[0].text;
  assert.ok(text() !== "");
  const off = runCommand(ctx, "template", "off");
  assert.equal(off.kind, "success");
  assert.equal(text(), "");
  runCommand(ctx, "template", "on");
  assert.ok(text() !== "");
});

test("command responses", () => {
  const ctx = createFakeCtx();
  apply(ctx, { greeting: "Ciao!" });
  assert.equal(runCommand(ctx, "template", "status").text, "Template policy section is OFF.");
  assert.equal(runCommand(ctx, "template", "hello").text, "Ciao!");
  assert.equal(runCommand(ctx, "template", "").kind, "success");
  const bad = runCommand(ctx, "template", "bogus");
  assert.equal(bad.kind, "error");
  assert.match(bad.text, /Usage:/);
});

test("no command is registered when allowCommand is false", () => {
  const ctx = createFakeCtx();
  apply(ctx, { allowCommand: false });
  assert.equal(ctx.commands.length, 0);
  assert.equal(ctx.sections.length, 1);
});

test("invalid config fails at load", () => {
  const ctx = createFakeCtx();
  assert.throws(() => apply(ctx, { enabled: "yes" }), /boolean `enabled`/);
});

test("settings namespace schema resolves client values", () => {
  const ctx = createFakeCtx();
  apply(ctx, {});
  const schema = ctx.namespaces[0].schema;
  assert.deepEqual(schema({ greeting: "x" }), { enabled: true, greeting: "x" });
  assert.equal(typeof templateSchema, "function");
});
