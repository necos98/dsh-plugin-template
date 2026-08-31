// Unit tests for the pure config domain (lib/config.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONFIG_KEYS,
  DEFAULT_SECTION,
  NS,
  resolveConfig,
  settingsNamespace,
  templateSchema,
} from "../lib/config.js";

test("resolveConfig applies defaults", () => {
  const resolved = resolveConfig({});
  assert.deepEqual(resolved, {
    section: DEFAULT_SECTION,
    order: 50,
    enabled: false,
    allowCommand: true,
    greeting: "Hello from dsh-plugin-template",
  });
});

test("resolveConfig passes explicit values through", () => {
  const cfg = {
    section: "Be terse.",
    order: 10,
    enabled: true,
    allowCommand: false,
    greeting: "Hi",
  };
  assert.deepEqual(resolveConfig(cfg), cfg);
});

test("resolveConfig rejects unknown keys", () => {
  assert.throws(() => resolveConfig({ nope: 1 }), /unknown key\(s\) nope/);
  assert.throws(() => resolveConfig({ section: "x", extra: true }), /unknown key\(s\) extra/);
});

test("resolveConfig rejects mistyped fields", () => {
  assert.throws(() => resolveConfig({ enabled: "yes" }), /boolean `enabled`/);
  assert.throws(() => resolveConfig({ order: "50" }), /finite number `order`/);
  assert.throws(() => resolveConfig({ section: "   " }), /non-empty `section`/);
  assert.throws(() => resolveConfig({ greeting: 42 }), /string `greeting`/);
});

test("settingsNamespace validates the namespace pattern", () => {
  assert.equal(settingsNamespace("dsh-plugin-template"), "dsh-plugin-template");
  assert.throws(() => settingsNamespace("Uppercase!"), /must match/);
});

test("templateSchema applies defaults, trims and clamps", () => {
  const s = templateSchema({ greeting: "  hello  " });
  assert.deepEqual(s, { enabled: true, greeting: "hello" });
  const long = "x".repeat(300);
  assert.equal(templateSchema({ greeting: long }).greeting.length, 120);
  assert.equal(templateSchema({ enabled: false }).enabled, false);
});

test("module exports are stable", () => {
  assert.equal(NS, "dsh-plugin-template");
  assert.deepEqual(CONFIG_KEYS, ["section", "order", "enabled", "allowCommand", "greeting"]);
  assert.equal(typeof templateSchema.toJSON, "function");
});
