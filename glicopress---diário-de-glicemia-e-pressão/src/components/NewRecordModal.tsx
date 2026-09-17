import React, { useState } from 'react';
import { 
  X, 
  Droplet, 
  Heart, 
  Check, 
  Volume2, 
  Minus, 
  Plus, 
  Clock, 
  Calendar,
  Smile,
  AlertCircle
} from 'lucide-react';
import { HealthRecord, GlucoseContext, UserProfile, AccessibilitySettings } from '../types';
import { speakText, playBeepAlert } from '../services/speech';
import confetti from 'canvas-confetti';

interface NewRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<HealthRecord, 'id' | 'timestamp'>) => void;
  user: UserProfile;
  accessibility: AccessibilitySettings;
}

export const NewRecordModal: React.FC<NewRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
  accessibility,
}) => {
  if (!isOpen) return null;

  // Estado inicial
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentTimeStr = now.toTimeString().slice(0, 5);

  const [recordType, setRecordType] = useState<'ambos' | 'glicemia' | 'pressao'>(
    user.condition === 'diabetes' ? 'glicemia' : user.condition === 'hipertensao' ? 'pressao' : 'ambos'
  );

  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(currentTimeStr);

  // Glicemia
  const [glucose, setGlucose] = useState<number>(105);
  const [glucoseContext, setGlucoseContext] = useState<GlucoseContext>('jejum');

  // Pressão
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(72);
  const [arm, setArm] = useState<'esquerdo' | 'direito'>('esquerdo');

  // Sintomas e Notas
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Sentindo-se bem']);
  const [notes, setNotes] = useState<string>('');

  const commonSymptoms = [
    'Sentindo-se bem 👍',
    'Disposto(a) ☀️',
    'Tontura 💫',
    'Dor de cabeça 🤕',
    'Boca seca / Sede 💧',
    'Fraqueza / Cansaço 😴',
    'Visão turva 👓',
  ];

  const toggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const handleSpeakSummary = () => {
    let text = 'Você está prestes a salvar: ';
    if (recordType === 'ambos' || recordType === 'glicemia') {
      text += `Glicemia ${glucose} miligramas por decilitro. `;
    }
    if (recordType === 'ambos' || recordType === 'pressao') {
      text += `Pressão ${Math.round(systolic / 10)} por ${Math.round(diastolic / 10)}, sistólica ${systolic}, diastólica ${diastolic}. `;
    }
    text += 'Toque no botão verde grande para confirmar.';
    speakText(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Determina status
    let status: HealthRecord['status'] = 'normal';
    if (recordType !== 'glicemia') {
      if (systolic > user.targetSystolicMax + 20 || diastolic > user.targetDiastolicMax + 15) {
        status = 'perigo';
      } else if (systolic > user.targetSystolicMax || diastolic > user.targetDiastolicMax) {
        status = 'alerta';
      }
    }
    if (recordType !== 'pressao') {
      if (glucose > user.targetGlucoseMax + 40 || glucose < user.targetGlucoseMin) {
        status = 'alerta';
      }
      if (glucose > 240 || glucose < 60) {
        status = 'perigo';
      }
    }

    const newRecord: Omit<HealthRecord, 'id' | 'timestamp'> = {
      userId: user.id,
      type: recordType,
      date,
      time,
      glucose: recordType === 'pressao' ? undefined : glucose,
      glucoseContext: recordType === 'pressao' ? undefined : glucoseContext,
      systolic: recordType === 'glicemia' ? undefined : systolic,
      diastolic: recordType === 'glicemia' ? undefined : diastolic,
      pulse: recordType === 'glicemia' ? undefined : pulse,
      arm: recordType === 'glicemia' ? undefined : arm,
      symptoms: selectedSymptoms,
      notes: notes.trim() || undefined,
      status,
    };

    onSave(newRecord);
    playBeepAlert('success');

    // Celebração visual suave
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // Confetti opcional
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border-4 border-[#075E54] overflow-hidden my-auto flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Cabeçalho do Modal estilo WhatsApp */}
        <div className="bg-[#075E54] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#25D366] text-slate-950 flex items-center justify-center font-black">
              ✓
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black leading-tight">Novo Registro</h2>
              <p className="text-xs text-emerald-200 font-medium">Preencha com calma e confirme abaixo</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSpeakSummary}
              type="button"
              className="p-2.5 rounded-full bg-[#128C7E] hover:bg-[#25D366] hover:text-slate-900 text-white active:scale-95 transition-all"
              title="Ouvir dados preenchidos"
              aria-label="Ouvir"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2.5 rounded-full hover:bg-white/15 text-white active:scale-95 transition-all"
              aria-label="Fechar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Formulário com Rolagem */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Seletor de Tipo de Medição (Grandes Botões) */}
          <div>
            <label className="block text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              O que você mediu agora?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecordType('ambos')}
                className={`py-3 px-2 rounded-2xl border-2 font-bold text-xs sm:text-sm flex flex-col items-center gap-1 transition-all active:scale-95 ${
                  recordType === 'ambos'
                    ? 'border-[#075E54] bg-emerald-50 text-[#075E54] shadow-md ring-2 ring-emerald-400'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1 text-base">
                  <span>🩸</span>
                  <span>💓</span>
                </div>
                <span>Ambos</span>
              </button>

              <button
                type="button"
                onClick={() => setRecordType('glicemia')}
                className={`py-3 px-2 rounded-2xl border-2 font-bold text-xs sm:text-sm flex flex-col items-center gap-1 transition-all active:scale-95 ${
                  recordType === 'glicemia'
                    ? 'border-red-600 bg-red-50 text-red-700 shadow-md ring-2 ring-red-400'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">🩸</span>
                <span>Só Glicemia</span>
              </button>

              <button
                type="button"
                onClick={() => setRecordType('pressao')}
                className={`py-3 px-2 rounded-2xl border-2 font-bold text-xs sm:text-sm flex flex-col items-center gap-1 transition-all active:scale-95 ${
                  recordType === 'pressao'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-md ring-2 ring-purple-400'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">💓</span>
                <span>Só Pressão</span>
              </button>
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#075E54]" />
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-sm sm:text-base font-bold text-slate-800 focus:border-[#075E54] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-[#075E54]" />
                Horário
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-sm sm:text-base font-bold text-slate-800 focus:border-[#075E54] focus:outline-none"
              />
            </div>
          </div>

          {/* SEÇÃO GLICEMIA */}
          {(recordType === 'ambos' || recordType === 'glicemia') && (
            <div className="bg-red-50/50 p-4 rounded-2xl border-2 border-red-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-red-700 text-sm sm:text-base flex items-center gap-1.5">
                  <Droplet className="w-5 h-5 fill-red-600 text-red-600" />
                  Glicemia (mg/dL)
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  Meta jejum: &lt; {user.targetGlucoseMax} mg/dL
                </span>
              </div>

              {/* Ajuste de Glicemia com números gigantes e botões +/- */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setGlucose(Math.max(30, glucose - 5))}
                  className="w-14 h-14 rounded-2xl bg-white border-2 border-red-300 text-red-700 hover:bg-red-100 flex items-center justify-center font-black text-2xl active:scale-90 shadow-sm"
                  aria-label="Diminuir 5 na glicemia"
                >
                  <Minus className="w-7 h-7 stroke-[3]" />
                </button>

                <div className="bg-white border-3 border-red-400 rounded-2xl px-6 py-2 shadow-inner text-center min-w-[140px]">
                  <input
                    type="number"
                    value={glucose}
                    onChange={(e) => setGlucose(Number(e.target.value))}
                    className="w-24 text-center font-black text-4xl text-slate-900 focus:outline-none"
                  />
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">mg/dL</div>
                </div>

                <button
                  type="button"
                  onClick={() => setGlucose(glucose + 5)}
                  className="w-14 h-14 rounded-2xl bg-white border-2 border-red-300 text-red-700 hover:bg-red-100 flex items-center justify-center font-black text-2xl active:scale-90 shadow-sm"
                  aria-label="Aumentar 5 na glicemia"
                >
                  <Plus className="w-7 h-7 stroke-[3]" />
                </button>
              </div>

              {/* Atalhos Rápidos de Glicemia */}
              <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
                {[85, 95, 110, 130, 150, 180].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setGlucose(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                      glucose === val
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>

              {/* Momento / Contexto da Refeição */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Momento em que mediu:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'jejum', label: '☀️ Em Jejum' },
                    { id: 'pos_cafe', label: '☕ Após o Café' },
                    { id: 'pos_almoco', label: '🍽️ Após Almoço (2h)' },
                    { id: 'antes_dormir', label: '🌙 Antes de Dormir' },
                  ].map((ctx) => (
                    <button
                      key={ctx.id}
                      type="button"
                      onClick={() => setGlucoseContext(ctx.id as GlucoseContext)}
                      className={`p-2 rounded-xl text-xs font-bold border text-center transition-all ${
                        glucoseContext === ctx.id
                          ? 'bg-red-600 text-white border-red-600 shadow'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {ctx.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO PRESSÃO ARTERIAL */}
          {(recordType === 'ambos' || recordType === 'pressao') && (
            <div className="bg-purple-50/50 p-4 rounded-2xl border-2 border-purple-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-purple-700 text-sm sm:text-base flex items-center gap-1.5">
                  <Heart className="w-5 h-5 fill-purple-600 text-purple-600" />
                  Pressão Arterial (mmHg)
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  Meta: &lt; {user.targetSystolicMax}/{user.targetDiastolicMax}
                </span>
              </div>

              {/* Atalhos Rápidos Populares para Idosos (ex: 12 por 8) */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 mr-1">Atalhos rápidos:</span>
                {[
                  { label: '11 x 7', sys: 110, dia: 70 },
                  { label: '12 x 8 (Normal)', sys: 120, dia: 80 },
                  { label: '13 x 8', sys: 130, dia: 80 },
                  { label: '14 x 9', sys: 140, dia: 90 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setSystolic(item.sys);
                      setDiastolic(item.dia);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                      systolic === item.sys && diastolic === item.dia
                        ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                        : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Campos Sistólica e Diastólica */}
              <div className="grid grid-cols-2 gap-3">
                {/* Sistólica (Máxima) */}
                <div className="bg-white p-3 rounded-xl border border-purple-200 text-center">
                  <span className="text-xs font-bold text-slate-600 block mb-1">
                    Sistólica (Máxima)
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSystolic(Math.max(60, systolic - 5))}
                      className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 font-bold active:scale-95 flex items-center justify-center"
                    >
                      <Minus className="w-5 h-5 stroke-[3]" />
                    </button>
                    <span className="font-black text-3xl text-slate-900 w-16">
                      {systolic}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSystolic(systolic + 5)}
                      className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 font-bold active:scale-95 flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5 stroke-[3]" />
                    </button>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-700 mt-1 block">
                    Equivale a {Math.round(systolic / 10)}
                  </span>
                </div>

                {/* Diastólica (Mínima) */}
                <div className="bg-white p-3 rounded-xl border border-purple-200 text-center">
                  <span className="text-xs font-bold text-slate-600 block mb-1">
                    Diastólica (Mínima)
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDiastolic(Math.max(40, diastolic - 5))}
                      className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 font-bold active:scale-95 flex items-center justify-center"
                    >
                      <Minus className="w-5 h-5 stroke-[3]" />
                    </button>
                    <span className="font-black text-3xl text-slate-900 w-16">
                      {diastolic}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDiastolic(diastolic + 5)}
                      className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 font-bold active:scale-95 flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5 stroke-[3]" />
                    </button>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-700 mt-1 block">
                    Equivale a {Math.round(diastolic / 10)}
                  </span>
                </div>
              </div>

              {/* Pulso e Braço */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    ❤️ Pulso / Batimentos
                  </label>
                  <input
                    type="number"
                    value={pulse}
                    onChange={(e) => setPulse(Number(e.target.value))}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-1.5 text-center font-bold text-slate-800"
                    placeholder="72 bpm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Braço medido
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setArm('esquerdo')}
                      className={`py-1.5 rounded-lg text-xs font-bold border ${
                        arm === 'esquerdo' ? 'bg-purple-700 text-white' : 'bg-white text-slate-700'
                      }`}
                    >
                      Esquerdo
                    </button>
                    <button
                      type="button"
                      onClick={() => setArm('direito')}
                      className={`py-1.5 rounded-lg text-xs font-bold border ${
                        arm === 'direito' ? 'bg-purple-700 text-white' : 'bg-white text-slate-700'
                      }`}
                    >
                      Direito
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Como você está se sentindo agora? (Sintomas) */}
          <div>
            <label className="block text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              Como está se sentindo agora?
            </label>
            <div className="flex flex-wrap gap-1.5">
              {commonSymptoms.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all active:scale-95 ${
                      isSelected
                        ? 'border-[#075E54] bg-[#d9fdd3] text-slate-900 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observação Adicional */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Anotação ou recado para o médico (opcional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Tomei café sem açúcar, caminhei 20 minutos"
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2.5 text-sm sm:text-base font-medium text-slate-800 focus:bg-white focus:border-[#075E54] focus:outline-none"
            />
          </div>

          {/* BOTÃO GRANDE VERDE DE SALVAR */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-black py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-lg sm:text-xl uppercase tracking-wider transition-all active:scale-95 border-2 border-emerald-600/30 cursor-pointer"
            >
              <Check className="w-7 h-7 stroke-[3]" />
              <span>Confirmar e Salvar no Diário</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
