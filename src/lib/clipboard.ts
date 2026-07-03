import { invoke } from "@tauri-apps/api/core";

export async function getClipboardText(): Promise<string> {
  return invoke("get_clipboard_text");
}

export async function setClipboardText(text: string): Promise<void> {
  return invoke("set_clipboard_text", { text });
}
