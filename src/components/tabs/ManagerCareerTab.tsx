import React, { useState } from 'react';
import { GameWorldState, YouthProspect, Player } from '../../types/game';
import { 
  Trophy, 
  Award, 
  Dumbbell, 
  GraduationCap, 
  Globe, 
  ShieldAlert, 
  Save, 
  RotateCcw, 
  Check, 
  TrendingUp,
  Settings,
  Languages,
  Database,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useI18n } from '../../i18n/LanguageContext';
import { saveGameState } from '../../engine/gameState';

interface Props {
  state: GameWorldState;
  onUpdateState: (newState: GameWorldState) => void;
  onPromoteYouth: (youth: YouthProspect) => void;
  onRequestReset?: () => void;
  onResetCareer: () => void;
}

export const ManagerCareerTab: React.FC<Props> = ({ 
  state, 
  onUpdateState, 
  onPromoteYouth,
  onRequestReset,
  onResetCareer 
}) => {
  const { language, setLanguage, t } = useI18n();
  const [subSection, setSubSection] = useState<'academy_training' | 'career_trophies' | 'finance_board' | 'settings'>('academy_training');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;

  const trainingOptions = [
    { id: 'バランス総合', desc: '全体的な戦術浸透と基礎フィットネスの向上' },
    { id: '攻撃・連係強化', desc: 'パススピードとフィニッシュ精度を高める' },
    { id: '守備戦術・プレス', desc: '守備陣形とプレッシングの連動性を強化' },
    { id: 'コンディション回復', desc: '疲労蓄積を大幅に解消（リカバリー重視）' },
    { id: '若手重点育成', desc: '21歳以下の選手の能力成長スピードがアップ' }
  ] as const;

  const handleManualSave = () => {
    const ok = saveGameState(state);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const triggerResetModal = () => {
    if (onRequestReset) {
      onRequestReset();
    } else {
      onResetCareer();
    }
  };

  return (
    <div className="space-y-5 pb-20">
      
      {/* Header with Career Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
        <img
          src="/src/assets/images/trophy_celebration_1790585081399.jpg"
          alt="Trophy Celebration"
          referrerPolicy="no-referrer"
          className="w-full h-40 sm:h-52 object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        
        <div className="absolute bottom-4 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1 font-mono">
            <Trophy className="w-3.5 h-3.5" />
            <span>OFFICIAL CAREER PROFILE & CLUB OPERATIONS</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            {state.manager.name} 監督
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
            <span>{state.manager.nationality} · {state.manager.age}歳</span>
            <span aria-hidden="true">·</span>
            <span>哲学: {state.manager.style}</span>
            <span aria-hidden="true">·</span>
            <span>名声度: <strong className="text-amber-400 font-mono">{state.manager.reputation}</strong> / 100</span>
          </div>
        </div>
      </div>

      {/* Sub navigation buttons */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSubSection('academy_training')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            subSection === 'academy_training'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ユース & 育成
        </button>
        <button
          type="button"
          onClick={() => setSubSection('career_trophies')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            subSection === 'career_trophies'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          監督戦績 & 代表
        </button>
        <button
          type="button"
          onClick={() => setSubSection('finance_board')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            subSection === 'finance_board'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          クラブ経営 & 財務
        </button>
        <button
          type="button"
          onClick={() => setSubSection('settings')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            subSection === 'settings'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>設定 & 初期化</span>
        </button>
      </div>

      {/* SUBSECTION 1: ACADEMY & TRAINING */}
      {subSection === 'academy_training' && (
        <div className="space-y-5">
          
          {/* Weekly Training Focus */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                週間トレーニング方針 (Weekly Training Focus)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {trainingOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateState({ ...state, trainingFocus: opt.id })}
                  className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    state.trainingFocus === opt.id
                      ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/30 text-white'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{opt.id}</span>
                    {state.trainingFocus === opt.id && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Youth Academy Prospects */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  ユースアカデミー発掘有望株 (Youth Academy Wonderkids)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">{state.youthAcademy.length} 名</span>
            </div>

            <div className="space-y-3">
              {state.youthAcademy.map(prospect => (
                <div 
                  key={prospect.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{prospect.name}</span>
                      <span className="text-[10px] bg-blue-950 text-blue-300 font-mono px-1.5 py-0.5 rounded border border-blue-800">
                        {prospect.position}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{prospect.age}歳 · {prospect.nationality}</span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 italic">
                      スカウト寸評: 「{prospect.scoutReport}」
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-300 mt-2 font-mono">
                      <span>現在能力: <strong className="text-white">{prospect.ovr}</strong></span>
                      <span>潜在ポテンシャル: <strong className="text-emerald-400 font-bold">{prospect.potential}</strong></span>
                      <span>プレースタイル: {prospect.playstyle}</span>
                    </div>
                  </div>

                  <div>
                    {prospect.promoted ? (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold">
                        トップチーム昇格済
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onPromoteYouth(prospect)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                      >
                        トップチームへ昇格
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SUBSECTION 2: CAREER & NATIONAL TEAM */}
      {subSection === 'career_trophies' && (
        <div className="space-y-5">
          {/* Career Record Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">通算監督キャリア戦績</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-500 block">指揮試合数</span>
                <span className="text-xl font-bold text-white font-mono">{state.manager.matchesManaged}</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-500 block">勝敗 (勝/分/敗)</span>
                <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
                  {state.manager.wins}勝 {state.manager.draws}分 {state.manager.losses}敗
                </span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-500 block">通算勝率</span>
                <span className="text-xl font-bold text-white font-mono">
                  {state.manager.matchesManaged > 0 
                    ? ((state.manager.wins / state.manager.matchesManaged) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-500 block">獲得メジャートロフィー</span>
                <span className="text-xl font-bold text-amber-300 font-mono">{state.manager.careerTrophies}</span>
              </div>
            </div>
          </div>

          {/* National Team Management */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
              <Globe className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                代表監督就任オファー (National Team Job Offers)
              </h3>
            </div>

            {state.manager.reputation >= 85 ? (
              <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-white">SAMURAI BLUE（サッカー日本代表）</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ワールドカップ予選およびアジアカップ制覇を狙う日本サッカー協会（JFA）から就任打診が届いています。
                  </p>
                </div>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
                >
                  代表監督を受諾する
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-950 p-4 rounded-2xl border border-slate-800 leading-relaxed">
                ※代表監督（日本代表や欧州各国代表）からのオファーは、クラブでタイトル獲得やチャンピオンズリーグ進出など十分な実績を積み、監督名声度が【85以上】に達した際に届きます。（現在名声度: {state.manager.reputation}/100）
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBSECTION 3: FINANCE & BOARD & SAVE */}
      {subSection === 'finance_board' && (
        <div className="space-y-5">
          {/* Financial Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">クラブ財務・給与状況</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-slate-500 block mb-1">移籍補強残高</span>
                <span className="text-base sm:text-lg font-bold text-white font-mono">
                  €{((userClub?.transferBudget || 0) / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-slate-500 block mb-1">週給予算枠</span>
                <span className="text-base sm:text-lg font-bold text-white font-mono">
                  €{((userClub?.wageBudget || 0) / 1000).toFixed(0)}k /週
                </span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-slate-500 block mb-1">現在の選手給与総額</span>
                <span className="text-base sm:text-lg font-bold text-slate-300 font-mono">
                  €{((userClub?.currentWageSpend || 0) / 1000).toFixed(0)}k /週
                </span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-slate-500 block mb-1">理事会解任危険度</span>
                <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
                  安全（連敗数: {state.consecutiveLosses}）
                </span>
              </div>
            </div>
          </div>

          {/* Save & Reset Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white">キャリアセーブ管理</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                ゲーム状態は自動でLocalStorageに保存されますが、手動セーブも可能です。
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleManualSave}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveSuccess ? 'セーブ完了！' : 'キャリアを手動保存'}</span>
              </button>

              <button
                type="button"
                onClick={triggerResetModal}
                className="px-4 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/80 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>初期化</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBSECTION 4: SETTINGS & DATA RESET */}
      {subSection === 'settings' && (
        <div className="space-y-5">
          {/* Language Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <Languages className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                ゲーム内言語設定 (In-Game Language)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              試合・移籍市場・チーム編成・ニュース・設定など、ゲーム全体の表示言語を切り替えます。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { code: 'ja' as const, label: '日本語 (Japanese)', native: '日本語' },
                { code: 'en' as const, label: 'English (英語)', native: 'English' },
                { code: 'es' as const, label: 'Español (スペイン語)', native: 'Español' }
              ].map(item => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLanguage(item.code)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    language === item.code
                      ? 'bg-blue-950/50 border-blue-500 text-white shadow-md shadow-blue-500/10 ring-1 ring-blue-500/40'
                      : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{item.native}</span>
                    {language === item.code && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Database System Verification Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                ベースデータベース情報 (2025/26 Base Data)
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5 text-[11px]">収録クラブ</span>
                <span className="text-base font-bold text-white">{Object.keys(state.clubs).length} クラブ</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">全116クラブ収録</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5 text-[11px]">実在選手データ</span>
                <span className="text-base font-bold text-white">{Object.keys(state.players).length} 名</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">実在選手完全網羅</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5 text-[11px]">収録リーグ</span>
                <span className="text-base font-bold text-white">欧州5大リーグ</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">96クラブ完全網羅</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5 text-[11px]">現在ゲーム日付</span>
                <span className="text-base font-bold text-emerald-400">{state.currentDate}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{state.season}</span>
              </div>
            </div>
          </div>

          {/* CRITICAL: Game Data Initialization Section (Requirement 9) */}
          <div className="bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-900 border border-red-900/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-red-900/40 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                ゲームデータ初期化（新規キャリア開始）
              </h3>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              現在の監督データ、所属クラブ、シーズン進行、試合結果、移籍履歴、選手成長、怪我・疲労などの<strong>ゲーム内進行データ（GAME DATA）のみを完全に削除</strong>し、最新の2025/26開幕時点へ戻します。
            </p>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-1.5">
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>BASE DATA（実在116クラブ・実在選手・大会データ）は保護されます</span>
              </div>
              <p className="text-[11px] text-slate-400 pl-5 leading-relaxed">
                初期化後は自動でデータ検証が実行され、新規の監督プロファイル作成画面から、ランダムに提示される5クラブのオファーを選んでプレイを再開できます。
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                ※初期化実行前に確認ダイアログが表示されます
              </div>

              <button
                type="button"
                onClick={triggerResetModal}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>ゲームデータを初期化</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
