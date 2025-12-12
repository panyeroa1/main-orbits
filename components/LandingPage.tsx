import React from 'react';
import { ArrowRight, Globe, Sparkles, Zap, Lock, Activity, Mic, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="h-screen w-full bg-black text-white font-sans overflow-x-hidden overflow-y-auto relative selection:bg-indigo-500/30 scroll-smooth">
      
      {/* Background Layers */}
      <div className="fixed inset-0 ambient-wave opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none mix-blend-overlay"></div>
      
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 backdrop-blur-md bg-black/0 border-b border-white/0 transition-all duration-300">
         <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
             <img 
               src="https://orbitz.eburon.ai/icons/logo.png" 
               alt="Orbitz Logo" 
               className="w-10 h-10 drop-shadow-[0_0_20px_rgba(79,70,229,0.5)]" 
             />
             <span className="text-2xl font-bold tracking-tighter font-[Inter]">Orbitz</span>
         </div>
         <button 
           onClick={onEnter}
           className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-700 delay-100"
         >
            Sign In <ArrowRight size={14} />
         </button>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 md:px-12 flex flex-col items-center text-center z-10">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 backdrop-blur-md">
             <Sparkles size={12} />
             <span>Zero-Latency AI Translation</span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-light tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-600 animate-in fade-in slide-in-from-bottom-8 duration-1000 leading-[1.1] text-glow font-[Inter]">
              Speak <br className="md:hidden" />
              <span className="font-semibold text-white">Universally</span>
          </h1>

          {/* Subheadline */}
          <p className="max-w-2xl text-lg md:text-xl text-zinc-400 font-light leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
              Break down language barriers with high-fidelity voice mirroring. 
              Orbitz preserves your emotion, tone, and nuance across 30+ languages in real-time.
          </p>

          {/* CTAs */}
          <div className="flex flex-col md:flex-row items-center gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
              <button 
                onClick={onEnter}
                className="group relative px-10 py-5 bg-white text-black rounded-full font-semibold text-lg hover:bg-zinc-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_80px_rgba(255,255,255,0.4)] hover:-translate-y-1 active:scale-95 flex items-center gap-3 overflow-hidden"
              >
                  <span className="relative z-10">Start Experience</span>
                  <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>
              
              <button onClick={onEnter} className="px-8 py-5 bg-black/40 border border-white/10 rounded-full font-medium text-lg hover:bg-white/5 hover:border-white/20 transition-all text-zinc-300 flex items-center gap-2 backdrop-blur-md">
                   <Activity size={20} />
                   Live Demo
              </button>
          </div>

      </section>

      {/* Feature Grid (Bento) */}
      <section className="px-6 md:px-12 pb-32 max-w-7xl mx-auto z-10 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-24 duration-1000 delay-500">
              
              {/* Card 1: Voice Mirror (Large) */}
              <div className="col-span-1 md:col-span-2 p-10 md:p-14 rounded-[3rem] bg-zinc-900/30 border border-white/5 backdrop-blur-md relative overflow-hidden group hover:bg-zinc-900/40 transition-colors">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[120px] -mr-20 -mt-20 group-hover:bg-indigo-500/30 transition-all duration-700"></div>
                  <div className="relative z-10">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/5">
                          <Mic size={28} className="text-indigo-300" />
                      </div>
                      <h3 className="text-4xl font-light mb-6 text-white">Voice Mirroring</h3>
                      <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
                          Unlike traditional translation, Orbitz captures your pitch, rhythm, and pauses. If you whisper, it whispers. If you shout, it shouts.
                      </p>
                  </div>
              </div>

              {/* Card 2: Speed (Small) */}
              <div className="col-span-1 p-10 rounded-[3rem] bg-zinc-900/30 border border-white/5 backdrop-blur-md relative overflow-hidden group hover:bg-zinc-900/40 transition-colors">
                  <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                          <Zap size={28} className="text-yellow-300" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-light mb-3 text-white">Instant</h3>
                        <p className="text-zinc-400">
                            Powered by Gemini 2.5 Flash, translation happens in milliseconds.
                        </p>
                      </div>
                  </div>
              </div>

              {/* Card 3: Privacy (Small) */}
               <div className="col-span-1 p-10 rounded-[3rem] bg-zinc-900/30 border border-white/5 backdrop-blur-md relative overflow-hidden group hover:bg-zinc-900/40 transition-colors">
                   <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                          <Lock size={28} className="text-green-300" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-light mb-3 text-white">Private</h3>
                        <p className="text-zinc-400">
                            End-to-end encryption. Your voice data is processed ephemerally.
                        </p>
                      </div>
                   </div>
              </div>

              {/* Card 4: Global (Large) */}
              <div className="col-span-1 md:col-span-2 p-10 md:p-14 rounded-[3rem] bg-zinc-900/30 border border-white/5 backdrop-blur-md relative overflow-hidden flex items-center group hover:bg-zinc-900/40 transition-colors">
                   <div className="relative z-10 w-full">
                       <h3 className="text-4xl md:text-5xl font-light leading-tight mb-8 text-white">
                           Connect with <span className="text-indigo-400 font-normal">anyone</span>, <br/>anywhere.
                       </h3>
                       <div className="flex flex-wrap gap-3">
                           {['English', 'Spanish', 'Japanese', 'French', 'Korean', 'Mandarin', 'Tagalog', 'Hindi'].map(lang => (
                               <span key={lang} className="px-5 py-2.5 rounded-full bg-white/5 border border-white/5 text-xs uppercase tracking-widest text-zinc-400 group-hover:border-white/10 transition-colors">
                                   {lang}
                               </span>
                           ))}
                           <span className="px-5 py-2.5 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-xs uppercase tracking-widest text-indigo-300">
                               +25 More
                           </span>
                       </div>
                   </div>
              </div>

          </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-white/5 bg-black py-12 px-6 md:px-12 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6 opacity-60 relative z-10">
          <div className="flex items-center gap-2">
             <img 
               src="https://orbitz.eburon.ai/icons/logo.png" 
               alt="Orbitz Logo" 
               className="w-6 h-6 opacity-60 grayscale hover:grayscale-0 transition-all" 
             />
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Orbitz AI © 2024</p>
          </div>
          
          <div className="flex gap-8">
              <a href="#" className="text-xs text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-medium">Privacy Policy</a>
              <a href="#" className="text-xs text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-medium">Terms of Service</a>
              <a href="#" className="text-xs text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-medium">Contact</a>
          </div>
      </footer>

    </div>
  );
};