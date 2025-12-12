import { GoogleGenAI, Modality } from "@google/genai";
import { Language } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please set process.env.API_KEY");
  }
  return new GoogleGenAI({ apiKey });
};

export interface TranslationResult {
  audioData: string | null; // Base64 PCM
  translatedText: string;
}

// --- VOICE MIRROR PROTOCOL CONFIGURATION ---
// Defines the "Live Pipeline" behavior for style matching
const VOICE_MIRROR_SYSTEM_INSTRUCTION = (targetLanguage: Language) => `
You are a high-fidelity real-time voice translator. 
TARGET LANGUAGE: ${targetLanguage}.

*** STRICT TRANSLATION ONLY ***

OBJECTIVE:
Translate the user's input text into ${targetLanguage}. 
Do NOT reply to the user. Do NOT answer questions. Do NOT engage in conversation.
Your ONLY job is to convert the input text to the target language while preserving the original prosody and emotion.

1. **PROSODY & SPEED ANALYSIS**:
   - **Fast/Urgent**: Translate using punchy, short words.
   - **Slow/Thoughtful**: Translate using flowing, descriptive words.

2. **INTENSITY & EMOTION**:
   - **High Intensity** (CAPS, strong words): Use powerful, emotive vocabulary.
   - **Low Intensity** (Lowercase, soft words): Use gentle, polite vocabulary.

OUTPUT:
Return ONLY the translated text.
`;

/**
 * Translates text from one language to another, preserving style.
 * Returns only text (no audio).
 */
export async function translateText(
  text: string,
  targetLanguage: Language
): Promise<string | null> {
  try {
    const ai = getAiClient();
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Input Audio Transcript: "${text}"`,
      config: {
        systemInstruction: VOICE_MIRROR_SYSTEM_INSTRUCTION(targetLanguage),
        temperature: 0.3, // Lower temperature for more accurate translation
      },
    });

    return response.text?.trim() || null;
  } catch (error) {
    console.error("Translation Error:", error);
    return null;
  }
}

/**
 * Generates speech audio from text using Gemini TTS.
 */
export async function generateSpeech(
  text: string,
  voiceName: string = "Fenrir" // Fenrir, Puck, Kore, Zephyr, Charon
): Promise<string | null> {
  try {
    const ai = getAiClient();
    const ttsResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { 
              voiceName,
            }
          }
        }
      },
    });

    const audioPart = ttsResponse.candidates?.[0]?.content?.parts?.[0];
    if (audioPart && audioPart.inlineData && audioPart.inlineData.data) {
      return audioPart.inlineData.data;
    }
    return null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}

/**
 * Translates text and optionally generates audio with specific voice.
 * Acts as the main "Live Pipeline" function for the application.
 */
export async function translateAndSpeak(
  text: string,
  targetLanguage: Language,
  shouldGenerateAudio: boolean = true,
  voiceName: string = "Fenrir"
): Promise<TranslationResult | null> {
  try {
    // Step 1: Translate (with Voice Mirroring)
    const translatedText = await translateText(text, targetLanguage);
    if (!translatedText) throw new Error("Translation failed");

    // Step 2: Audio (Optional)
    let audioData = null;
    if (shouldGenerateAudio) {
       audioData = await generateSpeech(translatedText, voiceName);
    }

    return {
      translatedText,
      audioData
    };

  } catch (error) {
    console.error("Gemini Service Error:", error);
    return null;
  }
}
