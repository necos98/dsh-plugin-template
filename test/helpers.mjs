// test/helpers.mjs — micro test framework for DSH plugins.
//
// Zero dependencies: node:test (built-in) runs the tests; this file provides
// the plugin-specific pieces:
//   - createFakeCtx: a fake Cordis ctx that records what apply() registers
//     (sections, commands, settings namespaces, lifecycle hooks, effects) so
//     tests can assert on the registrations without booting DSH.
//   - runCommand: invoke a registered command handler by name.
//   - loadClientModule: execute lib/client.js inside a fake window so the
//     browser half can be tested under Node.
//   - createFakeClientCtx / createFakeSettingsScope: fake client services.

import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/** Minimal react stub: tests assert registrations, they never render. */
const reactStub = {
  createElement: (...args) => ({ __element: args }),
  useSyncExternalStore: () => ({ value: {} }),
};

/**
 * Build a fake Cordis context. inject() calls its callback immediately with
 * the fake ctx (services are assumed mounted), so apply() registers
 * everything synchronously and tests can inspect it.
 */
export function createFakeCtx(services = {}) {
  const ctx = {
    sections: [],
    namespaces: [],
    lifecycle: {},
    effects: [],
    services: { ...services },
    systemPrompt: {
      section: (spec) => {
        ctx.sections.push(spec);
      },
    },
    // ctx.commands doubles as the fake service and the record: it is an array
    // (so runCommand can .find()) that also exposes the .register() API the
    // plugin's apply() calls through ctx.inject(["commands"], ...).
    commands: Object.assign([], {
      register: (spec) => {
        ctx.commands.push(spec);
      },
    }),
    settings: {
      register: (ns, schema) => {
        ctx.namespaces.push({ ns, schema });
      },
    },
    on: (event, callback) => {
      (ctx.lifecycle[event] ??= []).push(callback);
    },
    effect: (fn, label) => {
      ctx.effects.push({ fn, label });
      fn(); // Cordis runs effects on registration
    },
    inject: (_deps, callback) => {
      callback(ctx);
    },
    get: (serviceName) => ctx.services[serviceName],
  };
  return ctx;
}

/**
 * Invoke a command handler registered on a fake ctx.
 * @param ctx Fake ctx from createFakeCtx.
 * @param name Command name.
 * @param rawInput Raw command input text.
 * @returns the handler result ({ kind, text }).
 */
export function runCommand(ctx, name, rawInput) {
  const spec = ctx.commands.find((c) => c.name === name);
  assert.ok(spec, "command " + name + " not registered");
  return spec.handler({ rawInput });
}

/** Fake settingsScope: bind() returns a scope with getSnapshot/subscribe/set. */
export function createFakeSettingsScope(initial = {}) {
  const state = { value: { ...initial } };
  const listeners = new Set();
  return {
    bind() {
      return this;
    },
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(field, value) {
      state.value = { ...state.value, [field]: value };
      for (const listener of [...listeners]) listener();
    },
  };
}

/**
 * Fake client ctx for the browser half: settingsScope always mounted,
 * locale/slots mounted by default (pass false to test the graceful skip).
 */
export function createFakeClientCtx({ settings = {}, locale = true, slots = true } = {}) {
  const ctx = {
    settingsScope: createFakeSettingsScope(settings),
    dictionaries: [],
    slotRegistrations: [],
    effects: [],
    locale: locale
      ? {
          register: (ns, dict) => {
            ctx.dictionaries.push({ ns, dict });
            return () => {};
          },
          bind: (ns) => {
            const found = ctx.dictionaries.find((d) => d.ns === ns);
            const dict = found ? found.dict.en : {};
            return (key) => dict[key] ?? key;
          },
        }
      : undefined,
    slots: slots
      ? {
          inject: (name, factory) => {
            ctx.slotRegistrations.push({ name, factory });
          },
          register: (meta, component) => ({ meta, component }),
        }
      : undefined,
    effect: (fn, label) => {
      ctx.effects.push({ fn, label });
      fn(); // Cordis runs effects on registration
    },
    get: (serviceName) =>
      serviceName === "locale" ? ctx.locale : serviceName === "slots" ? ctx.slots : undefined,
  };
  return ctx;
}

/**
 * Execute lib/client.js inside a fake `window` and return the loaded modules
 * keyed by id. The file is a classic script that calls
 * window.__ModuleLoader__.load({ id, factory }), so it runs under vm.
 * @param absolutePath Absolute path to lib/client.js.
 * @returns Map of module id -> exports.
 */
export function loadClientModule(absolutePath) {
  const modules = new Map();
  const window = {
    __ModuleLoader__: {
      load({ id, factory }) {
        const require = (spec) => {
          if (spec === "react") return reactStub;
          throw new Error("Unhandled require in client module: " + spec);
        };
        modules.set(id, factory(require));
      },
    },
  };
  const code = fs.readFileSync(absolutePath, "utf8");
  vm.runInNewContext(code, { window, console }, { filename: absolutePath });
  return modules;
}