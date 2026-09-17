import React, { useState } from 'react';
import { 
  Pill, 
  Plus, 
  Check, 
  Clock, 
  Bell, 
  Volume2, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { Medication, MedicationLog, UserProfile, AccessibilitySettings } from '../types';
import { speakText, playBeepAlert } from '../services/speech';
import confetti from 'canvas-confetti';

interface MedicationsViewProps {
  medications: Medication[];
  medicationLogs: MedicationLog[];
  user: UserProfile;
  accessibility: AccessibilitySettings;
  onTakeDose: (med: Medication, time: string) => void;
  onUndoDose: (logId: string) => void;
  onSaveMedication: (med: Medication) => void;
  onDeleteMedication: (id: string) => void;
}

export const MedicationsView: React.FC<MedicationsViewProps> = ({
  medications,
  medicationLogs,
  user,
  accessibility,
  onTakeDose,
  onUndoDose,
  onSaveMedication,
  onDeleteMedication,
}) => {
  const [isNewMedModalOpen, setIsNewMedModalOpen] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedCategory, setNewMedCategory] = useState<'diabetes' | 'pressao' | 'outro'>('pressao');
  const [newMedTimes, setNewMedTimes] = useState<string[]>(['08:00']);
  const [newMedInstructions, setNewMedInstructions] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = medicationLogs.filter((l) => l.date === todayStr);

  const isDoseTakenToday = (medId: string, scheduledTime: string) => {
    return todayLogs.some((l) => l.medicationId === medId && l.scheduledTime === scheduledTime);
  };

  const getLogForDose = (medId: string, scheduledTime: string) => {
    return todayLogs.find((l) => l.medicationId === medId && l.scheduledTime === scheduledTime);
  };

  const handleTakeDose = (med: Medication, time: string) => {
    onTakeDose(med, time);
    playBeepAlert('success');
    speakText(`Muito bem ${user.name}! Você registrou que tomou ${med.name}. Parabéns pela disciplina!`);
    
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
      });
    } catch {
      // Ignorar
    }
  };

  const handleTestAlarm = (med: Medication, time: string) => {
    playBeepAlert('medication');
    speakText(`Atenção ${user.name}! Alarme de lembrete: Está no horário de tomar ${med.name}, dose ${med.dosage}. ${med.instructions || ''}`);
  };

  const handleSaveNewMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const newMed: Medication = {
      id: 'med_' + Date.now(),
      userId: user.id,
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || '1 comprimido',
      category: newMedCategory,
      instructions: newMedInstructions.trim() || 'Conforme orientação médica',
      times: newMedTimes,
      active: true,
      color: newMedCategory === 'diabetes' ? '#16a34a' : newMedCategory === 'pressao' ? '#0284c7' : '#9333ea',
    };

    onSaveMedication(newMed);
    setIsNewMedModalOpen(false);
    setNewMedName('');
    setNewMedDosage('');
    setNewMedInstructions('');
    setNewMedTimes(['08:00']);
    playBeepAlert('success');
    speakText(`Remédio ${newMed.name} cadastrado com sucesso.`);
  };

  const addTimeSlot = () => {
    setNewMedTimes([...newMedTimes, '12:00']);
  };

  const updateTimeSlot = (idx: number, val: string) => {
    const updated = [...newMedTimes];
    updated[idx] = val;
    setNewMedTimes(updated);
  };

  const removeTimeSlot = (idx: number) => {
    if (newMedTimes.length > 1) {
      setNewMedTimes(newMedTimes.filter((_, i) => i !== idx));
    }
  };

  return (
    <div className="whatsapp-bg min-h-[calc(100vh-140px)] pb-28 pt-4 px-2 sm:px-4 select-none">
      <div className="max-w-3xl mx-auto space-y-4">
        
        {/* Banner Informativo Estilo WhatsApp */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#075E54] flex items-center justify-center shrink-0">
                <Pill className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Controle Diário de Remédios
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Marque cada dose assim que tomar para manter seu tratamento em dia.
                </p>
              </div>
            </div>
            
            {/* Botão de Cadastrar Novo */}
            <button
              onClick={() => setIsNewMedModalOpen(true)}
              className="bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-md text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Adicionar Remédio</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>

          {/* Dica de Notificação Ativa */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Bell className="w-4 h-4 text-emerald-600 animate-bounce" />
              Lembretes sonoros ativados pontualmente
            </span>
            <span className="text-[#075E54] font-bold">
              {todayLogs.length} doses tomadas hoje
            </span>
          </div>
        </div>

        {/* Lista de Medicamentos Cadastrados */}
        {medications.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm">
            <Pill className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">Nenhum remédio cadastrado</p>
            <p className="text-xs text-slate-500 mb-4">Cadastre os remédios recomendados pelo seu médico.</p>
            <button
              onClick={() => setIsNewMedModalOpen(true)}
              className="bg-[#25D366] text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-sm"
            >
              + Cadastrar Meu Primeiro Remédio
            </button>
          </div>
        ) : (
          medications.map((med) => (
            <div
              key={med.id}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 transition-all hover:border-emerald-300"
            >
              {/* Topo do Card do Remédio */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-sm"
                    style={{ backgroundColor: med.color || '#075E54' }}
                  >
                    💊
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-base sm:text-lg">
                        {med.name}
                      </h3>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        med.category === 'diabetes' 
                          ? 'bg-red-100 text-red-700' 
                          : med.category === 'pressao'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {med.category === 'diabetes' ? '🩸 Diabetes' : med.category === 'pressao' ? '💓 Pressão' : 'Geral'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-600">
                      Dose: <span className="text-slate-900">{med.dosage}</span>
                    </p>
                  </div>
                </div>

                {/* Ações: Testar Alarme & Excluir */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTestAlarm(med, med.times[0] || '08:00')}
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all border border-amber-200"
                    title="Testar alarme sonoro e de voz deste remédio"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline">Testar Alarme</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja remover o remédio ${med.name}?`)) {
                        onDeleteMedication(med.id);
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
                    title="Excluir remédio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Instruções de Uso */}
              {med.instructions && (
                <div className="my-2.5 text-xs sm:text-sm bg-slate-50 p-2.5 rounded-xl text-slate-700 font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#075E54] shrink-0" />
                  <span>Como tomar: <strong>{med.instructions}</strong></span>
                </div>
              )}

              {/* Horários e Botão "Já Tomei" com Acessibilidade Máxima */}
              <div className="mt-3 space-y-2">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                  Horários Programados para Hoje:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {med.times.map((time) => {
                    const isTaken = isDoseTakenToday(med.id, time);
                    const log = getLogForDose(med.id, time);

                    return (
                      <div
                        key={time}
                        className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between gap-2 ${
                          isTaken
                            ? 'bg-[#d9fdd3] border-[#25D366] text-slate-900 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl font-black text-sm flex items-center gap-1 ${
                            isTaken ? 'bg-[#25D366] text-slate-950' : 'bg-slate-100 text-slate-800'
                          }`}>
                            <Clock className="w-4 h-4" />
                            <span>{time}</span>
                          </div>
                          <div>
                            {isTaken ? (
                              <div>
                                <span className="text-xs font-black text-emerald-900 flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                                  Tomado com sucesso!
                                </span>
                                <span className="text-[11px] text-slate-600 font-medium">
                                  {log?.takenAt ? `às ${new Date(log.takenAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Hoje'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Dose Pendente
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botão de Check-in ou Desfazer */}
                        {isTaken ? (
                          <button
                            onClick={() => log && onUndoDose(log.id)}
                            className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-xs"
                            title="Desfazer se marcou por engano"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Desfazer</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTakeDose(med, time)}
                            className="bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-4 rounded-xl shadow-md text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-emerald-600/30"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>JÁ TOMEI</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL PARA CADASTRAR NOVO REMÉDIO */}
      {isNewMedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/65 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-4 border-[#075E54] overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="bg-[#075E54] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-6 h-6 text-[#25D366]" />
                <h3 className="text-xl font-black">Cadastrar Novo Remédio</h3>
              </div>
              <button
                onClick={() => setIsNewMedModalOpen(false)}
                className="p-1.5 text-white hover:bg-white/10 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveNewMed} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Nome do Remédio:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Losartana, Insulina, Metformina"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-900 focus:bg-white focus:border-[#075E54] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Dosagem:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 50mg, 1 cp, 10 UI"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:border-[#075E54] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Finalidade:
                  </label>
                  <select
                    value={newMedCategory}
                    onChange={(e) => setNewMedCategory(e.target.value as 'diabetes' | 'pressao' | 'outro')}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:border-[#075E54] focus:outline-none"
                  >
                    <option value="pressao">💓 Pressão Alta</option>
                    <option value="diabetes">🩸 Diabetes</option>
                    <option value="outro">Geral / Outros</option>
                  </select>
                </div>
              </div>

              {/* Horários */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Horários das Doses:
                  </label>
                  <button
                    type="button"
                    onClick={addTimeSlot}
                    className="text-xs font-bold text-[#075E54] hover:underline flex items-center gap-0.5"
                  >
                    + Adicionar outro horário
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {newMedTimes.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <input
                        type="time"
                        value={t}
                        onChange={(e) => updateTimeSlot(idx, e.target.value)}
                        className="bg-slate-50 border-2 border-slate-300 rounded-xl px-2 py-1.5 font-black text-center text-slate-900 flex-1 focus:border-[#075E54] focus:outline-none"
                      />
                      {newMedTimes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(idx)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Instruções */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Como tomar (instrução médica):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Em jejum pela manhã, após o almoço"
                  value={newMedInstructions}
                  onChange={(e) => setNewMedInstructions(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 focus:bg-white focus:border-[#075E54] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-base uppercase tracking-wider active:scale-95 transition-all"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Salvar Remédio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
