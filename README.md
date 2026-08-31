# dsh-plugin-template

Blank project for building plugins on the **DSH** (DeepSeek Harness) harness.
Start from here: rename it, then delete what you don't need.

Comes with a zero-dependency **micro unit-test framework** (`node:test` +
fake-ctx helpers) and a **micro eval framework** (deterministic behavior
evals, plus opt-in LLM evals).

## Structure

| Path | Role |
|---|---|
| `lib/index.js` | **Host** wiring (Cordis): `systemPrompt` section, `/template` command, lifecycle hooks, settings namespace. Pure logic lives in the files below. |
| `lib/config.js` | Pure config domain: `resolveConfig`, `templateSchema`, namespace brand. Unit-tested directly. |
| `lib/handlers.js` | Pure handlers: policy-section text factory and command handler. Unit-tested directly. |
| `lib/client.js` | **Browser** half (web): settings row synced with the host namespace, i18n dictionaries, UI slot. |
| `test/helpers.mjs` | Micro test framework: fake `ctx`, command runner, `window.__ModuleLoader__` shim, fake client services. |
| `test/*.test.mjs` | Unit tests: config domain, host wiring, browser half. |
| `eval/framework.mjs` + `eval/run.mjs` | Micro eval framework: behavior evals (free) + LLM evals (opt-in). |
| `eval/cases/` | Example eval cases (behavior + llm). |
| `examples/greeter/` | Complete worked example plugin, commented block by block. |
| `docs/surfaces.md` | Copy-paste snippets for extra surfaces (tool, HTTP route, UI slots). |
| `cordis.patch.yml` | Row that inserts the plugin into the profile; config defaults are changed here (or in the profile's own `cordis.patch.yml`, which takes precedence). |
| `package.json` | `exports` (`.` + `./client` + `./cordis.patch.yml`), `dsh.bundle.patch`, `dsh.client`, scripts (`check`, `test`, `eval`, `eval:llm`). |

## Included surfaces (one each, removable)

1. **`systemPrompt` section** — `text` as a function: toggled from config at runtime, no restart.
2. **`/template` command** — registered via optional `commands` injection (`on|off|status|hello`).
3. **Lifecycle hooks** — `ctx.on("ready" / "dispose")` + `ctx.effect` for cleanup.
4. **Settings namespace + client** — host↔browser shared config, UI row in `settings.general.item`.

## Compatibility

Built and verified against **DSH 0.1.1-rc.2** (the channel the current harness
runs on). Peer dependency ranges:

| Package | Range |
|---|---|
| `@deepseek-ai/cordis` | `^4.0.1` |
| `@deepseek-ai/dsh-system-prompt` | `^0.1.1-rc.2` |

Client modules are injected by name (`dsh.client.inject`) and resolved from the
web app bundle, so they need no version pin.

## Testing

Zero dependencies: Node's built-in test runner + the helpers in
`test/helpers.mjs`.

```
npm test          # node --test test/
npm run check     # node --check on every JS/MJS file
```

The helpers let tests drive the real plugin entry point without booting DSH:
`createFakeCtx()` records what `apply(ctx, config)` registers (sections,
commands, namespaces, hooks, effects), `runCommand(ctx, name, input)` invokes
a registered command handler, and `loadClientModule()` runs `lib/client.js`
inside a fake `window` so the browser half is testable too. New tests are
just files named `*.test.mjs` under `test/`.

## Evals

```
npm run eval         # behavior evals (deterministic, free)
npm run eval:llm     # + LLM evals (needs DEEPSEEK_API_KEY, costs tokens)
```

- **Behavior evals** (`eval/cases/behavior.mjs`): scenario checks that run
  `apply()` against the fake ctx — e.g. "the section renders only while
  enabled", "the command toggles it at runtime". Free, CI-safe.
- **LLM evals** (`eval/cases/llm.mjs`): send real prompts with the plugin's
  policy section as system prompt, then run checks
  (`include` / `exclude` / `regex` / `length-lte` / `length-gte`) on the
  output. Gated behind `--llm`; prints tokens and estimated cost. Override
  with `EVAL_MODEL` (default `deepseek-chat`) and `EVAL_BASE_URL`.

New cases are just exported entries in files under `eval/cases/`.

## Example

`examples/greeter/` is a complete plugin (prompt section + `/greet` command
+ settings row) built from this template, commented block by block. Install
it from the profile: `dsh plugin add ../examples/greeter`.

## CI

`.github/workflows/ci.yml` runs `npm run check`, `npm test` and
`npm run eval` on every push and pull request — free, no tokens. LLM evals
stay out of CI.

## Dev loop

From the profile that runs the web app (the folder where `dsh` boots):

```
dsh plugin add .            # self-link from the plugin checkout
dsh plugin list
```

Edit `lib/*.js` and `cordis.patch.yml`, then restart the profile process
(the web client hot-reloads via `dsh-plugin-hmr`). To remove:

```
dsh plugin remove dsh-plugin-template
```

## Customization checklist

1. Rename the folder and the `name` in `package.json` (e.g. `dsh-plugin-my-thing`).
2. Update `cordis.patch.yml`: `id` and `name` plus the config defaults.
3. Replace the section, command and hooks in `lib/index.js` with your own logic;
   keep pure logic in `lib/config.js` / `lib/handlers.js` so it stays testable.
4. If you don't need the web UI: remove `lib/client.js` and the `dsh.client`
   block from package.json, and drop the `settings` namespace from the host.
5. If you don't need the command: set `allowCommand: false` or delete the block.
6. Update the `description` and this README.
