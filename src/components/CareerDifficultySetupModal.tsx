import React, { useState } from 'react';
import { DifficultySettings, DEFAULT_DIFFICULTY_SETTINGS, ManagerProfile } from '../types/game';
import { Sliders, ArrowRight, ShieldCheck, HeartPulse, TrendingUp, RefreshCw, Target, UserCheck } from 'lucide-react';

interface CareerDifficultySetupModalProps {
  manager: ManagerProfile;
  initialSettings?: DifficultySettings;
  onConfirm: (settings: DifficultySettings) => void;
  onBack: () => void;
}

export const CareerDifficultySetupModal: React.FC<CareerDifficultySetupModalProps> = ({
  manager,
  initialSettings = DEFAULT_DIFFICULTY_SETTINGS,
  onConfirm,
  onBack
}) => {
  const [settings, setSettings] = useState<DifficultySettings>({ ...initialSettings });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              CAREER SETUP · 難易度・プレイ環境設定
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-display">
              あなたのキャリアを設定
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {manager.name} 監督のキャリア難易度を決定します（※開始後も設定タブからいつでも変更可能です）。
            </p>
          </div>
        </div>

        {/* Options List */}
        <div className="space-y-4">
          
          {/* 1. Transfer Difficulty */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">移籍交渉難易度</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {settings.transferDifficulty === 'easy' ? '簡単' : settings.transferDifficulty === 'normal' ? '普通 (推奨)' : '現実的'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {settings.transferDifficulty === 'easy'
                ? 'クラブ側の要求額が緩く、選手も移籍に前向き。スムーズに補強を行えます。'
                : settings.transferDifficulty === 'normal'
                ? '標準的な難易度。市場価値・予算・年俸のバランスが取れた交渉です。'
                : '移籍金、年俸、財政、クラブ格、ライバル関係、出場機会などを強く考慮したシビアな交渉。'}
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'easy', label: '簡単' },
                { id: 'normal', label: '普通' },
                { id: 'realistic', label: '現実的' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, transferDifficulty: opt.id as any })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settings.transferDifficulty === opt.id
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Injury Frequency */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-400" />
                <span className="text-sm font-bold text-white">負傷・怪我の発生頻度</span>
              </div>
              <span className="text-[11px] font-mono text-rose-400 font-bold">
                {settings.injuryFrequency === 'low' ? '少ない' : settings.injuryFrequency === 'normal' ? '普通 (推奨)' : '多い (リアル)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', label: '少ない' },
                { id: 'normal', label: '普通' },
                { id: 'high', label: '多い' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, injuryFrequency: opt.id as any })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settings.injuryFrequency === opt.id
                      ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Player Growth Rate */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-bold text-white">選手OVR成長速度</span>
              </div>
              <span className="text-[11px] font-mono text-sky-400 font-bold">
                {settings.playerGrowthRate === 'slow' ? '遅い (じっくり)' : settings.playerGrowthRate === 'normal' ? '普通 (推奨)' : '速い (急成長)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'slow', label: '遅い' },
                { id: 'normal', label: '普通' },
                { id: 'fast', label: '速い' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, playerGrowthRate: opt.id as any })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settings.playerGrowthRate === opt.id
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. AI Transfer Activity */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-white">AIクラブの移籍市場活動</span>
              </div>
              <span className="text-[11px] font-mono text-purple-400 font-bold">
                {settings.aiTransferActivity === 'low' ? '少ない (静か)' : settings.aiTransferActivity === 'normal' ? '普通 (推奨)' : '活発 (大型移籍頻発)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', label: '少ない' },
                { id: 'normal', label: '普通' },
                { id: 'high', label: '活発' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, aiTransferActivity: opt.id as any })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settings.aiTransferActivity === opt.id
                      ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Match Goal Rate */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white">試合得点傾向</span>
              </div>
              <span className="text-[11px] font-mono text-amber-400 font-bold">
                {settings.matchGoalRate === 'low' ? 'ロースコア (堅守)' : settings.matchGoalRate === 'normal' ? '標準 (推奨)' : 'ハイスコア (乱打戦)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', label: '少ない' },
                { id: 'normal', label: '普通' },
                { id: 'high', label: '多い' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, matchGoalRate: opt.id as any })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settings.matchGoalRate === opt.id
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Board Patience / Job Difficulty */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">フロント解任プレッシャー</span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 font-bold">
                {settings.managerJobDifficulty === 'lenient' ? '寛容' : settings.managerJobDifficulty === 'normal' ? '普通' : '厳格 (即解任危機)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'lenient', label: '寛容' },
                { id: 'normal', label: '普通' },
                { id: 'strict', label: '厳格' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, managerJobDifficulty: opt.id as any })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settings.managerJobDifficulty === opt.id
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
          >
            ← 監督作成に戻る
          </button>
          <button
            type="button"
            onClick={() => onConfirm(settings)}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
          >
            <span>この設定でクラブ選定へ進む</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
