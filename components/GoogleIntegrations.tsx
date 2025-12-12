import React from 'react';
import { X, Calendar, Mail, HardDrive, ExternalLink } from 'lucide-react';
import { Group } from '../types';

interface GoogleIntegrationsProps {
    isOpen: boolean;
    onClose: () => void;
    action: 'calendar' | 'gmail' | 'drive' | null;
    activeGroup: Group | undefined;
}

export const GoogleIntegrations: React.FC<GoogleIntegrationsProps> = ({ isOpen, onClose, action, activeGroup }) => {
    if (!isOpen || !action) return null;

    const sessionId = activeGroup?.id || 'orbit-session';
    const joinUrl = window.location.href; // In real app, this would be specific link
    const title = `Orbitz Session: ${activeGroup?.name || 'Meeting'}`;
    const description = `Join the Orbitz translation session here: ${joinUrl} (Session ID: ${sessionId})`;

    // Generate Links
    const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(description)}&location=Orbitz+App`;
    const mailLink = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description)}`;
    const driveLink = `https://drive.google.com/drive/u/0/my-drive`;

    const handleOpen = (url: string) => {
        window.open(url, '_blank');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-in fade-in duration-200">
             <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[2rem] p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white"><X size={20} /></button>
                
                <div className="flex flex-col items-center text-center mt-2">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-white">
                        {action === 'calendar' && <Calendar size={32} />}
                        {action === 'gmail' && <Mail size={32} />}
                        {action === 'drive' && <HardDrive size={32} />}
                    </div>
                    
                    <h3 className="text-xl font-light text-white mb-2">
                        {action === 'calendar' && 'Schedule Meeting'}
                        {action === 'gmail' && 'Send Invite'}
                        {action === 'drive' && 'Attach from Drive'}
                    </h3>
                    
                    <p className="text-sm text-zinc-500 mb-6">
                        {action === 'calendar' && 'Create a Google Calendar event for this session.'}
                        {action === 'gmail' && 'Open Gmail to send an invitation link to participants.'}
                        {action === 'drive' && 'Open Google Drive to pick files to share (Mock).'}
                    </p>

                    <button 
                        onClick={() => handleOpen(action === 'calendar' ? calendarLink : action === 'gmail' ? mailLink : driveLink)}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                        Open {action === 'calendar' ? 'Calendar' : action === 'gmail' ? 'Gmail' : 'Drive'} <ExternalLink size={16} />
                    </button>
                </div>
             </div>
        </div>
    );
};