export type PerformanceLevel = 'Perfect' | 'Excellent' | 'Good' | 'Mid' | 'BelowAvg' | 'Poor' | 'Inactive';

export interface PlayerWarStats {
  war_number: number;
  player_name: string;
  player_tag: string;
  fame: number;
  decks_used: number;
  performance: PerformanceLevel;
  participation_pct: number;
}

export interface PlayerSeasonStats {
  player_name: string;
  player_tag: string;
  total_fame: number;
  total_decks_used: number;
  wars_participated: number;
  avg_fame_per_war: number;
  participation_pct: number;
  performance: PerformanceLevel;
  war_breakdown: PlayerWarStats[];
}

export interface WarSummary {
  war_number: number;
  clan_fame: number;
  clan_rank: number;
  players_count: number;
}

export interface SeasonSummary {
  season_id: number;
  wars: WarSummary[];
  total_wars: number;
  colosseum_war: number | null;
  detection_status: 'auto' | 'manual_required' | 'manual_set';
}

export interface DashboardResponse {
  season: SeasonSummary;
  players: PlayerSeasonStats[];
  low_performers: PlayerSeasonStats[];
}

export interface HeatmapData {
  players: string[];
  wars: number[];
  data: number[][];
}

export interface SeasonsResponse {
  seasons: number[];
}
