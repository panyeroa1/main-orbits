import React, { useEffect, useRef } from 'react';
import { MicOff, Monitor, Sparkles, Pin } from 'lucide-react';
import { User } from '../types';
import { LiveCaption } from '../App';
import { DraggableVideo } from './DraggableVideo';

interface VideoStageProps {
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  currentUser: User;
  participants: User[]; // Remote participants
  speakingUserId?: string | null;
  liveCaption: LiveCaption | null;
  isDirectCall?: boolean;
  showCaptions: boolean;
  pinnedUserId: string | null;
}

export const VideoStage: React.FC<VideoStageProps> = ({ 
  localStream, 
  screenStream,
  isVideoEnabled, 
  isAudioEnabled, 
  currentUser,
  participants,
  speakingUserId,
  liveCaption,
  isDirectCall = false,
  showCaptions,
  pinnedUserId
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
        screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  const renderAvatar = (avatarStr: string, sizeClass: string = "text-6xl") => {
    const isImage = avatarStr.startsWith('http') || avatarStr.startsWith('data:');
    if (isImage) {
        return <img src={avatarStr} alt="Avatar" className="w-full h-full object-cover" />;
    }
    return <span className={sizeClass}>{avatarStr}</span>;
  };

  // Determine who is displayed in the Main Viewport
  // Priority: Screen Share -> Pinned User -> Active Speaker (if remote) -> First Remote User
  
  let mainUser = participants[0]; // Default
  if (pinnedUserId) {
      const pinned = participants.find(p => p.id === pinnedUserId);
      if (pinned) mainUser = pinned;
      else if (pinnedUserId === currentUser.id) {
          // Self pinned logic handled implicitly or ignored for main stage
      }
  }

  // If screen sharing is active, it dominates the view
  const isPresenting = !!screenStream;

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm">
      
      {/* --- LAYER 1: MAIN STAGE --- */}
      {isPresenting ? (
          // PRESENTATION MODE
          <div className="absolute inset-0 bg-black flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
              <video 
                 ref={screenVideoRef}
                 autoPlay
                 playsInline
                 muted
                 className="w-full h-full object-contain"
              />
              <div className="absolute top-24 left-8 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                  <div className="p-1.5 bg-green-500/20 rounded-lg">
                    <Monitor size={16} className="text-green-400" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Live Presentation</span>
                     <span className="text-[10px] text-zinc-400">Sharing Screen</span>
                  </div>
              </div>
          </div>
      ) : (
          // USER MODE (Pinned or Default)
          mainUser ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* User Content */}
                <div className="relative z-10 flex flex-col items-center gap-8 w-full px-6 transition-all duration-700">
                    
                    {/* Avatar Circle */}
                    <div className={`relative w-48 h-48 sm:w-64 sm:h-64 rounded-full flex items-center justify-center bg-zinc-900 border border-zinc-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-700 ${speakingUserId === mainUser.id ? 'scale-110 shadow-[0_0_120px_rgba(99,102,241,0.3)] border-indigo-500/40' : ''}`}>
                        {speakingUserId === mainUser.id && (
                            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />
                        )}
                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                            {renderAvatar(mainUser.avatar, "text-8xl")}
                        </div>
                    </div>

                    <div className="text-center relative">
                        {pinnedUserId === mainUser.id && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-indigo-400 animate-in fade-in slide-in-from-bottom-2">
                                <Pin size={16} fill="currentColor" />
                            </div>
                        )}
                        <h2 className="text-4xl md:text-6xl font-thin text-white tracking-tighter drop-shadow-2xl mb-4">{mainUser.name}</h2>
                        <div className="inline-flex items-center gap-3 px-5 py-2 bg-black/40 rounded-full backdrop-blur-xl border border-white/5 shadow-2xl">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{mainUser.language}</span>
                            {mainUser.voice && <span className="w-1 h-1 bg-zinc-600 rounded-full" />}
                            {mainUser.voice && <span className="text-[10px] text-zinc-500">{mainUser.voice}</span>}
                        </div>
                    </div>
                </div>
            </div>
          ) : (
            <div className="text-zinc-500 flex flex-col items-center z-10">
               <div className="animate-pulse font-light tracking-[0.2em] uppercase text-xs">Waiting for participants...</div>
            </div>
          )
      )}

      {/* --- LAYER 2: SUBTITLES (The "Bottom Area" Requirement) --- */}
      {/* Positioned explicitly at the bottom, just above controls */}
      {showCaptions && liveCaption && (
          <div className="absolute bottom-28 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
             <div className="max-w-4xl w-full text-center animate-in slide-in-from-bottom-4 fade-in duration-300">
                {/* Current Source Text (The "Subtitle like transcription") */}
                <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 inline-block shadow-lg border border-white/5">
                    <p className="text-lg md:text-2xl text-white font-medium leading-relaxed tracking-wide drop-shadow-md">
                       {liveCaption.translatedText || liveCaption.originalText}
                    </p>
                    
                    {/* If translated, show original small below? Or if self, show original? */}
                    {/* User requested: "One liner only in a straight line... of the subtitle that I'm saying" */}
                    {liveCaption.translatedText && (
                        <p className="text-xs text-zinc-400 mt-1 font-light opacity-80">
                            {liveCaption.originalText}
                        </p>
                    )}
                </div>
             </div>
          </div>
      )}

      {/* --- LAYER 3: LOCAL USER (Draggable Host View) --- */}
      <DraggableVideo className="bottom-28 right-4 sm:bottom-32 sm:right-8 w-28 h-28 sm:w-40 sm:h-40 bg-zinc-900 rounded-full overflow-hidden border-4 border-zinc-800/80 shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-40 group cursor-grab active:cursor-grabbing">
          {/* Video Feed */}
          <div className="w-full h-full relative bg-black">
              {localStream && isVideoEnabled ? (
                  <video
                  ref={localVideoRef}
                  autoPlay
                  muted={true}
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                  />
              ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                      {renderAvatar(currentUser.avatar, "text-2xl")}
                  </div>
              )}
          </div>

          {/* Local Status */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <span className="text-[10px] font-bold uppercase tracking-widest text-white">You</span>
          </div>

          {!isAudioEnabled && (
              <div className="absolute top-3 right-3 bg-red-500/90 p-1.5 rounded-full text-white shadow-sm z-20 backdrop-blur-sm">
                  <MicOff size={10} />
              </div>
          )}
      </DraggableVideo>
    </div>
  );
};