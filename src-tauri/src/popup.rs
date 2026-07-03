use std::sync::Mutex;
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindowBuilder};

#[derive(Default)]
pub struct PendingText(pub Mutex<Option<String>>);

#[tauri::command]
pub async fn get_popup_text(app: AppHandle) -> Result<Option<String>, String> {
    let state = app.state::<PendingText>();
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    Ok(guard.take())
}

#[tauri::command]
pub async fn get_mouse_position() -> Result<(i32, i32), String> {
    #[cfg(target_os = "windows")]
    {
        use windows_sys::Win32::Foundation::POINT;
        use windows_sys::Win32::UI::WindowsAndMessaging::GetCursorPos;

        unsafe {
            let mut pt = POINT { x: 0, y: 0 };
            let ok = GetCursorPos(&mut pt);
            if ok != 0 {
                Ok((pt.x, pt.y))
            } else {
                Err("获取鼠标位置失败".to_string())
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("仅支持 Windows".to_string())
    }
}

#[tauri::command]
pub async fn show_popup(app: AppHandle, text: String) -> Result<(), String> {
    {
        let state = app.state::<PendingText>();
        let mut guard = state.0.lock().map_err(|e| e.to_string())?;
        *guard = Some(text);
    }

    if let Some(window) = app.get_webview_window("popup") {
        let _ = window.close();
    }

    let (mx, my) = get_mouse_position().await.unwrap_or((100, 100));

    let mut screen_w = 1920.0_f64;
    let mut screen_h = 1080.0_f64;
    if let Ok(Some(monitor)) = app.primary_monitor() {
        let s = monitor.size();
        let sf = monitor.scale_factor();
        screen_w = (s.width as f64) / sf;
        screen_h = (s.height as f64) / sf;
    }

    let popup_w: f64 = 420.0;
    let popup_h: f64 = 80.0;

    let mut x = (mx as f64) - popup_w / 2.0;
    let mut y = (my as f64) + 20.0;

    if x < 10.0 { x = 10.0; }
    if y + popup_h > screen_h - 10.0 { y = (my as f64) - popup_h - 20.0; }
    if x + popup_w > screen_w - 10.0 { x = screen_w - popup_w - 10.0; }
    if y < 10.0 { y = 10.0; }

    let window = WebviewWindowBuilder::new(
        &app,
        "popup",
        WebviewUrl::App("index.html?window=popup".into()),
    )
    .title("提示词框架")
    .inner_size(popup_w, 80.0)
    .min_inner_size(360.0, 80.0)
    .max_inner_size(800.0, 900.0)
    .position(x, y)
    .decorations(true)
    .always_on_top(true)
    .resizable(true)
    .skip_taskbar(true)
    .focused(true)
    .visible(false)
    .build()
    .map_err(|e| e.to_string())?;

    let _ = window.show();
    let _ = window.set_focus();
    let _ = window.set_size(tauri::Size::Physical(PhysicalSize::new(
        (popup_w * 1.0) as u32,
        80,
    )));
    let _ = window.set_position(tauri::Position::Physical(PhysicalPosition::new(
        x as i32,
        y as i32,
    )));

    Ok(())
}

#[tauri::command]
pub async fn resize_popup(app: AppHandle, width: f64, height: f64) -> Result<(), String> {
    let Some(window) = app.get_webview_window("popup") else { return Ok(()); };
    let mut w = width.max(360.0).min(800.0);
    let mut h = height.max(80.0).min(900.0);

    if let Ok(Some(monitor)) = app.primary_monitor() {
        let s = monitor.size();
        let sf = monitor.scale_factor();
        let screen_w = (s.width as f64) / sf;
        let screen_h = (s.height as f64) / sf;
        if w > screen_w - 20.0 { w = screen_w - 20.0; }
        if h > screen_h - 80.0 { h = screen_h - 80.0; }
    }

    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize::new(w, h)));
    Ok(())
}

#[tauri::command]
pub async fn close_popup(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("popup") {
        let _ = window.close();
    }
    Ok(())
}

#[tauri::command]
pub async fn show_settings_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
    Ok(())
}

pub fn handle_shortcut_event(app: &tauri::AppHandle) {
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let text = crate::grab::grab_selected_text(app.clone())
            .await
            .unwrap_or_default();

        if let Err(e) = show_popup(app.clone(), text).await {
            eprintln!("show_popup failed: {}", e);
        }
    });
}
