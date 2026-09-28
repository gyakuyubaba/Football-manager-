import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => { success: boolean; error?: string };
}

export const ResetConfirmationModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useI18n();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecuteReset = () => {
    setIsProcessing(true);
    setErrorMessage(null);

    // Short timeout to guarantee UI feedback
    setTimeout(() => {
      try {
        const result = onConfirm();
        if (!result.success) {
          setErrorMessage(result.error || '初期化検証に失敗しました。');
          setIsProcessing(false);
        } else {
          // Success: App will reset state and unmount modal
          onClose();
        }
      } catch (err: any) {
        setErrorMessage(err?.message || '初期化中に予期せぬエラーが発生しました。');
        setIsProcessing(false);
      }
    }, 150);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 my-auto text-left">
        
        {/* Close Icon */}
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 id="reset-modal-title" className="text-lg sm:text-xl font-bold text-white tracking-tight">
              ゲームデータを初期化しますか？
            </h3>
            <p className="text-xs text-red-300/90 font-medium mt-1">
              ※この操作は取り消すことができません
            </p>
          </div>
        </div>

        {/* Exact User Prompt Body */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5">
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            現在の監督キャリア、移籍、試合結果、順位、選手成長などがすべて削除されます。
          </p>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold">保持されるデータ（BASE DATA）:</span>
            </div>
            <p className="pl-5 text-slate-400">
              実在116クラブ・実在選手・選手基本能力・大会日程・多言語辞書は完全に保持されます。
            </p>
          </div>
        </div>

        {/* Error notification if validation fails */}
        {errorMessage && (
          <div className="bg-red-950/60 border border-red-700/60 rounded-xl p-3 text-xs text-red-200 leading-relaxed">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            キャンセル
          </button>
          
          <button
            type="button"
            onClick={handleExecuteReset}
            disabled={isProcessing}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>初期化処理中...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>初期化する</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
