import React, { useState } from 'react';
import { Club, ManagerProfile, LeagueKey } from '../types/game';
import { ALL_116_CLUBS } from '../data/clubsData';
import { 
  Trophy, 
  DollarSign, 
  Target, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Search, 
  Check, 
  Building2,
  ChevronRight,
  Filter
} from 'lucide-react';

interface Props {
  manager: ManagerProfile;
  offers: Club[];
  onSelectClub: (clubId: string) => void;
  onBackToManagerCreation?: () => void;
}

const LEAGUES: { id: LeagueKey; name: string; flag: string }[] = [
  { id: 'premier-league', name: 'プレミアリーグ (20クラブ)', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'laliga', name: 'ラ・リーガ (20クラブ)', flag: '🇪🇸' },
  { id: 'bundesliga', name: 'ブンデスリーガ (18クラブ)', flag: '🇩🇪' },
  { id: 'serie-a', name: 'セリエA (20クラブ)', flag: '🇮🇹' },
  { id: 'ligue-1', name: 'リーグ・アン (18クラブ)', flag: '🇫🇷' }
];

export const ClubOfferModal: React.FC<Props> = ({ manager, offers, onSelectClub, onBackToManagerCreation }) => {
  const [selectedClubId, setSelectedClubId] = useState<string>(offers[0]?.id || 'arsenal');
  const [viewMode, setViewMode] = useState<'offers' | 'all'>('offers');
  const [selectedLeague, setSelectedLeague] = useState<LeagueKey>('premier-league');
  const [searchQuery, setSearchQuery] = useState('');

  // Find currently selected club from all clubs
  const selectedClub = ALL_116_CLUBS.find(c => c.id === selectedClubId) || offers[0] || ALL_116_CLUBS[0];

  // Filtered clubs for "All Clubs" browse mode
  const filteredClubs = ALL_116_CLUBS.filter(c => {
    const matchLeague = c.league === selectedLeague;
    const matchSearch = searchQuery.trim() === '' || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.shortName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLeague && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100 flex flex-col">
      {/* Scrollable Container with Bottom Padding for Sticky Bar */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-3.5 sm:px-6 pt-5 pb-32">
        
        {/* Top Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2025/26 SEASON OFFICIAL PROPOSALS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            監督就任オファーの受諾・クラブ決定
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl mx-auto">
            {manager.name}監督（{manager.style} / {manager.specialty}）の招聘を希望するクラブです。
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
          <button
            type="button"
            onClick={() => setViewMode('offers')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              viewMode === 'offers'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ★ 正式オファー（推薦5クラブ）
          </button>
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              viewMode === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🌍 全116クラブから自由に選択
          </button>
          {onBackToManagerCreation && (
            <button
              type="button"
              onClick={onBackToManagerCreation}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all cursor-pointer"
            >
              ← 監督設定に戻る
            </button>
          )}
        </div>

        {/* MODE 1: 5 OFFICIAL OFFERS */}
        {viewMode === 'offers' && (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 mb-6">
            {offers.map(club => {
              const isSelected = club.id === selectedClubId;
              const tagLabel = 
                club.tier === 'Elite' ? '強豪タイトル' :
                club.tier === 'Upper' ? '欧州CL争い' :
                club.tier === 'Mid' ? '中堅プロジェクト' : '残留＆再建';

              return (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => setSelectedClubId(club.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div 
                      className="w-4 h-4 rounded-full border border-white/20 shrink-0" 
                      style={{ backgroundColor: club.primaryColor }}
                    />
                    <span className="text-[10px] text-slate-400 truncate uppercase font-mono">
                      {club.league.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white truncate pr-4">
                    {club.name}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                    補強予算 €{(club.transferBudget / 1000000).toFixed(1)}M
                  </div>
                  <div className="inline-block mt-2 px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400">
                    {tagLabel}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* MODE 2: BROWSE ALL 116 CLUBS */}
        {viewMode === 'all' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 space-y-3.5">
            {/* League Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {LEAGUES.map(lg => (
                <button
                  key={lg.id}
                  type="button"
                  onClick={() => setSelectedLeague(lg.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedLeague === lg.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <span>{lg.flag}</span>
                  <span>{lg.name}</span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="クラブ名で検索..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Club Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
              {filteredClubs.map(c => {
                const isSelected = c.id === selectedClubId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedClubId(c.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full border border-white/20 shrink-0" 
                        style={{ backgroundColor: c.primaryColor }}
                      />
                      <span className="text-[10px] text-slate-400 font-mono">{c.shortName}</span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">{c.name}</div>
                    <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                      €{(c.transferBudget / 1000000).toFixed(1)}M
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Club Details Card */}
        {selectedClub && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            
            {/* Header / Identity */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg border border-white/20 shrink-0"
                  style={{ backgroundColor: selectedClub.primaryColor }}
                >
                  {selectedClub.shortName}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                      {selectedClub.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 font-medium">
                      {selectedClub.country}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400 font-medium uppercase font-mono">
                      {selectedClub.league.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>本拠地: {selectedClub.stadiumName}（収容 {selectedClub.stadiumCapacity.toLocaleString()}人）</span>
                  </div>
                </div>
              </div>

              {/* Salary & Contract Offer */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 bg-slate-950/60 p-3 sm:p-0 rounded-xl sm:bg-transparent">
                <div className="text-left sm:text-right">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">提示契約期間</div>
                  <div className="text-xs sm:text-sm font-semibold text-white">3年契約 (2029年6月まで)</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">監督年俸オファー</div>
                  <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
                    €{(selectedClub.tier === 'Elite' ? 3800000 : selectedClub.tier === 'Upper' ? 2200000 : selectedClub.tier === 'Mid' ? 1200000 : 650000).toLocaleString()} /年
                  </div>
                </div>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>移籍補強予算</span>
                </div>
                <div className="text-lg sm:text-xl font-bold text-white font-mono">
                  €{(selectedClub.transferBudget / 1000000).toFixed(1)}M
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  週給予算: €{(selectedClub.wageBudget / 1000).toFixed(0)}k/週
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  <span>クラブ目標</span>
                </div>
                <div className="text-sm sm:text-base font-bold text-white truncate">
                  {selectedClub.target}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  格付け: {selectedClub.tier} ランク
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>サポーターの期待</span>
                </div>
                <div className="text-sm sm:text-base font-bold text-amber-300 truncate">
                  {selectedClub.fanExpectation}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  サポーター基盤: 非常に熱狂的
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>基本戦術システム</span>
                </div>
                <div className="text-sm sm:text-base font-bold text-purple-300 font-mono">
                  {selectedClub.currentFormation}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  クラブ名声度: {selectedClub.reputation} / 100
                </div>
              </div>
            </div>

            {/* Board Project Message */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-xs font-bold text-slate-300 mb-1">フロント・取締役会からのメッセージ</div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                「{manager.name}監督、貴殿の【{manager.style}】の指導方針と【{manager.specialty}】の実績に深く敬意を表します。当クラブが今季掲げる【{selectedClub.target}】を成し遂げるため、チーム編成の全権を委託し、戦力補強とアカデミー改革の全面バックアップをお約束いたします。」
              </p>
            </div>

          </div>
        )}

      </div>

      {/* Fixed Sticky Action Bar at Bottom: NEVER CUT OFF */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md px-4 py-3 sm:py-4 shadow-2xl">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 border border-white/20"
              style={{ backgroundColor: selectedClub.primaryColor }}
            >
              {selectedClub.shortName}
            </div>
            <div className="truncate">
              <div className="text-xs text-slate-400 truncate">
                選択中: <span className="text-white font-bold">{selectedClub.name}</span> ({selectedClub.league.replace('-', ' ')})
              </div>
              <div className="text-[11px] text-emerald-400 font-mono">
                補強予算 €{(selectedClub.transferBudget / 1000000).toFixed(1)}M · 提示年俸 €{(selectedClub.tier === 'Elite' ? 3800000 : selectedClub.tier === 'Upper' ? 2200000 : selectedClub.tier === 'Mid' ? 1200000 : 650000).toLocaleString()}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectClub(selectedClub.id)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-sm sm:text-base transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>{selectedClub.name} の監督就任契約にサインする</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

        </div>
      </div>

    </div>
  );
};
