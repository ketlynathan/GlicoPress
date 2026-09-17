import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserProfile, 
  HealthRecord, 
  Medication, 
  MedicationLog, 
  ActiveTab, 
  AccessibilitySettings 
} from './types';
import { StorageService } from './services/storage';
import { playBeepAlert, speakText } from './services/speech';
import { WhatsAppHeader } from './components/WhatsAppHeader';
import { WhatsAppTabBar } from './components/WhatsAppTabBar';
import { DailyDiaryView } from './components/DailyDiaryView';
import { MedicationsView } from './components/MedicationsView';
import { ChartsView } from './components/ChartsView';
import { ReportView } from './components/ReportView';
import { NewRecordModal } from './components/NewRecordModal';
import { AuthModal } from './components/AuthModal';
import { NotificationToast } from './components/NotificationToast';

export default function App() {
  // Estado do Usuário e Sessão
  const [users, setUsers] = useState<UserProfile[]>(() => StorageService.getUsers());
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => StorageService.getActiveUser());

  // Navegação
  const [activeTab, setActiveTab] = useState<ActiveTab>('diario');

  // Dados de Saúde
  const [records, setRecords] = useState<HealthRecord[]>(() => StorageService.getRecords(currentUser.id));
  const [medications, setMedications] = useState<Medication[]>(() => StorageService.getMedications(currentUser.id));
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>(() => StorageService.getMedicationLogs(undefined, currentUser.id));

  // Acessibilidade
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>(() => StorageService.getAccessibilitySettings());

  // Modais
  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Alerta de Remédio Notificação
  const [activeMedAlarm, setActiveMedAlarm] = useState<{ med: Medication; time: string } | null>(null);

  // Sincroniza dados quando troca de usuário
  useEffect(() => {
    StorageService.setActiveUserId(currentUser.id);
    setRecords(StorageService.getRecords(currentUser.id));
    setMedications(StorageService.getMedications(currentUser.id));
    setMedicationLogs(StorageService.getMedicationLogs(undefined, currentUser.id));
  }, [currentUser.id]);

  // Aplica classe de alto contraste e acessibilidade no body
  useEffect(() => {
    if (accessibility.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    StorageService.saveAccessibilitySettings(accessibility);
  }, [accessibility]);

  // Monitor de Horários de Remédio para Notificação Pontual
  useEffect(() => {
    const checkScheduledMedications = () => {
      const now = new Date();
      const currentHourMinute = now.toTimeString().slice(0, 5); // "08:00"
      const todayStr = now.toISOString().split('T')[0];

      // Procura se tem algum remédio no horário atual que ainda não foi tomado hoje
      for (const med of medications) {
        if (!med.active) continue;
        for (const time of med.times) {
          if (time === currentHourMinute) {
            const alreadyTaken = medicationLogs.some(
              (l) => l.medicationId === med.id && l.scheduledTime === time && l.date === todayStr
            );
            if (!alreadyTaken && (!activeMedAlarm || activeMedAlarm.med.id !== med.id)) {
              setActiveMedAlarm({ med, time });
              if (accessibility.soundAlerts) {
                playBeepAlert('medication');
              }
              if (accessibility.voiceReadout) {
                speakText(`Hora de tomar seu remédio: ${med.name}, dose ${med.dosage}.`);
              }
              break;
            }
          }
        }
      }
    };

    const interval = setInterval(checkScheduledMedications, 30000); // checa a cada 30s
    return () => clearInterval(interval);
  }, [medications, medicationLogs, activeMedAlarm, accessibility]);

  // Ações de Registros
  const handleSaveRecord = (recordData: Omit<HealthRecord, 'id' | 'timestamp'>) => {
    const saved = StorageService.addRecord(recordData);
    setRecords((prev) => [saved, ...prev]);
  };

  const handleDeleteRecord = (id: string) => {
    StorageService.deleteRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Ações de Medicamentos
  const handleTakeDose = (med: Medication, time: string) => {
    const newLog = StorageService.logMedicationTaken(med, time);
    setMedicationLogs((prev) => [newLog, ...prev]);
  };

  const handleUndoDose = (logId: string) => {
    StorageService.undoMedicationTaken(logId);
    setMedicationLogs((prev) => prev.filter((l) => l.id !== logId));
  };

  const handleSaveMedication = (med: Medication) => {
    StorageService.saveMedication(med);
    setMedications(StorageService.getMedications(currentUser.id));
  };

  const handleDeleteMedication = (id: string) => {
    StorageService.deleteMedication(id);
    setMedications(StorageService.getMedications(currentUser.id));
  };

  // Ações de Usuário
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    setIsUserModalOpen(false);
  };

  const handleSaveUser = (user: UserProfile) => {
    StorageService.saveUser(user);
    setUsers(StorageService.getUsers());
    setCurrentUser(user);
  };

  const handleDeleteUser = (userId: string) => {
    const success = StorageService.deleteUser(userId);
    if (success) {
      setUsers(StorageService.getUsers());
      setCurrentUser(StorageService.getActiveUser());
    }
  };

  // Contadores para as abas
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecordsCount = useMemo(() => {
    return records.filter((r) => r.date === todayStr).length;
  }, [records, todayStr]);

  const pendingMedCount = useMemo(() => {
    let pending = 0;
    medications.forEach((m) => {
      if (!m.active) return;
      m.times.forEach((t) => {
        const taken = medicationLogs.some(
          (l) => l.medicationId === m.id && l.scheduledTime === t && l.date === todayStr
        );
        if (!taken) pending++;
      });
    });
    return pending;
  }, [medications, medicationLogs, todayStr]);

  // Classe de tamanho de fonte global
  const rootFontSizeClass = 
    accessibility.fontSize === 'extra' 
      ? 'text-lg' 
      : accessibility.fontSize === 'grande' 
        ? 'text-base' 
        : 'text-sm';

  return (
    <div className={`min-h-screen flex flex-col ${rootFontSizeClass}`}>
      {/* Topo Estilo WhatsApp */}
      <WhatsAppHeader
        user={currentUser}
        accessibility={accessibility}
        onUpdateAccessibility={setAccessibility}
        onOpenUserModal={() => setIsUserModalOpen(true)}
      />

      {/* Barra de Abas Estilo WhatsApp */}
      <WhatsAppTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingMedCount={pendingMedCount}
        todayRecordsCount={todayRecordsCount}
      />

      {/* Conteúdo Principal com base na Aba Ativa */}
      <main className="flex-1 w-full">
        {activeTab === 'diario' && (
          <DailyDiaryView
            records={records}
            user={currentUser}
            accessibility={accessibility}
            onOpenNewRecord={() => setIsNewRecordModalOpen(true)}
            onDeleteRecord={handleDeleteRecord}
            onOpenMedicationsTab={() => setActiveTab('medicamentos')}
          />
        )}

        {activeTab === 'medicamentos' && (
          <MedicationsView
            medications={medications}
            medicationLogs={medicationLogs}
            user={currentUser}
            accessibility={accessibility}
            onTakeDose={handleTakeDose}
            onUndoDose={handleUndoDose}
            onSaveMedication={handleSaveMedication}
            onDeleteMedication={handleDeleteMedication}
          />
        )}

        {activeTab === 'graficos' && (
          <ChartsView
            records={records}
            user={currentUser}
            accessibility={accessibility}
          />
        )}

        {activeTab === 'relatorio' && (
          <ReportView
            records={records}
            user={currentUser}
            medications={medications}
            accessibility={accessibility}
          />
        )}
      </main>

      {/* Toast de Notificação de Remédio */}
      <NotificationToast
        medication={activeMedAlarm?.med || null}
        time={activeMedAlarm?.time || ''}
        onTake={handleTakeDose}
        onDismiss={() => setActiveMedAlarm(null)}
      />

      {/* Modal de Novo Registro com Acessibilidade e Botões Grandes */}
      <NewRecordModal
        isOpen={isNewRecordModalOpen}
        onClose={() => setIsNewRecordModalOpen(false)}
        onSave={handleSaveRecord}
        user={currentUser}
        accessibility={accessibility}
      />

      {/* Modal de Controle de Usuários e Login */}
      <AuthModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onSaveUser={handleSaveUser}
        onDeleteUser={handleDeleteUser}
      />
    </div>
  );
}
