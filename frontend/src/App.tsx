import { useState, useEffect, useMemo } from 'react';
import { getDashboard, getSeasons } from './api';
import type { DashboardResponse, PlayerSeasonStats } from './types';
import { getPerformanceColor, formatNumber, formatPercentage } from './utils';
import { TrophyIcon, UsersIcon, AlertTriangleIcon, BarChart3Icon, SearchIcon, XIcon, SwordsIcon, FlameIcon, TargetIcon, ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

type SortKey = 'rank' | 'name' | 'fame' | 'wars' | 'avg' | 'participation' | 'performance';
type SortDirection = 'asc' | 'desc';

const performanceOrder = ['Perfect', 'Excellent', 'Good', 'Mid', 'BelowAvg', 'Poor', 'Inactive'];

function App() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [season, setSeason] = useState<number | null>(null);
  const [excludeColosseum, setExcludeColosseum] = useState(true);
  const [threshold, setThreshold] = useState(75);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualColosseumWar, setManualColosseumWar] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSeasonStats | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('fame');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch available seasons on mount
  useEffect(() => {
    async function fetchSeasons() {
      try {
        const result = await getSeasons();
        setAvailableSeasons(result.seasons);
        if (result.seasons.length > 0) {
          setSeason(result.seasons[0]); // Set to latest season
        }
      } catch (err) {
        setError('Failed to load seasons. Make sure the backend server is running.');
        console.error('Error fetching seasons:', err);
      }
    }
    fetchSeasons();
  }, []);

  // Fetch dashboard data when season changes
  useEffect(() => {
    if (season === null) return; // Don't fetch until season is set

    const currentSeason = season; // Capture for TypeScript narrowing

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const result = await getDashboard({
          season: currentSeason,
          exclude_colosseum: excludeColosseum,
          threshold,
          colosseum_war: manualColosseumWar,
        });
        setData(result);
      } catch (err) {
        setError('Failed to load data. Make sure the backend server is running.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [season, excludeColosseum, threshold, manualColosseumWar]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPlayer(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Handle sort
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection(key === 'name' ? 'asc' : 'desc');
    }
  };

  // Sort icon component
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <span className="ml-1 opacity-30">↕</span>;
    }
    return sortDirection === 'asc'
      ? <ChevronUpIcon className="w-4 h-4 ml-1 inline" />
      : <ChevronDownIcon className="w-4 h-4 ml-1 inline" />;
  };

  // Sorted and filtered players
  const sortedPlayers = useMemo(() => {
    if (!data) return [];

    const filtered = data.players.filter(p =>
      p.player_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case 'rank':
        case 'fame':
          comparison = a.total_fame - b.total_fame;
          break;
        case 'name':
          comparison = a.player_name.localeCompare(b.player_name);
          break;
        case 'wars':
          comparison = a.wars_participated - b.wars_participated;
          break;
        case 'avg':
          comparison = a.avg_fame_per_war - b.avg_fame_per_war;
          break;
        case 'participation':
          comparison = a.participation_pct - b.participation_pct;
          break;
        case 'performance':
          comparison = performanceOrder.indexOf(a.performance) - performanceOrder.indexOf(b.performance);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, searchTerm, sortKey, sortDirection]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-2xl font-bold text-slate-200">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 flex items-center justify-center p-6">
        <div className="bg-slate-800/50 backdrop-blur border border-red-500/30 text-red-300 px-8 py-6 rounded-2xl max-w-2xl shadow-2xl">
          <h2 className="font-bold text-2xl mb-2 flex items-center gap-2">
            <AlertTriangleIcon className="w-6 h-6" />
            Error
          </h2>
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Prepare chart data for modal
  const getChartData = (player: PlayerSeasonStats) => {
    return player.war_breakdown.map(w => ({
      name: `W${w.war_number}`,
      fame: w.fame,
      decks: w.decks_used,
      performance: w.performance,
    })).sort((a, b) => parseInt(a.name.slice(1)) - parseInt(b.name.slice(1)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-block mb-4">
            <TrophyIcon className="w-16 h-16 md:w-20 md:h-20 text-amber-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-100 mb-2">
            Lebanon Clan Wars
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium">Analytics Dashboard</p>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 mb-6 border border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide">
                Season
              </label>
              <select
                value={season ?? ''}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all hover:bg-slate-700"
              >
                {availableSeasons.map((s) => (
                  <option key={s} value={s} className="bg-slate-800">Season {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide">
                Participation Threshold
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                min="0"
                max="100"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all hover:bg-slate-700"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={excludeColosseum}
                  onChange={(e) => setExcludeColosseum(e.target.checked)}
                  className="w-6 h-6 text-cyan-600 rounded-lg border-2 border-slate-600 focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-sm font-bold text-slate-300 uppercase tracking-wide group-hover:text-slate-100 transition-colors">
                  Exclude Colosseum
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Manual Colosseum Selector */}
        {data.season.detection_status === 'manual_required' && (
          <div className="bg-cyan-900/20 backdrop-blur-sm border-l-4 border-cyan-500 p-6 md:p-8 mb-6 rounded-xl shadow-xl">
            <h3 className="text-xl font-bold text-cyan-100 mb-3 flex items-center gap-2">
              <AlertTriangleIcon className="w-6 h-6" />
              Manual Colosseum Selection Required
            </h3>
            <p className="text-cyan-200 mb-4">
              Current wars detected: {data.season.wars.map(w => `W${w.war_number}`).join(', ')}
              <br />
              Please select which war will be the Colosseum:
            </p>
            <div className="flex flex-wrap gap-3">
              {[...Array(5)].map((_, i) => {
                const warNum = i + 1;
                return (
                  <button
                    key={warNum}
                    onClick={() => setManualColosseumWar(warNum)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${
                      manualColosseumWar === warNum
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/50'
                        : 'bg-slate-700/50 text-cyan-200 border border-cyan-600/30 hover:bg-slate-700'
                    }`}
                  >
                    War {warNum}
                  </button>
                );
              })}
              <button
                onClick={() => setManualColosseumWar(null)}
                className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${
                  manualColosseumWar === null
                    ? 'bg-slate-600 text-white shadow-lg'
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700'
                }`}
              >
                Auto
              </button>
            </div>
            {manualColosseumWar && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-cyan-200 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                  War {manualColosseumWar} selected as Colosseum
                </p>
                {excludeColosseum && (
                  <p className="text-sm text-orange-300">
                    ⚠️ "Exclude Colosseum" is ON - War {manualColosseumWar} will be excluded from stats
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700/50 hover:border-cyan-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <BarChart3Icon className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="text-sm text-slate-400 font-bold uppercase tracking-wide mb-1">Total Wars</div>
            <div className="text-4xl font-black text-slate-100">{data.season.total_wars}</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700/50 hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <UsersIcon className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="text-sm text-slate-400 font-bold uppercase tracking-wide mb-1">Total Players</div>
            <div className="text-4xl font-black text-slate-100">{data.players.length}</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700/50 hover:border-rose-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <AlertTriangleIcon className="w-8 h-8 text-rose-400" />
            </div>
            <div className="text-sm text-slate-400 font-bold uppercase tracking-wide mb-1">Low Performers</div>
            <div className="text-4xl font-black text-slate-100">{data.low_performers.length}</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700/50 hover:border-amber-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <TrophyIcon className="w-8 h-8 text-amber-400" />
            </div>
            <div className="text-sm text-slate-400 font-bold uppercase tracking-wide mb-1">Detection</div>
            <div className="text-lg font-black text-slate-100 capitalize">
              {data.season.detection_status.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Low Performers Alert */}
        {data.low_performers.length > 0 && (
          <div className="bg-amber-900/20 backdrop-blur-sm border-l-4 border-amber-500 p-6 md:p-8 mb-6 rounded-xl shadow-xl">
            <h3 className="text-xl font-bold text-amber-100 mb-3 flex items-center gap-2">
              <AlertTriangleIcon className="w-6 h-6" />
              Low Participation Warning
            </h3>
            <p className="text-amber-200 mb-4">
              {data.low_performers.length} players below {threshold}% participation threshold
            </p>
            <div className="space-y-2">
              {data.low_performers.slice(0, 5).map((player) => (
                <div
                  key={player.player_tag}
                  onClick={() => setSelectedPlayer(player)}
                  className="flex justify-between items-center bg-slate-800/30 px-4 py-2 rounded-lg border border-amber-700/20 cursor-pointer hover:bg-slate-700/50 transition-colors"
                >
                  <span className="font-bold text-amber-100">{player.player_name}</span>
                  <span className="text-amber-300">{formatPercentage(player.participation_pct)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-700/50">
          <h2 className="text-3xl font-black text-slate-100 mb-6 flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-cyan-400" />
            Player Statistics
            <span className="text-sm font-normal text-slate-400 ml-2">(click players for more details)</span>
          </h2>

          <div className="relative mb-6">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search player..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-700">
                  <th
                    onClick={() => handleSort('rank')}
                    className="text-left py-4 px-4 font-black text-slate-300 uppercase tracking-wide text-sm cursor-pointer hover:text-cyan-400 transition-colors select-none"
                  >
                    Rank <SortIcon columnKey="rank" />
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="text-left py-4 px-4 font-black text-slate-300 uppercase tracking-wide text-sm cursor-pointer hover:text-cyan-400 transition-colors select-none"
                  >
                    Player <SortIcon columnKey="name" />
                  </th>
                  <th
                    onClick={() => handleSort('fame')}
                    className="text-right py-4 px-4 font-black text-slate-300 uppercase tracking-wide text-sm cursor-pointer hover:text-cyan-400 transition-colors select-none"
                  >
                    Total Fame <SortIcon columnKey="fame" />
                  </th>
                  <th
                    onClick={() => handleSort('wars')}
                    className="text-right py-4 px-4 font-black text-slate-300 uppercase tracking-wide text-sm cursor-pointer hover:text-cyan-400 transition-colors select-none"
                  >
                    Wars <SortIcon columnKey="wars" />
                  </th>
                  <th
                    onClick={() => handleSort('avg')}
                    className="text-right py-4 px-4 font-black text-slate-300 uppercase tracking-wide text-sm cursor-pointer hover:text-cyan-400 transition-colors select-none"
                  >
                    Avg Fame <SortIcon columnKey="avg" />
                  </th>
                  <th
                    onClick={() => handleSort('participation')}
                    className="text-right py-4 px-4 font-black text-slate-300 uppercase tracking-wide text-sm cursor-pointer hover:text-cyan-400 transition-colors select-none"
                  >
                    Participation <SortIcon columnKey="participation" />
                  </th>
                  <th
                    onClick={() => handleSort('performance')}
                    className="text-center py-4 px-4 font-black text-slate-300 uppercase tracking-wide text-sm cursor-pointer hover:text-cyan-400 transition-colors select-none"
                  >
                    Performance <SortIcon columnKey="performance" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player, index) => (
                  <tr
                    key={player.player_tag}
                    onClick={() => setSelectedPlayer(player)}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-4 text-slate-400 font-bold">
                      <div className="flex items-center gap-2">
                        {index < 3 && sortKey === 'fame' && sortDirection === 'desc' && (
                          <TrophyIcon className="w-4 h-4 text-amber-400" />
                        )}
                        #{index + 1}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {player.player_name}
                    </td>
                    <td className="py-4 px-4 text-right text-slate-200 font-semibold">{formatNumber(player.total_fame)}</td>
                    <td className="py-4 px-4 text-right text-slate-400">{player.wars_participated}</td>
                    <td className="py-4 px-4 text-right text-slate-400">{formatNumber(Math.round(player.avg_fame_per_war))}</td>
                    <td className="py-4 px-4 text-right text-slate-200 font-semibold">{formatPercentage(player.participation_pct)}</td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className="px-4 py-2 rounded-full text-white text-xs font-black uppercase tracking-wide shadow-lg inline-block"
                        style={{ backgroundColor: getPerformanceColor(player.performance) }}
                      >
                        {player.performance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm font-medium">
            Created by <span className="font-bold text-slate-200">AIKO ❤️</span>
          </p>
          <p className="text-slate-500 text-xs mt-2">Built for Lebanon Clan Only</p>
        </div>
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-700 flex justify-between items-start sticky top-0 bg-slate-800/95 backdrop-blur-sm rounded-t-3xl">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-100 flex items-center gap-3">
                  {selectedPlayer.player_name}
                  <span
                    className="px-3 py-1 rounded-full text-white text-xs font-bold uppercase shadow-lg"
                    style={{ backgroundColor: getPerformanceColor(selectedPlayer.performance) }}
                  >
                    {selectedPlayer.performance}
                  </span>
                </h2>
                <p className="text-slate-400 text-sm mt-1">{selectedPlayer.player_tag}</p>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="text-slate-400 hover:text-slate-100 transition-colors p-2 hover:bg-slate-700 rounded-xl"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <FlameIcon className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                  <div className="text-2xl font-black text-slate-100">{formatNumber(selectedPlayer.total_fame)}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Total Fame</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <SwordsIcon className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <div className="text-2xl font-black text-slate-100">{selectedPlayer.wars_participated}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Wars</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <BarChart3Icon className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <div className="text-2xl font-black text-slate-100">{formatNumber(Math.round(selectedPlayer.avg_fame_per_war))}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Avg/War</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <TargetIcon className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-black text-slate-100">{formatPercentage(selectedPlayer.participation_pct)}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Participation</div>
                </div>
              </div>

              {/* Fame Chart */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-200 mb-4">Fame per War</h3>
                <div className="bg-slate-700/20 rounded-xl p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={getChartData(selectedPlayer)}>
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        axisLine={{ stroke: '#475569' }}
                      />
                      <YAxis
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        axisLine={{ stroke: '#475569' }}
                        domain={[0, 4000]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '12px',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        }}
                        labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                        itemStyle={{ color: '#94a3b8' }}
                        formatter={(value) => [formatNumber(value as number), 'Fame']}
                      />
                      <ReferenceLine y={3600} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Perfect', fill: '#22c55e', fontSize: 10 }} />
                      <ReferenceLine y={2700} stroke="#eab308" strokeDasharray="5 5" label={{ value: 'Good', fill: '#eab308', fontSize: 10 }} />
                      <Bar dataKey="fame" radius={[8, 8, 0, 0]}>
                        {getChartData(selectedPlayer).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getPerformanceColor(entry.performance)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* War Breakdown Table */}
              <div>
                <h3 className="text-lg font-bold text-slate-200 mb-4">War Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 text-sm font-bold uppercase">War</th>
                        <th className="text-right py-3 px-4 text-slate-400 text-sm font-bold uppercase">Fame</th>
                        <th className="text-right py-3 px-4 text-slate-400 text-sm font-bold uppercase">Decks</th>
                        <th className="text-center py-3 px-4 text-slate-400 text-sm font-bold uppercase">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPlayer.war_breakdown
                        .sort((a, b) => a.war_number - b.war_number)
                        .map((war) => (
                          <tr key={war.war_number} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                            <td className="py-3 px-4 text-slate-200 font-bold">War {war.war_number}</td>
                            <td className="py-3 px-4 text-right text-slate-200">{formatNumber(war.fame)}</td>
                            <td className="py-3 px-4 text-right text-slate-400">{war.decks_used}/16</td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className="px-3 py-1 rounded-full text-white text-xs font-bold uppercase"
                                style={{ backgroundColor: getPerformanceColor(war.performance) }}
                              >
                                {war.performance}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
