use axum::{routing::get, Extension, Router};
use std::sync::{Arc, Mutex};
use tower_http::cors::CorsLayer;

mod analytics;
mod csv_parser;
mod handlers;
mod models;

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::fmt::init();

    // Load CSV data on startup
    println!("🔄 Loading CSV data...");
    let records = csv_parser::load_csv("data/clan-2Q9Q2CU.csv")
        .expect("Failed to load CSV file. Make sure data/clan-2Q9Q2CU.csv exists!");

    println!("✅ Loaded {} records", records.len());

    // Show available seasons
    let seasons = analytics::get_available_seasons(&records);
    println!("📊 Available seasons: {:?}", seasons);

    // Wrap in Arc<Mutex> for shared state
    let shared_state = Arc::new(Mutex::new(records));

    // Configure CORS for React frontend
    let cors = CorsLayer::permissive(); // Allow all origins for development

    // Build router
    let app = Router::new()
        .route("/health", get(handlers::health))
        .route("/api/seasons", get(handlers::get_seasons))
        .route("/api/seasons/:season_id", get(handlers::get_season_summary))
        .route("/api/dashboard", get(handlers::get_dashboard))
        .route("/api/heatmap", get(handlers::get_heatmap))
        .route("/api/players/:player_tag", get(handlers::get_player))
        .layer(cors)
        .layer(Extension(shared_state));

    // Start server
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap();

    println!("🚀 Server running on {}", addr);
    println!("📡 API endpoints:");
    println!("   GET /health");
    println!("   GET /api/seasons");
    println!("   GET /api/seasons/:season_id");
    println!("   GET /api/dashboard?season=128&exclude_colosseum=true&threshold=75");
    println!("   GET /api/heatmap?season=128");
    println!("   GET /api/players/:player_tag?season=128");

    axum::serve(listener, app).await.unwrap();
}
