import React, { useState, useEffect, useRef } from 'react';
import { User, Language } from '../types';
import { supabase } from '../lib/supabase';
import { X, User as UserIcon, Lock, Monitor, Smartphone, Camera, Mic, Volume2, Save, Check, ChevronDown, Fingerprint, Server, Play, Square, Activity } from 'lucide-react';
import { saveTrainingData } from '../services/trainingService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (user: User) => void;
  preferences: {
    darkMode: boolean;
    autoHideControls: boolean;
    defaultMicOn: boolean;
    defaultVideoOn: boolean;
    selectedAudioDeviceId?: string;
    selectedVideoDeviceId?: string;
  };
  onUpdatePreferences: (key: string, value: any) => void;
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'account', label: 'Account', icon: Lock },
  { id: 'appearance', label: 'Appearance', icon: Monitor },
  { id: 'devices', label: 'Audio & Video', icon: Volume2 },
  { id: 'voice-cloning', label: 'Voice Cloning', icon: Fingerprint },
];

const ADMIN_EMAIL = 'master@eburon.ai';

const TRAINING_PROMPTS = [
    "The quick brown fox jumps over the lazy dog.",
    "Orbitz translates my voice with perfect clarity and emotion.",
    "I am training my personal AI model to speak just like me."
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  onUpdateUser,
  preferences,
  onUpdatePreferences
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile State
  const [name, setName] = useState(currentUser.name);
  const [language, setLanguage] = useState<Language>(currentUser.language);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Account State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Device State
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // Voice Cloning State
  const [recordingStep, setRecordingStep] = useState(0);
  const [isRecordingSample, setIsRecordingSample] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'uploading' | 'complete'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Add Server Settings if Admin
  const availableTabs = currentUser.email === ADMIN_EMAIL 
      ? [...TABS, { id: 'server', label: 'Server Settings', icon: Server }] 
      : TABS;

  if (!isOpen) return null;

  useEffect(() => {
      if (isOpen) {
          const getDevices = async () => {
              try {
                  const devices = await navigator.mediaDevices.enumerateDevices();
                  setAudioInputs(devices.filter(d => d.kind === 'audioinput'));
                  setVideoInputs(devices.filter(d => d.kind === 'videoinput'));
              } catch (e) {
                  console.error("Device enumeration failed", e);
                  setDeviceError("Could not access devices. Permissions may be needed.");
              }
          };
          getDevices();
      }
  }, [isOpen]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
        const { error } = await supabase.from('profiles').update({ name, language, avatar }).eq('id', currentUser.id);
        if (error) throw error;
        onUpdateUser({ ...currentUser, name, language, avatar });
    } catch (e) {
        console.error("Profile update failed", e);
    } finally {
        setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
          setPasswordStatus('error');
          setPasswordMessage("Passwords do not match");
          return;
      }
      if (newPassword.length < 6) {
          setPasswordStatus('error');
          setPasswordMessage("Password must be at least 6 characters");
          return;
      }

      setPasswordStatus('saving');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
          setPasswordStatus('error');
          setPasswordMessage(error.message);
      } else {
          setPasswordStatus('success');
          setPasswordMessage("Password updated successfully");
          setNewPassword('');
          setConfirmPassword('');
      }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
          if (evt.target?.result) setAvatar(evt.target.result as string);
      };
      reader.readAsDataURL(file);
  };

  // --- Voice Recording Logic ---
  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          let options: any = undefined;
          if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options = { mimeType: 'audio/webm;codecs=opus' };
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/webm' };
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                options = { mimeType: 'audio/mp4' };
            }
          }
          
          const recorder = new MediaRecorder(stream, options);
          chunksRef.current = [];
          
          recorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunksRef.current.push(e.data);
          };
          
          recorder.onstop = () => {
              // Create blob with the actual mime type used by the recorder
              const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
              setAudioBlob(blob);
              stream.getTracks().forEach(t => t.stop());
          };

          recorder.start();
          mediaRecorderRef.current = recorder;
          setIsRecordingSample(true);
      } catch(e) {
          console.error("Mic access failed", e);
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecordingSample) {
          mediaRecorderRef.current.stop();
          setIsRecordingSample(false);
      }
  };

  const saveSample = async () => {
      if (!audioBlob) return;
      setTrainingStatus('uploading');
      
      await saveTrainingData(currentUser.id, TRAINING_PROMPTS[recordingStep], audioBlob);
      
      setAudioBlob(null);
      setTrainingStatus('idle');

      if (recordingStep < TRAINING_PROMPTS.length - 1) {
          setRecordingStep(prev => prev + 1);
      } else {
          // Finished all samples
          setTrainingStatus('complete');
          // Mock setting user status
          onUpdateUser({ ...currentUser, customVoiceStatus: 'training' });
      }
  };

  const playPreview = () => {
      if (!audioBlob) return;
      try {
          const url = URL.createObjectURL(audioBlob);
          const audio = new Audio(url);
          audio.play().catch(e => console.error("Playback failed:", e));
      } catch (e) {
          console.error("Error creating audio preview:", e);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl h-[80vh] bg-zinc-900 border border-white/10 rounded-[2rem] shadow-2xl flex overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-64 bg-zinc-950/50 border-r border-white/5 p-6 flex flex-col">
            <h2 className="text-xl font-semibold text-white mb-8 pl-2">Settings</h2>
            <nav className="space-y-2 flex-1">
                {availableTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <tab.icon size={18} />
                        <span className="font-medium text-sm">{tab.label}</span>
                    </button>
                ))}
            </nav>
            <div className="mt-auto text-xs text-zinc-600 px-2">
                Version 1.0.4
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-zinc-900 relative">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
            </button>

            <div className="flex-1 overflow-y-auto p-10">
                
                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-indigo-500 transition-colors shadow-xl">
                                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-xs font-medium text-white">
                                    Change
                                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                                </label>
                            </div>
                            <div>
                                <h3 className="text-xl font-medium text-white">{name}</h3>
                                <p className="text-sm text-zinc-500">Update your photo and personal details.</p>
                            </div>
                        </div>

                        <div className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Display Name</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Native Language</label>
                                <div className="relative">
                                    <select 
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value as Language)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        {Object.values(Language).map(l => (
                                            <option key={l} value={l} className="bg-zinc-900">{l}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-3.5 text-zinc-500 pointer-events-none" size={16} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button 
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-white/10"
                            >
                                {isSavingProfile ? <Monitor className="animate-spin" size={16}/> : <Save size={16} />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}

                {/* ACCOUNT TAB */}
                {activeTab === 'account' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div>
                            <h3 className="text-xl font-medium text-white mb-1">Security</h3>
                            <p className="text-sm text-zinc-500">Manage your password and account security.</p>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md bg-white/5 p-6 rounded-2xl border border-white/5">
                            <h4 className="font-medium text-white mb-4">Change Password</h4>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">New Password</label>
                                <input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Confirm Password</label>
                                <input 
                                    type="password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            
                            {passwordStatus === 'error' && <p className="text-red-400 text-sm">{passwordMessage}</p>}
                            {passwordStatus === 'success' && <p className="text-green-400 text-sm flex items-center gap-2"><Check size={14}/> {passwordMessage}</p>}

                            <button 
                                type="submit"
                                disabled={passwordStatus === 'saving'}
                                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors mt-2"
                            >
                                {passwordStatus === 'saving' ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                )}

                {/* APPEARANCE TAB */}
                {activeTab === 'appearance' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                         <div>
                            <h3 className="text-xl font-medium text-white mb-1">App Appearance</h3>
                            <p className="text-sm text-zinc-500">Customize how Orbitz looks and feels.</p>
                        </div>

                        <div className="space-y-4 max-w-xl">
                            {/* Dark Mode Toggle */}
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-zinc-800 rounded-lg"><Monitor size={20} className="text-zinc-400"/></div>
                                    <div>
                                        <div className="font-medium text-white">Dark Mode</div>
                                        <div className="text-xs text-zinc-500">Use dark themes for system interface.</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onUpdatePreferences('darkMode', !preferences.darkMode)}
                                    className={`w-12 h-7 rounded-full transition-colors relative ${preferences.darkMode ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${preferences.darkMode ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Auto-Hide Toggle */}
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-zinc-800 rounded-lg"><Smartphone size={20} className="text-zinc-400"/></div>
                                    <div>
                                        <div className="font-medium text-white">Auto-Hide Controls</div>
                                        <div className="text-xs text-zinc-500">Hide bottom bar when idle for immersion.</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onUpdatePreferences('autoHideControls', !preferences.autoHideControls)}
                                    className={`w-12 h-7 rounded-full transition-colors relative ${preferences.autoHideControls ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${preferences.autoHideControls ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* DEVICES TAB */}
                {activeTab === 'devices' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div>
                            <h3 className="text-xl font-medium text-white mb-1">Audio & Video</h3>
                            <p className="text-sm text-zinc-500">Manage input devices and default behaviors.</p>
                        </div>
                        
                        {deviceError && (
                             <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                 {deviceError}
                             </div>
                        )}

                        <div className="space-y-6 max-w-xl">
                            {/* Device Selectors */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Microphone</label>
                                    <div className="relative">
                                        <select 
                                            value={preferences.selectedAudioDeviceId || ''}
                                            onChange={(e) => onUpdatePreferences('selectedAudioDeviceId', e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Default System Microphone</option>
                                            {audioInputs.map(device => (
                                                <option key={device.deviceId} value={device.deviceId}>
                                                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-3.5 text-zinc-500 pointer-events-none" size={16} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Camera</label>
                                    <div className="relative">
                                        <select 
                                            value={preferences.selectedVideoDeviceId || ''}
                                            onChange={(e) => onUpdatePreferences('selectedVideoDeviceId', e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Default System Camera</option>
                                            {videoInputs.map(device => (
                                                <option key={device.deviceId} value={device.deviceId}>
                                                    {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-3.5 text-zinc-500 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-white/10" />

                            {/* Defaults */}
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-zinc-800 rounded-lg"><Mic size={20} className="text-zinc-400"/></div>
                                    <div>
                                        <div className="font-medium text-white">Join with Microphone On</div>
                                        <div className="text-xs text-zinc-500">Automatically unmute when joining.</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onUpdatePreferences('defaultMicOn', !preferences.defaultMicOn)}
                                    className={`w-12 h-7 rounded-full transition-colors relative ${preferences.defaultMicOn ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${preferences.defaultMicOn ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-zinc-800 rounded-lg"><Camera size={20} className="text-zinc-400"/></div>
                                    <div>
                                        <div className="font-medium text-white">Join with Camera On</div>
                                        <div className="text-xs text-zinc-500">Automatically turn on video when joining.</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onUpdatePreferences('defaultVideoOn', !preferences.defaultVideoOn)}
                                    className={`w-12 h-7 rounded-full transition-colors relative ${preferences.defaultVideoOn ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${preferences.defaultVideoOn ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* VOICE CLONING TAB */}
                {activeTab === 'voice-cloning' && (
                     <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div>
                            <h3 className="text-xl font-medium text-white mb-1">Personal Voice Model</h3>
                            <p className="text-sm text-zinc-500">Train the AI to speak with your voice by recording samples.</p>
                        </div>

                        {trainingStatus === 'complete' ? (
                            <div className="flex flex-col items-center justify-center py-12 bg-white/5 rounded-3xl border border-white/10">
                                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4">
                                    <Check size={32} />
                                </div>
                                <h4 className="text-xl font-medium text-white mb-2">Voice Training Complete</h4>
                                <p className="text-zinc-400 text-center max-w-sm mb-6">
                                    Your voice profile has been created. The AI will now use your custom voice model for translations.
                                </p>
                                <button className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors">
                                    Retrain Model
                                </button>
                            </div>
                        ) : (
                            <div className="max-w-xl mx-auto">
                                {/* Progress Steps */}
                                <div className="flex items-center justify-between mb-8 px-4">
                                    {TRAINING_PROMPTS.map((_, idx) => (
                                        <div key={idx} className="flex items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                                                idx === recordingStep 
                                                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' 
                                                : idx < recordingStep 
                                                    ? 'border-green-500 bg-green-500 text-white' 
                                                    : 'border-zinc-700 text-zinc-600'
                                            }`}>
                                                {idx < recordingStep ? <Check size={14} /> : idx + 1}
                                            </div>
                                            {idx < TRAINING_PROMPTS.length - 1 && (
                                                <div className={`w-12 h-0.5 mx-2 transition-colors ${idx < recordingStep ? 'bg-green-500' : 'bg-zinc-800'}`} />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Active Recording Card */}
                                <div className="bg-black/40 border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden">
                                    {isRecordingSample && (
                                        <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
                                    )}
                                    
                                    <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Read Aloud</h5>
                                    <p className="text-2xl font-light text-white mb-10 leading-relaxed">
                                        "{TRAINING_PROMPTS[recordingStep]}"
                                    </p>

                                    <div className="flex flex-col items-center gap-4">
                                        {audioBlob ? (
                                            <div className="flex gap-4">
                                                <button onClick={playPreview} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white flex items-center gap-2">
                                                    <Play size={18} /> Preview
                                                </button>
                                                <button onClick={() => setAudioBlob(null)} className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl">
                                                    Retake
                                                </button>
                                                <button onClick={saveSample} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                                                    {trainingStatus === 'uploading' ? 'Uploading...' : 'Next Sample'}
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onMouseDown={startRecording}
                                                onMouseUp={stopRecording}
                                                onMouseLeave={stopRecording}
                                                onTouchStart={startRecording}
                                                onTouchEnd={stopRecording}
                                                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                                                    isRecordingSample 
                                                    ? 'bg-red-500 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]' 
                                                    : 'bg-zinc-800 hover:bg-zinc-700 border border-white/10'
                                                }`}
                                            >
                                                {isRecordingSample ? <Square size={32} className="text-white" fill="currentColor" /> : <Mic size={32} className="text-zinc-400" />}
                                            </button>
                                        )}
                                        
                                        {!audioBlob && (
                                            <p className="text-xs text-zinc-500 mt-2">
                                                {isRecordingSample ? 'Recording... Release to stop' : 'Press and hold to record'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                     </div>
                )}

                {/* SERVER SETTINGS TAB (RESTRICTED) */}
                {activeTab === 'server' && currentUser.email === ADMIN_EMAIL && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-medium text-red-400 mb-1 flex items-center gap-2">
                                    <Lock size={18} /> Server Administration
                                </h3>
                                <p className="text-sm text-zinc-500">Restricted access area. Authorized personnel only.</p>
                            </div>
                            <div className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-mono uppercase border border-red-500/20">
                                ROOT_ACCESS
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 bg-zinc-950/50 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3 mb-4 text-zinc-300">
                                    <Activity size={20} />
                                    <span className="font-medium">System Status</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Gemini API</span>
                                        <span className="text-green-400">Operational</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Supabase DB</span>
                                        <span className="text-green-400">Operational</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Voice Processing</span>
                                        <span className="text-yellow-400">High Load</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-zinc-950/50 rounded-2xl border border-white/5 flex flex-col justify-center gap-3">
                                <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 rounded-lg text-sm transition-colors text-left px-4">
                                    Flush Cache
                                </button>
                                <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 rounded-lg text-sm transition-colors text-left px-4">
                                    Rotate API Keys
                                </button>
                                <button className="w-full py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-500/20 text-red-400 rounded-lg text-sm transition-colors text-left px-4">
                                    Emergency Shutdown
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};