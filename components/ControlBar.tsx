import React, { useState } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Globe, 
  Sparkles, Volume2, VolumeX, Monitor, MonitorOff, 
  Users, Captions, CaptionsOff, Zap, ZapOff,
  Calendar, Mail, HardDrive, MessageSquare, Disc, Settings
} from 'lucide-react';
import { Language } from '../types';
import { AudioVisualizer } from './AudioVisualizer';

interface ControlBarProps {
  isVisible: boolean; // Controls visibility from parent
  isMicOn: boolean;
  isVideoOn: boolean;
  isTranslating: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  myLanguage: Language;
  onMyLanguageChange: (lang: Language) => void;
  localStream: MediaStream | null;
  isMyTranslatorMuted: boolean;
  onToggleMyTranslatorMute: () => void;
  
  // New Props
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
  showParticipants: boolean;
  onToggleParticipants: () => void;
  showCaptions: boolean;
  onToggleCaptions: () => void;
  isDirectVoice: boolean;
  onToggleDirectVoice: () => void;
  onGoogleAction: (action: 'calendar' | 'gmail' | 'drive') => void;
  onToggleHistory: () => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  onOpenSettings: () => void;
}

const DockButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  primary?: boolean;
  className?: string;
}> = ({ onClick, active = false, icon, label, danger, primary, className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);

  let bgClass = "bg-white/5 text-zinc-300 border-transparent hover:bg-white/10";
  if (active) bgClass = primary ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-white/20 text-white";
  if (danger) bgClass = "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-400";
  if (active && danger) bgClass = "bg-red-600 text-white"; // Red state override

  return (
    <div className="relative flex flex-col items-center group">
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200 ease-out transform ${isHovered ? 'scale-125 -translate-y-2 mx-2 z-10' : 'scale-100 mx-0'} ${bgClass} ${className} border border-white/5`}
        aria-label={label}
      >
        {icon}
      </button>
      {/* Tooltip */}
      <div className={`absolute -top-10 px-2 py-1 bg-black/80 backdrop-blur rounded text-[10px] text-white whitespace-nowrap opacity-0 transition-opacity duration-200 pointer-events-none ${isHovered ? 'opacity-100' : ''}`}>
        {label}
      </div>
    </div>
  );
};

export const ControlBar: React.FC<ControlBarProps> = ({
  isVisible,
  isMicOn,
  isVideoOn,
  isTranslating,
  onToggleMic,
  onToggleVideo,
  onEndCall,
  myLanguage,
  onMyLanguageChange,
  localStream,
  isMyTranslatorMuted,
  onToggleMyTranslatorMute,
  isScreenSharing,
  onToggleScreenShare,
  showParticipants,
  onToggleParticipants,
  showCaptions,
  onToggleCaptions,
  isDirectVoice,
  onToggleDirectVoice,
  onGoogleAction,
  onToggleHistory,
  isRecording,
  onToggleRecording,
  onOpenSettings
}) => {
  return (
    <div className={`absolute bottom-8 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
        {/* Main Floating Dock */}
        <div className="bg-zinc-950/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-6 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] pointer-events-auto flex items-end gap-2 max-w-[95vw] overflow-visible">
          
          {/* Group 1: Output Controls */}
          <div className="flex items-center gap-1">
             <DockButton 
                onClick={onToggleDirectVoice}
                active={isDirectVoice}
                icon={isDirectVoice ? <Zap size={20} /> : <ZapOff size={20} />}
                label={isDirectVoice ? "Direct Voice Mode" : "AI Translation Mode"}
                primary={isDirectVoice}
             />
             <DockButton 
                onClick={onToggleMyTranslatorMute}
                active={!isMyTranslatorMuted}
                icon={isMyTranslatorMuted ? <VolumeX size={20} /> : <Sparkles size={20} />}
                label={isMyTranslatorMuted ? "Unmute My Translation" : "Mute My Translation"}
                primary={!isMyTranslatorMuted}
             />
          </div>

          <div className="w-px h-10 bg-white/10 mx-2 self-center" />

          {/* Group 2: Features */}
           <div className="flex items-center gap-1">
              <DockButton 
                  onClick={onToggleScreenShare}
                  active={isScreenSharing}
                  icon={isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
                  label="Screen Share"
                  primary={isScreenSharing}
              />
              <DockButton 
                  onClick={onToggleRecording}
                  active={isRecording}
                  icon={<Disc size={20} className={isRecording ? 'animate-pulse' : ''} />}
                  label="Record Session"
                  danger={isRecording}
              />
              <DockButton 
                  onClick={onToggleHistory}
                  icon={<MessageSquare size={20} />}
                  label="Chat History"
              />
              <DockButton 
                  onClick={onToggleCaptions}
                  active={showCaptions}
                  icon={showCaptions ? <Captions size={20} /> : <CaptionsOff size={20} />}
                  label="Captions"
              />
              <DockButton 
                  onClick={onToggleParticipants}
                  active={showParticipants}
                  icon={<Users size={20} />}
                  label="Participants"
              />
           </div>

           <div className="w-px h-10 bg-white/10 mx-2 self-center" />

           {/* Integrations Mini Group */}
           <div className="flex items-center gap-1">
               <DockButton onClick={() => onGoogleAction('calendar')} icon={<Calendar size={18} />} label="Calendar" />
               <DockButton onClick={() => onOpenSettings()} icon={<Settings size={18} />} label="Settings" />
           </div>

          {/* Visualizer (Middle - Hidden on small screens or incorporated nicely) */}
          <div className="hidden lg:flex w-32 h-14 bg-black/40 rounded-2xl items-center justify-center border border-white/5 overflow-hidden px-2 relative mx-4 self-center shadow-inner">
              <div className={`absolute inset-0 opacity-20 transition-opacity duration-500 ${isMicOn ? 'bg-indigo-500 blur-xl' : ''}`}></div>
              {localStream && isMicOn ? (
                  <div className="relative z-10 opacity-90">
                    <AudioVisualizer stream={localStream} isActive={isMicOn} color={isTranslating ? '#c4b5fd' : '#818cf8'} />
                  </div>
              ) : (
                  <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest relative z-10">Muted</div>
              )}
          </div>

          {/* Group 3: Core Media */}
          <div className="flex items-center gap-2 pl-2">
            <DockButton 
                onClick={onToggleMic}
                active={isMicOn}
                icon={isMicOn ? <Mic size={22} /> : <MicOff size={22} />}
                label={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
                className={!isMicOn ? "bg-red-500/10 text-red-500 border-red-500/20" : ""}
            />
            <DockButton 
                onClick={onToggleVideo}
                active={isVideoOn}
                icon={isVideoOn ? <Video size={22} /> : <VideoOff size={22} />}
                label={isVideoOn ? "Stop Video" : "Start Video"}
                className={!isVideoOn ? "bg-red-500/10 text-red-500 border-red-500/20" : ""}
            />
            
            <div className="ml-2">
                <DockButton 
                    onClick={onEndCall}
                    icon={<PhoneOff size={24} />}
                    label="Leave Call"
                    danger
                    className="w-14 h-14 rounded-2xl"
                />
            </div>
          </div>

        </div>
    </div>
  );
};
