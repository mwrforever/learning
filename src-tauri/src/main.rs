#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod file;
mod commands;
mod shortcuts;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            shortcuts::register_shortcuts(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::read_file,
            commands::write_file,
            commands::save_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
