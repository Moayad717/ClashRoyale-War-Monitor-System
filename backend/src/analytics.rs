use crate::models::*;
use std::collections::{HashMap, HashSet};

// Helper to extract war number from season_key
pub fn extract_war_number(season_key: &str) -> i32 {
    season_key
        .split('-')
        .nth(1)
        .and_then(|s| s.parse().ok())
        .unwrap_or(0)
}

// Detect colosseum war
pub fn detect_colosseum_war(
    records: &[CsvWarRecord],
    season_id: i32,
    user_override: Option<i32>,
) -> (Option<i32>, String) {
    // If user manually specified, use that
    if let Some(war_num) = user_override {
        return (Some(war_num), "manual_set".to_string());
    }

    // Get all unique war numbers for this season
    let mut war_numbers: Vec<i32> = records
        .iter()
        .filter(|r| r.season_id == season_id)
        .map(|r| extract_war_number(&r.season_key))
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();

    war_numbers.sort();

    // If 4 or 5 wars exist, last one is colosseum
    if war_numbers.len() >= 4 {
        return (war_numbers.last().copied(), "auto".to_string());
    }

    // If only 3 wars, can't auto-detect
    (None, "manual_required".to_string())
}

// Get unique war numbers from filtered records
pub fn get_unique_war_numbers(records: &[&CsvWarRecord]) -> Vec<i32> {
    let mut wars: Vec<i32> = records
        .iter()
        .map(|r| extract_war_number(&r.season_key))
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();
    wars.sort();
    wars
}

// Calculate player season statistics
pub fn calculate_player_season_stats(
    records: &[CsvWarRecord],
    season_id: i32,
    exclude_colosseum: bool,
    colosseum_war: Option<i32>,
) -> Vec<PlayerSeasonStats> {
    // Filter records by season and optionally exclude colosseum
    let filtered: Vec<_> = records
        .iter()
        .filter(|r| r.season_id == season_id)
        .filter(|r| {
            let war_num = extract_war_number(&r.season_key);
            if exclude_colosseum {
                if let Some(colosseum) = colosseum_war {
                    return war_num != colosseum;
                }
            }
            true
        })
        .collect();

    // Group by player
    let mut player_map: HashMap<String, Vec<&CsvWarRecord>> = HashMap::new();
    for record in &filtered {
        player_map
            .entry(record.player_tag.clone())
            .or_insert_with(Vec::new)
            .push(record);
    }

    // Calculate stats
    let num_wars = get_unique_war_numbers(&filtered).len() as i32;
    let max_possible_decks = num_wars * 16;

    let mut stats: Vec<PlayerSeasonStats> = player_map
        .into_iter()
        .map(|(tag, player_records)| {
            let total_fame: i32 = player_records.iter().map(|r| r.player_fame).sum();
            let total_decks: i32 = player_records.iter().map(|r| r.player_decks_used).sum();
            let wars_participated = player_records.len() as i32;

            let participation_pct = if max_possible_decks > 0 {
                (total_decks as f32 / max_possible_decks as f32) * 100.0
            } else {
                0.0
            };

            let avg_fame_per_war = if wars_participated > 0 {
                total_fame as f32 / wars_participated as f32
            } else {
                0.0
            };

            // Build per-war breakdown
            let mut war_breakdown: Vec<PlayerWarStats> = player_records
                .iter()
                .map(|r| {
                    let war_num = extract_war_number(&r.season_key);
                    PlayerWarStats {
                        war_number: war_num,
                        player_name: r.player_name.clone(),
                        player_tag: r.player_tag.clone(),
                        fame: r.player_fame,
                        decks_used: r.player_decks_used,
                        performance: PerformanceLevel::from_fame(r.player_fame),
                        participation_pct: (r.player_decks_used as f32 / 16.0) * 100.0,
                    }
                })
                .collect();

            war_breakdown.sort_by_key(|w| w.war_number);

            PlayerSeasonStats {
                player_name: player_records[0].player_name.clone(),
                player_tag: tag,
                total_fame,
                total_decks_used: total_decks,
                wars_participated,
                avg_fame_per_war,
                participation_pct,
                performance: PerformanceLevel::from_fame(total_fame / wars_participated.max(1)),
                war_breakdown,
            }
        })
        .collect();

    // Sort by total fame (descending)
    stats.sort_by(|a, b| b.total_fame.cmp(&a.total_fame));

    stats
}

