import debug from "debug";
import type OpenAI from "openai";

const log = debug("ai18n:translate");

const DEFAULT_TEMPLATE: OpenAI.Chat.ChatCompletionMessageParam[] = [
  {
    role: "user",
    content:
      "I want you to act as an professional translator, spelling corrector and improver. I will speak to you in any language and you will detect the language, translate it and answer in the corrected and improved version of my text. I want you to reply beautiful, elegant, upper level words and sentences. You do not need to translate everything, keep specific abbreviations or terminologies inact. Keep the meaning and the structure same. Keep code blocks untranslated and compilable. I want you to only reply the correction, the improvements and nothing else, do not write explanations.",
  },
  {
    role: "assistant",
    content: "Understood.",
  },
  {
    role: "user",
    content: "# 範例\n\n許多人還在使用 `var`，但這是**不好**的！\n---\n[en]",
  },
  {
    role: "assistant",
    content:
      "# Example\n\nMany people are still using `var`, but this is **undesirable**!",
  },
  {
    role: "user",
    content: "${content}\n---\n[${to}]",
  },
];

export async function translate(
  api: OpenAI,
  content: string,
  to: string,
  template: OpenAI.Chat.ChatCompletionMessageParam[] = DEFAULT_TEMPLATE,
): Promise<string> {
  const messages = template.map((m) => ({
    role: m.role,
    content: build(m.content as string, { to, content }),
    ...((m as any).name && { name: (m as any).name }), // Include name if it exists
  }));
  log("translate", { content, to, messages });

  const res: OpenAI.Chat.ChatCompletion = await api.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    messages,
    temperature: 0,
  });

  log("translate usage", res.usage);
  const translated = res.choices[0].message?.content;
  if (!translated) {
    throw new Error("No translation returned.");
  }

  log("translated", translated);
  return translated;
}

function build(template: string, dict: Record<string, string>): string {
  return template.replace(/\${([^}]+)}/g, (_, key) => dict[key] || "");
}
