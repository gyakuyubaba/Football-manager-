import React from 'react';
import { Home, Shield, DollarSign, CalendarDays, MoreHorizontal } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';

export type MainTab = 'home' | 'tactics' | 'transfers' | 'fixtures' | 'club';

interface Props {
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
  unreadNewsCount?: number;
  hasMatchToday?: boolean;
}

export const BottomTabBar: React.FC<Props> = ({ 
  activeTab, 
  onChangeTab, 
  unreadNewsCount = 0,
  hasMatchToday = false
}) => {
  const { t } = useI18n();

  const tabs: { id: MainTab; label: string; icon: React.ComponentType<{ className?: string }>; dot?: boolean; badge?: number }[] = [
    { id: 'home' as MainTab, label: t.tabHome || 'ホーム', icon: Home },
    { id: 'tactics' as MainTab, label: t.tabTactics || '戦術・編成', icon: Shield },
    { id: 'transfers' as MainTab, label: t.tabTransfers || '移籍市場', icon: DollarSign },
    { id: 'fixtures' as MainTab, label: t.tabFixtures || '試合・日程', icon: CalendarDays, dot: hasMatchToday },
    { id: 'club' as MainTab, label: t.tabClub || 'クラブ・記録', icon: MoreHorizontal }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 px-2">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChangeTab(t.id)}
              className={`flex flex-col items-center justify-center relative min-h-[44px] transition-colors cursor-pointer ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {t.badge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                    {t.badge}
                  </span>
                )}
                {t.dot && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
