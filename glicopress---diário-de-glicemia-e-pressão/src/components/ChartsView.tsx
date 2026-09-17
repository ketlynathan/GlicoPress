import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  Volume2, 
  Heart, 
  Droplet, 
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { HealthRecord, UserProfile, AccessibilitySettings } from '../types';
import { speakText } from '../services/speech';

interface ChartsViewProps {
  records: HealthRecord[];
  user: UserProfile;
  accessibility: AccessibilitySettings;
}

type Timeframe = 'diario' | 'semanal' | 'mensal';

export const ChartsView: React.FC<ChartsViewProps> = ({
  records,
  user,
  accessibility,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('semanal');
  const [activeMetric, setActiveMetric] = useState<'todos' | 'pressao' | 'glicemia'>('todos');

  // Filtra registros pelo período selecionado
  const filteredRecords = useMemo(() => {
    const now = new Date();
    let daysToInclude = 7;
    if (timeframe === 'diario') daysToInclude = 1;
    if (timeframe === 'semanal') daysToInclude = 7;
    if (timeframe === 'mensal') daysToInclude = 30;

    const cutoff = new Date();
    cutoff.setDate(now.getDate() - daysToInclude);

    return records
      .filter((r) => new Date(r.timestamp) >= cutoff)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [records, timeframe]);

  // Formata os dados para o Recharts
  const chartData = useMemo(() => {
    if (timeframe === 'diario') {
      // Pega medições do dia com o horário
      return filteredRecords.map((r) => ({
        label: r.time,
        glicemia: r.glucose || null,
        sistolica: r.systolic || null,
        diastolica: r.diastolic || null,
        pulso: r.pulse || null,
        fullDate: r.date,
      }));
    }

    // Para semanal e mensal, agrupa por dia e calcula a média diária
    const dailyMap: Record<string, {
      glucoseSum: number;
      glucoseCount: number;
      sysSum: number;
      sysCount: number;
      diaSum: number;
      diaCount: number;
    }> = {};

    filteredRecords.forEach((r) => {
      if (!dailyMap[r.date]) {
        dailyMap[r.date] = {
          glucoseSum: 0,
          glucoseCount: 0,
          sysSum: 0,
          sysCount: 0,
          diaSum: 0,
          diaCount: 0,
        };
      }
      if (r.glucose) {
        dailyMap[r.date].glucoseSum += r.glucose;
        dailyMap[r.date].glucoseCount++;
      }
      if (r.systolic && r.diastolic) {
        dailyMap[r.date].sysSum += r.systolic;
        dailyMap[r.date].sysCount++;
        dailyMap[r.date].diaSum += r.diastolic;
        dailyMap[r.date].diaCount++;
      }
    });

    return Object.entries(dailyMap).map(([dateStr, agg]) => {
      const [year, month, day] = dateStr.split('-');
      return {
        label: `${day}/${month}`,
        glicemia: agg.glucoseCount > 0 ? Math.round(agg.glucoseSum / agg.glucoseCount) : null,
        sistolica: agg.sysCount > 0 ? Math.round(agg.sysSum / agg.sysCount) : null,
        diastolica: agg.diaCount > 0 ? Math.round(agg.diaSum / agg.diaCount) : null,
        fullDate: dateStr,
      };
    });
  }, [filteredRecords, timeframe]);

  // Análise de Tendência Inteligente
  const trendAnalysis = useMemo(() => {
    if (filteredRecords.length < 2) {
      return {
        status: 'estavel',
        title: 'Poucas Medições',
        description: 'Faça mais medições para gerar uma análise comparativa precisa.',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
        icon: <Minus className="w-5 h-5 text-slate-600" />,
      };
    }

    // Compara a primeira metade do período com a segunda metade
    const half = Math.floor(filteredRecords.length / 2);
    const firstHalf = filteredRecords.slice(0, half);
    const secondHalf = filteredRecords.slice(half);

    const avg = (arr: HealthRecord[], key: 'glucose' | 'systolic') => {
      const valid = arr.filter((x) => x[key] !== undefined);
      if (valid.length === 0) return 0;
      return valid.reduce((acc, curr) => acc + (curr[key] || 0), 0) / valid.length;
    };

    const firstSys = avg(firstHalf, 'systolic');
    const secondSys = avg(secondHalf, 'systolic');
    const firstGlu = avg(firstHalf, 'glucose');
    const secondGlu = avg(secondHalf, 'glucose');

    let improvingCount = 0;
    let worseningCount = 0;

    if (firstSys > 0 && secondSys > 0) {
      if (secondSys < firstSys - 3) improvingCount++;
      else if (secondSys > firstSys + 4) worseningCount++;
    }

    if (firstGlu > 0 && secondGlu > 0) {
      if (secondGlu < firstGlu - 6) improvingCount++;
      else if (secondGlu > firstGlu + 8) worseningCount++;
    }

    if (improvingCount > worseningCount) {
      return {
        status: 'melhorando',
        title: 'Seus números estão Melhorando! 🟢',
        description: `Parabéns ${user.name}! Seus valores médios estão mais baixos e estáveis em comparação ao início do período. Continue tomando seus remédios pontualmente e mantendo a boa alimentação.`,
        badgeColor: 'bg-[#d9fdd3] text-emerald-950 border-[#25D366]',
        icon: <TrendingDown className="w-6 h-6 text-emerald-700" />,
      };
    } else if (worseningCount > improvingCount) {
      return {
        status: 'piorando',
        title: 'Atenção: Números em Alta 🔴',
        description: `Seus valores médios apresentaram uma leve elevação recentemente. Reduza o sal, tome água, confira se não esqueceu nenhum remédio e mostre este relatório ao ${user.doctorName || 'seu médico'}.`,
        badgeColor: 'bg-amber-50 text-amber-950 border-amber-300',
        icon: <TrendingUp className="w-6 h-6 text-amber-700" />,
      };
    } else {
      return {
        status: 'estavel',
        title: 'Seus números estão Estáveis 🟡',
        description: `Seus registros estão mantendo uma média constante, com boa disciplina de horários. Continue medindo todos os dias!`,
        badgeColor: 'bg-blue-50 text-blue-950 border-blue-200',
        icon: <Minus className="w-6 h-6 text-blue-600" />,
      };
    }
  }, [filteredRecords, user]);

  const handleSpeakAnalysis = () => {
    speakText(`Análise do seu período ${timeframe}: ${trendAnalysis.title}. ${trendAnalysis.description}`);
  };

  return (
    <div className="whatsapp-bg min-h-[calc(100vh-140px)] pb-28 pt-4 px-2 sm:px-4 select-none">
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* Seletor de Período Estilo WhatsApp */}
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-emerald-200 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#075E54]" />
            <span className="font-extrabold text-xs sm:text-sm text-slate-700 uppercase tracking-wider">
              Visualizar Período:
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(['diario', 'semanal', 'mensal'] as Timeframe[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`py-2 px-4 rounded-lg font-black text-xs sm:text-sm uppercase tracking-wide transition-all active:scale-95 ${
                  timeframe === t
                    ? 'bg-[#075E54] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'diario' ? 'Diário (Hoje)' : t === 'semanal' ? 'Semanal (7 Dias)' : 'Mensal (30 Dias)'}
              </button>
            ))}
          </div>
        </div>

        {/* Card Grande de Análise de Tendência (Com voz) */}
        <div className={`rounded-2xl p-4 sm:p-5 border-2 shadow-sm ${trendAnalysis.badgeColor}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-white shadow-xs shrink-0">
                {trendAnalysis.icon}
              </div>
              <div>
                <h3 className="font-black text-base sm:text-xl text-slate-900 leading-tight">
                  {trendAnalysis.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed font-medium">
                  {trendAnalysis.description}
                </p>
              </div>
            </div>

            <button
              onClick={handleSpeakAnalysis}
              className="p-3 rounded-full bg-white text-[#075E54] shadow-sm hover:bg-emerald-50 active:scale-95 transition-all shrink-0 border border-emerald-300"
              title="Ouvir análise de evolução em voz alta"
              aria-label="Ouvir análise"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* GRÁFICO 1: PRESSÃO ARTERIAL (SISTÓLICA E DIASTÓLICA) */}
        {(user.condition === 'ambos' || user.condition === 'hipertensao') && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Heart className="w-5 h-5 fill-purple-600" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                    Evolução da Pressão Arterial (PA)
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Meta segura recomendada: Sistólica &lt; {user.targetSystolicMax} mmHg | Diastólica &lt; {user.targetDiastolicMax} mmHg
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-500">Unidade: mmHg</span>
              </div>
            </div>

            {/* Container do Gráfico */}
            <div className="h-64 sm:h-72 w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold text-sm">
                  Sem registros de pressão para o período selecionado
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} 
                    />
                    <YAxis 
                      domain={[50, 180]} 
                      tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '2px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: number) => [`${val} mmHg`, '']}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '8px', fontSize: '13px', fontWeight: 'bold' }} 
                    />
                    {/* Linha de Referência da Meta Médica */}
                    <ReferenceLine 
                      y={user.targetSystolicMax} 
                      stroke="#ef4444" 
                      strokeDasharray="4 4" 
                      label={{ value: `Limite Sistólica (${user.targetSystolicMax})`, fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} 
                    />
                    <ReferenceLine 
                      y={user.targetDiastolicMax} 
                      stroke="#3b82f6" 
                      strokeDasharray="4 4" 
                      label={{ value: `Limite Diastólica (${user.targetDiastolicMax})`, fill: '#3b82f6', fontSize: 10, position: 'insideBottomRight' }} 
                    />
                    <Line
                      type="monotone"
                      name="Sistólica (Máxima)"
                      dataKey="sistolica"
                      stroke="#7e22ce"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#7e22ce', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 7 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      name="Diastólica (Mínima)"
                      dataKey="diastolica"
                      stroke="#0284c7"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#0284c7', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 7 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* GRÁFICO 2: GLICEMIA (mg/dL) */}
        {(user.condition === 'ambos' || user.condition === 'diabetes') && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  <Droplet className="w-5 h-5 fill-red-600" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                    Evolução da Glicemia Capilar
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Meta recomendada pelo médico: {user.targetGlucoseMin} a {user.targetGlucoseMax} mg/dL em jejum
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-500">Unidade: mg/dL</span>
              </div>
            </div>

            {/* Container do Gráfico */}
            <div className="h-64 sm:h-72 w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold text-sm">
                  Sem registros de glicemia para o período selecionado
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} 
                    />
                    <YAxis 
                      domain={[50, 240]} 
                      tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '2px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: number) => [`${val} mg/dL`, 'Glicemia']}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '8px', fontSize: '13px', fontWeight: 'bold' }} 
                    />
                    <ReferenceLine 
                      y={user.targetGlucoseMax} 
                      stroke="#dc2626" 
                      strokeDasharray="4 4" 
                      label={{ value: `Meta Jejum (${user.targetGlucoseMax})`, fill: '#dc2626', fontSize: 10, position: 'insideTopRight' }} 
                    />
                    <ReferenceLine 
                      y={user.targetGlucoseMin} 
                      stroke="#ea580c" 
                      strokeDasharray="4 4" 
                      label={{ value: `Mínimo (${user.targetGlucoseMin})`, fill: '#ea580c', fontSize: 10, position: 'insideBottomRight' }} 
                    />
                    <Line
                      type="monotone"
                      name="Glicemia (mg/dL)"
                      dataKey="glicemia"
                      stroke="#dc2626"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#dc2626', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 7 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
