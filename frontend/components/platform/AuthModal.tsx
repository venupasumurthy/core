'use client';
import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onLogin: (userName: string) => void;
}

export default function AuthModal({ isOpen, onLogin }: Props) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('operator@core.fleet');
  const [password, setPassword] = useState('••••••••');
  const [name, setName] = useState('Chief Fleet Commander');
  const [showForgot, setShowForgot] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(name || 'Fleet Operator');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(5, 7, 15, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="glass glow"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '36px 32px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: 20,
          position: 'relative',
        }}
      >
        {/* Logo / Badge */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 14px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 800,
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(6, 182, 212, 0.35)',
            }}
          >
            C
          </div>
          <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: '#38bdf8', textTransform: 'uppercase', marginBottom: 4 }}>
            CORE · Coordination & Optimization for Robotic Execution
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc' }}>
            {showForgot ? 'Reset Password' : isSignUp ? 'Create Operator Account' : 'Fleet Command Access'}
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Autonomous Multi-Agent Robot Fleet Coordination Platform
          </p>
        </div>

        {showForgot ? (
          <div>
            <p style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 16, lineHeight: 1.5 }}>
              Enter your enterprise email to receive secure recovery instructions.
            </p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="operator@core.fleet"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                marginBottom: 16,
                outline: 'none',
              }}
            />
            <button
              className="btn btn-primary"
              onClick={() => {
                alert('Password reset instructions sent to ' + email);
                setShowForgot(false);
              }}
            >
              Send Reset Link
            </button>
            <button
              className="btn btn-ghost"
              style={{ marginTop: 8 }}
              onClick={() => setShowForgot(false)}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isSignUp && (
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Commander Sarah Chen"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, color: '#94a3b8' }}>Security Key / Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: 11, cursor: 'pointer' }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '12px', marginTop: 6 }}>
              {isSignUp ? '✨ Register & Launch' : '🚀 Enter Command Center'}
            </button>

            {/* Quick 1-Click Demo Button */}
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <button
                type="button"
                onClick={() => onLogin('Lead Operations Specialist')}
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px dashed #6366f1',
                  color: '#a5b4fc',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                ⚡ 1-Click Demo Access (Judges & Evaluators)
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#64748b' }}>
              {isSignUp ? 'Already have an account? ' : "Don't have credentials? "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 600, cursor: 'pointer' }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
