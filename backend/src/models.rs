use serde::{Deserialize, Serialize};

// CSV Input Record
#[derive(Debug, Deserialize, Clone)]
pub struct CsvWarRecord {
    pub season_key: String,
    pub season_id: i32,
    pub clan_rank: i32,
    pub clan_fame: i32,
    pub player_name: String,
    pub player_tag: String,
    pub player_fame: i32,
    pub player_decks_used: i32,
}

// Performance Level Enum
#[derive(Debug, Serialize, Clone, Copy, PartialEq)]
pub enum PerformanceLevel {
    Perfect,
    Excellent,
    Good,
    Mid,
    BelowAvg,
    Poor,
    Inactive,
}

impl PerformanceLevel {
    pub fn from_fame(fame: i32) -> Self {
        match fame {
            3600 => Self::Perfect,
            3000..=3599 => Self::Excellent,
            2700..=2999 => Self::Good,
            2500..=2699 => Self::Mid,
            2000..=2499 => Self::BelowAvg,
            1..=1999 => Self::Poor,
            0 => Self::Inactive,
            _ => Self::Poor,
        }
    }
}

// API Response Models
#[derive(Debug, Serialize, Clone)]
pub struct PlayerWarStats {
    pub war_number: i32,
    pub player_name: String,
    pub player_tag: String,
    pub fame: i32,
    pub decks_used: i32,
    pub performance: PerformanceLevel,
    pub participation_pct: f32,
}

#[derive(Debug, Serialize, Clone)]
pub struct PlayerSeasonStats {
    pub player_name: String,
    pub player_tag: String,
    pub total_fame: i32,
    pub total_decks_used: i32,
    pub wars_participated: i32,
    pub avg_fame_per_war: f32,
    pub participation_pct: f32,
    pub performance: PerformanceLevel,
    pub war_breakdown: Vec<PlayerWarStats>,
}

#[derive(Debug, Serialize, Clone)]
pub struct WarSummary {
    pub war_number: i32,
    pub clan_fame: i32,
    pub clan_rank: i32,
    pub players_count: i32,
}

#[derive(Debug, Serialize)]
pub struct SeasonSummary {
    pub season_id: i32,
    pub wars: Vec<WarSummary>,
    pub total_wars: i32,
    pub colosseum_war: Option<i32>,
    pub detection_status: String,
}

#[derive(Debug, Serialize)]
pub struct DashboardResponse {
    pub season: SeasonSummary,
    pub players: Vec<PlayerSeasonStats>,
    pub low_performers: Vec<PlayerSeasonStats>,
}

#[derive(Debug, Serialize)]
pub struct HeatmapData {
    pub players: Vec<String>,
    pub wars: Vec<i32>,
    pub data: Vec<Vec<i32>>,
}

#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub status: String,
}

#[derive(Debug, Serialize)]
pub struct SeasonsResponse {
    pub seasons: Vec<i32>,
}
