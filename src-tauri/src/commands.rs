use std::fs;
use std::path::Path;

#[derive(Debug, Clone, serde::Serialize)]
pub struct FileInfo {
    pub content: String,
    pub file_type: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct DirectoryEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
}

#[tauri::command]
pub fn read_file(path: String) -> Result<FileInfo, String> {
    let path_obj = Path::new(&path);
    if !path_obj.exists() {
        return Err("文件不存在".to_string());
    }

    let content = fs::read_to_string(&path).map_err(|e| format!("读取失败: {}", e))?;

    let ext = path_obj
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("txt");

    let file_type = match ext.to_lowercase().as_str() {
        "md" | "markdown" => "markdown",
        "html" | "htm" => "html",
        _ => "text",
    };

    Ok(FileInfo { content, file_type: file_type.to_string() })
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| format!("写入失败: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn read_directory(path: String) -> Result<Vec<DirectoryEntry>, String> {
    let mut entries: Vec<DirectoryEntry> = Vec::new();
    let mut dir = tokio::fs::read_dir(&path)
        .await
        .map_err(|e| e.to_string())?;

    while let Some(item) = dir.next_entry().await.map_err(|e| e.to_string())? {
        let metadata = item.metadata().await.map_err(|e| e.to_string())?;
        entries.push(DirectoryEntry {
            name: item.file_name().to_string_lossy().to_string(),
            path: item.path().to_string_lossy().to_string(),
            is_directory: metadata.is_dir(),
        });
    }

    Ok(entries)
}

#[tauri::command]
pub fn create_file(path: String) -> Result<(), String> {
    let path_obj = Path::new(&path);
    if path_obj.exists() {
        return Err("文件已存在".to_string());
    }
    fs::write(&path, "").map_err(|e| format!("创建文件失败: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn create_directory(path: String) -> Result<(), String> {
    let path_obj = Path::new(&path);
    if path_obj.exists() {
        return Err("目录已存在".to_string());
    }
    fs::create_dir_all(&path).map_err(|e| format!("创建目录失败: {}", e))?;
    Ok(())
}
