import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, Shield, Sparkles } from 'lucide-react';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/dashboard';
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Success! Please verify your email.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card auth-form-card"
    >
      <div className="auth-header">
        <div className="auth-icon-wrapper">
          <Shield color="var(--accent-primary)" size={32} />
        </div>
        <h2 className="auth-title">
          {isLogin ? 'Initialize' : 'Create'} <span className="serif">Vault</span>
        </h2>
        <p className="auth-subtitle">
          {isLogin ? 'Access your private financial monolith' : 'Begin your journey to absolute clarity'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form-element">
        <div className="form-group">
          <label className="input-label">NODE ADDRESS (EMAIL)</label>
          <div className="input-wrapper">
            <Mail size={18} className="input-icon" />
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@finmate.io"
              className="premium-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="input-label">ACCESS KEY (PASSWORD)</label>
          <div className="input-wrapper">
            <Lock size={18} className="input-icon" />
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="premium-input"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-premium"
          style={{ width: '100%', justifyContent: 'center', height: '56px' }}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'INITIALIZE SESSION' : 'REGISTER PROTOCOL')}
          {!loading && (isLogin ? <ArrowRight size={20} /> : <Sparkles size={20} />)}
        </button>

        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`auth-message ${message.type}`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="auth-toggle-btn"
        >
          {isLogin ? "New Operator? " : "Existing Operator? "}
          <span className="toggle-highlight">{isLogin ? 'Register Node' : 'Initialize Vault'}</span>
        </button>
      </form>

      <style>{`
        .auth-form-card {
          max-width: 480px;
          width: 100%;
          padding: 4rem 3rem;
          margin: 0 auto;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 3.5rem;
        }

        .auth-icon-wrapper {
          width: 64px;
          height: 64px;
          background: rgba(99, 102, 241, 0.08);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          border: 1px solid rgba(99, 102, 241, 0.15);
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.1);
        }

        .auth-title {
          font-size: 2rem;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }

        .auth-subtitle {
          color: var(--mono-40);
          font-size: 0.95rem;
          font-weight: 500;
        }

        .auth-form-element {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .input-label {
          font-size: 0.65rem;
          font-weight: 900;
          color: var(--mono-40);
          letter-spacing: 0.1em;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--mono-40);
          transition: var(--transition-smooth);
        }

        .premium-input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--mono-100);
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          outline: none;
          transition: var(--transition-smooth);
        }

        .premium-input:focus {
          border-color: var(--accent-primary);
          background: rgba(255, 255, 255, 0.04);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .premium-input:focus + .input-icon {
          color: var(--accent-primary);
        }

        .auth-message {
          padding: 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          text-align: center;
        }

        .auth-message.success {
          background: rgba(16, 185, 129, 0.1);
          color: var(--accent-emerald);
          border: 1px solid rgba(16, 185, 129, 0.1);
        }

        .auth-message.error {
          background: rgba(244, 63, 94, 0.1);
          color: var(--accent-rose);
          border: 1px solid rgba(244, 63, 94, 0.1);
        }

        .auth-toggle-btn {
          background: none;
          border: none;
          color: var(--mono-40);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .toggle-highlight {
          color: var(--accent-primary);
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .auth-toggle-btn:hover {
          color: var(--mono-100);
        }
      `}</style>
    </motion.div>
  );
}
