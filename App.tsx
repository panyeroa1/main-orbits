import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { VideoStage } from './components/VideoStage';
import { ControlBar } from './components/ControlBar';
import { TopBar } from './components/TopBar'; 
import { ProfileSetup } from './components/ProfileSetup';
import { Dashboard } from './components/Dashboard';
import { CallHistory } from './components/CallHistory';
import { ParticipantsSidebar } from './components/ParticipantsSidebar';
import { GoogleIntegrations } from './components/GoogleIntegrations';
import { SettingsModal } from './components/SettingsModal';
import { LandingPage } from './components/LandingPage'; // Added Import
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useIdle } from './hooks/useIdle'; 
import { Language, ChatMessage, User, Group, MessageStatus } from './types';
import { getSpeechRecognitionLanguage } from './utils/languageUtils';
import { translateAndSpeak, translateText } from './services/geminiService';
import { decodeBase64, decodeAudioData } from './services/audioUtils';
import { audioQueue } from './services/audioQueue';
import { saveTrainingData } from './services/trainingService';
import { Check, X, User as UserIcon } from 'lucide-react';
import { supabase } from './lib/supabase';

// Mock Contacts for Demo
const MOCK_CONTACTS: User[] = [
  { id: 'u2', name: 'Alice', avatar: '👩‍🎨', language: Language.SPANISH, voice: 'Kore' },
  { id: 'u3', name: 'Bob', avatar: '👨‍🚀', language: Language.FRENCH, voice: 'Charon' },
];

export interface LiveCaption {
  userId: string;
  originalText: string;
  translatedText?: string;
  timestamp: number;
}

