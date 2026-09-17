import React from 'react';
import { Bell, Check, X, Volume2, Pill } from 'lucide-react';
import { Medication } from '../types';
import { speakText, playBeepAlert } from '../services/speech';

interface NotificationToastProps {
  medication: Medication | null;
  time: string;
  onTake: (med: Medication, time: string) => void;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  medication,
  time,
  onTake,
  onDismiss,
}) => {
  if (!medication) return null;

  const handleSpeak = () => {
    speakText(`Atenção! Lembrete das ${time}: Hora de tomar ${medication.name}, dose ${medication.dosage}. ${medication.instructions || ''}`);
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-md animate-in slide-in-from-top-6 duration-300">
      <div className="bg-[#075E54] text-white p-4 rounded-2xl shadow-2xl border-2 border-[#25D366] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#25D366] text-slate-950 flex items-center justify-center shrink-0 animate-bounce">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase text-amber-300 bg-black/20 px-2 py-0.5 rounded">
                Hora do Remédio ({time})
              </span>
            </div>
            <h4 className="font-extrabold text-white text-base leading-tight mt-0.5">
              {medication.name}
            </h4>
            <p className="text-xs text-emerald-100 font-medium">
              {medication.dosage} • {medication.instructions || 'Tomar agora'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleSpeak}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white active:scale-95"
            title="Ouvir lembrete"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              onTake(medication, time);
              onDismiss();
            }}
            className="bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-2.5 rounded-xl text-xs sm:text-sm active:scale-95 shadow flex items-center gap-1"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Tomei</span>
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg"
            title="Dispensar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
