import { UserProfile, HealthRecord, Medication, MedicationLog, AccessibilitySettings } from '../types';

const USERS_STORAGE_KEY = 'glicopress_users_v2';
const ACTIVE_USER_ID_KEY = 'glicopress_active_user_id';
const RECORDS_STORAGE_KEY = 'glicopress_records_v2';
const MEDICATIONS_STORAGE_KEY = 'glicopress_medications_v2';
const MED_LOGS_STORAGE_KEY = 'glicopress_med_logs_v2';
const ACCESSIBILITY_STORAGE_KEY = 'glicopress_accessibility_v2';

// Usuário padrão com dados realistas
const DEFAULT_USER: UserProfile = {
  id: 'usr_maria_silva',
  name: 'Dona Maria Silva',
  login: 'maria',
  passwordPin: '1234',
  age: 68,
  condition: 'ambos',
  targetGlucoseMin: 70,
  targetGlucoseMax: 140,
  targetSystolicMax: 130,
  targetDiastolicMax: 85,
  doctorName: 'Dr. Roberto Santos (Cardiologista)',
  emergencyContact: 'Carlos (Filho)',
  emergencyPhone: '(11) 98765-4321',
  avatarEmoji: '👵',
  color: '#075E54',
  createdAt: new Date().toISOString(),
};

const DEFAULT_MEDICATIONS: Medication[] = [
  {
    id: 'med_losartana',
    userId: 'usr_maria_silva',
    name: 'Losartana Potássica',
    dosage: '50 mg - 1 comprimido',
    category: 'pressao',
    instructions: 'Tomar pela manhã com um copo de água',
    times: ['08:00'],
    active: true,
    color: '#0284c7', // azul
  },
  {
    id: 'med_metformina',
    userId: 'usr_maria_silva',
    name: 'Cloridrato de Metformina',
    dosage: '850 mg - 1 comprimido',
    category: 'diabetes',
    instructions: 'Tomar junto ou logo após o almoço',
    times: ['12:30'],
    active: true,
    color: '#16a34a', // verde
  },
  {
    id: 'med_anlodipino',
    userId: 'usr_maria_silva',
    name: 'Besilato de Anlodipino',
    dosage: '5 mg - 1 comprimido',
    category: 'pressao',
    instructions: 'Tomar à noite antes de deitar',
    times: ['21:00'],
    active: true,
    color: '#9333ea', // roxo
  },
];

