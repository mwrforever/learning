use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileContent {
    pub content: String,
    pub file_type: String,
}

pub fn read_file_content(path: &str) -> Result<FileContent, String> {
    let path_obj = Path::new(path);
    
    if !path_obj.exists() {
        return Err("文件不存在".to_string());
    }
    
    let content = fs::read_to_string(path)
        .map_err(|e| format!("读取失败: {}", e))?;
    
    let extension = path_obj
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("txt");
    
    let file_type = match extension {
        "md" => "markdown",
        "html" => "html",
        _ => "text",
    };
    
    Ok(FileContent { content, file_type: file_type.to_string() })
}

pub fn write_file_content(path: &str, content: &str) -> Result<(), String> {
    fs::write(path, content)
        .map_err(|e| format!("写入失败: {}", e))?;
    Ok(())
}
