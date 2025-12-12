import { Language } from '../types';

export const getSpeechRecognitionLanguage = (lang: Language): string => {
  switch (lang) {
    case Language.ENGLISH: return 'en-US';
    case Language.SPANISH: return 'es-ES';
    case Language.FRENCH: return 'fr-FR';
    case Language.GERMAN: return 'de-DE';
    case Language.ITALIAN: return 'it-IT';
    case Language.PORTUGUESE: return 'pt-BR';
    case Language.DUTCH: return 'nl-NL';
    case Language.POLISH: return 'pl-PL';
    case Language.RUSSIAN: return 'ru-RU';
    case Language.JAPANESE: return 'ja-JP';
    case Language.KOREAN: return 'ko-KR';
    case Language.CHINESE_MANDARIN: return 'zh-CN';
    case Language.CHINESE_CANTONESE: return 'zh-HK';
    case Language.HINDI: return 'hi-IN';
    case Language.BENGALI: return 'bn-IN';
    case Language.THAI: return 'th-TH';
    case Language.VIETNAMESE: return 'vi-VN';
    case Language.INDONESIAN: return 'id-ID';
    case Language.TAGALOG: return 'fil-PH'; // Standard Filipino
    case Language.CEBUANO: return 'ceb-PH'; // Supported in some browsers, fallbacks to fil-PH logic in app if needed
    case Language.ILOCANO: return 'ilo-PH'; 
    case Language.ARABIC: return 'ar-SA';
    case Language.TURKISH: return 'tr-TR';
    case Language.SWEDISH: return 'sv-SE';
    case Language.NORWEGIAN: return 'no-NO';
    case Language.DANISH: return 'da-DK';
    case Language.FINNISH: return 'fi-FI';
    case Language.GREEK: return 'el-GR';
    case Language.HEBREW: return 'he-IL';
    case Language.MALAY: return 'ms-MY';
    case Language.UKRAINIAN: return 'uk-UA';
    default: return 'en-US';
  }
};