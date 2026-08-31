# dsh-plugin-template

Blank project per creare plugin sull'harness **DSH** (DeepSeek Harness).
Parti da qui, rinomina, cancella ciò che non ti serve.

Basato sull'anatomia reale dei plugin di riferimento
(`dsh-plugin-caveman-mode`, `dsh-plugin-coding-styles`,
`dsh-credit-meter`, `dsh-sound-notify`).

## Struttura

| File | Ruolo |
|---|---|
| `lib/index.js` | Nodo **host** (Cordis): sezione `systemPrompt`, comando `/template`, hook di lifecycle, namespace `settings` per il client. Config validata al load (`resolveConfig`). |
| `lib/client.js` | Metà **browser** (web): riga nel General settings, sincronizzata col namespace host via `settingsScope`, dizionari i18n, slot UI. |
| `cordis.patch.yml` | Riga che inserisce il plugin nel profile; i default di config si cambiano qui (o nel `cordis.patch.yml` del profile, che ha priorità). |
| `package.json` | `exports` (`.` + `./client` + `./cordis.patch.yml`), `dsh.bundle.patch`, `dsh.client` (platform web + inject dei moduli client). |

## Superfici incluse (una ciascuna, eliminabili)

1. **Sezione `systemPrompt`** — `text` come funzione: si accende/spegne da config a runtime, senza restart.
2. **Comando `/template`** — registrato via inject opzionale di `commands` (`on|off|status|hello`).
3. **Hook di lifecycle** — `ctx.on("ready" / "dispose")` + `ctx.effect` per il cleanup.
4. **Namespace settings + client** — config condivisa host↔browser, riga UI in `settings.general.item`.

## Dev loop

Dal profile che fa girare la web app (la cartella con `dsh` boot):

```
dsh plugin add .            # self-link dalla checkout del plugin
dsh plugin list
```

Modifica `lib/index.js` e `cordis.patch.yml`, poi riavvia il processo del
profile (il client web ha HMR via `dsh-plugin-hmr`). Per rimuovere:

```
dsh plugin remove dsh-plugin-template
```

## Checklist di personalizzazione

1. Rinomina la cartella e il `name` in `package.json` (es. `dsh-plugin-my-thing`).
2. Aggiorna `cordis.patch.yml`: `id` e `name` + i default di config.
3. Sostituisci sezione, comando e hook in `lib/index.js` con la tua logica.
4. Se non ti serve la UI web: elimina `lib/client.js` e il blocco `dsh.client`
   dal package.json, e togli il namespace `settings` dall'host.
5. Se non ti serve il comando: `allowCommand: false` o cancella il blocco.
6. Aggiorna `description` e questo README.
