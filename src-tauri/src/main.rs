// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::read_file,
            commands::write_file,
            commands::read_directory,
            commands::create_file,
            commands::create_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
