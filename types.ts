export enum Language {
  ENGLISH = 'English',
  SPANISH = 'Spanish',
  FRENCH = 'French',
  GERMAN = 'German',
  ITALIAN = 'Italian',
  PORTUGUESE = 'Portuguese',
  DUTCH = 'Dutch',
  POLISH = 'Polish',
  RUSSIAN = 'Russian',
  JAPANESE = 'Japanese',
  KOREAN = 'Korean',
  CHINESE_MANDARIN = 'Chinese (Mandarin)',
  CHINESE_CANTONESE = 'Chinese (Cantonese)',
  HINDI = 'Hindi',
  BENGALI = 'Bengali',
  THAI = 'Thai',
  VIETNAMESE = 'Vietnamese',
  INDONESIAN = 'Indonesian',
  TAGALOG = 'Tagalog (Filipino)',
  CEBUANO = 'Cebuano',
  ILOCANO = 'Ilocano',
  ARABIC = 'Arabic',
  TURKISH = 'Turkish',
  SWEDISH = 'Swedish',
  NORWEGIAN = 'Norwegian',
  DANISH = 'Danish',
  FINNISH = 'Finnish',
  GREEK = 'Greek',
  HEBREW = 'Hebrew',
  MALAY = 'Malay',
  UKRAINIAN = 'Ukrainian'
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface User {
  id: string;
  name: string;
  avatar: string; // Emoji or URL
  language: Language;
  voice?: string; // TTS Voice Name (e.g. Fenrir, Kore)
}

export interface ChatMessage {
  id: string;
  senderId: string; // User ID
  senderName: string;
  text: string;
  translatedText?: string; // Localized for the viewer
  timestamp: number;
  status: MessageStatus;
  isDirect?: boolean; // If true, bypass translation
}

export interface Group {
  id: string;
  name: string;
  members: User[]; // Includes the local user
  messages: ChatMessage[];
  lastActive: number;
}

export interface VoiceTrainingData {
  id?: string;
  user_id: string;
  original_text: string;
  audio_url?: string;
  created_at?: string;
  style_tag?: 'singing' | 'rapping' | 'speaking';
}