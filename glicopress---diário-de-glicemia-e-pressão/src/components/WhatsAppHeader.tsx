import React from 'react';
import { Volume2, VolumeX, Eye, User, Sparkles, ChevronDown } from 'lucide-react';
import { UserProfile, AccessibilitySettings } from '../types';
import { speakText } from '../services/speech';

interface WhatsAppHeaderProps {
  user: UserProfile;
  accessibility: AccessibilitySettings;
  onUpdateAccessibility: (settings: AccessibilitySettings) => void;
  onOpenUserModal: () => void;
}

export const WhatsAppHeader: React.FC<WhatsAppHeaderProps> = ({
  user,
  accessibility,
  onUpdateAccessibility,
  onOpenUserModal,
}) => {
  const toggleSound = () => {
    const next = !accessibility.soundAlerts;
    onUpdateAccessibility({ ...accessibility, soundAlerts: next, voiceReadout: next });
    if (next) {
      speakText('Sons e voz ativados.');
    }
  };

  const cycleFontSize = () => {
    const nextSize = accessibility.fontSize === 'normal' ? 'grande' : accessibility.fontSize === 'grande' ? 'extra' : 'normal';
    onUpdateAccessibility({ ...accessibility, fontSize: nextSize });
    speakText(`Tamanho da letra alterado para ${nextSize === 'extra' ? 'muito grande' : nextSize}`);
  };

  const toggleContrast = () => {
    const nextContrast = !accessibility.highContrast;
    onUpdateAccessibility({ ...accessibility, highContrast: nextContrast });
  };

  const handleSpeakStatus = () => {
    const conditionText = user.condition === 'ambos' 
      ? 'diabetes e pressão alta' 
      : user.condition === 'diabetes' 
        ? 'diabetes' 
        : 'pressão alta';
    speakText(`Olá ${user.name}. Aplicativo GlicoPress conectado. Você monitora ${conditionText}. Toque no botão verde no canto inferior para registrar sua medição.`);
  };

  return (
    <header className="bg-[#075E54] text-white shadow-md select-none sticky top-0 z-30">
      {/* Barra superior de status estilo WhatsApp */}
      <div className="bg-[#054c44] text-[13px] text-emerald-100/90 px-4 py-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse"></span>
          GlicoPress Saúde • Modo Fácil
        </span>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="hidden sm:inline">Metas Médicas: PA &lt; {user.targetSystolicMax}/{user.targetDiastolicMax} | Glicose &lt; {user.targetGlucoseMax}</span>
          <button
            onClick={cycleFontSize}
            title="Alterar tamanho da letra"
            className="bg-emerald-900/60 hover:bg-emerald-800 px-2.5 py-0.5 rounded border border-emerald-500/40 text-xs text-white font-bold transition-all active:scale-95 flex items-center gap-1"
          >
            <span>Letra:</span>
            <span className="uppercase text-emerald-300">
              {accessibility.fontSize === 'normal' ? 'A' : accessibility.fontSize === 'grande' ? 'A+' : 'A++'}
            </span>
          </button>
        </div>
      </div>

      {/* Conteúdo Principal do Header */}
      <div className="px-3 py-2.5 sm:px-4 flex items-center justify-between gap-2 max-w-5xl mx-auto">
        {/* Perfil do Usuário com botão clicável para trocar */}
        <button
          onClick={onOpenUserModal}
          className="flex items-center gap-3 text-left p-1.5 rounded-xl hover:bg-white/10 transition-all active:scale-95 group focus:outline-none focus:ring-2 focus:ring-[#25D366]"
          title="Clique para trocar de usuário ou ver perfil"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-slate-800 flex items-center justify-center text-2xl font-bold shadow-inner border-2 border-[#25D366]">
              {user.avatarEmoji || '👵'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 bg-[#25D366] w-4 h-4 rounded-full border-2 border-[#075E54] flex items-center justify-center text-[9px] font-bold text-slate-900">
              ✓
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-base sm:text-lg text-white leading-tight tracking-wide flex items-center gap-1">
                {user.name}
              </h1>
              <ChevronDown className="w-4 h-4 text-emerald-300 group-hover:translate-y-0.5 transition-transform" />
            </div>
            <p className="text-xs sm:text-sm text-emerald-200/90 font-medium">
              {user.age ? `${user.age} anos • ` : ''}
              {user.condition === 'ambos' ? 'Glicemia & Pressão' : user.condition === 'diabetes' ? 'Controle Glicemia' : 'Controle Pressão'}
            </p>
          </div>
        </button>

        {/* Ações de Acessibilidade: Voz, Alto Contraste e Perfil */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Ouvir Instruções / Status */}
          <button
            onClick={handleSpeakStatus}
            className="p-2.5 rounded-full bg-[#128C7E] hover:bg-[#25D366] hover:text-slate-900 text-white transition-all active:scale-95 shadow-sm flex items-center justify-center"
            title="Ouvir instruções em voz alta"
            aria-label="Ouvir instruções"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
          </button>

          {/* Som / Mudo */}
          <button
            onClick={toggleSound}
            className={`p-2.5 rounded-full transition-all active:scale-95 shadow-sm flex items-center justify-center ${
              accessibility.soundAlerts 
                ? 'bg-[#128C7E] text-white hover:bg-emerald-600' 
                : 'bg-red-800 text-red-200'
            }`}
            title={accessibility.soundAlerts ? 'Sons ativados' : 'Sons desativados'}
            aria-label="Alternar sons"
          >
            {accessibility.soundAlerts ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Alto Contraste */}
          <button
            onClick={toggleContrast}
            className={`p-2.5 rounded-full transition-all active:scale-95 shadow-sm flex items-center justify-center ${
              accessibility.highContrast ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-[#128C7E] text-white hover:bg-emerald-600'
            }`}
            title="Alternar modo de alto contraste"
            aria-label="Alto contraste"
          >
            <Eye className="w-5 h-5" />
          </button>

          {/* Botão de Trocar Paciente */}
          <button
            onClick={onOpenUserModal}
            className="hidden sm:flex items-center gap-1.5 bg-[#25D366] text-slate-950 font-bold text-xs px-3 py-2 rounded-full hover:bg-emerald-400 active:scale-95 transition-all shadow"
          >
            <User className="w-4 h-4" />
            <span>Trocar Paciente</span>
          </button>
        </div>
      </div>
    </header>
  );
};
