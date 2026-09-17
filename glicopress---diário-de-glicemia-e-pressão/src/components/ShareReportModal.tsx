import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  FileText, 
  MessageCircle, 
  Copy, 
  Check, 
  Download, 
  Volume2, 
  Smartphone, 
  Send,
  Phone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { HealthRecord, UserProfile, Medication, AccessibilitySettings } from '../types';
import { 
  generateDoctorPDF, 
  getDoctorPDFFile, 
  generateWhatsAppSummaryText, 
  computeReportSummary 
} from '../services/pdfGenerator';
import { speakText, playBeepAlert } from '../services/speech';
import confetti from 'canvas-confetti';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  records: HealthRecord[];
  medications: Medication[];
  periodLabel: string;
  accessibility: AccessibilitySettings;
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  isOpen,
  onClose,
  user,
  records,
  medications,
  periodLabel,
  accessibility,
}) => {
  if (!isOpen) return null;

  const [isSharingPDF, setIsSharingPDF] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const summaryText = generateWhatsAppSummaryText(user, records, medications, periodLabel);
  const summary = computeReportSummary(records, user, periodLabel);

  // Verifica suporte à API de compartilhamento nativo do sistema
  const hasSystemShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  
  const canShareFiles = (): boolean => {
    if (!hasSystemShare || typeof navigator.canShare !== 'function' || typeof File === 'undefined') {
      return false;
    }
    try {
      const testFile = new File(['test'], 'teste.pdf', { type: 'application/pdf' });
      return navigator.canShare({ files: [testFile] });
    } catch {
      return false;
    }
  };

  const supportsFileShare = canShareFiles();

  // 1. Compartilhar PDF diretamente pelo sistema (WhatsApp / Apps)
  const handleSharePDF = async () => {
    setIsSharingPDF(true);
    setStatusMessage(null);

    try {
      const { file } = getDoctorPDFFile(user, records, medications, periodLabel);

      if (supportsFileShare) {
        speakText('Abrindo compartilhamento do sistema com o arquivo PDF.');
        await navigator.share({
          title: `Relatório Clínico - ${user.name}`,
          text: `Olá! Segue o relatório clínico de ${user.name} (${periodLabel}) em formato PDF gerado pelo GlicoPress.`,
          files: [file],
        });

        setStatusMessage({
          type: 'success',
          text: 'PDF compartilhado com sucesso!',
        });
        playBeepAlert('success');
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      } else {
        // Fallback quando o navegador do dispositivo não suporta envio direto de arquivo via WebShare
        generateDoctorPDF(user, records, medications, periodLabel);
        setStatusMessage({
          type: 'info',
          text: 'O arquivo PDF foi baixado no seu dispositivo! Agora você pode anexá-lo na conversa do WhatsApp.',
        });
        playBeepAlert('success');
        speakText('O arquivo PDF foi baixado no seu aparelho. Você já pode anexá-lo na conversa do WhatsApp.');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // O usuário apenas fechou a gaveta de compartilhamento
        return;
      }
      console.warn('Erro ao compartilhar PDF:', err);
      // Caso de erro no sistema, garante download do PDF
      generateDoctorPDF(user, records, medications, periodLabel);
      setStatusMessage({
        type: 'info',
        text: 'O PDF foi salvo em seus downloads. Abra o WhatsApp e anexe o arquivo baixado.',
      });
    } finally {
      setIsSharingPDF(false);
    }
  };

  // 2. Compartilhar resumo em texto via API do Sistema
  const handleShareTextViaSystem = async () => {
    setStatusMessage(null);
    if (hasSystemShare) {
      try {
        speakText('Abrindo menu de compartilhamento para escolher o contato do WhatsApp.');
        await navigator.share({
          title: `Relatório de Saúde - ${user.name}`,
          text: summaryText,
        });
        setStatusMessage({
          type: 'success',
          text: 'Resumo em texto compartilhado com sucesso!',
        });
        playBeepAlert('success');
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        // Fallback para abrir o WhatsApp diretamente
        handleOpenWhatsAppDirect();
      }
    } else {
      handleOpenWhatsAppDirect();
    }
  };

  // 3. Abrir diretamente o WhatsApp com o texto pronto
  const handleOpenWhatsAppDirect = (phone?: string) => {
    setStatusMessage(null);
    playBeepAlert('success');
    speakText('Abrindo o WhatsApp com a mensagem do relatório pronta.');

    let cleanPhone = '';
    if (phone) {
      cleanPhone = phone.replace(/\D/g, '');
      // Se tiver número nacional de 10 ou 11 dígitos sem DDI 55, adiciona 55
      if (cleanPhone.length >= 10 && !cleanPhone.startsWith('55')) {
        cleanPhone = '55' + cleanPhone;
      }
    }

    const encodedText = encodeURIComponent(summaryText);
    const whatsappUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // 4. Copiar texto formatado do resumo
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedText(true);
      playBeepAlert('success');
      speakText('Texto do relatório copiado com sucesso. Você pode colar em qualquer conversa do WhatsApp.');
      setTimeout(() => setCopiedText(false), 3000);
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Não foi possível copiar automaticamente. Selecione o texto abaixo para copiar.',
      });
    }
  };

  // 5. Ouvir em voz alta o resumo
  const handleSpeakPreview = () => {
    speakText(summaryText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border-4 border-[#075E54] overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        
        {/* Topo estilo WhatsApp */}
        <div className="bg-[#075E54] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#25D366] text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Share2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black leading-tight flex items-center gap-2">
                <span>Compartilhar Relatório</span>
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                Envie em PDF ou texto para contatos do WhatsApp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/15 text-white active:scale-95 transition-all"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Feedback de Status */}
        {statusMessage && (
          <div className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-100 text-emerald-950 border-b border-emerald-300' 
              : statusMessage.type === 'error'
                ? 'bg-red-100 text-red-950 border-b border-red-300'
                : 'bg-amber-100 text-amber-950 border-b border-amber-300'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Conteúdo rolável */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Identificação do Paciente e Período */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-extrabold text-[#075E54] uppercase tracking-wider block">
                Relatório de Acompanhamento
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {user.name} • {periodLabel}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {summary.totalRecords} medições • {summary.inRangePercentage}% de metas atingidas
              </p>
            </div>
            
            <button
              onClick={handleSpeakPreview}
              className="p-2.5 rounded-xl bg-white border border-emerald-300 text-[#075E54] hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95"
              title="Ouvir Resumo"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">Ouvir</span>
            </button>
          </div>

          {/* OPÇÕES PRINCIPAIS DE COMPARTILHAMENTO */}
          <div className="space-y-3">
            
            {/* Opção 1: Compartilhar Arquivo PDF via Sistema (WhatsApp / Qualquer App) */}
            <div className="bg-white border-2 border-emerald-500/80 hover:border-emerald-600 rounded-2xl p-4 shadow-sm transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#075E54] flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-900">
                        Compartilhar Arquivo PDF
                      </h4>
                      <span className="bg-[#25D366]/20 text-[#075E54] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Documento Oficial
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
                      Envia o documento PDF completo com tabelas, médias e espaço para assinatura médica diretamente pelo menu do celular ou computador.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSharePDF}
                  disabled={isSharingPDF}
                  className="w-full sm:w-auto bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-black py-3 px-5 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Share2 className="w-5 h-5 stroke-[2.5]" />
                  <span>{isSharingPDF ? 'Gerando...' : 'Compartilhar PDF'}</span>
                </button>
              </div>
            </div>

            {/* Opção 2: Compartilhar Resumo em Texto no WhatsApp */}
            <div className="bg-white border-2 border-slate-200 hover:border-emerald-400 rounded-2xl p-4 shadow-sm transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#25D366] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                    <MessageCircle className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-900">
                        Enviar Resumo em Texto
                      </h4>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Pronto para Ler
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
                      Mensagem formatada com negrito, médias de pressão e glicemia, lista de remédios e percentuais de meta.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  {hasSystemShare ? (
                    <button
                      type="button"
                      onClick={handleShareTextViaSystem}
                      className="bg-[#075E54] hover:bg-[#128C7E] text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 shadow transition-all cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Compartilhar Texto</span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleOpenWhatsAppDirect()}
                    className="bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 shadow transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4 stroke-[2.5]" />
                    <span>Abrir no WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Botões de Atalho Rápido se houver Contato ou Médico cadastrado */}
              {(user.emergencyPhone || user.doctorName) && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block w-full">
                    Atalhos Rápidos de Envio:
                  </span>
                  
                  {user.emergencyPhone && (
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsAppDirect(user.emergencyPhone)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-[#075E54] border border-emerald-300 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 active:scale-95"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Enviar para {user.emergencyContact || 'Contato de Emergência'} ({user.emergencyPhone})</span>
                    </button>
                  )}

                  {user.doctorName && (
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsAppDirect()}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5 text-[#075E54]" />
                      <span>Enviar para o Médico: {user.doctorName}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Pré-visualização do Balão do WhatsApp */}
          <div className="bg-[#e5ddd5] p-3.5 sm:p-4 rounded-2xl border border-slate-300 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#075E54]" />
                <span>Prévia da Mensagem no WhatsApp:</span>
              </span>

              <button
                type="button"
                onClick={handleCopyText}
                className="bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 flex items-center gap-1.5 active:scale-95 shadow-2xs"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span className="text-emerald-700">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>

            {/* Balão Verde Claro do WhatsApp */}
            <div className="bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-xs p-3 sm:p-4 shadow-sm font-sans text-xs sm:text-sm whitespace-pre-wrap leading-relaxed border border-emerald-200 select-text">
              {summaryText}
              <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-slate-500 font-semibold">
                <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-emerald-700 font-bold">✓✓</span>
              </div>
            </div>
          </div>

        </div>

        {/* Rodapé do Modal */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500 font-medium">
            💡 Dica: Se preferir imprimir em papel, você também pode baixar o PDF.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm active:scale-95"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
