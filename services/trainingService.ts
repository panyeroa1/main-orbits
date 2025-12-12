import { supabase } from '../lib/supabase';
import { VoiceTrainingData } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Saves voice samples and text to the backend to create a dataset
 * for future Voice Cloning / Custom Model training.
 */
export async function saveTrainingData(
  userId: string,
  text: string,
  audioBlob: Blob
): Promise<void> {
  try {
    // 1. Upload Audio Blob to Supabase Storage
    const fileName = `${userId}/${Date.now()}_${uuidv4()}.webm`;
    
    // Note: This assumes a 'voice-samples' bucket exists in Supabase Storage.
    // If not, this upload will fail gracefully.
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice-samples')
      .upload(fileName, audioBlob, {
        contentType: 'audio/webm',
        upsert: false
      });

    let audioUrl = '';
    if (!uploadError && uploadData) {
       const { data: { publicUrl } } = supabase.storage
         .from('voice-samples')
         .getPublicUrl(fileName);
       audioUrl = publicUrl;
    } else {
        console.warn("Could not upload audio sample (Bucket missing?)", uploadError);
    }

    // 2. Save Metadata to Database
    const trainingData: VoiceTrainingData = {
      user_id: userId,
      original_text: text,
      audio_url: audioUrl,
      // Simple heuristic for tagging style based on text content
      style_tag: detectStyle(text)
    };

    const { error: dbError } = await supabase
      .from('voice_training_data')
      .insert([trainingData]);

    if (dbError) {
      console.warn("Could not save training metadata (Table missing?)", dbError);
    } else {
      console.log("Training data saved successfully");
    }

  } catch (error) {
    console.error("Error in saveTrainingData", error);
  }
}

function detectStyle(text: string): 'singing' | 'rapping' | 'speaking' {
  // Simple heuristics to help categorize data for the AI
  if (text.includes('\n')) return 'singing'; // Multi-line often implies lyrics
  if (text.length > 50 && !text.includes('.')) return 'rapping'; // Long flow without periods
  return 'speaking';
}