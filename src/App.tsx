import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Sparkles } from "lucide-react";
import { useAppStore } from "./lib/store";
import SettingsPanel from "./components/SettingsPanel";
import TemplateEditor from "./components/TemplateEditor";

type Tab = "settings" | "templates";

function App() {
  const store = useAppStore();
  const [showSettings, setShowSettings] = useState(false);
  const [tab, setTab] = useState<Tab>("settings");

  useEffect(() => {
    store.init();
  }, []);

  const handleHide = async () => {
    try {
      await getCurrentWindow().hide();
    } catch {}
  };

  if (!store.initialized) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        加载中...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-800">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h1 className="font-semibold text-base">提示词框架</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTab("settings")}
            className={`px-3 py-1 text-sm rounded ${
              tab === "settings" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            基本
          </button>
          <button
            onClick={() => setTab("templates")}
            className={`px-3 py-1 text-sm rounded ${
              tab === "templates" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            模板
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {tab === "settings" ? <SettingsPanel onClose={handleHide} embedded /> : <TemplateEditor />}
      </main>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default App;
