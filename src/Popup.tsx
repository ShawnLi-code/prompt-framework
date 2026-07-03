import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { Check, ChevronDown, ChevronUp, Copy, Loader2, Wand2, X } from "lucide-react";
import { useAppStore } from "./lib/store";
import { builtInTemplates } from "./lib/templates";
import { streamPrompt, buildSystemPrompt } from "./lib/ai";
import { setClipboardText } from "./lib/clipboard";

function Popup() {
  const store = useAppStore();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    store.init();
  }, []);

  useEffect(() => {
    const unlistenP = listen<string>("popup-text", async (event) => {
      const text = event.payload || "";
      setInput(text);
      setOutput("");
      startedRef.current = true;
      await new Promise((r) => setTimeout(r, 50));
      doGenerate(text);
    });
    return () => {
      unlistenP.then((fn) => fn());
      abortRef.current?.abort();
    };
  }, [store.initialized]);

  const doGenerate = async (text: string) => {
    if (!text.trim() || isGenerating) return;
    if (!store.initialized) return;

    const template = store.getTemplate();
    const settings = {
      apiBaseUrl: store.apiBaseUrl,
      apiKey: store.apiKey,
      model: store.model,
    };

    if (!settings.apiKey) {
      setOutput("请先在设置里配置 API Key。");
      try {
        await getCurrentWindow().hide();
        await invoke("show_settings_window");
      } catch {}
      return;
    }

    setIsGenerating(true);
    setOutput("");
    abortRef.current = new AbortController();

    const systemPrompt = buildSystemPrompt(
      template.output,
      JSON.stringify(template.fields, null, 2)
    );

    try {
      for await (const chunk of streamPrompt(
        settings.apiBaseUrl,
        settings.apiKey,
        settings.model,
        systemPrompt,
        text
      )) {
        setOutput((prev) => prev + chunk);
      }
    } catch (err) {
      setOutput((prev) => prev + "\n\n[错误] " + (err as Error).message);
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await setClipboardText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRegenerate = () => {
    if (input && !isGenerating) doGenerate(input);
  };

  const handleClose = async () => {
    abortRef.current?.abort();
    try {
      await getCurrentWindow().close();
    } catch {}
  };

  const handleTemplateChange = (id: string) => {
    store.setSettings({ selectedTemplateId: id });
  };

  if (!store.initialized) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500 text-sm bg-white">
        加载中...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white text-gray-800 select-none">
      <div
        data-tauri-drag-region
        className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Wand2 className="w-4 h-4 text-blue-600 shrink-0" />
          <select
            value={store.selectedTemplateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="text-xs border border-gray-300 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[160px]"
          >
            {builtInTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
            {store.customTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-gray-200 text-gray-500"
          title="关闭"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="border-b border-gray-100">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
          >
            <span>原文（{input.length} 字）</span>
            {showOriginal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showOriginal && (
            <div className="px-3 pb-2 max-h-20 overflow-y-auto text-xs text-gray-600 whitespace-pre-wrap">
              {input || <span className="text-gray-400">（无）</span>}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 bg-gray-50">
          {output ? (
            <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-gray-800">
              {output}
              {isGenerating && <span className="inline-block w-1.5 h-3 bg-blue-500 ml-0.5 animate-pulse" />}
            </pre>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">
              {isGenerating ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  生成中...
                </span>
              ) : (
                "等待生成结果"
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 px-3 py-2 border-t border-gray-200 bg-white">
        <button
          onClick={handleRegenerate}
          disabled={isGenerating || !input.trim()}
          className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded disabled:opacity-40"
        >
          重新生成
        </button>
        <button
          onClick={handleCopy}
          disabled={!output || isGenerating}
          className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "已复制" : "复制"}
        </button>
      </div>
    </div>
  );
}

export default Popup;