// Gera registros históricos realistas dos últimos 14 dias para gráficos e relatório PDF
function generateInitialRecords(): HealthRecord[] {
  const records: HealthRecord[] = [];
  const now = new Date();

  // Histórico de 14 dias
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Registro matinal em jejum (Glicemia + Pressão)
    const morningGlucose = Math.round(92 + (Math.sin(i * 0.8) * 18) + (i % 3 === 0 ? 12 : -5));
    const morningSystolic = Math.round(124 + (Math.cos(i * 0.6) * 10) + (i === 4 ? 18 : 0));
    const morningDiastolic = Math.round(78 + (Math.sin(i * 0.4) * 6));
    const morningPulse = Math.round(72 + (Math.sin(i) * 5));

    let morningStatus: HealthRecord['status'] = 'normal';
    if (morningSystolic > 140 || morningGlucose > 150) morningStatus = 'alerta';
    if (morningSystolic > 160 || morningGlucose > 200 || morningGlucose < 65) morningStatus = 'perigo';

    records.push({
      id: `rec_morning_${dateStr}`,
      userId: 'usr_maria_silva',
      type: 'ambos',
      timestamp: `${dateStr}T07:30:00.000Z`,
      date: dateStr,
      time: '07:30',
      glucose: morningGlucose,
      glucoseContext: 'jejum',
      systolic: morningSystolic,
      diastolic: morningDiastolic,
      pulse: morningPulse,
      arm: 'esquerdo',
      symptoms: morningSystolic > 140 ? ['Leve dor na nuca'] : ['Disposta'],
      notes: i === 4 ? 'Noite mal dormida e calor' : 'Café da manhã sem açúcar',
      status: morningStatus,
    });

    // Registro pós almoço (Glicemia)
    const lunchGlucose = Math.round(128 + (Math.sin(i * 1.1) * 22) + (i % 5 === 0 ? 25 : 0));
    let lunchStatus: HealthRecord['status'] = 'normal';
    if (lunchGlucose > 160) lunchStatus = 'alerta';
    if (lunchGlucose > 200) lunchStatus = 'perigo';

    records.push({
      id: `rec_lunch_${dateStr}`,
      userId: 'usr_maria_silva',
      type: 'glicemia',
      timestamp: `${dateStr}T14:15:00.000Z`,
      date: dateStr,
      time: '14:15',
      glucose: lunchGlucose,
      glucoseContext: 'pos_almoco',
      symptoms: lunchGlucose > 160 ? ['Sede aumentada'] : ['Sentindo-se bem'],
      notes: i % 5 === 0 ? 'Almoço em família com sobremesa pequena' : 'Arroz integral e salada',
      status: lunchStatus,
    });

    // Registro noturno (Pressão) a cada 2 dias
    if (i % 2 === 0) {
      const nightSys = Math.round(122 + (Math.sin(i * 0.5) * 8));
      const nightDia = Math.round(76 + (Math.cos(i * 0.5) * 5));
      records.push({
        id: `rec_night_${dateStr}`,
        userId: 'usr_maria_silva',
        type: 'pressao',
        timestamp: `${dateStr}T20:45:00.000Z`,
        date: dateStr,
        time: '20:45',
        systolic: nightSys,
        diastolic: nightDia,
        pulse: 68,
        arm: 'esquerdo',
        symptoms: ['Tranquila'],
        notes: 'Antes de tomar o remédio da noite',
        status: nightSys > 135 ? 'alerta' : 'normal',
      });
    }
  }

  return records;
}

