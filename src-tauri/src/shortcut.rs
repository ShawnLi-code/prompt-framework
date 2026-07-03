use tauri::AppHandle;
use tauri_plugin_global_shortcut::GlobalShortcutExt;

#[tauri::command]
pub fn register_shortkey(app: AppHandle, accelerator: String) -> Result<(), String> {
    app.global_shortcut()
        .register(accelerator.as_str())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn unregister_shortkey(app: AppHandle, accelerator: String) -> Result<(), String> {
    app.global_shortcut()
        .unregister(accelerator.as_str())
        .map_err(|e| e.to_string())
}
