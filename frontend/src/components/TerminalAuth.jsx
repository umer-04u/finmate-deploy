import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Shield, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const TerminalAuth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('CONFIRMATION_SENT: Check your inbox.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/dashboard';
      }
    } catch (error) {
      setMessage(error.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brutal-box w-full max-w-md p-8 bg-black/40 backdrop-blur-xl">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 border border-cyan/30 flex items-center justify-center mb-4 relative">
          <Shield className="text-cyan" size={32} />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan"></div>
        </div>
        <h2 className="font-display text-2xl tracking-tighter uppercase">Security_Gateway</h2>
        <p className="font-mono text-[10px] text-white/40 mt-1 uppercase tracking-widest">Identify yourself to continue</p>
      </div>

      <form onSubmit={handleAuth} className="space-y-6">
        <div>
          <label className="block font-mono text-[10px] text-white/50 uppercase mb-2 tracking-widest">Electronic_Mail</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              type="email"
              required
              className="w-full bg-white/5 border border-white/10 p-3 pl-10 font-mono text-sm text-white focus:outline-none focus:border-cyan transition-colors"
              placeholder="USER@DOMAIN.SYS"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block font-mono text-[10px] text-white/50 uppercase mb-2 tracking-widest">Access_Cipher</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              type="password"
              required
              className="w-full bg-white/5 border border-white/10 p-3 pl-10 font-mono text-sm text-white focus:outline-none focus:border-cyan transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {message && (
          <div className={`p-3 font-mono text-[10px] flex items-center gap-2 ${message.includes('CONFIRMATION') ? 'text-lime border border-lime/30 bg-lime/5' : 'text-orange border border-orange/30 bg-orange/5'}`}>
            <AlertCircle size={14} />
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="brutal-btn w-full"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : (isSignUp ? 'EXECUTE_SIGN_UP' : 'EXECUTE_SIGN_IN')}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="font-mono text-[10px] text-white/40 hover:text-cyan uppercase tracking-widest transition-colors"
        >
          {isSignUp ? '[ ALREADY_REGISTERED? SIGN_IN ]' : '[ NO_IDENTITY_FOUND? SIGN_UP ]'}
        </button>
      </div>
    </div>
  );
};

export default TerminalAuth;