export default function App() {
  // Navigation State - Default to 'landing'
  const [view, setView] = useState<'landing' | 'profile' | 'dashboard' | 'call' | 'waiting_room'>('landing');
  const [showHistory, setShowHistory] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [googleAction, setGoogleAction] = useState<'calendar' | 'gmail' | 'drive' | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Preferences State with Persistence
  const [preferences, setPreferences] = useState(() => {
      const saved = localStorage.getItem('orbitz_preferences');
      return saved ? JSON.parse(saved) : {
          darkMode: true,
          autoHideControls: true,
          defaultMicOn: true,
          defaultVideoOn: true,
          selectedAudioDeviceId: '',
          selectedVideoDeviceId: ''
      };
  });

  // Save preferences whenever they change
  useEffect(() => {
      localStorage.setItem('orbitz_preferences', JSON.stringify(preferences));
      if (preferences.darkMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [preferences]);

  // Data State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [contacts, setContacts] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // Call State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true); // Remote Volume
  const [isMyTranslatorMuted, setIsMyTranslatorMuted] = useState(false); // Default UNMUTED
  const [isTranslating, setIsTranslating] = useState(false);
  const [speakingUserId, setSpeakingUserId] = useState<string | null>(null);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isDirectVoice, setIsDirectVoice] = useState(false); 
  const [isRecording, setIsRecording] = useState(false);
  const [pinnedUserId, setPinnedUserId] = useState<string | null>(null);
  
  // UI Logic
  const isIdle = useIdle(12000); // 12 seconds
  const controlsVisible = !preferences.autoHideControls || !isIdle || showParticipants || showHistory || isSettingsOpen;

  // Waiting Room / Admittance State
  const [pendingGuests, setPendingGuests] = useState<User[]>([]);
  
  // Live Caption State
  const [liveCaption, setLiveCaption] = useState<LiveCaption | null>(null);
  const captionTimeoutRef = useRef<any>(null);

  // Audio Context
  const audioCtxRef = useRef<AudioContext | null>(null);
  const messagesSubscription = useRef<any>(null);

  // Helpers
  const activeGroup = groups.find(g => g.id === activeGroupId);
  const participants = activeGroup ? activeGroup.members.filter(m => m.id !== currentUser?.id) : [];
  const isDirectCall = participants.length === 1;

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioQueue.setAudioContext(audioCtxRef.current);
    }
    if (audioCtxRef.current.state === 'suspended' && isSpeakerOn) {
      audioCtxRef.current.resume();
    }
  };

  const showCaptionHandler = (userId: string, originalText: string, translatedText?: string) => {
      if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
      setLiveCaption({ userId, originalText, translatedText, timestamp: Date.now() });
      captionTimeoutRef.current = setTimeout(() => setLiveCaption(null), 8000);
  };

  // --- Initial Load & Auth ---
  useEffect(() => {
    // Apply preferences on mount
    if (preferences.darkMode) {
        document.documentElement.classList.add('dark');
    }

    const handleAuthUser = async (authUser: any) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (profile) {
            handleProfileComplete({ ...profile, email: authUser.email });
        } else {
            const newProfile: User = {
                id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata.full_name || authUser.email?.split('@')[0] || 'User',
                avatar: authUser.user_metadata.avatar_url || authUser.user_metadata.picture || `https://ui-avatars.com/api/?name=${authUser.email}`,
                language: Language.ENGLISH, // Default
                voice: 'Fenrir', // Default
                customVoiceStatus: 'none'
            };
            await supabase.from('profiles').upsert([newProfile]);
            handleProfileComplete(newProfile);
        }
    };

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
         await handleAuthUser(session.user);
      } else {
         const storedUser = localStorage.getItem('orbitz_user');
         if (storedUser) {
             try {
                const user: User = JSON.parse(storedUser);
                setCurrentUser(user);
                await loadUserData(user.id);
                setView('dashboard');
             } catch(e) { setView('landing'); }
         } else {
             setView('landing');
         }
         setLoadingInitial(false);
      }
    };
    
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
             setLoadingInitial(true);
             await handleAuthUser(session.user);
        }
        if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            setView('landing');
        }
    });

    return () => subscription.unsubscribe();
  }, []); // Only run once

  const loadUserData = async (userId: string) => {
    try {
      const { data: allUsers } = await supabase.from('profiles').select('*').neq('id', userId);
      setContacts(allUsers || MOCK_CONTACTS);
      fetchGroups(userId);
    } catch (e) {
      setContacts(MOCK_CONTACTS);
    }
  };

  const fetchGroups = async (userId: string) => {
      // Basic fetch logic
  };

  // --- Dashboard Logic ---

  const handleProfileComplete = (user: User) => {
    localStorage.setItem('orbitz_user', JSON.stringify(user));
    setCurrentUser(user);
    loadUserData(user.id);
    setView('dashboard');
    setLoadingInitial(false);
  };

  const handleUpdatePreferences = (key: string, value: any) => {
      setPreferences(prev => {
          const newState = { ...prev, [key]: value };
          // If changing devices while call is active, restart stream
          if (view === 'call' && (key === 'selectedAudioDeviceId' || key === 'selectedVideoDeviceId')) {
             const audioId = key === 'selectedAudioDeviceId' ? value : prev.selectedAudioDeviceId;
             const videoId = key === 'selectedVideoDeviceId' ? value : prev.selectedVideoDeviceId;
             startCamera(audioId, videoId);
          }
          return newState;
      });
  };

  const handleCreateGroup = async (name: string, members: User[]) => {
    if (!currentUser) return;
    const newGroup: Group = {
        id: uuidv4().slice(0, 8), // Simple ID
        name,
        members,
        messages: [],
        lastActive: Date.now()
    };
    setGroups(prev => [newGroup, ...prev]);
    handleJoinGroup(newGroup, true); 
  };

  const handleJoinGroup = async (group: Group, isHost: boolean = false) => {
    setActiveGroupId(group.id);
    if (isHost || group.members.some(m => m.id === currentUser?.id)) {
        setView('call');
        // Use preferences for default state
        setIsMicOn(preferences.defaultMicOn);
        setIsVideoOn(preferences.defaultVideoOn);
        
        // Start camera if enabled pref or just to init devices
        // We always start camera to get stream, but disable tracks if video is off
        startCamera(preferences.selectedAudioDeviceId, preferences.selectedVideoDeviceId);
    } else {
        setView('waiting_room');
        simulateGuestKnocking(group.id);
    }
  };

  // --- Admittance Logic ---
  const simulateGuestKnocking = async (groupId: string) => {
      if(!currentUser) return;
      try {
          await supabase.from('messages').insert([{
              group_id: groupId,
              sender_id: currentUser.id,
              text: `__SYSTEM_KNOCK__:${JSON.stringify(currentUser)}`,
              client_message_id: uuidv4(),
              original_language: currentUser.language
          }]);
      } catch(e) { console.warn("Failed to knock", e); }
  };

  const handleAdmitGuest = (guest: User) => {
      setGroups(prev => prev.map(g => {
          if (g.id !== activeGroupId) return g;
          return { ...g, members: [...g.members, guest] };
      }));
      setPendingGuests(prev => prev.filter(p => p.id !== guest.id));
      sendSystemMessage(activeGroupId!, `__SYSTEM_ADMIT__:${guest.id}`);
  };

  const handleDenyGuest = (guestId: string) => {
      setPendingGuests(prev => prev.filter(p => p.id !== guestId));
  };

  const sendSystemMessage = async (groupId: string, text: string) => {
     if (!currentUser) return;
     await supabase.from('messages').insert([{
        group_id: groupId,
        sender_id: currentUser.id,
        text: text,
        client_message_id: uuidv4(),
        original_language: currentUser.language
    }]);
  };

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
    }
    audioQueue.clear();
    setView('dashboard');
    setActiveGroupId(null);
    setLiveCaption(null);
    setPendingGuests([]);
    setShowParticipants(false);
    setIsRecording(false);
  };

  // --- Media Setup ---
  const startCamera = async (audioDeviceId?: string, videoDeviceId?: string) => {
    if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
            deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined,
            echoCancellation: true, 
            noiseSuppression: true, 
            autoGainControl: true
        },
        video: {
            deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      // Enforce mute states based on current state (or pref if just starting)
      // Note: startCamera re-initializes, so we need to re-apply isMicOn/isVideoOn
      // But if we are joining, we used prefs. If we are switching devices mid-call, we stick to current state.
      const shouldMicBeOn = view === 'call' ? isMicOn : preferences.defaultMicOn;
      const shouldVideoBeOn = view === 'call' ? isVideoOn : preferences.defaultVideoOn;

      stream.getAudioTracks().forEach(track => track.enabled = shouldMicBeOn);
      stream.getVideoTracks().forEach(track => track.enabled = shouldVideoBeOn);
      
      // Update UI state to match if we just joined (no-op if mid-call usually)
      if (view !== 'call') {
          setIsMicOn(shouldMicBeOn);
          setIsVideoOn(shouldVideoBeOn);
      }

    } catch (err) { 
        console.error("Error accessing media", err); 
        // Fallback: try without deviceId constraints if specific failed
        if (audioDeviceId || videoDeviceId) {
             console.warn("Retrying without specific device constraints...");
             startCamera();
        }
    }
  };

  const handleToggleScreenShare = async () => {
      if (screenStream) {
          screenStream.getTracks().forEach(track => track.stop());
          setScreenStream(null);
      } else {
          try {
              const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
              setScreenStream(stream);
              stream.getVideoTracks()[0].onended = () => {
                  setScreenStream(null);
              };
          } catch (e) {
              console.warn("Screen share cancelled", e);
          }
      }
  };


  // --- Real-time Logic ---

  useEffect(() => {
    if (!activeGroupId || !currentUser) return;

    const channel = supabase
        .channel(`group-${activeGroupId}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${activeGroupId}` },
            async (payload) => {
                const newMsg = payload.new;
                
                // System Messages
                if (newMsg.text.startsWith('__SYSTEM_KNOCK__')) {
                    if (view === 'call') {
                         const guestDataStr = newMsg.text.split('__SYSTEM_KNOCK__:')[1];
                         try {
                             const guest: User = JSON.parse(guestDataStr);
                             if (guest.id !== currentUser.id) {
                                 setPendingGuests(prev => prev.some(p => p.id === guest.id) ? prev : [...prev, guest]);
                             }
                         } catch(e){}
                    }
                    return;
                }
                if (newMsg.text.startsWith('__SYSTEM_ADMIT__')) {
                    const admittedId = newMsg.text.split('__SYSTEM_ADMIT__:')[1];
                    if (currentUser.id === admittedId && view === 'waiting_room') {
                        setView('call');
                        startCamera(preferences.selectedAudioDeviceId, preferences.selectedVideoDeviceId);
                    }
                    return;
                }

                // Normal Messages
                if (newMsg.sender_id === currentUser.id) {
                     showCaptionHandler(currentUser.id, newMsg.text); 
                     if (!isMyTranslatorMuted && !newMsg.is_direct) {
                         const result = await translateAndSpeak(newMsg.text, currentUser.language, true, currentUser.voice || 'Fenrir');
                         if (result && result.audioData) {
                             initAudio();
                             if (audioCtxRef.current) {
                                 const rawBytes = decodeBase64(result.audioData);
                                 const audioBuffer = await decodeAudioData(rawBytes, audioCtxRef.current);
                                 audioQueue.enqueue(audioBuffer);
                             }
                         }
                     }
                     return; 
                }

                // Remote Messages
                const sender = activeGroup?.members.find(m => m.id === newMsg.sender_id) || groups.find(g => g.id === activeGroupId)?.members.find(m => m.id === newMsg.sender_id);
                const senderVoice = sender?.voice || 'Fenrir';
                
                setIsTranslating(true);
                setSpeakingUserId(newMsg.sender_id);

                try {
                    const result = await translateAndSpeak(newMsg.text, currentUser.language, true, senderVoice);
                    
                    if (result) {
                        showCaptionHandler(newMsg.sender_id, newMsg.text, result.translatedText);
                        if (result.audioData && isSpeakerOn) {
                            initAudio();
                            if (audioCtxRef.current) {
                                const rawBytes = decodeBase64(result.audioData);
                                const audioBuffer = await decodeAudioData(rawBytes, audioCtxRef.current);
                                audioQueue.enqueue(audioBuffer);
                            }
                        }
                    } else {
                         showCaptionHandler(newMsg.sender_id, newMsg.text);
                    }
                } catch(e) {
                    console.error("Translation error", e);
                } finally {
                    setIsTranslating(false);
                    setTimeout(() => setSpeakingUserId(null), 2000);
                }
            }
        )
        .subscribe();

    messagesSubscription.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [activeGroupId, currentUser, activeGroup, view, isMyTranslatorMuted, isSpeakerOn, groups]);


  // --- Send Logic ---

  const handleFinalTranscript = useCallback(async (text: string, audioBlob?: Blob) => {
    if (!text.trim() || !activeGroupId || !currentUser) return;
    
    setSpeakingUserId(currentUser.id);
    showCaptionHandler(currentUser.id, text);
    
    if (audioBlob) saveTrainingData(currentUser.id, text, audioBlob);
    
    if (!isMyTranslatorMuted && !isDirectVoice) {
         try {
             translateAndSpeak(text, currentUser.language, true, currentUser.voice || 'Fenrir').then(result => {
                 if (result?.audioData) {
                     initAudio();
                     if (audioCtxRef.current) {
                         const rawBytes = decodeBase64(result.audioData);
                         decodeAudioData(rawBytes, audioCtxRef.current).then(buffer => audioQueue.enqueue(buffer));
                     }
                 }
             });
         } catch(e) {}
    }

    try {
      await supabase.from('messages').insert([{
          group_id: activeGroupId,
          sender_id: currentUser.id,
          text: text,
          client_message_id: uuidv4(),
          original_language: currentUser.language
      }]);
    } catch (err) { console.error(err); }
    
    setTimeout(() => setSpeakingUserId(null), 1500);
    
  }, [activeGroupId, currentUser, isMyTranslatorMuted, groups, isDirectVoice]);


  const { startListening, stopListening } = useSpeechRecognition(
    currentUser ? getSpeechRecognitionLanguage(currentUser.language) : 'en-US', 
    localStream, 
    handleFinalTranscript
  );

  useEffect(() => {
    if (view === 'call' && isMicOn) startListening();
    else stopListening();
  }, [view, isMicOn, startListening, stopListening]);

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = isVideoOn);
      localStream.getAudioTracks().forEach(track => track.enabled = isMicOn);
    }
  }, [isVideoOn, isMicOn, localStream]);


  // --- Render ---

  if (loadingInitial) {
      return (
        <div className="h-screen w-full flex items-center justify-center ambient-wave text-indigo-500 flex-col gap-4">
            <img 
              src="https://orbitz.eburon.ai/icons/logo.png" 
              alt="Orbitz" 
              className="w-20 h-20 animate-pulse drop-shadow-[0_0_25px_rgba(99,102,241,0.5)]" 
            />
        </div>
      );
  }

  // New Landing Page Logic
  if (view === 'landing') {
      return <LandingPage onEnter={() => setView('profile')} />;
  }

  if (view === 'profile') return <ProfileSetup onComplete={handleProfileComplete} />;
  
  if (view === 'waiting_room') {
      return (
          <div className="h-screen ambient-wave flex flex-col items-center justify-center p-6 text-center">
              <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center animate-pulse mb-6 border border-white/10">
                  <UserIcon size={40} className="text-zinc-500" />
              </div>
              <h2 className="text-2xl font-light text-white mb-2">Waiting for Host...</h2>
              <p className="text-zinc-500 max-w-xs">You have requested to join the session. Please wait for the host to admit you.</p>
              <button onClick={handleEndCall} className="mt-8 px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors">Cancel</button>
          </div>
      );
  }

  if (view === 'dashboard' && currentUser) {
    return (
        <>
            <Dashboard 
                currentUser={currentUser}
                contacts={contacts}
                groups={groups}
                onJoinGroup={handleJoinGroup}
                onCreateGroup={handleCreateGroup}
                onDeleteGroup={() => {}}
                onDirectCall={() => {}}
                onEditProfile={() => setIsSettingsOpen(true)} 
            />
            {isSettingsOpen && (
                <SettingsModal 
                    isOpen={isSettingsOpen} 
                    onClose={() => setIsSettingsOpen(false)}
                    currentUser={currentUser}
                    onUpdateUser={setCurrentUser}
                    preferences={preferences}
                    onUpdatePreferences={handleUpdatePreferences}
                />
            )}
        </>
    );
  }

  if (!currentUser || !activeGroup) return null;

  return (
    <div className={`flex flex-col h-screen overflow-hidden ambient-wave text-white ${preferences.darkMode ? 'dark' : ''}`} onClick={initAudio}>
      
      {/* Pending Guest Toasts */}
      {pendingGuests.length > 0 && (
          <div className="absolute top-24 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none">
              {pendingGuests.map(guest => (
                  <div key={guest.id} className="pointer-events-auto bg-zinc-800/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-xl flex items-center gap-4 animate-in slide-in-from-top-2">
                      <span className="text-sm font-medium">{guest.name} wants to join</span>
                      <div className="flex gap-2">
                          <button onClick={() => handleAdmitGuest(guest)} className="p-2 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500/30"><Check size={16} /></button>
                          <button onClick={() => handleDenyGuest(guest.id)} className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30"><X size={16} /></button>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* Top Bar (Participants, Language, Rec Status) */}
      <TopBar 
          isVisible={true} // Top bar handles its own idle visual state internally or we can pass !isIdle
          currentUser={currentUser}
          participants={participants}
          onLanguageChange={async (lang) => {
              const updated = { ...currentUser, language: lang };
              setCurrentUser(updated);
              localStorage.setItem('orbitz_user', JSON.stringify(updated));
              try { await supabase.from('profiles').update({ language: lang }).eq('id', currentUser.id); } catch(e){}
          }}
          isRecording={isRecording}
          onToggleRecording={() => setIsRecording(!isRecording)}
          pinnedUserId={pinnedUserId}
          onPinUser={(id) => setPinnedUserId(id === pinnedUserId ? null : id)}
          activeGroupId={activeGroupId}
      />

      {/* Sidebars & Modals */}
      <ParticipantsSidebar 
          isOpen={showParticipants} 
          onClose={() => setShowParticipants(false)}
          participants={participants}
          currentUser={currentUser}
          activeGroup={activeGroup}
      />
      <GoogleIntegrations 
          isOpen={!!googleAction}
          onClose={() => setGoogleAction(null)}
          action={googleAction}
          activeGroup={activeGroup}
      />
      
      {isSettingsOpen && (
          <SettingsModal 
              isOpen={isSettingsOpen} 
              onClose={() => setIsSettingsOpen(false)}
              currentUser={currentUser}
              onUpdateUser={setCurrentUser}
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
          />
      )}

      {/* Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        <VideoStage 
          localStream={localStream}
          screenStream={screenStream}
          isVideoEnabled={isVideoOn}
          isAudioEnabled={isMicOn}
          currentUser={currentUser}
          participants={participants}
          speakingUserId={speakingUserId}
          liveCaption={liveCaption} 
          isDirectCall={isDirectCall}
          showCaptions={showCaptions}
          pinnedUserId={pinnedUserId}
        />
        
        {showHistory && (
            <CallHistory 
                group={activeGroup} 
                currentUser={currentUser} 
                onClose={() => setShowHistory(false)} 
            />
        )}
      </div>

      {/* Controls */}
      <ControlBar 
        isVisible={controlsVisible}
        isMicOn={isMicOn}
        isVideoOn={isVideoOn}
        isTranslating={isTranslating}
        onToggleMic={() => setIsMicOn(!isMicOn)}
        onToggleVideo={() => setIsVideoOn(!isVideoOn)}
        onEndCall={handleEndCall}
        myLanguage={currentUser.language}
        onMyLanguageChange={() => {}} // Now handled in TopBar
        localStream={localStream}
        onToggleHistory={() => setShowHistory(!showHistory)}
        isMyTranslatorMuted={isMyTranslatorMuted}
        onToggleMyTranslatorMute={() => setIsMyTranslatorMuted(!isMyTranslatorMuted)}
        isScreenSharing={!!screenStream}
        onToggleScreenShare={handleToggleScreenShare}
        showParticipants={showParticipants}
        onToggleParticipants={() => setShowParticipants(!showParticipants)}
        showCaptions={showCaptions}
        onToggleCaptions={() => setShowCaptions(!showCaptions)}
        isDirectVoice={isDirectVoice}
        onToggleDirectVoice={() => setIsDirectVoice(!isDirectVoice)}
        onGoogleAction={(action) => setGoogleAction(action)}
        isRecording={isRecording}
        onToggleRecording={() => setIsRecording(!isRecording)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    </div>
  );
}