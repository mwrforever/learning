use std::collections::HashMap;
use std::time::{Duration, Instant};
use crate::file::write_file_content;

#[derive(Debug, Clone)]
pub struct SaveRequest {
    pub path: String,
    pub content: String,
}

pub struct AutoSaveManager {
    pending_saves: HashMap<String, SaveRequest>,
    last_save_time: HashMap<String, Instant>,
}

impl AutoSaveManager {
    pub fn new() -> Self {
        Self {
            pending_saves: HashMap::new(),
            last_save_time: HashMap::new(),
        }
    }
    
    pub fn queue_save(&mut self, request: SaveRequest) {
        self.pending_saves.insert(request.path.clone(), request);
    }
    
    pub fn process_pending(&mut self) -> Vec<Result<(), String>> {
        let mut results = Vec::new();
        let now = Instant::now();
        let debounce_duration = Duration::from_millis(500);
        
        self.pending_saves.retain(|path, request| {
            if let Some(last_time) = self.last_save_time.get(path) {
                if now.duration_since(*last_time) < debounce_duration {
                    return true;
                }
            }
            
            let result = write_file_content(&request.path, &request.content);
            results.push(result);
            self.last_save_time.insert(path.clone(), now);
            false;
        });
        
        results
    }
}

impl Default for AutoSaveManager {
    fn default() -> Self {
        Self::new()
    }
}
