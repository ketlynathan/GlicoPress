import jsPDF from 'jspdf';
import { UserProfile, HealthRecord, Medication } from '../types';

export interface ReportSummary {
  periodLabel: string;
  totalRecords: number;
  avgSystolic: number | null;
  avgDiastolic: number | null;
  minPressure: string | null;
  maxPressure: string | null;
  avgFastingGlucose: number | null;
  avgPostMealGlucose: number | null;
  minGlucose: number | null;
  maxGlucose: number | null;
  inRangePercentage: number;
  alertCount: number;
}

export function computeReportSummary(records: HealthRecord[], user: UserProfile, periodLabel: string): ReportSummary {
  let systolicSum = 0;
  let systolicCount = 0;
  let diastolicSum = 0;
  let diastolicCount = 0;
  let minSys = 999;
  let maxSys = 0;
  let minDia = 999;
  let maxDia = 0;

  let fastingSum = 0;
  let fastingCount = 0;
  let postMealSum = 0;
  let postMealCount = 0;
  let minGlu = 999;
  let maxGlu = 0;

  let inRangeCount = 0;
  let totalEvaluated = 0;
  let alertCount = 0;

  records.forEach(r => {
    let isOk = true;

    if (r.systolic && r.diastolic) {
      systolicSum += r.systolic;
      systolicCount++;
      diastolicSum += r.diastolic;
      diastolicCount++;

      if (r.systolic < minSys) minSys = r.systolic;
      if (r.systolic > maxSys) maxSys = r.systolic;
      if (r.diastolic < minDia) minDia = r.diastolic;
      if (r.diastolic > maxDia) maxDia = r.diastolic;

      if (r.systolic > user.targetSystolicMax || r.diastolic > user.targetDiastolicMax) {
        isOk = false;
        alertCount++;
      }
    }

    if (r.glucose) {
      if (r.glucose < minGlu) minGlu = r.glucose;
      if (r.glucose > maxGlu) maxGlu = r.glucose;

      if (r.glucoseContext === 'jejum') {
        fastingSum += r.glucose;
        fastingCount++;
        if (r.glucose > user.targetGlucoseMax || r.glucose < user.targetGlucoseMin) {
          isOk = false;
          alertCount++;
        }
      } else {
        postMealSum += r.glucose;
        postMealCount++;
        if (r.glucose > (user.targetGlucoseMax + 40) || r.glucose < user.targetGlucoseMin) {
          isOk = false;
          alertCount++;
        }
      }
    }

    totalEvaluated++;
    if (isOk) inRangeCount++;
  });

  return {
    periodLabel,
    totalRecords: records.length,
    avgSystolic: systolicCount > 0 ? Math.round(systolicSum / systolicCount) : null,
    avgDiastolic: diastolicCount > 0 ? Math.round(diastolicSum / diastolicCount) : null,
    minPressure: minSys !== 999 ? `${minSys}/${minDia}` : null,
    maxPressure: maxSys !== 0 ? `${maxSys}/${maxDia}` : null,
    avgFastingGlucose: fastingCount > 0 ? Math.round(fastingSum / fastingCount) : null,
    avgPostMealGlucose: postMealCount > 0 ? Math.round(postMealSum / postMealCount) : null,
    minGlucose: minGlu !== 999 ? minGlu : null,
    maxGlucose: maxGlu !== 0 ? maxGlu : null,
    inRangePercentage: totalEvaluated > 0 ? Math.round((inRangeCount / totalEvaluated) * 100) : 100,
    alertCount,
  };
}

