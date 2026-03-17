import axios from 'axios';
import type { DashboardResponse, HeatmapData, SeasonsResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export interface DashboardParams {
  season: number;
  exclude_colosseum?: boolean;
  colosseum_war?: number | null;
  threshold?: number;
}

export interface HeatmapParams {
  season: number;
  exclude_colosseum?: boolean;
  colosseum_war?: number | null;
}

export async function getSeasons(): Promise<SeasonsResponse> {
  const { data } = await api.get<SeasonsResponse>('/api/seasons');
  return data;
}

export async function getDashboard(params: DashboardParams): Promise<DashboardResponse> {
  const { data } = await api.get<DashboardResponse>('/api/dashboard', { params });
  return data;
}

export async function getHeatmap(params: HeatmapParams): Promise<HeatmapData> {
  const { data } = await api.get<HeatmapData>('/api/heatmap', { params });
  return data;
}

export default api;
