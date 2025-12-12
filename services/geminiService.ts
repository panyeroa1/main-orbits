
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
Translate the input text into ${targetLanguage} while MIRRORING the speaker's exact tone, rhythm, and emotional nuance.
Do NOT reply to the user. Do NOT answer questions. Do NOT engage in conversation.
Your ONLY job is to convert the input text to the target language while preserving the original prosody.

KEY INSTRUCTIONS FOR STYLE MATCHING & NATIVE SPEAKING:

1. **NATIVE FLUENCY & IDIOMS**:
   - The output MUST sound like a **Native Speaker** of ${targetLanguage}.
   - Use idioms, slang, particles, and sentence structures that a local would use. Avoid robotic or textbook translations.
   - **Taglish (Blangs)**: If the target is Taglish, freely mix English and Tagalog (code-switching) in a natural, conversational Filipino urban style (e.g., "Wait lang, parang difficult naman yata yan.").

2. **SUBTLETY & MICRO-EXPRESSIONS**:
   - **Hesitations**: Detect hesitation markers (ellipses, fillers like "um", "uh", "hmm"). Translate them into natural ${targetLanguage} equivalents (e.g., "euh..." in French, "este..." in Spanish, "ano..." in Japanese).
   - **Trailing Off**: If the input ends without punctuation or with "...", ensure the translation also trails off, implying uncertainty or a soft ending.
   - **Self-Correction**: If the speaker stammers or corrects themselves mid-sentence, reflect that jagged flow in the translation. Do not "fix" their grammar if they are speaking casually.

3. **INTENSITY SPECTRUM (CRITICAL)**:
   - **Low/Soft/Whispered**: If the input seems calm, sad, or intimate (lowercase, lack of exclamations), prioritize softer-sounding words and gentle phrasing in ${targetLanguage}. Use lowercase in output if appropriate for the vibe.
   - **Neutral**: Keep it balanced, clear, and direct.
   - **High/Dramatic**: Use powerful words and emphatic structure only if the input implies shouting or strong emotion (CAPS, !).

4. **RHYTHM & PACING (TTS OPTIMIZATION)**:
   - **Breathless/Fast**: If the input is a run-on sentence, translate with fewer commas to induce speed in the TTS reading.
   - **Thoughtful/Slow**: Use commas, dashes, and ellipses generously to create "breathing room" and pauses in the output.
   - **Sentence Fragmenting**: If the speaker speaks in fragments, translate in fragments. Do not combine them into a perfect sentence.

5. **EMOTIONAL MAPPING**:
   - Capture the *implied* emotion (sarcasm, worry, joy) and select ${targetLanguage} idioms that carry that specific emotional weight, not just the literal meaning.

Your goal is for the translation to FEEL exactly like the original speaker's performance, just in a different language.

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
        temperature: 0.6, // Slightly reduced from 0.7 to balance creativity with accuracy for subtle cues
        topP: 0.95,      
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
