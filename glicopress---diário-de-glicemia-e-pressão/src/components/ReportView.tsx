import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Share2, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  Heart, 
  Droplet, 
  Pill,
  UserCheck,
  MessageCircle,
  Send
} from 'lucide-react';
import { HealthRecord, UserProfile, Medication, AccessibilitySettings } from '../types';
import { generateDoctorPDF, computeReportSummary } from '../services/pdfGenerator';
import { speakText, playBeepAlert } from '../services/speech';
import { ShareReportModal } from './ShareReportModal';
import confetti from 'canvas-confetti';

interface ReportViewProps {
  records: HealthRecord[];
  user: UserProfile;
  medications: Medication[];
  accessibility: AccessibilitySettings;
}

export const ReportView: React.FC<ReportViewProps> = ({
  records,
  user,
  medications,
  accessibility,
}) => {
  const [periodFilter, setPeriodFilter] = useState<'ultimos_30' | 'este_mes' | 'ultimos_7' | 'todos'>('ultimos_30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { filteredRecords, periodLabel } = useMemo(() => {
    const now = new Date();
    let cutoff = new Date();
    let label = 'Últimos 30 Dias';

    if (periodFilter === 'ultimos_7') {
      cutoff.setDate(now.getDate() - 7);
      label = 'Últimos 7 Dias';
    } else if (periodFilter === 'ultimos_30') {
      cutoff.setDate(now.getDate() - 30);
      label = 'Últimos 30 Dias (Mensal)';
    } else if (periodFilter === 'este_mes') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      label = `Mês de ${monthNames[now.getMonth()]} de ${now.getFullYear()}`;
    } else {
      cutoff = new Date(0);
      label = 'Todo o Histórico Completo';
    }

    const filtered = records
      .filter((r) => new Date(r.timestamp) >= cutoff)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { filteredRecords: filtered, periodLabel: label };
  }, [records, periodFilter]);

  const summary = useMemo(() => {
    return computeReportSummary(filteredRecords, user, periodLabel);
  }, [filteredRecords, user, periodLabel]);

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    playBeepAlert('success');
    speakText(`Gerando relatório em PDF para o Dr. ${user.doctorName || 'seu médico'}. O arquivo será baixado no seu dispositivo.`);

    setTimeout(() => {
      try {
        generateDoctorPDF(user, filteredRecords, medications, periodLabel);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.error('Erro ao gerar PDF:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 400);
  };

  const handleSpeakSummary = () => {
    let msg = `Resumo do relatório de ${periodLabel}. `;
    msg += `Total de ${summary.totalRecords} medições realizadas. `;
    if (summary.avgSystolic && summary.avgDiastolic) {
      msg += `Sua média de pressão foi ${summary.avgSystolic} por ${summary.avgDiastolic}. `;
    }
    if (summary.avgFastingGlucose) {
      msg += `Sua média de glicemia em jejum foi ${summary.avgFastingGlucose} miligramas por decilitro. `;
    }
    msg += `Aderência à meta médica foi de ${summary.inRangePercentage} porcento. `;
    speakText(msg);
  };

  return (
    <div className="whatsapp-bg min-h-[calc(100vh-140px)] pb-28 pt-4 px-2 sm:px-4 select-none">
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* Banner de Ação Principal: Baixar PDF com Botão Gigante */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-md border-2 border-emerald-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-[#075E54] flex items-center justify-center shrink-0 shadow-inner">
                <FileText className="w-9 h-9" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  Relatório Mensal para o Médico
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium max-w-lg">
                  Gera um documento oficial em PDF formatado com todas as médias, horários e remédios para levar à consulta ou enviar por WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => setIsShareModalOpen(true)}
                disabled={filteredRecords.length === 0}
                className="w-full sm:w-auto bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-black py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2.5 text-base sm:text-lg uppercase tracking-wider active:scale-95 transition-all border-2 border-emerald-600/30 cursor-pointer disabled:opacity-50"
              >
                <Share2 className="w-6 h-6 stroke-[3]" />
                <span>Compartilhar WhatsApp</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={isGenerating || filteredRecords.length === 0}
                className="w-full sm:w-auto bg-[#075E54] hover:bg-[#128C7E] text-white font-black py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2.5 text-sm sm:text-base uppercase tracking-wider active:scale-95 transition-all border border-emerald-300/30 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>{isGenerating ? 'Criando...' : 'Baixar PDF'}</span>
              </button>
            </div>
          </div>

          {/* Seletor de Período do Relatório */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#075E54]" />
              <span className="text-xs sm:text-sm font-extrabold text-slate-700">Filtrar período:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ultimos_30', label: 'Últimos 30 Dias' },
                { id: 'este_mes', label: 'Este Mês' },
                { id: 'ultimos_7', label: '7 Dias' },
                { id: 'todos', label: 'Todos' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriodFilter(p.id as typeof periodFilter)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                    periodFilter === p.id
                      ? 'bg-[#075E54] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quadro de Resumo Clínico do Paciente */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#075E54]" />
              <h3 className="font-extrabold text-base text-slate-900">
                Resumo Clínico que constará no PDF
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1 text-xs font-bold bg-[#25D366]/20 text-[#075E54] hover:bg-[#25D366]/30 px-3 py-1.5 rounded-xl border border-emerald-300 active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Compartilhar</span>
              </button>
              <button
                onClick={handleSpeakSummary}
                className="flex items-center gap-1 text-xs font-bold text-[#075E54] hover:underline active:scale-95"
              >
                <Volume2 className="w-4 h-4" />
                <span>Ouvir Resumo</span>
              </button>
            </div>
          </div>

          {/* 4 Blocos de Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs font-bold text-slate-500 block mb-1">Média de Pressão</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {summary.avgSystolic ? `${summary.avgSystolic} x ${summary.avgDiastolic}` : '-'}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                {summary.minPressure ? `Min ${summary.minPressure} / Max ${summary.maxPressure}` : 'mmHg'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs font-bold text-slate-500 block mb-1">Glicemia em Jejum</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {summary.avgFastingGlucose ? `${summary.avgFastingGlucose}` : '-'}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                mg/dL (Média)
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs font-bold text-slate-500 block mb-1">Total de Medições</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {summary.totalRecords}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                {periodLabel}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs font-bold text-slate-500 block mb-1">Aderência à Meta</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700">
                {summary.inRangePercentage}%
              </span>
              <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                {summary.alertCount} fora da meta
              </span>
            </div>
          </div>

          {/* Lista de Medicamentos inclusos no relatório */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
              Remédios que serão impressos no relatório:
            </span>
            <div className="flex flex-wrap gap-2">
              {medications.map((m) => (
                <div key={m.id} className="bg-emerald-50 text-emerald-950 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{m.name} ({m.dosage}) - Horários: {m.times.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabela Prévia dos Registros */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 overflow-hidden">
          <h4 className="font-extrabold text-slate-900 text-sm mb-3">
            Prévia das Medições ({filteredRecords.length} registros no período)
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#075E54] text-white uppercase text-[11px] font-bold">
                <tr>
                  <th className="p-2.5 rounded-tl-xl">Data / Hora</th>
                  <th className="p-2.5">Contexto</th>
                  <th className="p-2.5">Glicemia</th>
                  <th className="p-2.5">Pressão (PA)</th>
                  <th className="p-2.5">Pulso</th>
                  <th className="p-2.5 rounded-tr-xl">Sintomas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.slice(0, 15).map((r, idx) => (
                  <tr key={r.id} className={idx % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'}>
                    <td className="p-2.5 font-bold text-slate-800 whitespace-nowrap">
                      {r.date.split('-').reverse().join('/')} {r.time}
                    </td>
                    <td className="p-2.5 text-slate-600 font-medium">
                      {r.glucoseContext || 'Geral'}
                    </td>
                    <td className="p-2.5 font-black text-slate-900">
                      {r.glucose ? `${r.glucose} mg/dL` : '-'}
                    </td>
                    <td className="p-2.5 font-black text-slate-900">
                      {r.systolic && r.diastolic ? `${r.systolic} x ${r.diastolic} mmHg` : '-'}
                    </td>
                    <td className="p-2.5 text-slate-600">
                      {r.pulse ? `${r.pulse} bpm` : '-'}
                    </td>
                    <td className="p-2.5 text-slate-600 italic truncate max-w-[150px]">
                      {[...(r.symptoms || []), r.notes].filter(Boolean).join(', ') || 'Normal'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length > 15 && (
            <p className="text-center text-xs text-slate-500 mt-3 italic font-medium">
              Mostrando as primeiras 15 medições. O arquivo PDF conterá todos os {filteredRecords.length} registros completos.
            </p>
          )}

          {/* Barra de Ação Rápida de Envio */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <span className="text-xs text-slate-600 font-bold text-center sm:text-left">
              💬 Envie este relatório para o médico, cuidador ou familiares no WhatsApp:
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex-1 sm:flex-none bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
              >
                <Share2 className="w-4 h-4 stroke-[2.5]" />
                <span>Enviar pelo WhatsApp</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isGenerating || filteredRecords.length === 0}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Salvar PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Compartilhamento WhatsApp e Sistema */}
      <ShareReportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        user={user}
        records={filteredRecords}
        medications={medications}
        periodLabel={periodLabel}
        accessibility={accessibility}
      />
    </div>
  );
};
