# dsh-plugin-template

Blank project for building plugins on the **DSH** (DeepSeek Harness) harness.
Start from here: rename it, then delete what you don't need.

Built on the real anatomy of the reference plugins
(`dsh-plugin-caveman-mode`, `dsh-plugin-coding-styles`,
`dsh-credit-meter`, `dsh-sound-notify`).

## Structure

| File | Role |
|---|---|
| `lib/index.js` | **Host** node (Cordis): `systemPrompt` section, `/template` command, lifecycle hooks, `settings` namespace for the client. Config validated at load (`resolveConfig`). |
| `lib/client.js` | **Browser** half (web): a row in General settings, synced with the host namespace via `settingsScope`, i18n dictionaries, UI slot. |
| `cordis.patch.yml` | Row that inserts the plugin into the profile; config defaults are changed here (or in the profile's own `cordis.patch.yml`, which takes precedence). |
| `package.json` | `exports` (`.` + `./client` + `./cordis.patch.yml`), `dsh.bundle.patch`, `dsh.client` (web platform + client module injects). |

## Included surfaces (one each, removable)

1. **`systemPrompt` section** — `text` as a function: toggled from config at runtime, no restart.
2. **`/template` command** — registered via optional `commands` injection (`on|off|status|hello`).
3. **Lifecycle hooks** — `ctx.on("ready" / "dispose")` + `ctx.effect` for cleanup.
4. **Settings namespace + client** — host↔browser shared config, UI row in `settings.general.item`.

## Dev loop

From the profile that runs the web app (the folder where `dsh` boots):

```
dsh plugin add .            # self-link from the plugin checkout
dsh plugin list
```

Edit `lib/index.js` and `cordis.patch.yml`, then restart the profile process
(the web client hot-reloads via `dsh-plugin-hmr`). To remove:

```
dsh plugin remove dsh-plugin-template
```

## Customization checklist

1. Rename the folder and the `name` in `package.json` (e.g. `dsh-plugin-my-thing`).
2. Update `cordis.patch.yml`: `id` and `name` plus the config defaults.
3. Replace the section, command and hooks in `lib/index.js` with your own logic.
4. If you don't need the web UI: remove `lib/client.js` and the `dsh.client`
   block from package.json, and drop the `settings` namespace from the host.
5. If you don't need the command: set `allowCommand: false` or delete the block.
6. Update the `description` and this README.
