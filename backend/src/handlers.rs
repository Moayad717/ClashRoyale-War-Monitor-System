use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use std::sync::{Arc, Mutex};

use crate::analytics;
use crate::models::*;

// Query parameters for dashboard endpoint
#[derive(Deserialize)]
pub struct DashboardQuery {
    pub season: i32,
    #[serde(default = "default_true")]
    pub exclude_colosseum: bool,
    pub colosseum_war: Option<i32>,
    #[serde(default = "default_threshold")]
    pub threshold: f32,
}

fn default_true() -> bool {
    true
}
fn default_threshold() -> f32 {
    75.0
}

// Query parameters for heatmap endpoint
#[derive(Deserialize)]
pub struct HeatmapQuery {
    pub season: i32,
    #[serde(default = "default_true")]
    pub exclude_colosseum: bool,
    pub colosseum_war: Option<i32>,
}

// Query parameters for player endpoint
#[derive(Deserialize)]
pub struct PlayerQuery {
    pub season: i32,
}

// Health check handler
pub async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
    })
}

// Get available seasons
pub async fn get_seasons(
    Extension(state): Extension<Arc<Mutex<Vec<CsvWarRecord>>>>,
) -> Result<Json<SeasonsResponse>, StatusCode> {
    let records = state
        .lock()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let seasons = analytics::get_available_seasons(&records);

    Ok(Json(SeasonsResponse { seasons }))
}

// Get season summary
pub async fn get_season_summary(
    Path(season_id): Path<i32>,
    Extension(state): Extension<Arc<Mutex<Vec<CsvWarRecord>>>>,
) -> Result<Json<SeasonSummary>, StatusCode> {
    let records = state
        .lock()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Detect colosseum
    let (colosseum_war, detection_status) =
        analytics::detect_colosseum_war(&records, season_id, None);

    // Get war summaries
    let wars = analytics::get_war_summaries(&records, season_id);
    let total_wars = wars.len() as i32;

    let summary = SeasonSummary {
        season_id,
        wars,
        total_wars,
        colosseum_war,
        detection_status,
    };

    Ok(Json(summary))
}

// Get dashboard data (MAIN ENDPOINT)
pub async fn get_dashboard(
    Query(params): Query<DashboardQuery>,
    Extension(state): Extension<Arc<Mutex<Vec<CsvWarRecord>>>>,
) -> Result<Json<DashboardResponse>, StatusCode> {
    let records = state
        .lock()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Detect colosseum
    let (colosseum_war, detection_status) = analytics::detect_colosseum_war(
        &records,
        params.season,
        params.colosseum_war,
    );

    // Calculate player stats
    let players = analytics::calculate_player_season_stats(
        &records,
        params.season,
        params.exclude_colosseum,
        colosseum_war,
    );

    // Filter low performers
    let low_performers = analytics::filter_low_performers(&players, params.threshold);

    // Build season summary
    let wars = analytics::get_war_summaries(&records, params.season);
    let total_wars = wars.len() as i32;

    let season = SeasonSummary {
        season_id: params.season,
        wars,
        total_wars,
        colosseum_war,
        detection_status,
    };

    let response = DashboardResponse {
        season,
        players,
        low_performers,
    };

    Ok(Json(response))
}

// Get heatmap data
pub async fn get_heatmap(
    Query(params): Query<HeatmapQuery>,
    Extension(state): Extension<Arc<Mutex<Vec<CsvWarRecord>>>>,
) -> Result<Json<HeatmapData>, StatusCode> {
    let records = state
        .lock()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Detect colosseum if needed
    let (colosseum_war, _) = analytics::detect_colosseum_war(
        &records,
        params.season,
        params.colosseum_war,
    );

    let heatmap = analytics::get_heatmap_data(
        &records,
        params.season,
        params.exclude_colosseum,
        colosseum_war,
    );

    Ok(Json(heatmap))
}

// Get individual player details
pub async fn get_player(
    Path(player_tag): Path<String>,
    Query(params): Query<PlayerQuery>,
    Extension(state): Extension<Arc<Mutex<Vec<CsvWarRecord>>>>,
) -> Result<Json<PlayerSeasonStats>, StatusCode> {
    let records = state
        .lock()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Calculate all player stats
    let players = analytics::calculate_player_season_stats(&records, params.season, false, None);

    // Find the specific player
    let player = players
        .into_iter()
        .find(|p| p.player_tag == player_tag)
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(player))
}