// Filter low performers
pub fn filter_low_performers(
    players: &[PlayerSeasonStats],
    threshold: f32,
) -> Vec<PlayerSeasonStats> {
    players
        .iter()
        .filter(|p| p.participation_pct < threshold)
        .cloned()
        .collect()
}

// Get war summaries for a season
pub fn get_war_summaries(records: &[CsvWarRecord], season_id: i32) -> Vec<WarSummary> {
    let filtered: Vec<_> = records
        .iter()
        .filter(|r| r.season_id == season_id)
        .collect();

    let war_numbers = get_unique_war_numbers(&filtered);

    war_numbers
        .into_iter()
        .map(|war_num| {
            let war_records: Vec<_> = filtered
                .iter()
                .filter(|r| extract_war_number(&r.season_key) == war_num)
                .collect();

            let clan_fame = war_records.first().map(|r| r.clan_fame).unwrap_or(0);
            let clan_rank = war_records.first().map(|r| r.clan_rank).unwrap_or(0);
            let players_count = war_records.len() as i32;

            WarSummary {
                war_number: war_num,
                clan_fame,
                clan_rank,
                players_count,
            }
        })
        .collect()
}

// Get heatmap data
pub fn get_heatmap_data(
    records: &[CsvWarRecord],
    season_id: i32,
    exclude_colosseum: bool,
    colosseum_war: Option<i32>,
) -> HeatmapData {
    let filtered: Vec<_> = records
        .iter()
        .filter(|r| r.season_id == season_id)
        .filter(|r| {
            let war_num = extract_war_number(&r.season_key);
            if exclude_colosseum {
                if let Some(colosseum) = colosseum_war {
                    return war_num != colosseum;
                }
            }
            true
        })
        .collect();

    let mut wars = get_unique_war_numbers(&filtered);
    wars.sort();

    // Get all unique players
    let mut players: Vec<String> = filtered
        .iter()
        .map(|r| r.player_name.clone())
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();
    players.sort();

    // Build matrix
    let mut data: Vec<Vec<i32>> = Vec::new();

    for player in &players {
        let mut player_row = Vec::new();
        for war in &wars {
            let fame = filtered
                .iter()
                .find(|r| {
                    r.player_name == *player && extract_war_number(&r.season_key) == *war
                })
                .map(|r| r.player_fame)
                .unwrap_or(0);
            player_row.push(fame);
        }
        data.push(player_row);
    }

    HeatmapData {
        players,
        wars,
        data,
    }
}

// Get all available seasons
pub fn get_available_seasons(records: &[CsvWarRecord]) -> Vec<i32> {
    let mut seasons: Vec<i32> = records
        .iter()
        .map(|r| r.season_id)
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();
    seasons.sort_by(|a, b| b.cmp(a)); // Descending order
    seasons
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_war_number() {
        assert_eq!(extract_war_number("128-3"), 3);
        assert_eq!(extract_war_number("127-5"), 5);
    }

    #[test]
    fn test_performance_level() {
        assert!(matches!(
            PerformanceLevel::from_fame(3600),
            PerformanceLevel::Perfect
        ));
        assert!(matches!(
            PerformanceLevel::from_fame(3200),
            PerformanceLevel::Excellent
        ));
        assert!(matches!(
            PerformanceLevel::from_fame(0),
            PerformanceLevel::Inactive
        ));
    }
}
