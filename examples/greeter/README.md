# dsh-plugin-greeter-example

A complete, minimal plugin built from the template. Read `lib/index.js` and
`lib/client.js` top to bottom: every block maps to one surface of the
template (prompt section, settings namespace, lifecycle hooks, command, client
settings row).

## What it does

- Adds a **`greeter:policy` system-prompt section** ("Be warm and friendly…")
- Registers the **`/greet [name]` command** → `Hello, <name>!`
- Exposes a **settings namespace** (`greeter-example`) with the default
  greeting name, editable from a **General settings row** in the web UI

## Install

From the profile that runs the web app:

```
dsh plugin add ../examples/greeter
```

## Surfaces used (and where)

| Surface | Where |
|---|---|
| `systemPrompt.section` | `lib/index.js` → `apply`, step 1 |
| `settings.register` | `lib/index.js` → `apply`, step 2 |
| `ctx.on("ready" / "dispose")` | `lib/index.js` → `apply`, step 3 |
| `commands.register` | `lib/index.js` → `apply`, step 4 |
| `settingsScope` + `locale` + `slots` | `lib/client.js` |