export function createDoctorPDFDoc(
  user: UserProfile,
  records: HealthRecord[],
  medications: Medication[],
  periodLabel: string
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const summary = computeReportSummary(records, user, periodLabel);

  // Paleta de cores médicas e elegantes
  const primaryColor = [7, 94, 84]; // #075E54 (WhatsApp Teal)
  const secondaryColor = [18, 140, 126];
  const darkText = [30, 41, 59];
  const grayText = [100, 116, 139];
  const bgBox = [241, 245, 249];

  // CABEÇALHO
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('GlicoPress - Relatório Clínico de Acompanhamento', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Diário de Glicemia e Pressão Arterial para Avaliação Médica', 14, 18);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, 24);

  // IDENTIFICAÇÃO DO PACIENTE (Card)
  let y = 34;
  doc.setFillColor(bgBox[0], bgBox[1], bgBox[2]);
  doc.roundedRect(12, y, 186, 26, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('DADOS DO PACIENTE', 16, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(`Paciente: ${user.name} (${user.age ? user.age + ' anos' : 'Não informado'})`, 16, y + 12);
  doc.text(`Condição Clínica: ${user.condition === 'ambos' ? 'Diabetes Mellitus & Hipertensão Arterial' : user.condition === 'diabetes' ? 'Diabetes Mellitus' : 'Hipertensão Arterial'}`, 16, y + 17);
  doc.text(`Médico Assistente: ${user.doctorName || 'Não especificado'}`, 16, y + 22);

  doc.text(`Período Avaliado: ${periodLabel}`, 115, y + 12);
  doc.text(`Metas: PA < ${user.targetSystolicMax}/${user.targetDiastolicMax} mmHg | Glicemia Jejum < ${user.targetGlucoseMax} mg/dL`, 115, y + 17);
  doc.text(`Contato Emergência: ${user.emergencyContact || '-'} ${user.emergencyPhone || ''}`, 115, y + 22);

  // RESUMO ESTATÍSTICO (Quadro)
  y = 64;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('RESUMO DAS MEDIÇÕES NO PERÍODO', 14, y);

  y += 4;
  // 4 caixas de métricas
  const boxWidth = 44;
  const boxHeight = 18;
  const metrics = [
    {
      title: 'Média de Pressão',
      value: summary.avgSystolic ? `${summary.avgSystolic} x ${summary.avgDiastolic}` : 'Sem dados',
      sub: summary.minPressure ? `Min: ${summary.minPressure} | Max: ${summary.maxPressure}` : 'mmHg',
    },
    {
      title: 'Glicemia em Jejum',
      value: summary.avgFastingGlucose ? `${summary.avgFastingGlucose} mg/dL` : 'Sem dados',
      sub: summary.minGlucose ? `Min: ${summary.minGlucose} | Max: ${summary.maxGlucose}` : 'mg/dL',
    },
    {
      title: 'Glicemia Pós-Refeição',
      value: summary.avgPostMealGlucose ? `${summary.avgPostMealGlucose} mg/dL` : 'Sem dados',
      sub: 'Média após almoço/jantar',
    },
    {
      title: 'Aderência à Meta',
      value: `${summary.inRangePercentage}%`,
      sub: `${summary.alertCount} medições fora da meta`,
    },
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + (idx * 46);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, boxWidth, boxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text(m.title, x + 3, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(m.value, x + 3, y + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text(m.sub, x + 3, y + 16);
  });

  // MEDICAMENTOS EM USO
  y += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('MEDICAMENTOS ATUAIS EM USO:', 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  
  const medText = medications.length > 0 
    ? medications.map(m => `• ${m.name} (${m.dosage}) - Horários: ${m.times.join(', ')} [${m.instructions || ''}]`).join('\n')
    : 'Nenhum medicamento registrado.';
  
  const splitMed = doc.splitTextToSize(medText, 182);
  doc.text(splitMed, 14, y + 4.5);
  y += 5 + (splitMed.length * 4);

  // TABELA DE REGISTROS CRONOLÓGICOS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`REGISTRO DETALHADO DAS MEDIÇÕES (${records.length} registros)`, 14, y);

  y += 3;
  // Cabeçalho da tabela
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(12, y, 186, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');

  doc.text('Data / Hora', 14, y + 5);
  doc.text('Contexto / Refeição', 38, y + 5);
  doc.text('Glicemia', 76, y + 5);
  doc.text('Pressão (PA)', 102, y + 5);
  doc.text('Pulso', 130, y + 5);
  doc.text('Sintomas / Observações', 146, y + 5);

  y += 7;

  // Linhas da tabela
  doc.setFont('helvetica', 'normal');
  const sortedRecords = [...records].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  sortedRecords.forEach((r, idx) => {
    // Nova página se necessário
    if (y > 270) {
      doc.addPage();
      y = 16;
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(12, y, 186, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Data / Hora', 14, y + 5);
      doc.text('Contexto / Refeição', 38, y + 5);
      doc.text('Glicemia', 76, y + 5);
      doc.text('Pressão (PA)', 102, y + 5);
      doc.text('Pulso', 130, y + 5);
      doc.text('Sintomas / Observações', 146, y + 5);
      y += 7;
      doc.setFont('helvetica', 'normal');
    }

    // Zebra striping
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(12, y, 186, 6.5, 'F');
    }

    // Alerta de cor no texto se fora do normal
    doc.setFontSize(7.5);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);

    const formattedDate = r.date.split('-').reverse().slice(0, 2).join('/') + ' ' + r.time;
    doc.text(formattedDate, 14, y + 4.5);

    const contextLabels: Record<string, string> = {
      jejum: 'Jejum Matinal',
      pos_cafe: 'Pós-Café',
      pre_almoco: 'Pré-Almoço',
      pos_almoco: 'Pós-Almoço',
      pre_jantar: 'Pré-Jantar',
      pos_jantar: 'Pós-Jantar',
      antes_dormir: 'Antes de Dormir',
      madrugada: 'Madrugada',
      outro: 'Geral',
    };
    const ctx = r.glucoseContext ? contextLabels[r.glucoseContext] || r.glucoseContext : '-';
    doc.text(ctx, 38, y + 4.5);

    // Glicemia com status
    if (r.glucose) {
      if (r.glucose > user.targetGlucoseMax + 40 || r.glucose < user.targetGlucoseMin) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(185, 28, 28); // vermelho
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      }
      doc.text(`${r.glucose} mg/dL`, 76, y + 4.5);
    } else {
      doc.text('-', 76, y + 4.5);
    }

    // Pressão com status
    if (r.systolic && r.diastolic) {
      if (r.systolic > user.targetSystolicMax || r.diastolic > user.targetDiastolicMax) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(185, 28, 28);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      }
      doc.text(`${r.systolic} x ${r.diastolic} mmHg`, 102, y + 4.5);
    } else {
      doc.text('-', 102, y + 4.5);
    }

    // Pulso
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text(r.pulse ? `${r.pulse} bpm` : '-', 130, y + 4.5);

    // Sintomas / Notas
    const notesStr = [
      ...(r.symptoms || []),
      r.notes || ''
    ].filter(Boolean).join(' - ');
    const truncatedNotes = notesStr.length > 32 ? notesStr.substring(0, 30) + '...' : (notesStr || 'Normal');
    doc.text(truncatedNotes, 146, y + 4.5);

    y += 6.5;
  });

  // RODAPÉ / ASSINATURA DO MÉDICO
  if (y > 250) {
    doc.addPage();
    y = 20;
  } else {
    y += 10;
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, 196, y);

  y += 12;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Documento gerado pelo GlicoPress para acompanhamento médico ambulatorial.', 14, y);

  // Linha de assinatura
  doc.line(125, y + 10, 190, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Assinatura / Carimbo do Médico', 130, y + 14);

  return doc;
}

export function generateDoctorPDF(
  user: UserProfile,
  records: HealthRecord[],
  medications: Medication[],
  periodLabel: string
): void {
  const doc = createDoctorPDFDoc(user, records, medications, periodLabel);
  const safeName = user.name.replace(/\s+/g, '_').toLowerCase();
  doc.save(`relatorio_glicopress_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function getDoctorPDFFile(
  user: UserProfile,
  records: HealthRecord[],
  medications: Medication[],
  periodLabel: string
): { file: File; blob: Blob; filename: string } {
  const doc = createDoctorPDFDoc(user, records, medications, periodLabel);
  const safeName = user.name.replace(/\s+/g, '_').toLowerCase();
  const filename = `relatorio_glicopress_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`;
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });
  return { file, blob, filename };
}

export function generateWhatsAppSummaryText(
  user: UserProfile,
  records: HealthRecord[],
  medications: Medication[],
  periodLabel: string
): string {
  const summary = computeReportSummary(records, user, periodLabel);
  const conditionLabel = user.condition === 'ambos' 
    ? 'Diabetes e Hipertensão' 
    : user.condition === 'diabetes' 
      ? 'Diabetes' 
      : 'Hipertensão';

  let text = `🩺 *GlicoPress - Relatório de Saúde*\n`;
  text += `👤 *Paciente:* ${user.name}${user.age ? ` (${user.age} anos)` : ''}\n`;
  text += `🏥 *Condição:* ${conditionLabel}\n`;
  text += `📅 *Período:* ${periodLabel}\n`;
  if (user.doctorName) {
    text += `👨‍⚕️ *Médico Assistente:* ${user.doctorName}\n`;
  }
  text += `\n📊 *RESUMO CLÍNICO:*\n`;
  text += `• *Total de medições:* ${summary.totalRecords}\n`;
  
  if (summary.avgSystolic && summary.avgDiastolic) {
    text += `• *Média de Pressão (PA):* ${summary.avgSystolic} x ${summary.avgDiastolic} mmHg`;
    if (summary.minPressure && summary.maxPressure) {
      text += ` (Min: ${summary.minPressure} | Máx: ${summary.maxPressure})`;
    }
    text += `\n`;
  }

  if (summary.avgFastingGlucose) {
    text += `• *Glicemia em Jejum (média):* ${summary.avgFastingGlucose} mg/dL`;
    if (summary.minGlucose && summary.maxGlucose) {
      text += ` (Min: ${summary.minGlucose} | Máx: ${summary.maxGlucose})`;
    }
    text += `\n`;
  }

  if (summary.avgPostMealGlucose) {
    text += `• *Glicemia Pós-Refeição (média):* ${summary.avgPostMealGlucose} mg/dL\n`;
  }

  text += `• *Aderência às Metas Médicas:* ${summary.inRangePercentage}%\n`;
  if (summary.alertCount > 0) {
    text += `• *Avisos/Medições fora da meta:* ${summary.alertCount}\n`;
  }

  const activeMeds = medications.filter(m => m.active);
  if (activeMeds.length > 0) {
    text += `\n💊 *MEDICAMENTOS ATUAIS:*\n`;
    activeMeds.forEach(m => {
      text += `• ${m.name} (${m.dosage}) - Horários: ${m.times.join(', ')}\n`;
    });
  }

  text += `\n_Relatório gerado pelo aplicativo GlicoPress para avaliação médica._`;
  return text;
}
