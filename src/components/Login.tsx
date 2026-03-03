import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, User as UserIcon, Lock, Package } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, pass: string) => void;
  loading: boolean;
}

export const Login: React.FC<LoginProps> = ({ onLogin, loading }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 relative overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/10 blur-[100px] rounded-full"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-300/20 blur-[100px] rounded-full"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Clear Glass Container */}
        <div className="bg-white/20 backdrop-blur-2xl border border-white/30 rounded-[48px] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden">
          
          <div className="mb-10 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
              <Package className="text-white drop-shadow-md" size={40} strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none drop-shadow-sm">
              E-LOG <span className="text-blue-100/80">RSDI</span>
            </h1>
            <p className="text-blue-50/90 text-[10px] font-black uppercase tracking-[0.4em] mt-3 drop-shadow-sm">
              Logistics System Management
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="text-white/60 group-focus-within:text-white transition-colors" size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl outline-none text-white placeholder:text-white/40 font-medium transition-all focus:bg-white/20 focus:border-white/40"
                  placeholder="Username"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-white/60 group-focus-within:text-white transition-colors" size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl outline-none text-white placeholder:text-white/40 font-medium transition-all focus:bg-white/20 focus:border-white/40"
                  placeholder="Password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-2xl h-14"
            >
              <div className="absolute inset-0 bg-white group-hover:bg-blue-50 transition-colors duration-300"></div>
              <div className="relative flex items-center justify-center gap-3 text-blue-600 font-black text-xs tracking-[0.3em] uppercase">
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'MASUK'}
              </div>
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
              Secure Access &bull; IT RSDI KENDAL
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
