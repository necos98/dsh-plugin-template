// LLM evals: measure the plugin's effect on real model output. Opt-in via
// `npm run eval:llm` — needs DEEPSEEK_API_KEY and costs tokens. The system
// prompt below is the template's own policy section, so these cases validate
// that the section actually shapes model behavior.
import { DEFAULT_SECTION } from "../../lib/config.js";

export const cases = [
  {
    kind: "llm",
    name: "policy section keeps answers terse",
    system: DEFAULT_SECTION,
    prompt: "Explain what REST is in one sentence.",
    checks: [{ type: "length-lte", value: 140 }],
  },
  {
    kind: "llm",
    name: "policy section keeps answers terse (open-ended)",
    system: DEFAULT_SECTION,
    prompt: "List the pros and cons of using SQLite for a small CLI tool.",
    checks: [{ type: "length-lte", value: 260 }],
  },
];
