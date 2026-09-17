import React from 'react';
import { MessageSquare, Pill, TrendingUp, FileText } from 'lucide-react';
import { ActiveTab } from '../types';

interface WhatsAppTabBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingMedCount: number;
  todayRecordsCount: number;
}

export const WhatsAppTabBar: React.FC<WhatsAppTabBarProps> = ({
  activeTab,
  onTabChange,
  pendingMedCount,
  todayRecordsCount,
}) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'diario',
      label: 'DIÁRIO',
      icon: <MessageSquare className="w-5 h-5" />,
      badge: todayRecordsCount > 0 ? todayRecordsCount : undefined,
    },
    {
      id: 'medicamentos',
      label: 'REMÉDIOS',
      icon: <Pill className="w-5 h-5" />,
      badge: pendingMedCount > 0 ? pendingMedCount : undefined,
    },
    {
      id: 'graficos',
      label: 'GRÁFICOS',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      id: 'relatorio',
      label: 'RELATÓRIO PDF',
      icon: <FileText className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="bg-[#075E54] border-t border-[#0b6c61] shadow-md sticky top-[73px] z-20 select-none">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-3 px-1 sm:px-3 text-center transition-all relative flex items-center justify-center gap-1.5 focus:outline-none ${
                isActive
                  ? 'text-white font-extrabold border-b-[4px] border-[#25D366] bg-black/10'
                  : 'text-emerald-100/75 hover:text-white font-semibold hover:bg-black/5'
              }`}
            >
              <span className={isActive ? 'text-[#25D366]' : 'text-emerald-200'}>
                {tab.icon}
              </span>
              <span className="text-xs sm:text-sm tracking-wider uppercase truncate">
                {tab.label}
              </span>
              {tab.badge !== undefined && (
                <span
                  className={`ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full leading-none flex items-center justify-center min-w-[18px] h-[18px] ${
                    tab.id === 'medicamentos' && tab.badge > 0
                      ? 'bg-amber-400 text-slate-900 animate-pulse'
                      : 'bg-[#25D366] text-slate-950'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
