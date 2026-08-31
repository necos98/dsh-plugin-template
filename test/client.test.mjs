// Unit tests for the browser half (lib/client.js) loaded through the
// window.__ModuleLoader__ shim.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFakeClientCtx, loadClientModule } from "./helpers.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const clientModules = loadClientModule(path.join(here, "..", "lib", "client.js"));
const client = clientModules.get("dsh-plugin-template");

test("client module loads and exposes the plugin contract", () => {
  assert.ok(client, "module should be registered under dsh-plugin-template");
  assert.equal(typeof client.apply, "function");
  assert.deepEqual([...client.inject].sort(), ["locale", "settingsScope", "slots"].sort());
});

test("client registers dictionaries and a settings row", () => {
  const ctx = createFakeClientCtx({ settings: { enabled: true, greeting: "Hi" } });
  client.apply(ctx);
  assert.equal(ctx.dictionaries.length, 1);
  assert.ok(ctx.dictionaries[0].dict.en["row.title"]);
  assert.equal(ctx.slotRegistrations.length, 1);
  const slot = ctx.slotRegistrations[0];
  assert.equal(slot.name, "settings.general.item");
  // config was synced from the settings scope
  assert.equal(ctx.settingsScope.getSnapshot().value.greeting, "Hi");
});

test("client skips UI registration when slots are missing", () => {
  const ctx = createFakeClientCtx({ slots: false });
  client.apply(ctx);
  assert.equal(ctx.slotRegistrations.length, 0);
});

test("client skips dictionaries when locale is missing", () => {
  const ctx = createFakeClientCtx({ locale: false });
  client.apply(ctx);
  assert.equal(ctx.dictionaries.length, 0);
});
