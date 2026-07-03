import { useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../lib/store";

interface Props {
  onClose: () => void;
  embedded?: boolean;
}

export default function SettingsPanel({ onClose, embedded = false }: Props) {
  const store = useAppStore();
  const [apiBaseUrl, setApiBaseUrl] = useState(store.apiBaseUrl);
  const [apiKey, setApiKey] = useState(store.apiKey);
  const [model, setModel] = useState(store.model);
  const [hotkey, setHotkey] = useState(store.hotkey);
  const [autoCopyOnDone, setAutoCopyOnDone] = useState(store.autoCopyOnDone);
  const [hotkeyError, setHotkeyError] = useState("");
  const [hotkeyOk, setHotkeyOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const checkHotkey = async () => {
    setHotkeyError("");
    setHotkeyOk(false);
    try {
      await invoke("unregister_shortkey", { accelerator: store.hotkey });
    } catch {}
    try {
      await invoke("register_shortkey", { accelerator: hotkey });
      setHotkeyOk(true);
    } catch (err) {
      setHotkeyError((err as Error).message || "快捷键可能被占用");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await checkHotkey();
      if (hotkeyError) {
        setSaving(false);
        return;
      }
      await store.setSettings({
        apiBaseUrl,
        apiKey,
        model,
        hotkey,
        autoCopyOnDone,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const containerCls = embedded
    ? "p-4"
    : "absolute inset-0 bg-black/30 flex items-center justify-center z-50";

  const cardCls = embedded
    ? "w-full"
    : "bg-white rounded-lg shadow-xl w-[520px] max-h-[90vh] flex flex-col";

  return (
    <div className={containerCls}>
      <div className={cardCls}>
        {!embedded && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-base">设置</h2>
          </div>
        )}

        <div className={embedded ? "space-y-5" : "p-4 overflow-y-auto space-y-5"}>
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-2">AI API</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Base URL</label>
                <input
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">模型</label>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-2">全局快捷键</h3>
            <div className="flex gap-2">
              <input
                value={hotkey}
                onChange={(e) => {
                  setHotkey(e.target.value);
                  setHotkeyError("");
                  setHotkeyOk(false);
                }}
                placeholder="Ctrl+Alt+P"
                className="flex-1 text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={checkHotkey}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                检测
              </button>
            </div>
            {hotkeyError && (
              <div className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5" />
                {hotkeyError}
              </div>
            )}
            {hotkeyOk && (
              <div className="mt-1.5 flex items-center gap-1 text-xs text-green-600">
                <Check className="w-3.5 h-3.5" />
                可用
              </div>
            )}
            <p className="mt-1 text-xs text-gray-400">
              格式示例：Ctrl+Alt+P、Cmd+Shift+T、Alt+Space
            </p>
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-2">浮窗行为</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCopyOnDone}
                onChange={(e) => setAutoCopyOnDone(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">生成完成后自动复制到剪贴板</span>
            </label>
            <p className="mt-1 text-xs text-gray-400">
              开启后，提示词生成完成的瞬间会直接写入剪贴板，可以直接粘贴使用
            </p>
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-2">使用方式</h3>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
              <li>在任意应用里选中文字</li>
              <li>按下快捷键 <span className="font-mono text-blue-600">{hotkey}</span></li>
              <li>鼠标位置弹出小窗，自动生成结构化提示词</li>
              <li>点"复制"即可粘贴使用</li>
            </ol>
          </section>
        </div>

        {!embedded && (
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        )}

        {embedded && (
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存设置"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
