import React, { useState } from 'react';
import { User, Group } from '../types';
import { Video, PlusSquare, Settings, ArrowRight, UserPlus, Disc } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface DashboardProps {
  currentUser: User;
  contacts: User[];
  groups: Group[];
  onJoinGroup: (group: Group) => void;
  onCreateGroup: (name: string, members: User[]) => void;
  onDeleteGroup: (groupId: string) => void;
  onDirectCall: (contact: User) => void;
  onEditProfile: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  contacts,
  groups,
  onJoinGroup,
  onCreateGroup,
  onDeleteGroup,
  onDirectCall,
  onEditProfile
}) => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinId, setJoinId] = useState('');

  const handleNewMeeting = () => {
    // Generate a new session instantly
    const newSessionId = uuidv4().slice(0, 8); // Short ID for demo
    onCreateGroup(`Session ${newSessionId}`, [currentUser]);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    
    // Check if group exists in local state
    const existing = groups.find(g => g.name.includes(joinId) || g.id === joinId);
    
    if (existing) {
        onJoinGroup(existing);
    } else {
        // Mock join: Create a placeholder group reference to "Join"
        // In a real app, this would query Supabase for the ID
        const mockGroup: Group = {
            id: joinId,
            name: `Session ${joinId}`,
            members: [currentUser], // Will add self
            messages: [],
            lastActive: Date.now()
        };
        onJoinGroup(mockGroup);
    }
  };

  const renderAvatar = (avatarStr: string) => {
    const isImage = avatarStr.startsWith('http') || avatarStr.startsWith('data:');
    if (isImage) {
        return <img src={avatarStr} alt="Avatar" className="w-full h-full object-cover" />;
    }
    return <span className="text-xl md:text-2xl">{avatarStr}</span>;
  };

  return (
    <div className="h-screen flex flex-col items-center relative overflow-hidden font-sans text-white">
      
      {/* Top Bar */}
      <div className="w-full flex justify-between items-center p-6 z-20">
          <div className="flex items-center gap-3 bg-white/5 p-1.5 pr-4 rounded-full border border-white/5 backdrop-blur-md cursor-pointer hover:bg-white/10 transition-colors" onClick={onEditProfile}>
             <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10">
                {renderAvatar(currentUser.avatar)}
             </div>
             <span className="text-sm font-medium text-zinc-200">{currentUser.name}</span>
          </div>
          
          <button onClick={onEditProfile} className="p-3 bg-white/5 rounded-full border border-white/5 text-zinc-300 hover:text-white transition-colors hover:bg-white/10 group">
              <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg px-6 z-10 -mt-10">
          
          {/* Time/Date Aesthetic */}
          <div className="text-center mb-16">
              <h1 className="text-7xl font-light tracking-tighter text-white drop-shadow-2xl">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </h1>
              <p className="text-zinc-400 uppercase tracking-widest text-xs mt-4 font-medium">
                  {new Date().toLocaleDateString([], {weekday: 'long', month: 'long', day: 'numeric'})}
              </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-6 w-full">
              
              {/* New Meeting */}
              <button 
                onClick={handleNewMeeting}
                className="flex flex-col items-center justify-center gap-4 bg-orange-600/90 hover:bg-orange-500 p-8 rounded-[2rem] shadow-[0_20px_40px_rgba(234,88,12,0.2)] transition-all hover:scale-[1.02] active:scale-95 group backdrop-blur-sm border border-orange-500/20"
              >
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Video size={32} className="text-white" />
                  </div>
                  <span className="font-medium text-lg">New Session</span>
              </button>

              {/* Join */}
              <button 
                onClick={() => setShowJoinModal(true)}
                className="flex flex-col items-center justify-center gap-4 bg-indigo-600/90 hover:bg-indigo-500 p-8 rounded-[2rem] shadow-[0_20px_40px_rgba(79,70,229,0.2)] transition-all hover:scale-[1.02] active:scale-95 group backdrop-blur-sm border border-indigo-500/20"
              >
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <PlusSquare size={32} className="text-white" />
                  </div>
                  <span className="font-medium text-lg">Join Session</span>
              </button>
          </div>

          <p className="mt-12 text-zinc-400 text-sm text-center max-w-xs leading-relaxed">
             Start a new translation session or join an existing orbit ID to begin communicating.
          </p>

      </div>

      {/* Join Modal */}
      {showJoinModal && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="w-full max-w-sm bg-zinc-900/90 border border-white/10 rounded-[2rem] p-8 shadow-2xl relative backdrop-blur-2xl">
                  <h2 className="text-2xl font-light text-white mb-6 text-center">Join Session</h2>
                  <form onSubmit={handleJoin} className="space-y-4">
                      <input 
                        type="text" 
                        value={joinId}
                        onChange={(e) => setJoinId(e.target.value)}
                        placeholder="Enter Session ID"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-center text-lg outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600 text-white"
                        autoFocus
                      />
                      <div className="grid grid-cols-2 gap-3 pt-4">
                          <button type="button" onClick={() => setShowJoinModal(false)} className="py-3 rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 font-medium transition-colors">Cancel</button>
                          <button type="submit" className="py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-medium shadow-lg shadow-indigo-500/20 transition-colors">Join</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};
