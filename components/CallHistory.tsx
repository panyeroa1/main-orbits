import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { Group, User } from '../types';

interface CallHistoryProps {
  group: Group;
  currentUser: User;
  onClose: () => void;
}

export const CallHistory: React.FC<CallHistoryProps> = ({ group, currentUser, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900/80 border border-white/10 rounded-[32px] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h2 className="text-lg font-medium text-white tracking-wide">Conversation History</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {group.messages.length === 0 && (
             <div className="text-center text-slate-500 py-10">No messages yet. Start speaking!</div>
          )}
          {group.messages.map((msg) => {
             const isMe = msg.senderId === currentUser.id;
             return (
               <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-5 rounded-3xl text-sm backdrop-blur-sm transition-all duration-300 ${
                      isMe 
                      ? 'bg-indigo-500/20 text-indigo-50 border border-indigo-500/20 rounded-br-sm' 
                      : 'bg-white/5 text-slate-200 border border-white/5 rounded-bl-sm'
                  }`}>
                      <div className="flex items-center gap-2 mb-2 opacity-60">
                         <span className="text-[10px] uppercase tracking-wider font-bold">
                           {isMe ? 'You' : msg.senderName}
                         </span>
                         <span className="text-[10px]">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      
                      {/* Added whitespace-pre-wrap to support lyrics/stanzas */}
                      <p className="leading-relaxed text-base font-light whitespace-pre-wrap">{msg.text}</p>
                      
                      {msg.translatedText && (
                         <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-xs opacity-70 flex gap-2 items-start">
                               <Sparkles size={12} className="mt-0.5 shrink-0 text-indigo-400" />
                               <span className="italic font-light whitespace-pre-wrap">"{msg.translatedText}"</span>
                            </p>
                         </div>
                      )}
                  </div>
               </div>
             )
          })}
        </div>
      </div>
    </div>
  );
}