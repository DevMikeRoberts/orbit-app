export type ConnectionType =
  | 'born'
  | 'raised'
  | 'live'
  | 'lived'
  | 'work'
  | 'worked'
  | 'school'
  | 'married'
  | 'family'
  | 'travel'
  | 'other';

export const CONNECTION_LABELS: Record<ConnectionType, string> = {
  born: 'Born here',
  raised: 'Grew up here',
  live: 'Currently living',
  lived: 'Formerly lived',
  work: 'Currently working',
  worked: 'Formerly worked',
  school: 'School / University',
  married: 'Got married here',
  family: 'Family here',
  travel: 'Visited / Dream destination',
  other: 'Other connection',
};

export const CONNECTION_EMOJIS: Record<ConnectionType, string> = {
  born: '👶',
  raised: '🏡',
  live: '📍',
  lived: '🏠',
  work: '💼',
  worked: '🏗️',
  school: '🎓',
  married: '💍',
  family: '👨‍👩‍👧‍👦',
  travel: '✈️',
  other: '📌',
};

export const PIN_COLORS = [
  '#60a5fa',
  '#34d399',
  '#f97316',
  '#e879f9',
  '#fbbf24',
  '#f43f5e',
  '#38bdf8',
  '#a78bfa',
] as const;

export interface SubEntry {
  emoji: string;
  role: string;
  company?: string;
  logo?: string;
  place: string;
  description: string;
  date: string;
}

export interface ProfileLocation {
  id: string;
  city: string;
  lat: number;
  lng: number;
  color: string;
  connectionType?: ConnectionType;
  subEntries: SubEntry[];
  spread?: number;
}

export interface ProfileProject {
  title: string;
  blurb: string;
  github: string | null;
  url: string | null;
  tags: string[];
  accent: string;
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  email: string;
  title?: string;
  resumeUrl?: string;
  liveLocation?: { lat: number; lng: number };
  locations: ProfileLocation[];
  projects: ProfileProject[];
  createdAt: string;
}
