export async function* streamPrompt(
  baseURL: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userText: string
): AsyncGenerator<string, void, unknown> {
  const url = baseURL.replace(/\/$/, "") + "/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      stream: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API 错误 ${res.status}: ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("响应体为空");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content;
        if (typeof content === "string" && content.length > 0) {
          yield content;
        }
      } catch {}
    }
  }
}

export function buildSystemPrompt(templateOutput: string, fieldsJson: string): string {
  return `你是一个提示词工程师。用户的输入是零散的描述，请你根据下面这个模板框架，把用户输入整理成结构化的提示词。

模板字段（JSON）：
${fieldsJson}

最终输出格式（严格按此格式，用 {{字段名}} 占位）：
${templateOutput}

要求：
1. 直接输出填充后的最终提示词，不要解释。
2. 如果用户输入缺少某个字段的信息，请根据上下文合理推断并补充。
3. 保持原意，不要添加用户没有要求的内容。
4. 用中文输出。`;
}
