use tauri::{AppHandle};

pub fn register_shortcuts(handle: AppHandle) {
    handle.global_shortcut("CommandOrControl+S", move |_| {
        handle.emit_all("save-request", ()).ok();
    }).ok();
    
    handle.global_shortcut("CommandOrControl+`", move |_| {
        handle.emit_all("toggle-view", ()).ok();
    }).ok();
}
