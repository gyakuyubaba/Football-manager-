import React, { useState } from 'react';
import { GameWorldState, LeagueKey, MatchFixture } from '../../types/game';
import { formatDateJP } from '../../engine/dateEngine';
import { Trophy, Calendar, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  state: GameWorldState;
  onOpenMatch: (fixture: MatchFixture) => void;
}

const LEAGUE_NAMES: Record<LeagueKey, string> = {
  'premier-league': 'Premier League (イングランド)',
  'laliga': 'LaLiga (スペイン)',
  'bundesliga': 'Bundesliga (ドイツ)',
  'serie-a': 'Serie A (イタリア)',
  'ligue-1': 'Ligue 1 (フランス)'
};

export const CompetitionsTab: React.FC<Props> = ({ state, onOpenMatch }) => {
  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;
  const initialLeague = userClub?.league || 'premier-league';

  const [selectedLeague, setSelectedLeague] = useState<LeagueKey>(initialLeague);
  const [viewMode, setViewMode] = useState<'standings' | 'fixtures'>('standings');

  const standings = state.standings[selectedLeague] || [];

  // Filter fixtures for selected league
  const leagueFixtures = state.fixtures.filter(f => f.competition === selectedLeague || f.competition === 'pre-season');

  return (
    <div className="space-y-5 pb-20">
      
      {/* Header & League Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-display">大会・順位表・対戦日程</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            2025/26シーズンの主要リーグ順位表と試合日程・結果一覧です。
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('standings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              viewMode === 'standings' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            順位表 (Standings)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('fixtures')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              viewMode === 'fixtures' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            対戦日程・結果 (Fixtures)
          </button>
        </div>
      </div>

      {/* League Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(Object.keys(LEAGUE_NAMES) as LeagueKey[]).map(lKey => (
          <button
            key={lKey}
            type="button"
            onClick={() => setSelectedLeague(lKey)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedLeague === lKey
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {LEAGUE_NAMES[lKey]}
          </button>
        ))}
      </div>

      {/* STANDINGS TABLE VIEW */}
      {viewMode === 'standings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {LEAGUE_NAMES[selectedLeague]} 順位表
            </h3>
            <span className="text-xs text-slate-500 font-mono">2025/26 SEASON</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800 pb-2">
                  <th className="py-2 px-2 text-center w-8">順位</th>
                  <th className="py-2 px-3">クラブ名</th>
                  <th className="py-2 px-2 text-right">試合</th>
                  <th className="py-2 px-2 text-right">勝</th>
                  <th className="py-2 px-2 text-right">分</th>
                  <th className="py-2 px-2 text-right">敗</th>
                  <th className="py-2 px-2 text-right">得点</th>
                  <th className="py-2 px-2 text-right">失点</th>
                  <th className="py-2 px-2 text-right">得失差</th>
                  <th className="py-2 px-3 text-right font-bold text-white">勝点</th>
                  <th className="py-2 px-3 text-center">直近</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {standings.map((row, idx) => {
                  const club = state.clubs[row.clubId];
                  const isUser = row.clubId === state.userClubId;

                  return (
                    <tr 
                      key={row.clubId}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isUser ? 'bg-emerald-950/30 text-emerald-200' : 'text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 px-2 text-center font-mono font-bold">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md ${
                          idx === 0 ? 'bg-amber-500/20 text-amber-300 font-bold' : 
                          idx < 4 ? 'bg-blue-500/20 text-blue-300 font-bold' : 
                          idx < 6 ? 'bg-cyan-500/10 text-cyan-300' :
                          idx >= standings.length - 3 ? 'bg-red-500/20 text-red-400 font-bold' :
                          'text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full shrink-0" 
                            style={{ backgroundColor: club?.primaryColor || '#94a3b8' }}
                          />
                          <span className="font-bold text-white">
                            {row.clubName}
                          </span>
                          {isUser && (
                            <span className="text-[10px] bg-emerald-500 text-slate-950 px-1 rounded font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-400">{row.played}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{row.won}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-400">{row.drawn}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-400">{row.lost}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{row.goalsFor}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-400">{row.goalsAgainst}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-semibold">
                        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-sm text-emerald-400">
                        {row.points}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
                          {row.form.length === 0 ? (
                            <span className="text-slate-600">-</span>
                          ) : (
                            row.form.map((f, i) => (
                              <span 
                                key={i}
                                className={`w-4 h-4 rounded flex items-center justify-center font-bold ${
                                  f === 'W' ? 'bg-emerald-500/20 text-emerald-400' : f === 'D' ? 'bg-slate-700 text-slate-300' : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {f}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Qualification & Relegation Legend */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
              <span>優勝 / ACLまたはUCL本戦</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-400" />
              <span>上位進出 / 欧州CL・国際大会出場圏</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
              <span>欧州EL圏</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-400" />
              <span>下位降格圏（残留争い）</span>
            </div>
          </div>
        </div>
      )}

      {/* FIXTURES LIST VIEW */}
      {viewMode === 'fixtures' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {LEAGUE_NAMES[selectedLeague]} 試合スケジュール
            </h3>
            <span className="text-xs text-slate-500 font-mono">{leagueFixtures.length} 試合</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {leagueFixtures.map(f => {
              const home = state.clubs[f.homeClubId];
              const away = state.clubs[f.awayClubId];
              const isUserMatch = f.homeClubId === state.userClubId || f.awayClubId === state.userClubId;

              return (
                <div 
                  key={f.id}
                  className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 rounded-xl transition-colors ${
                    isUserMatch ? 'bg-slate-800/40' : 'hover:bg-slate-800/20'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{formatDateJP(f.date)}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300 font-semibold">{f.competitionName}</span>
                  </div>

                  {/* Teams and score */}
                  <div className="flex items-center justify-center gap-4 text-xs font-bold">
                    <span className={`text-right w-36 truncate ${f.homeClubId === state.userClubId ? 'text-emerald-400 font-black' : 'text-white'}`}>
                      {home?.name}
                    </span>

                    <div className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-mono text-sm">
                      {f.status === 'finished' ? (
                        <span>{f.homeScore} - {f.awayScore}</span>
                      ) : (
                        <span className="text-slate-500 text-xs">VS</span>
                      )}
                    </div>

                    <span className={`text-left w-36 truncate ${f.awayClubId === state.userClubId ? 'text-emerald-400 font-black' : 'text-white'}`}>
                      {away?.name}
                    </span>
                  </div>

                  {/* Action / Status */}
                  <div className="flex items-center justify-end gap-2">
                    {f.status === 'finished' ? (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>試合終了</span>
                      </span>
                    ) : isUserMatch ? (
                      <button
                        type="button"
                        onClick={() => onOpenMatch(f)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        試合へ
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>未消化</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
