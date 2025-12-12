import React from 'react';
import { User, Group } from '../types';
import { X, Mic, MicOff } from 'lucide-react';

interface ParticipantsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  participants: User[];
  currentUser: User;
  activeGroup: Group | undefined;
}

export const ParticipantsSidebar: React.FC<ParticipantsSidebarProps> = ({ 
  isOpen, 
  onClose, 
  participants, 
  currentUser,
  activeGroup 
}) => {
  if (!isOpen) return null;

  // Combine currentUser + remote participants
  const allUsers = [currentUser, ...participants];

  return (
    <div className="absolute top-24 left-4 bottom-28 w-72 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-40 flex flex-col overflow-hidden animate-in slide-in-from-left-4 fade-in duration-300">
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
            <h3 className="font-medium text-white">Participants ({allUsers.length})</h3>
            <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white transition-colors">
                <X size={18} />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {allUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-white/5">
                        {user.avatar.startsWith('http') ? (
                            <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">{user.avatar}</div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate flex items-center gap-2">
                            {user.name} 
                            {user.id === currentUser.id && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">You</span>}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">{user.language} • {user.voice || 'Default'}</p>
                    </div>
                    <div>
                         <Mic size={14} className="text-zinc-600" />
                    </div>
                </div>
            ))}
        </div>
        
        <div className="p-4 border-t border-white/5 bg-black/20">
            <button 
                onClick={() => {
                   const url = window.location.href;
                   navigator.clipboard.writeText(activeGroup?.id || url);
                   alert("Session ID copied to clipboard!");
                }}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 text-sm rounded-xl transition-colors border border-white/5"
            >
                Copy Invite Link
            </button>
        </div>
    </div>
  );
};