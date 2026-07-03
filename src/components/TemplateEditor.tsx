import { useState } from "react";
import { ArrowLeft, Copy, Plus, Save, Trash2 } from "lucide-react";
import { useAppStore } from "../lib/store";
import { builtInTemplates, defaultTemplate } from "../lib/templates";
import { PromptTemplate, TemplateField } from "../types";

type Mode = "list" | "edit";

export default function TemplateEditor() {
  const store = useAppStore();
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<PromptTemplate | null>(null);
  const [isNew, setIsNew] = useState(false);

  const allTemplates = (): { id: string; tpl: PromptTemplate; builtIn: boolean }[] => {
    const built = builtInTemplates.map((t) => ({
      id: t.id,
      tpl: store.builtInOverrides[t.id] || t,
      builtIn: true,
    }));
    const custom = store.customTemplates.map((t) => ({
      id: t.id,
      tpl: t,
      builtIn: false,
    }));
    return [...built, ...custom];
  };

  const handleNew = () => {
    const newTpl: PromptTemplate = {
      id: `custom-${Date.now()}`,
      name: "新模板",
      description: "自定义模板",
      fields: [
        { key: "task", label: "任务", instruction: "明确要做什么" },
      ],
      output: `## 任务\n{{task}}\n`,
    };
    setEditing(newTpl);
    setIsNew(true);
    setMode("edit");
  };

  const handleEdit = (tpl: PromptTemplate, _builtIn: boolean) => {
    setEditing({ ...tpl });
    setIsNew(false);
    setMode("edit");
  };

  const handleClone = (tpl: PromptTemplate) => {
    const newTpl: PromptTemplate = {
      ...tpl,
      id: `custom-${Date.now()}`,
      name: `${tpl.name} (副本)`,
    };
    setEditing(newTpl);
    setIsNew(true);
    setMode("edit");
  };

  const handleDelete = async (id: string, builtIn: boolean) => {
    if (!confirm("确定删除这个模板？")) return;
    if (builtIn) {
      const overrides = { ...store.builtInOverrides };
      delete overrides[id];
      await store.setSettings({ builtInOverrides: overrides });
    } else {
      const next = store.customTemplates.filter((t) => t.id !== id);
      const update: Partial<typeof store> = { customTemplates: next };
      if (store.selectedTemplateId === id) {
        (update as Record<string, unknown>).selectedTemplateId = defaultTemplate.id;
      }
      await store.setSettings(update as never);
    }
  };

  const handleResetBuiltIn = async (id: string) => {
    const overrides = { ...store.builtInOverrides };
    delete overrides[id];
    await store.setSettings({ builtInOverrides: overrides });
  };

  const handleSave = async () => {
    if (!editing) return;
    if (isNew) {
      await store.setSettings({
        customTemplates: [...store.customTemplates, editing],
        selectedTemplateId: editing.id,
      });
    } else if (store.customTemplates.find((t) => t.id === editing.id)) {
      await store.setSettings({
        customTemplates: store.customTemplates.map((t) =>
          t.id === editing.id ? editing : t
        ),
      });
    } else {
      const isBuiltIn = builtInTemplates.find((t) => t.id === editing.id);
      if (isBuiltIn) {
        const overrides = { ...store.builtInOverrides, [editing.id]: editing };
        await store.setSettings({ builtInOverrides: overrides });
      }
    }
    setMode("list");
    setEditing(null);
  };

  const handleCancel = () => {
    setMode("list");
    setEditing(null);
    setIsNew(false);
  };

  const updateField = (idx: number, patch: Partial<TemplateField>) => {
    if (!editing) return;
    const fields = [...editing.fields];
    fields[idx] = { ...fields[idx], ...patch };
    setEditing({ ...editing, fields });
  };

  const addField = () => {
    if (!editing) return;
    const key = `field_${editing.fields.length + 1}`;
    setEditing({
      ...editing,
      fields: [...editing.fields, { key, label: "新字段", instruction: "" }],
    });
  };

  const removeField = (idx: number) => {
    if (!editing) return;
    setEditing({
      ...editing,
      fields: editing.fields.filter((_, i) => i !== idx),
    });
  };

  if (mode === "edit" && editing) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Save className="w-4 h-4" /> 保存
          </button>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">模板名称</label>
          <input
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">描述</label>
          <input
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">字段</h3>
            <button
              onClick={addField}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3 h-3" /> 添加字段
            </button>
          </div>
          <div className="space-y-2">
            {editing.fields.map((f, i) => (
              <div key={i} className="border border-gray-200 rounded-md p-2.5 space-y-1.5">
                <div className="flex gap-2">
                  <input
                    value={f.key}
                    onChange={(e) => updateField(i, { key: e.target.value })}
                    placeholder="key"
                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 font-mono"
                  />
                  <input
                    value={f.label}
                    onChange={(e) => updateField(i, { label: e.target.value })}
                    placeholder="显示名"
                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                  />
                  <button
                    onClick={() => removeField(i)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  value={f.instruction}
                  onChange={(e) => updateField(i, { instruction: e.target.value })}
                  placeholder="AI 提取这个字段时的提示语"
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                />
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            字段 key 用于在输出格式中引用，例如 {"{{task}}"}
          </p>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">输出格式</label>
          <textarea
            value={editing.output}
            onChange={(e) => setEditing({ ...editing, output: e.target.value })}
            rows={10}
            className="w-full text-xs border border-gray-300 rounded-md px-2.5 py-1.5 font-mono leading-relaxed"
          />
          <p className="mt-1 text-xs text-gray-400">
            用 {"{{key}}"} 引用上面的字段，AI 会按此格式输出
          </p>
        </div>
      </div>
    );
  }

  const list = allTemplates();

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-700">模板管理</h2>
        <button
          onClick={handleNew}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> 新建模板
        </button>
      </div>

      <ul className="space-y-2">
        {list.map(({ id, tpl, builtIn }) => {
          const isOverridden = builtIn && store.builtInOverrides[id];
          const isSelected = store.selectedTemplateId === id;
          return (
            <li
              key={id}
              className={`border rounded-md p-3 ${
                isSelected ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-800">
                      {tpl.name}
                    </span>
                    {builtIn && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                        内置
                      </span>
                    )}
                    {isOverridden && (
                      <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                        已修改
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                        当前
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{tpl.description}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {tpl.fields.length} 个字段
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => store.setSettings({ selectedTemplateId: id })}
                    className={`px-2 py-1 text-xs rounded ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    {isSelected ? "使用中" : "使用"}
                  </button>
                  {!builtIn && (
                    <button
                      onClick={() => handleClone(tpl)}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                      title="复制为新模板"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(tpl, builtIn)}
                    className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                  >
                    编辑
                  </button>
                  {builtIn && isOverridden && (
                    <button
                      onClick={() => handleResetBuiltIn(id)}
                      className="px-2 py-1 text-xs text-yellow-700 hover:bg-yellow-50 rounded"
                    >
                      重置
                    </button>
                  )}
                  {!builtIn && (
                    <button
                      onClick={() => handleDelete(id, builtIn)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
