import React from 'react';
import { Player, Club } from '../types/game';
import { FatigueGauge, ConditionDot } from './common/FatigueGauge';
import { useI18n } from '../i18n/LanguageContext';
import { Shield, Heart, Zap, Award, AlertTriangle, Calendar, DollarSign, X } from 'lucide-react';

interface Props {
  player: Player | null;
  club: Club | null;
  onClose: () => void;
}

export const PlayerDetailModal: React.FC<Props> = ({ player, club, onClose }) => {
  const { t } = useI18n();
  if (!player) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="flex min-h-full items-start justify-center p-3 sm:p-6">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl my-4 sm:my-8 transition-all text-left pb-10">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-bold text-white shadow-lg shrink-0">
              <span className="text-[10px] text-slate-400 font-mono">OVR</span>
              <span className="text-2xl text-emerald-400 font-mono font-black">{player.ovr}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-white">{player.name}</h3>
                <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-xs font-mono font-bold border border-blue-800">
                  {player.position}
                </span>
                <span className="text-xs text-slate-400 font-mono">#{player.shirtNumber}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {player.age}歳 · {player.nationality} · 利き足: {player.preferredFoot} · 所属: <strong className="text-slate-200">{club?.name || 'フリー'}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Highlights: Fatigue & Condition Clearly Separated (Requirements 6 & 7) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {/* Fatigue Gauge Box */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t.fatigue} (Fatigue Gauge)
            </div>
            <FatigueGauge fatigue={player.fatigue} size="md" showFraction />
          </div>

          {/* Condition Box */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t.condition} (Match Form)
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <ConditionDot condition={player.condition} showLabel />
            </div>
          </div>
        </div>

        {/* Contract, Health, and Trust Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">契約年数・役割</span>
            <div className="text-xs font-bold text-white mt-0.5">
              残{player.contractYears}年 · {player.squadRole}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">市場価値・週給</span>
            <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
              €{(player.marketValue / 1000000).toFixed(1)}M (週給€{(player.wage / 1000).toFixed(0)}k)
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">健康状態・出場資格</span>
            <div className="text-xs font-bold mt-0.5">
              {player.injury.isInjured ? (
                <span className="text-red-400 font-semibold">{player.injury.type} (全治{player.injury.recoveryDays}日)</span>
              ) : player.suspension.isSuspended ? (
                <span className="text-amber-400 font-semibold">停止中 (残{player.suspension.matchesRemaining}試合)</span>
              ) : (
                <span className="text-emerald-400">出場可能</span>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Attributes */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-5">
          <div className="text-xs font-bold text-white mb-3 uppercase tracking-wider">
            能力パラメータ詳細 (Attributes)
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">PAC (スピード)</span>
              <span className="text-base font-bold text-white font-mono">{player.pace}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">SHO (決定力)</span>
              <span className="text-base font-bold text-white font-mono">{player.shooting}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">PAS (パス)</span>
              <span className="text-base font-bold text-white font-mono">{player.passing}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">DRI (ドリブル)</span>
              <span className="text-base font-bold text-white font-mono">{player.dribbling}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">DEF (守備力)</span>
              <span className="text-base font-bold text-white font-mono">{player.defending}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">PHY (フィジカル)</span>
              <span className="text-base font-bold text-white font-mono">{player.physical}</span>
            </div>
          </div>
        </div>

        {/* Personality & Playstyle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">プレースタイル</span>
            <span className="text-xs font-bold text-blue-300 mt-0.5 block">{player.playstyle}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">パーソナリティ (性格)</span>
            <span className="text-xs font-bold text-purple-300 mt-0.5 block">{player.personality}</span>
          </div>
        </div>

        <div className="text-right pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  </div>
  );
};
