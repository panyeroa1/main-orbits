import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

export const useSpeechRecognition = (
  languageCode: string,
  mediaStream: MediaStream | null, // Added to capture audio
  onFinalTranscript?: (text: string, audioBlob?: Blob) => void
): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Update language dynamically if it changes while listening
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = languageCode;
    }
  }, [languageCode]);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Web Speech API is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true; // Keep listening
    recognitionRef.current.interimResults = true; // Show typing effect
    recognitionRef.current.lang = languageCode;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setError(null);
      startRecording();
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      stopRecording();
    };

    recognitionRef.current.onError = (event: any) => {
      console.warn("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
        setError("Microphone access denied.");
        setIsListening(false);
        stopRecording();
      }
    };

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscriptChunk = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptChunk += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setTranscript(interimTranscript);

      if (finalTranscriptChunk) {
        // When we get a final transcript, we want to grab the audio recorded SO FAR
        // and send it.
        handleFinalResult(finalTranscriptChunk.trim());
        setTranscript(''); 
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopRecording();
    };
  }, []); // Init only once

  // --- Audio Recording Logic ---
  
  const startRecording = () => {
    if (!mediaStream) return;
    try {
      // Create new recorder
      const recorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
    } catch (e) {
      console.warn("MediaRecorder failed", e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFinalResult = (finalText: string) => {
    // To synchronize audio with text, we stop the current recorder,
    // gather the blob, and immediately restart it for the next sentence.
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData(); // Flush
        mediaRecorderRef.current.stop();
        
        // Wait briefly for the stop event to process the last chunk
        setTimeout(() => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            if (onFinalTranscript) {
                onFinalTranscript(finalText, blob);
            }

            // Restart for next phrase if we are still listening
            if (isListening && mediaStream) {
                startRecording();
            }
        }, 100);
    } else {
        // Fallback if recorder wasn't running
        if (onFinalTranscript) onFinalTranscript(finalText);
    }
  };


  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Start error", e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) { 
      recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error
  };
};