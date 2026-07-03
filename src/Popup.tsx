import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { Check, Copy, Loader2, Sparkles, X } from "lucide-react";
import { useAppStore } from "./lib/store";
import { builtInTemplates } from "./lib/templates";
import { streamPrompt, buildSystemPrompt } from "./lib/ai";
import { setClipboardText } from "./lib/clipboard";

type Status = "idle" | "loading" | "streaming" | "done" | "error";

function Popup() {
  const store = useAppStore();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastReportedHeight = useRef(0);

  useEffect(() => {
    store.init();
  }, []);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const report = () => {
      const h = el.scrollHeight;
      if (Math.abs(h - lastReportedHeight.current) < 2) return;
      lastReportedHeight.current = h;
      const rect = el.getBoundingClientRect();
      invoke("resize_popup", { width: rect.width, height: h }).catch(() => {});
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [store.initialized, status]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      await store.init();
      if (cancelled) return;
      const text = await invoke<string | null>("get_popup_text");
      if (cancelled) return;
      if (text !== null && text !== undefined) {
        setInput(text);
        doGenerate(text);
      } else {
        setInput("");
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const doGenerate = async (text: string) => {
    if (!store.initialized) {
      await store.init();
    }

    if (!text.trim()) {
      setOutput("未抓到选中的文字。\n\n请在任意应用中先选中文字，再按 " + store.hotkey + "。");
      setStatus("error");
      return;
    }

    const template = store.getTemplate();
    const settings = {
      apiBaseUrl: store.apiBaseUrl,
      apiKey: store.apiKey,
      model: store.model,
    };

    if (!settings.apiKey) {
      setOutput("请先在设置里配置 API Key。");
      setStatus("error");
      try {
        await invoke("show_settings_window");
      } catch {}
      return;
    }

    if (!text.trim()) {
      setOutput("未抓到选中的文字。请在任意应用中先选中文字，再按快捷键。");
      setStatus("error");
      return;
    }

    abortRef.current?.abort();
    setStatus("streaming");
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
      setStatus("done");
      if (store.autoCopyOnDone) {
        await doCopy();
      }
    } catch (err) {
      setOutput((prev) => prev + "\n\n[错误] " + (err as Error).message);
      setStatus("error");
    } finally {
      abortRef.current = null;
    }
  };

  const doCopy = async () => {
    if (!output) return;
    await setClipboardText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRegenerate = () => {
    if (input) doGenerate(input);
  };

  const handleClose = async () => {
    abortRef.current?.abort();
    try {
      await getCurrentWindow().close();
    } catch {}
  };

  const statusLabel: Record<Status, string> = {
    idle: "等待中",
    loading: "调用中…",
    streaming: "生成中",
    done: "已完成",
    error: "出错了",
  };

  const statusDot: Record<Status, string> = {
    idle: "bg-gray-300",
    loading: "bg-amber-400 animate-pulse",
    streaming: "bg-blue-500 animate-pulse",
    done: "bg-emerald-500",
    error: "bg-red-500",
  };

  return (
    <div
      ref={containerRef}
      className="bg-white text-gray-800 antialiased"
      style={{ overflow: "hidden" }}
    >
      <div
        data-tauri-drag-region
        className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-800 truncate">提示词框架</span>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[status]}`} />
              <span className="text-[10px] text-gray-400 truncate">{statusLabel[status]}</span>
            </div>
            <select
              value={store.selectedTemplateId}
              onChange={(e) => store.setSettings({ selectedTemplateId: e.target.value })}
              className="text-[10px] text-gray-500 bg-transparent border-0 outline-none cursor-pointer hover:text-gray-800 max-w-[180px] truncate"
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
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700"
            title="关闭"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-3 min-h-[44px] flex items-center">
        {status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
            <span>调用中…</span>
          </div>
        )}
        {status === "streaming" && output === "" && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
            <span>等待响应…</span>
          </div>
        )}
        {status === "idle" && (
          <div className="text-sm text-gray-400">等待中…</div>
        )}
        {status === "error" && !output && (
          <div className="text-sm text-red-500">出错了</div>
        )}
        {(status === "streaming" || status === "done" || (status === "error" && output)) && (
          <pre className="w-full text-[13px] leading-relaxed text-gray-800 whitespace-pre-wrap break-words font-sans">
            {output}
            {status === "streaming" && (
              <span className="inline-block w-1.5 h-3.5 bg-blue-500 ml-0.5 align-middle animate-pulse" />
            )}
          </pre>
        )}
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/60">
        <div className="text-[10px] text-gray-400 truncate">
          {input ? `${input.length} 字 · ${statusLabel[status]}` : "无原文"}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleRegenerate}
            disabled={status === "loading" || status === "streaming" || !input}
            className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-800 hover:bg-white rounded disabled:opacity-30 disabled:hover:bg-transparent"
          >
            重新生成
          </button>
          <button
            onClick={doCopy}
            disabled={!output || status === "loading" || status === "streaming"}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-gray-900"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "已复制" : "复制"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Popup;
