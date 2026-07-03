use enigo::{Direction, Enigo, Key, Keyboard, Settings};
use std::thread;
use std::time::Duration;
use tauri::AppHandle;
use tauri_plugin_clipboard_manager::ClipboardExt;

#[tauri::command]
pub async fn grab_selected_text(app: AppHandle) -> Result<String, String> {
    let previous = app.clipboard().read_text().unwrap_or_default();

    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    enigo.key(Key::Control, Direction::Press).map_err(|e| e.to_string())?;
    enigo.key(Key::Unicode('c'), Direction::Click).map_err(|e| e.to_string())?;
    enigo.key(Key::Control, Direction::Release).map_err(|e| e.to_string())?;

    thread::sleep(Duration::from_millis(200));

    let text = app.clipboard().read_text().unwrap_or_default();

    let _ = app.clipboard().write_text(previous);

    Ok(text)
}
