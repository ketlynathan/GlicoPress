export type ConditionType = 'ambos' | 'diabetes' | 'hipertensao';

export type GlucoseContext = 
  | 'jejum' 
  | 'pos_cafe' 
  | 'pre_almoco' 
  | 'pos_almoco' 
  | 'pre_jantar' 
  | 'pos_jantar' 
  | 'antes_dormir' 
  | 'madrugada' 
  | 'outro';

export interface UserProfile {
  id: string;
  name: string;
  login: string;
  passwordPin: string; // 4 dígitos ou senha simples amigável para idosos
  age?: number;
  condition: ConditionType;
  targetGlucoseMin: number; // default 70
  targetGlucoseMax: number; // default 140 (ou 180 pós-prandial)
  targetSystolicMax: number; // default 120 ou 130
  targetDiastolicMax: number; // default 80
  doctorName?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  avatarEmoji?: string;
  color?: string;
  createdAt: string;
}

export interface HealthRecord {
  id: string;
  userId: string;
  type: 'glicemia' | 'pressao' | 'ambos';
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  
  // Glicemia
  glucose?: number; // mg/dL
  glucoseContext?: GlucoseContext;
  
  // Pressão Arterial
  systolic?: number; // mmHg (ex: 120)
  diastolic?: number; // mmHg (ex: 80)
  pulse?: number; // bpm (ex: 72)
  arm?: 'esquerdo' | 'direito';
  
  // Notas e sintomas
  symptoms?: string[]; // 'Tontura', 'Dor de cabeça', 'Suor frio', 'Visão turva', 'Sentindo-se bem'
  notes?: string;
  
  // WhatsApp styling meta
  status: 'normal' | 'alerta' | 'perigo';
}

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string; // ex: "500 mg", "1 comprimido", "15 UI"
  category: 'diabetes' | 'pressao' | 'outro';
  instructions: string; // ex: "Tomar junto com o almoço"
  times: string[]; // ["08:00", "20:00"]
  active: boolean;
  color: string;
}

export interface MedicationLog {
  id: string;
  userId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string; // HH:mm
  date: string; // YYYY-MM-DD
  takenAt: string; // ISO string
  status: 'tomado' | 'atrasado' | 'pulado';
}

export type FontSizeOption = 'normal' | 'grande' | 'extra';

export interface AccessibilitySettings {
  fontSize: FontSizeOption;
  highContrast: boolean;
  soundAlerts: boolean;
  voiceReadout: boolean;
}

export type ActiveTab = 'diario' | 'medicamentos' | 'graficos' | 'relatorio';
