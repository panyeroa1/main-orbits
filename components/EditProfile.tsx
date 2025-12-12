import React, { useState } from 'react';
import { User, Language } from '../types';
import { Camera, Upload, User as UserIcon, ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EditProfileProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onCancel: () => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ user, onSave, onCancel }) => {
  const [name, setName] = useState(user.name);
  const [language, setLanguage] = useState<Language>(user.language);
  const [avatar, setAvatar] = useState(user.avatar);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use FileReader to read the file
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create a canvas to resize the image
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 300; // Resize to max 300px to keep base64 string size manageable

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Convert to JPEG with compression (0.7 quality)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setAvatar(dataUrl);
        }
      };
      
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ name, language, avatar })
            .eq('id', user.id);

        if (error) throw error;

        onSave({ ...user, name, language, avatar });
    } catch(e) {
        console.error("Error updating profile", e);
        alert("Failed to update profile. The image might be too large or there was a connection error.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
       {/* Background */}
       <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-slate-950 to-slate-950 pointer-events-none" />
       
       <div className="w-full max-w-md bg-slate-900/90 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
           <div className="flex items-center gap-4 mb-8">
               <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                   <ArrowLeft size={20} />
               </button>
               <h2 className="text-2xl font-light text-white">Edit Profile</h2>
           </div>

           <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex justify-center mb-6">
                      <div className="relative group cursor-pointer">
                        <div className="w-32 h-32 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden hover:border-indigo-500 transition-colors shadow-2xl">
                          {avatar && (avatar.startsWith('http') || avatar.startsWith('data:')) ? (
                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="text-slate-500 group-hover:text-indigo-400 transition-colors" size={40} />
                          )}
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          title="Upload new avatar"
                        />
                        <div className="absolute bottom-1 right-1 bg-indigo-600 p-2 rounded-full shadow-lg border border-slate-900 pointer-events-none">
                          <Upload size={14} className="text-white" />
                        </div>
                      </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Display Name</label>
                    <div className="relative group">
                        <UserIcon className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/20 text-white rounded-2xl pl-12 pr-4 py-3 border border-white/10 focus:border-indigo-500/50 outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Language</label>
                     <div className="relative">
                        <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as Language)}
                        className="w-full bg-black/20 text-white rounded-2xl px-5 py-3 border border-white/10 focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
                        >
                        {Object.values(Language).map((lang) => (
                            <option key={lang} value={lang} className="bg-slate-900">{lang}</option>
                        ))}
                        </select>
                        <div className="absolute right-4 top-3.5 pointer-events-none text-slate-500">▼</div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 mt-4"
                >
                    {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                </button>
           </form>
       </div>
    </div>
  );
};