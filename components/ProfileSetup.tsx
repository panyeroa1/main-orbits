import React, { useState } from 'react';
import { ArrowRight, Mail, Lock, User as UserIcon, Loader2, Globe, Sparkles } from 'lucide-react';
import { Language, User } from '../types';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface ProfileSetupProps {
  onComplete: (user: User) => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot_password';

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Google Auth
  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
        console.error("Google Auth Error:", error);
        setError(error.message);
        setLoading(false);
    }
  };

  // Email Auth Logic
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
            }
          }
        });
        if (error) throw error;
        if (data.user) {
             // If auto-confirm is on, App.tsx will catch the session.
             // If email confirm is required:
             setMessage("Account created! Please check your email to confirm.");
        }
      } 
      else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        // App.tsx handles onAuthStateChange
      }
      else if (mode === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage("Password reset link sent to your email.");
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex font-sans ambient-wave overflow-y-auto overflow-x-hidden">
      
      {/* LEFT SIDE - AUTH FORM */}
      {/* Changed bg-black/95 to bg-slate-950/90 for deeper color that isn't black */}
      <div className="w-full md:w-[480px] lg:w-[550px] min-h-full flex flex-col justify-center px-8 sm:px-12 md:px-16 border-r border-white/5 bg-slate-950/90 backdrop-blur-xl relative z-20 shadow-[20px_0_50px_rgba(0,0,0,0.5)] py-12">
         
         <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 mb-6">
                <img 
                    src="https://orbitz.eburon.ai/icons/logo.png" 
                    alt="Orbitz Logo" 
                    className="w-12 h-12"
                />
                <span className="text-2xl font-semibold tracking-tight text-white">Orbitz</span>
            </div>
            <h1 className="text-4xl font-light text-white tracking-tight mb-2">
                {mode === 'signin' && 'Welcome back'}
                {mode === 'signup' && 'Create account'}
                {mode === 'forgot_password' && 'Reset Password'}
            </h1>
            <p className="text-zinc-400 font-light">
                {mode === 'signin' && 'Enter your details to access your workspace.'}
                {mode === 'signup' && 'Get started with your free account today.'}
                {mode === 'forgot_password' && 'Enter your email to receive a reset link.'}
            </p>
         </div>

         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
             
             {/* Google Button */}
             {mode !== 'forgot_password' && (
               <>
                 <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white hover:bg-zinc-200 text-black font-medium py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]"
                 >
                     <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26-.19-.58z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                     <span className="text-sm">Continue with Google</span>
                 </button>

                 <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Or Email</span>
                    <div className="flex-grow border-t border-white/10"></div>
                 </div>
               </>
             )}

             {/* Auth Form */}
             <form onSubmit={handleAuth} className="space-y-4">
                 
                 {mode === 'signup' && (
                    <div className="group">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 pl-1">Full Name</label>
                        <div className="relative">
                            <UserIcon className="absolute left-4 top-3.5 text-zinc-500 w-4 h-4 transition-colors group-focus-within:text-indigo-400" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full bg-black/40 text-white rounded-xl pl-10 pr-4 py-3.5 border border-white/10 focus:border-indigo-500/50 focus:bg-black/60 outline-none transition-all placeholder:text-zinc-700 font-light text-sm"
                                required
                            />
                        </div>
                    </div>
                 )}

                 <div className="group">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 pl-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-zinc-500 w-4 h-4 transition-colors group-focus-within:text-indigo-400" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="w-full bg-black/40 text-white rounded-xl pl-10 pr-4 py-3.5 border border-white/10 focus:border-indigo-500/50 focus:bg-black/60 outline-none transition-all placeholder:text-zinc-700 font-light text-sm"
                            required
                        />
                    </div>
                 </div>

                 {mode !== 'forgot_password' && (
                    <div className="group">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 pl-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-zinc-500 w-4 h-4 transition-colors group-focus-within:text-indigo-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-black/40 text-white rounded-xl pl-10 pr-4 py-3.5 border border-white/10 focus:border-indigo-500/50 focus:bg-black/60 outline-none transition-all placeholder:text-zinc-700 font-light text-sm"
                                required
                            />
                        </div>
                    </div>
                 )}

                 {/* Feedback Messages */}
                 {error && (
                     <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                         {error}
                     </div>
                 )}
                 {message && (
                     <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs text-center">
                         {message}
                     </div>
                 )}

                 {mode === 'signin' && (
                     <div className="flex justify-end">
                         <button type="button" onClick={() => setMode('forgot_password')} className="text-xs text-zinc-400 hover:text-white transition-colors">
                             Forgot password?
                         </button>
                     </div>
                 )}

                 <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 mt-2"
                 >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                        <>
                            {mode === 'signin' && 'Sign In'}
                            {mode === 'signup' && 'Create Account'}
                            {mode === 'forgot_password' && 'Send Reset Link'}
                            {mode !== 'forgot_password' && <ArrowRight size={16} />}
                        </>
                    )}
                 </button>
             </form>
         </div>

         <div className="mt-12 text-center text-sm text-zinc-400 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
             {mode === 'signin' ? (
                 <>
                    Don't have an account?{' '}
                    <button onClick={() => setMode('signup')} className="text-white font-medium hover:underline">
                        Sign up
                    </button>
                 </>
             ) : (
                 <>
                    Already have an account?{' '}
                    <button onClick={() => setMode('signin')} className="text-white font-medium hover:underline">
                        Sign in
                    </button>
                 </>
             )}
         </div>

      </div>

      {/* RIGHT SIDE - VISUALS */}
      <div className="hidden md:flex flex-1 relative items-center justify-center overflow-hidden h-full sticky top-0">
          {/* Content Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 pointer-events-none" />
          
          <div className="relative z-10 p-12 max-w-2xl text-center">
              <div className="w-20 h-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(255,255,255,0.1)] animate-bounce duration-[3000ms]">
                   <Globe size={40} className="text-indigo-300" />
              </div>

              <h2 className="text-5xl lg:text-7xl font-light text-white tracking-tighter mb-8 leading-tight text-glow">
                  Connect beyond <br/> 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 font-normal">boundaries</span>
              </h2>
              
              <p className="text-lg text-zinc-300 font-light leading-relaxed max-w-lg mx-auto mb-10">
                  Experience real-time, high-fidelity AI voice translation. 
                  Communicate effortlessly with anyone, anywhere, in any language.
              </p>

              {/* Decorative Features Grid */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left opacity-70">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-2 text-indigo-300">
                          <Sparkles size={16} />
                          <span className="text-xs font-bold uppercase tracking-wider">Voice Mirror</span>
                      </div>
                      <p className="text-xs text-zinc-300">Emotion & Prosody Transfer</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                       <div className="flex items-center gap-2 mb-2 text-indigo-300">
                          <Globe size={16} />
                          <span className="text-xs font-bold uppercase tracking-wider">Universal</span>
                      </div>
                      <p className="text-xs text-zinc-300">30+ Languages Supported</p>
                  </div>
              </div>
          </div>
      </div>

    </div>
  );
};