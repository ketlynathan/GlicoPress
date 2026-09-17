import React from 'react';
import { 
  Plus, 
  Volume2, 
  Trash2, 
  Heart, 
  Droplet, 
  CheckCheck, 
  Activity, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { HealthRecord, UserProfile, AccessibilitySettings } from '../types';
import { speakText } from '../services/speech';

interface DailyDiaryViewProps {
  records: HealthRecord[];
  user: UserProfile;
  accessibility: AccessibilitySettings;
  onOpenNewRecord: () => void;
  onDeleteRecord: (id: string) => void;
  onOpenMedicationsTab: () => void;
}

export const DailyDiaryView: React.FC<DailyDiaryViewProps> = ({
  records,
  user,
  accessibility,
  onOpenNewRecord,
  onDeleteRecord,
  onOpenMedicationsTab,
}) => {
  // Ordena do mais recente para o mais antigo
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Agrupa registros por data
  const groupedRecords: { [dateStr: string]: HealthRecord[] } = {};
  sortedRecords.forEach((record) => {
    if (!groupedRecords[record.date]) {
      groupedRecords[record.date] = [];
    }
    groupedRecords[record.date].push(record);
  });

  const formatDateHeader = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dateStr === today) return 'HOJE';
    if (dateStr === yesterday) return 'ONTEM';

    const [year, month, day] = dateStr.split('-');
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${day} DE ${months[parseInt(month, 10) - 1].toUpperCase()} DE ${year}`;
  };

  const getContextName = (ctx?: string) => {
    switch (ctx) {
      case 'jejum': return 'Jejum Matinal';
      case 'pos_cafe': return 'Depois do Café';
      case 'pre_almoco': return 'Antes do Almoço';
      case 'pos_almoco': return 'Depois do Almoço (2h)';
      case 'pre_jantar': return 'Antes do Jantar';
      case 'pos_jantar': return 'Depois do Jantar';
      case 'antes_dormir': return 'Antes de Dormir';
      case 'madrugada': return 'Madrugada';
      default: return 'Medição Avulsa';
    }
  };

  const speakRecordDetails = (record: HealthRecord) => {
    let msg = `Medição de ${record.time}. `;
    if (record.glucose) {
      msg += `Glicemia: ${record.glucose} miligramas por decilitro em ${getContextName(record.glucoseContext)}. `;
      if (record.glucose < user.targetGlucoseMin) {
        msg += 'Atenção, glicemia baixa. ';
      } else if (record.glucose > user.targetGlucoseMax + 40) {
        msg += 'Atenção, glicemia um pouco alta. ';
      } else {
        msg += 'Glicemia dentro da faixa esperada. ';
      }
    }
    if (record.systolic && record.diastolic) {
      const sysSimplified = Math.round(record.systolic / 10);
      const diaSimplified = Math.round(record.diastolic / 10);
      msg += `Pressão arterial: ${sysSimplified} por ${diaSimplified}, ou ${record.systolic} por ${record.diastolic} milímetros de mercúrio. `;
      if (record.systolic > user.targetSystolicMax || record.diastolic > user.targetDiastolicMax) {
        msg += 'Pressão arterial elevada. Descanse um pouco e beba água. ';
      } else {
        msg += 'Pressão arterial ótima e controlada. ';
      }
      if (record.pulse) {
        msg += `Batimentos cardíacos: ${record.pulse} batimentos por minuto.`;
      }
    }
    speakText(msg);
  };

  const fontClass = 
    accessibility.fontSize === 'extra' 
      ? 'text-lg sm:text-xl' 
      : accessibility.fontSize === 'grande' 
        ? 'text-base sm:text-lg' 
        : 'text-sm sm:text-base';

  const numberSizeClass = 
    accessibility.fontSize === 'extra' 
      ? 'text-3xl sm:text-4xl' 
      : accessibility.fontSize === 'grande' 
        ? 'text-2xl sm:text-3xl' 
        : 'text-xl sm:text-2xl';

  return (
    <div className="relative min-h-[calc(100vh-140px)] whatsapp-bg pb-28 pt-3 px-2 sm:px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        
        {/* Balão de Dica do WhatsApp (Mensagem Recebida do Assistente de Saúde) */}
        <div className="flex justify-start">
          <div className="bg-white text-slate-800 rounded-2xl rounded-tl-none p-3.5 shadow-sm max-w-[92%] sm:max-w-md border border-slate-200">
            <div className="flex items-center gap-2 mb-1 text-[#075E54] font-bold text-xs sm:text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#25D366]"></span>
              <span>Assistente GlicoPress</span>
            </div>
            <p className={`${fontClass} leading-relaxed text-slate-700`}>
              Olá, <strong className="text-slate-900">{user.name}</strong>! 🌿 Registre suas medições diariamente. Toque no botão verde <strong className="text-[#075E54]">+ Medição</strong> sempre que aferir seu aparelho.
            </p>
            <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={onOpenMedicationsTab}
                className="text-[#075E54] font-bold hover:underline flex items-center gap-1 active:scale-95"
              >
                <span>💊 Ver horários de remédios</span>
              </button>
              <span className="text-slate-400 font-medium">Hoje</span>
            </div>
          </div>
        </div>

        {/* Listagem de Grupos por Data */}
        {Object.keys(groupedRecords).length === 0 ? (
          <div className="text-center py-12 px-4 bg-white/90 rounded-2xl shadow-sm border border-slate-200">
            <div className="w-16 h-16 bg-emerald-100 text-[#075E54] rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-1">Nenhuma medição registrada ainda</h3>
            <p className="text-slate-600 text-sm max-w-sm mx-auto mb-4">
              Comece agora registrando sua glicemia ou pressão arterial tocando no botão verde abaixo.
            </p>
            <button
              onClick={onOpenNewRecord}
              className="bg-[#25D366] text-slate-950 font-extrabold px-6 py-3 rounded-full shadow-md hover:bg-emerald-400 active:scale-95 transition-all text-base"
            >
              + Adicionar Primeira Medição
            </button>
          </div>
        ) : (
          Object.entries(groupedRecords).map(([dateStr, dateRecords]) => (
            <div key={dateStr} className="space-y-3">
              {/* Pílula de Data estilo WhatsApp */}
              <div className="flex justify-center my-3 sticky top-28 z-10">
                <span className="bg-[#e1f3fb] text-[#2c5364] text-xs sm:text-sm font-bold px-4 py-1 rounded-lg shadow-sm border border-blue-200/60 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  {formatDateHeader(dateStr)}
                </span>
              </div>

              {/* Mensagens / Balões de Registro (Estilo Balão Enviado pelo Usuário #d9fdd3) */}
              {dateRecords.map((record) => {
                const isPressureAlert = record.systolic && (record.systolic > user.targetSystolicMax || (record.diastolic && record.diastolic > user.targetDiastolicMax));
                const isGlucoseAlert = record.glucose && (record.glucose > (record.glucoseContext === 'jejum' ? user.targetGlucoseMax : user.targetGlucoseMax + 40) || record.glucose < user.targetGlucoseMin);
                const hasAlert = isPressureAlert || isGlucoseAlert;

                return (
                  <div key={record.id} className="flex justify-end">
                    <div 
                      className={`relative bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-none p-3.5 sm:p-4 shadow-sm max-w-[96%] sm:max-w-lg border ${
                        hasAlert ? 'border-amber-300 ring-2 ring-amber-200/60' : 'border-emerald-200/70'
                      }`}
                    >
                      {/* Cabeçalho do balão: Tipo e Botão de Leitura de Voz */}
                      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-emerald-600/15">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wide text-[#075E54] flex items-center gap-1">
                            {record.type === 'ambos' && '🩸 Glicemia + 💓 Pressão'}
                            {record.type === 'glicemia' && '🩸 Glicemia'}
                            {record.type === 'pressao' && '💓 Pressão Arterial'}
                          </span>
                          {record.glucoseContext && (
                            <span className="bg-white/80 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-emerald-300/60">
                              {getContextName(record.glucoseContext)}
                            </span>
                          )}
                        </div>

                        {/* Botões de Ação: Ouvir e Excluir */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => speakRecordDetails(record)}
                            className="p-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-[#075E54] active:scale-95 transition-all"
                            title="Ouvir medição em voz alta"
                            aria-label="Ouvir medição"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Deseja excluir este registro de medição?')) {
                                onDeleteRecord(record.id);
                              }
                            }}
                            className="p-1.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-600 active:scale-95 transition-all"
                            title="Excluir este registro"
                            aria-label="Excluir registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Conteúdo dos Dados em Números Grandes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-2">
                        {/* Bloco de Glicemia */}
                        {record.glucose !== undefined && (
                          <div className="bg-white/90 rounded-xl p-2.5 border border-emerald-200 shadow-2xs">
                            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                              <span className="font-bold flex items-center gap-1 text-red-600">
                                <Droplet className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                                Glicose
                              </span>
                              {isGlucoseAlert ? (
                                <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded text-[11px] flex items-center gap-0.5">
                                  <AlertTriangle className="w-3 h-3 text-amber-700" />
                                  Atenção
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[11px] flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  Na meta
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className={`font-black tracking-tight text-slate-900 ${numberSizeClass}`}>
                                {record.glucose}
                              </span>
                              <span className="text-xs font-bold text-slate-500">mg/dL</span>
                            </div>
                          </div>
                        )}

                        {/* Bloco de Pressão Arterial */}
                        {record.systolic !== undefined && record.diastolic !== undefined && (
                          <div className="bg-white/90 rounded-xl p-2.5 border border-emerald-200 shadow-2xs">
                            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                              <span className="font-bold flex items-center gap-1 text-purple-700">
                                <Heart className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
                                Pressão (PA)
                              </span>
                              {isPressureAlert ? (
                                <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded text-[11px] flex items-center gap-0.5">
                                  <AlertTriangle className="w-3 h-3 text-amber-700" />
                                  Elevada
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[11px] flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  Excelente
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline justify-between">
                              <div className="flex items-baseline gap-1">
                                <span className={`font-black tracking-tight text-slate-900 ${numberSizeClass}`}>
                                  {record.systolic}
                                  <span className="text-slate-400 font-normal">/</span>
                                  {record.diastolic}
                                </span>
                                <span className="text-xs font-bold text-slate-500">mmHg</span>
                              </div>
                              {record.pulse && (
                                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                  ❤️ {record.pulse} bpm
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                              {Math.round(record.systolic / 10)} por {Math.round(record.diastolic / 10)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sintomas / Observações */}
                      {((record.symptoms && record.symptoms.length > 0) || record.notes) && (
                        <div className="mt-2 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/50 text-xs sm:text-sm text-slate-700">
                          {record.symptoms && record.symptoms.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {record.symptoms.map((s, idx) => (
                                <span key={idx} className="bg-white text-slate-800 font-medium px-2 py-0.5 rounded-full border border-emerald-300/40 text-[11px]">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                          {record.notes && (
                            <p className="italic text-slate-600 font-normal">"{record.notes}"</p>
                          )}
                        </div>
                      )}

                      {/* Rodapé do balão estilo WhatsApp com hora e duplo check azul */}
                      <div className="flex items-center justify-end gap-1.5 mt-2 text-slate-500 text-[11px] font-medium">
                        <span>{record.time}</span>
                        <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Botão Flutuante (FAB) Estilo WhatsApp para Novo Registro */}
      <div className="fixed bottom-6 right-4 sm:right-8 z-30">
        <button
          onClick={onOpenNewRecord}
          className="bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-black px-5 sm:px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 border-2 border-white/60 transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-300 group"
          title="Tocar para registrar pressão ou glicemia"
        >
          <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center group-hover:rotate-90 transition-transform">
            <Plus className="w-6 h-6 stroke-[3]" />
          </div>
          <span className="text-base sm:text-lg tracking-wide uppercase font-extrabold">
            Novo Registro
          </span>
        </button>
      </div>
    </div>
  );
};