export const StorageService = {
  // Usuários
  getUsers(): UserProfile[] {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([DEFAULT_USER]));
        return [DEFAULT_USER];
      }
      return JSON.parse(raw);
    } catch {
      return [DEFAULT_USER];
    }
  },

  saveUser(user: UserProfile): void {
    const users = this.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  },

  getActiveUserId(): string {
    const stored = localStorage.getItem(ACTIVE_USER_ID_KEY);
    if (stored) return stored;
    localStorage.setItem(ACTIVE_USER_ID_KEY, DEFAULT_USER.id);
    return DEFAULT_USER.id;
  },

  setActiveUserId(id: string): void {
    localStorage.setItem(ACTIVE_USER_ID_KEY, id);
  },

  getActiveUser(): UserProfile {
    const id = this.getActiveUserId();
    const users = this.getUsers();
    const user = users.find(u => u.id === id);
    if (user) return user;
    return users[0] || DEFAULT_USER;
  },

  deleteUser(userId: string): boolean {
    const users = this.getUsers().filter(u => u.id !== userId);
    if (users.length === 0) return false; // Não pode apagar todos
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    if (this.getActiveUserId() === userId) {
      this.setActiveUserId(users[0].id);
    }
    return true;
  },

  // Registros de Saúde
  getRecords(userId?: string): HealthRecord[] {
    try {
      const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
      let records: HealthRecord[];
      if (!raw) {
        records = generateInitialRecords();
        localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
      } else {
        records = JSON.parse(raw);
      }
      const targetUserId = userId || this.getActiveUserId();
      return records.filter(r => r.userId === targetUserId);
    } catch {
      return [];
    }
  },

  addRecord(record: Omit<HealthRecord, 'id' | 'timestamp'>): HealthRecord {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    const records: HealthRecord[] = raw ? JSON.parse(raw) : generateInitialRecords();
    
    const now = new Date();
    const newRecord: HealthRecord = {
      ...record,
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: `${record.date}T${record.time || '12:00'}:00.000Z`,
    };

    // Adiciona no início da lista
    records.unshift(newRecord);
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
    return newRecord;
  },

  deleteRecord(id: string): void {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) return;
    const records: HealthRecord[] = JSON.parse(raw);
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(filtered));
  },

  // Medicamentos
  getMedications(userId?: string): Medication[] {
    try {
      const raw = localStorage.getItem(MEDICATIONS_STORAGE_KEY);
      let meds: Medication[];
      if (!raw) {
        meds = DEFAULT_MEDICATIONS;
        localStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(meds));
      } else {
        meds = JSON.parse(raw);
      }
      const targetUserId = userId || this.getActiveUserId();
      return meds.filter(m => m.userId === targetUserId);
    } catch {
      return [];
    }
  },

  saveMedication(med: Medication): void {
    const raw = localStorage.getItem(MEDICATIONS_STORAGE_KEY);
    const meds: Medication[] = raw ? JSON.parse(raw) : DEFAULT_MEDICATIONS;
    const idx = meds.findIndex(m => m.id === med.id);
    if (idx >= 0) {
      meds[idx] = med;
    } else {
      meds.push(med);
    }
    localStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(meds));
  },

  deleteMedication(id: string): void {
    const raw = localStorage.getItem(MEDICATIONS_STORAGE_KEY);
    if (!raw) return;
    const meds: Medication[] = JSON.parse(raw);
    const filtered = meds.filter(m => m.id !== id);
    localStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(filtered));
  },

  // Registros de Doses Tomadas
  getMedicationLogs(dateStr?: string, userId?: string): MedicationLog[] {
    try {
      const raw = localStorage.getItem(MED_LOGS_STORAGE_KEY);
      const logs: MedicationLog[] = raw ? JSON.parse(raw) : [];
      const targetUserId = userId || this.getActiveUserId();
      let userLogs = logs.filter(l => l.userId === targetUserId);
      if (dateStr) {
        userLogs = userLogs.filter(l => l.date === dateStr);
      }
      return userLogs;
    } catch {
      return [];
    }
  },

  logMedicationTaken(medication: Medication, scheduledTime: string): MedicationLog {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(MED_LOGS_STORAGE_KEY);
    const logs: MedicationLog[] = raw ? JSON.parse(raw) : [];
    
    const newLog: MedicationLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: medication.userId,
      medicationId: medication.id,
      medicationName: medication.name,
      dosage: medication.dosage,
      scheduledTime,
      date: today,
      takenAt: new Date().toISOString(),
      status: 'tomado',
    };

    logs.unshift(newLog);
    localStorage.setItem(MED_LOGS_STORAGE_KEY, JSON.stringify(logs));
    return newLog;
  },

  undoMedicationTaken(logId: string): void {
    const raw = localStorage.getItem(MED_LOGS_STORAGE_KEY);
    if (!raw) return;
    const logs: MedicationLog[] = JSON.parse(raw);
    const filtered = logs.filter(l => l.id !== logId);
    localStorage.setItem(MED_LOGS_STORAGE_KEY, JSON.stringify(filtered));
  },

  // Acessibilidade
  getAccessibilitySettings(): AccessibilitySettings {
    try {
      const raw = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      if (!raw) {
        const defaults: AccessibilitySettings = {
          fontSize: 'grande', // Padrão "grande" para melhor leitura por idosos
          highContrast: false,
          soundAlerts: true,
          voiceReadout: true,
        };
        localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
      }
      return JSON.parse(raw);
    } catch {
      return {
        fontSize: 'grande',
        highContrast: false,
        soundAlerts: true,
        voiceReadout: true,
      };
    }
  },

  saveAccessibilitySettings(settings: AccessibilitySettings): void {
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings));
  },
};
