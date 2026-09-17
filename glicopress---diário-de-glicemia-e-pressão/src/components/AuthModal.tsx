import React, { useState } from 'react';
import { 
  X, 
  User, 
  Lock, 
  KeyRound, 
  Plus, 
  Check, 
  Shield, 
  Heart, 
  Droplet, 
  Phone, 
  LogOut, 
  Trash2,
  Edit2
} from 'lucide-react';
import { UserProfile, ConditionType } from '../types';
import { speakText, playBeepAlert } from '../services/speech';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onSaveUser: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSelectUser,
  onSaveUser,
  onDeleteUser,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<UserProfile | null>(null);

  // Form State
  const [name, setName] = useState(mode === 'edit' ? currentUser.name : '');
  const [login, setLogin] = useState(mode === 'edit' ? currentUser.login : '');
  const [passwordPin, setPasswordPin] = useState(mode === 'edit' ? currentUser.passwordPin : '');
  const [age, setAge] = useState<number | undefined>(mode === 'edit' ? currentUser.age : 65);
  const [condition, setCondition] = useState<ConditionType>(mode === 'edit' ? currentUser.condition : 'ambos');
  const [targetGlucoseMax, setTargetGlucoseMax] = useState<number>(mode === 'edit' ? currentUser.targetGlucoseMax : 140);
  const [targetSystolicMax, setTargetSystolicMax] = useState<number>(mode === 'edit' ? currentUser.targetSystolicMax : 130);
  const [targetDiastolicMax, setTargetDiastolicMax] = useState<number>(mode === 'edit' ? currentUser.targetDiastolicMax : 85);
  const [doctorName, setDoctorName] = useState(mode === 'edit' ? (currentUser.doctorName || '') : '');
  const [emergencyContact, setEmergencyContact] = useState(mode === 'edit' ? (currentUser.emergencyContact || '') : '');
  const [emergencyPhone, setEmergencyPhone] = useState(mode === 'edit' ? (currentUser.emergencyPhone || '') : '');
  const [avatarEmoji, setAvatarEmoji] = useState(mode === 'edit' ? (currentUser.avatarEmoji || '👵') : '👵');

  const handleOpenEdit = () => {
    setName(currentUser.name);
    setLogin(currentUser.login);
    setPasswordPin(currentUser.passwordPin);
    setAge(currentUser.age);
    setCondition(currentUser.condition);
    setTargetGlucoseMax(currentUser.targetGlucoseMax);
    setTargetSystolicMax(currentUser.targetSystolicMax);
    setTargetDiastolicMax(currentUser.targetDiastolicMax);
    setDoctorName(currentUser.doctorName || '');
    setEmergencyContact(currentUser.emergencyContact || '');
    setEmergencyPhone(currentUser.emergencyPhone || '');
    setAvatarEmoji(currentUser.avatarEmoji || '👵');
    setMode('edit');
  };

  const handleOpenCreate = () => {
    setName('');
    setLogin('');
    setPasswordPin('1234');
    setAge(65);
    setCondition('ambos');
    setTargetGlucoseMax(140);
    setTargetSystolicMax(130);
    setTargetDiastolicMax(85);
    setDoctorName('');
    setEmergencyContact('');
    setEmergencyPhone('');
    setAvatarEmoji('👴');
    setMode('create');
  };

  const handleSwitchUserClick = (target: UserProfile) => {
    if (target.id === currentUser.id) {
      onClose();
      return;
    }
    setSelectedCandidate(target);
    setPinInput('');
    setPinError('');
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    if (pinInput.trim() === selectedCandidate.passwordPin || !selectedCandidate.passwordPin) {
      onSelectUser(selectedCandidate);
      setSelectedCandidate(null);
      playBeepAlert('success');
      speakText(`Bem-vindo, ${selectedCandidate.name}`);
      onClose();
    } else {
      setPinError('Senha ou PIN incorreto. Tente novamente.');
      playBeepAlert('alert');
    }
  };

  const handleBypassLogin = (target: UserProfile) => {
    onSelectUser(target);
    playBeepAlert('success');
    speakText(`Perfil alterado para ${target.name}`);
    onClose();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const userToSave: UserProfile = {
      id: mode === 'edit' ? currentUser.id : 'usr_' + Date.now(),
      name: name.trim(),
      login: login.trim() || name.toLowerCase().replace(/\s+/g, ''),
      passwordPin: passwordPin.trim() || '1234',
      age: Number(age) || 60,
      condition,
      targetGlucoseMin: 70,
      targetGlucoseMax: Number(targetGlucoseMax) || 140,
      targetSystolicMax: Number(targetSystolicMax) || 130,
      targetDiastolicMax: Number(targetDiastolicMax) || 85,
      doctorName: doctorName.trim() || undefined,
      emergencyContact: emergencyContact.trim() || undefined,
      emergencyPhone: emergencyPhone.trim() || undefined,
      avatarEmoji,
      color: '#075E54',
      createdAt: mode === 'edit' ? currentUser.createdAt : new Date().toISOString(),
    };

    onSaveUser(userToSave);
    onSelectUser(userToSave);
    playBeepAlert('success');
    speakText(`Dados do paciente ${userToSave.name} salvos com sucesso.`);
    setMode('list');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border-4 border-[#075E54] overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#075E54] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#25D366] text-slate-950 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black">
                {mode === 'list' && 'Controle de Usuários'}
                {mode === 'create' && 'Cadastrar Novo Paciente'}
                {mode === 'edit' && 'Editar Dados e Metas Médicas'}
              </h2>
              <p className="text-xs text-emerald-200">
                {mode === 'list' ? 'Alterne ou adicione novos perfis' : 'Preencha os dados de saúde'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* MODO 1: LISTAGEM DE USUÁRIOS */}
          {mode === 'list' && (
            <div className="space-y-4">
              
              {/* Usuário Atual */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white text-2xl flex items-center justify-center border-2 border-[#075E54]">
                    {currentUser.avatarEmoji || '👵'}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Perfil Ativo Agora
                    </span>
                    <h3 className="text-lg font-black text-slate-900">{currentUser.name}</h3>
                    <p className="text-xs text-slate-600 font-medium">
                      {currentUser.condition === 'ambos' ? 'Diabetes e Pressão Alta' : currentUser.condition === 'diabetes' ? 'Diabetes' : 'Hipertensão'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleOpenEdit}
                  className="p-2.5 rounded-xl bg-white border border-emerald-300 text-[#075E54] hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 active:scale-95 shadow-xs"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Editar Metas</span>
                </button>
              </div>

              {/* Diálogo de PIN quando seleciona outro usuário */}
              {selectedCandidate && (
                <form onSubmit={handleConfirmPin} className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">
                      Entrar como <strong>{selectedCandidate.name}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCandidate(null)}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Digite o PIN ou Senha:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        autoFocus
                        placeholder="Ex: 1234"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 font-black text-center text-lg tracking-widest text-slate-900 focus:border-[#075E54] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl active:scale-95 transition-all text-sm shrink-0"
                      >
                        Entrar
                      </button>
                    </div>
                    {pinError && <p className="text-xs text-red-600 font-bold mt-1">{pinError}</p>}
                    <button
                      type="button"
                      onClick={() => handleBypassLogin(selectedCandidate)}
                      className="text-[11px] text-[#075E54] font-bold hover:underline mt-1.5 block"
                    >
                      Entrar sem senha (Acesso Rápido)
                    </button>
                  </div>
                </form>
              )}

              {/* Outros Perfis Cadastrados */}
              <div>
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                  Trocar de Paciente ({users.length} cadastrados):
                </span>

                <div className="space-y-2">
                  {users.map((u) => {
                    const isCurrent = u.id === currentUser.id;
                    return (
                      <div
                        key={u.id}
                        className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all ${
                          isCurrent
                            ? 'border-emerald-400 bg-emerald-50/50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSwitchUserClick(u)}
                          className="flex items-center gap-3 text-left flex-1"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl">
                            {u.avatarEmoji || '👤'}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{u.name}</h4>
                            <p className="text-xs text-slate-500">
                              {u.age ? `${u.age} anos • ` : ''}PIN: ••••
                            </p>
                          </div>
                        </button>

                        <div className="flex items-center gap-1">
                          {isCurrent ? (
                            <span className="text-xs font-bold text-[#075E54] bg-emerald-100 px-2 py-1 rounded-full">
                              Ativo
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSwitchUserClick(u)}
                              className="bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-[#075E54] text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95"
                            >
                              Acessar
                            </button>
                          )}

                          {users.length > 1 && !isCurrent && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Deseja excluir o usuário ${u.name}?`)) {
                                  onDeleteUser(u.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                              title="Excluir paciente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botão de Cadastrar Novo Paciente */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="w-full bg-[#075E54] hover:bg-[#128C7E] text-white font-black py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm sm:text-base uppercase tracking-wider active:scale-95 transition-all"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                  <span>Cadastrar Novo Paciente</span>
                </button>
              </div>
            </div>
          )}

          {/* MODO 2 & 3: FORMULÁRIO DE CADASTRO / EDIÇÃO */}
          {(mode === 'create' || mode === 'edit') && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Nome Completo:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Seu João Pereira"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:border-[#075E54] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Ícone / Avatar:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {['👵', '👴', '👩‍🦰', '👨‍🦳', '👩', '👨'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAvatarEmoji(emoji)}
                        className={`text-2xl p-1.5 rounded-xl border-2 ${
                          avatarEmoji === emoji ? 'border-[#075E54] bg-emerald-100' : 'border-slate-200 bg-white'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Senha / PIN de Acesso:
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    required
                    placeholder="Ex: 1234"
                    value={passwordPin}
                    onChange={(e) => setPasswordPin(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:border-[#075E54] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Idade:
                  </label>
                  <input
                    type="number"
                    value={age || ''}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:border-[#075E54] focus:outline-none"
                  />
                </div>
              </div>

              {/* Condição de Saúde */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Condição a ser monitorada:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ambos', label: '🩸 Diabetes + 💓 Pressão' },
                    { id: 'diabetes', label: '🩸 Apenas Diabetes' },
                    { id: 'hipertensao', label: '💓 Apenas Pressão' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCondition(c.id as ConditionType)}
                      className={`p-2.5 rounded-xl border-2 text-xs font-bold text-center active:scale-95 transition-all ${
                        condition === c.id
                          ? 'border-[#075E54] bg-emerald-50 text-[#075E54] ring-2 ring-emerald-300'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metas Médicas Recomendadas */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-extrabold text-[#075E54] uppercase tracking-wider block">
                  Metas Estabelecidas pelo Médico:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      Glicose Jejum Máx (mg/dL)
                    </label>
                    <input
                      type="number"
                      value={targetGlucoseMax}
                      onChange={(e) => setTargetGlucoseMax(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-center text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      PA Sistólica Máx (mmHg)
                    </label>
                    <input
                      type="number"
                      value={targetSystolicMax}
                      onChange={(e) => setTargetSystolicMax(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-center text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      PA Diastólica Máx (mmHg)
                    </label>
                    <input
                      type="number"
                      value={targetDiastolicMax}
                      onChange={(e) => setTargetDiastolicMax(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-center text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Médico e Contato de Emergência */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Nome do Médico:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Dr. Roberto (Cardiologista)"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 focus:bg-white focus:border-[#075E54] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Contato de Emergência:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Filho Carlos (11 98765-4321)"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 focus:bg-white focus:border-[#075E54] focus:outline-none"
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="py-3 px-4 rounded-xl border-2 border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 active:scale-95"
                >
                  Voltar
                </button>

                <button
                  type="submit"
                  className="flex-1 bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-base uppercase tracking-wider active:scale-95 transition-all"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Salvar Dados do Paciente</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
