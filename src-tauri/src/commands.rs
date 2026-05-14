use crate::file::{read_file_content, write_file_content};
use tauri::State;
use std::sync::Mutex;

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    let result = read_file_content(&path)?;
    Ok(result.content)
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    write_file_content(&path, &content)?;
    Ok(())
}

#[tauri::command]
pub async fn save_file(path: String, content: String) -> Result<(), String> {
    write_file_content(&path, &content)?;
    Ok(())
}
