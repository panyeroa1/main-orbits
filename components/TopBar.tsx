import React from 'react';
import { Language, User } from '../types';
import { Disc, ChevronDown, Pin, PinOff, Mic, MicOff } from 'lucide-react';

interface TopBarProps {
  isVisible: boolean; // Controls full visibility vs compact mode
  currentUser: User;
  participants: User[];
  onLanguageChange: (lang: Language) => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  pinnedUserId: string | null;
  onPinUser: (userId: string) => void;
  activeGroupId: string | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  isVisible,
  currentUser,
  participants,
  onLanguageChange,
  isRecording,
  onToggleRecording,
  pinnedUserId,
  onPinUser,
  activeGroupId
}) => {
  // combine all for the list
  const allUsers = [currentUser, ...participants];

  return (
    <div className={`absolute top-0 left-0 right-0 z-40 transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-100'}`}>
      
      {/* Background Gradient for legibility */}
      <div className={`absolute inset-0 bg-gradient-to-b from-black/80 to-transparent h-32 pointer-events-none transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`} />

      <div className="relative z-10 p-4 flex justify-between items-start">
        
        {/* Left: Language & Session Info */}
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-2">
                {/* Language Dropdown */}
                <div className="relative group pointer-events-auto">
                    <button className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-white text-sm hover:bg-zinc-800 transition-colors">
                        <span className="font-medium text-indigo-400">{currentUser.language}</span>
                        <ChevronDown size={14} className="text-zinc-500" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden hidden group-hover:block max-h-80 overflow-y-auto z-50">
                        {Object.values(Language).map((lang) => (
                            <button
                                key={lang}
                                onClick={() => onLanguageChange(lang)}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors ${currentUser.language === lang ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400'}`}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Session ID Badge */}
                {activeGroupId && (
                    <span className={`px-2 py-1 rounded bg-black/40 text-[10px] text-zinc-500 font-mono transition-opacity ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                        {activeGroupId}
                    </span>
                )}
           </div>
        </div>

        {/* Center: Recording Status */}
        <div className={`absolute left-1/2 -translate-x-1/2 top-6 transition-all duration-300 ${isRecording ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <div className="flex items-center gap-2 bg-red-950/50 border border-red-500/20 px-3 py-1 rounded-full backdrop-blur-md">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                 <span className="text-xs font-medium text-red-200 uppercase tracking-widest">REC</span>
             </div>
        </div>

        {/* Right: Participants List (Always visible but changes style) */}
        <div className="flex items-center gap-2 pointer-events-auto">
             {/* When controls fade, we still see this list clearly */}
             <div className="flex -space-x-3 transition-all duration-500">
                {allUsers.map((user) => {
                    const isPinned = pinnedUserId === user.id;
                    return (
                        <div key={user.id} className="relative group">
                             <div 
                                onClick={() => onPinUser(user.id)}
                                className={`w-10 h-10 rounded-full border-2 cursor-pointer transition-all overflow-hidden ${isPinned ? 'border-indigo-500 scale-110 z-10' : 'border-zinc-900 hover:scale-105 hover:z-10'}`}
                             >
                                <img 
                                    src={user.avatar.startsWith('http') ? user.avatar : `https://ui-avatars.com/api/?name=${user.name}`} 
                                    className="w-full h-full object-cover bg-zinc-800"
                                    alt={user.name}
                                />
                             </div>
                             
                             {/* Tooltip for Pin */}
                             <div className="absolute top-full right-0 mt-2 bg-black/80 backdrop-blur px-2 py-1 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none">
                                 {isPinned ? 'Unpin' : `Pin ${user.name}`}
                             </div>
                        </div>
                    );
                })}
             </div>
             <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs text-zinc-400">
                {allUsers.length}
             </div>
        </div>

      </div>
    </div>
  );
};