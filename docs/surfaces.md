# Plugin surfaces cheat sheet

Grounded against the SDK installed with **DSH 0.1.1-rc.2**. Copy the snippet
you need into `lib/index.js` (host) or `lib/client.js` (browser half).

## Host: custom tool (`ctx.tools` + `defineTool`)

From `@deepseek-ai/dsh-tools`. `register` returns a disposer; wire it to
`ctx.effect` so removal cleans up.

```js
import { defineTool } from "@deepseek-ai/dsh-tools";

// In apply(ctx):
const dispose = ctx.tools.register(
  defineTool({
    name: "my_plugin_lookup",
    description: "Look something up by query",
    parameters: { query: { type: "string", description: "Search term" } },
    output: {
      schema: { type: "string" },
      render: (_args, value) => [{ type: "text", text: value }],
    },
    async execute(args) {
      return "result for " + args.query;
    },
  })
);
ctx.effect(() => dispose, "my-plugin: tool");
```

## Host: HTTP route (`webServer`)

Same pattern as the reference implementation: exact-path route, node http
handler, disposer into `ctx.effect`.

```js
ctx.inject(["webServer"], (serverCtx) => {
  const dispose = serverCtx.webServer.register({
    kind: "exact",
    path: "/my-plugin/ping",
    handler: (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    },
  });
  ctx.effect(() => dispose, "my-plugin: route");
});
```

## Host: settings namespace (shared config)

The host owns the schema; the browser half reads/writes it via
`settingsScope`. Schema is a callable with `toJSON` (no schemastery import).

```js
function mySchema(section) {
  const v = section ?? {};
  return { enabled: typeof v.enabled === "boolean" ? v.enabled : true };
}
mySchema.toJSON = () => ({ type: "object", dict: {} });

ctx.inject(["settings"], (settingsCtx) => {
  settingsCtx.settings.register("my-plugin", mySchema);
});
```

## Client: UI slots

Slots are injected by name. Common ones (see the web client packages):

```js
// A whole settings tab (label shows in the sidebar of Settings)
slots.inject("settings.section", () =>
  slots.register(
    {
      name: "settings.section",
      id: "my-plugin",
      order: 90,
      label: () => t("section.nav"),
      locale: NS,
      inject: () => ({ scope }),
    },
    MySettingsSection
  )
);

// A compact row at the bottom of the sidebar (rail mode: same component)
slots.inject("sidebar.footer.action", () =>
  slots.register(
    { name: "sidebar.footer.action", id: "my-plugin", order: 90, locale: NS, inject: () => ({ scope }) },
    SidebarFooterRow
  )
);

// A badge next to the current session title
slots.inject("conversation.session.header.utilities", () =>
  slots.register(
    { name: "conversation.session.header.utilities", id: "my-plugin", order: 90, locale: NS, inject: () => ({ scope }) },
    SessionHeaderBadge
  )
);
```

## Client: i18n dictionaries

```js
ctx.effect(
  () =>
    locale.register(NS, {
      en: { "row.title": "My plugin" },
      // Add more locales here as needed.
    }),
  "my-plugin: dictionaries"
);
const t = locale.bind(NS);
```

## Optional injection pattern

Dependencies that may not be mounted get registered conditionally, so a
composition without them still gets the rest of the plugin:

```js
ctx.inject(["commands"], (commandCtx) => {
  commandCtx.commands.register({ /* ... */ });
});
```

## Not covered here

- **Background jobs** — `ctx.jobs.start(spec)`: `@deepseek-ai/dsh-jobs`
- **Schedules** — durable one-shot/fixed-rate reminders: `@deepseek-ai/dsh-schedule`
- **Skills** — `@deepseek-ai/dsh-skill` and `@deepseek-ai/dsh-skill-filesystem`

Check their type declarations in `node_modules/@deepseek-ai/*` for the exact
APIs of your DSH version.
