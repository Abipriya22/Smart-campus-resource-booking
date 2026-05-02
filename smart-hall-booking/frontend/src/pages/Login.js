import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8000';

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function PasswordFields({ password, setPassword, confirmPw, setConfirmPw, showPw, setShowPw }) {
  const pwStrength = getPasswordStrength(password);
  const pwLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <>
      <div className="form-group">
        <label>New Password</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Min 8 chars, uppercase, number, symbol"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ paddingRight: '48px' }}
            autoFocus
          />
          <button type="button" onClick={() => setShowPw(!showPw)} style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: '1rem'
          }}>{showPw ? '🙈' : '👁️'}</button>
        </div>
        {password.length > 0 && (
          <div className="pw-strength">
            <div className="pw-bars">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`pw-bar ${
                  i <= pwStrength
                    ? pwStrength <= 1 ? 'active-weak'
                    : pwStrength <= 2 ? 'active-medium'
                    : 'active-strong'
                    : ''
                }`} />
              ))}
            </div>
            <span className="pw-label">{pwLabels[pwStrength]}</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Confirm Password</label>
        <input
          type={showPw ? 'text' : 'password'}
          placeholder="Re-enter your password"
          value={confirmPw}
          onChange={e => setConfirmPw(e.target.value)}
        />
        {confirmPw.length > 0 && password !== confirmPw && (
          <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '4px' }}>
            ⚠️ Passwords do not match
          </p>
        )}
      </div>
    </>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');

  // 'id_entry' | 'login' | 'set_password' | 'forgot'
  const [mode, setMode] = useState('id_entry');

  const pwStrength = getPasswordStrength(password);
  const pwLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  function resetAll() {
    setId(''); setPassword(''); setConfirmPw('');
    setMode('id_entry'); setError(''); setUserName('');
  }

  // PHASE 1: Check if ID exists
  async function handleIdSubmit(e) {
    e.preventDefault();
    if (!id.trim()) return setError('Please enter your ID');
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/check/${role}/${id.trim()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'ID not found in system');
      }
      const data = await res.json();
      setUserName(data.name);
      if (!data.has_password) {
        setMode('set_password'); // First time → set password
      } else {
        setMode('login'); // Already registered → login
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // PHASE 2a: First time - Set Password
  async function handleSetPassword(e) {
    e.preventDefault();
    if (pwStrength < 3) return setError('Password is too weak. Use uppercase, number & symbol');
    if (password !== confirmPw) return setError('Passwords do not match');
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/set-password/${role}/${id.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!res.ok) throw new Error('Failed to set password');
      // Auto login after setting password
      await doLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // PHASE 2b: Login with password
  async function handleLogin(e) {
    e.preventDefault();
    if (!password) return setError('Please enter your password');
    setError(''); setLoading(true);
    try {
      await doLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Core login function
  async function doLogin() {
    const res = await fetch(`${API}/login/${role}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id.trim(), password })
    });
    if (!res.ok) {
      const err = await res.json();
      if (err.detail === 'Wrong password') throw new Error('Incorrect password. Try again.');
      throw new Error(err.detail || 'Login failed');
    }
    const user = await res.json();
    localStorage.setItem('user', JSON.stringify({ ...user, type: role }));
    window.location.href = role === 'admin' ? '/admin' : '/home';
  }

  // PHASE 3: Forgot password - reset
  async function handleForgotPassword(e) {
    e.preventDefault();
    if (pwStrength < 3) return setError('Password is too weak. Use uppercase, number & symbol');
    if (password !== confirmPw) return setError('Passwords do not match');
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/set-password/${role}/${id.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!res.ok) throw new Error('Failed to reset password');
      await doLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: '24px',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute', top: '-200px', right: '-200px',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-150px', left: '-150px',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            borderRadius: '16px', marginBottom: '16px', fontSize: '24px'
          }}>🏛️</div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.5px' }}>
            Smart Hall Booking
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginTop: '6px' }}>
            PSG College of Technology
          </p>
        </div>

        <div className="card">

          {/* Role Toggle - only in id_entry mode */}
          {mode === 'id_entry' && (
            <div className="tabs" style={{ marginBottom: '24px' }}>
              <button className={`tab ${role === 'student' ? 'active' : ''}`}
                onClick={() => { setRole('student'); resetAll(); }}>
                🎓 Student
              </button>
              <button className={`tab ${role === 'admin' ? 'active' : ''}`}
                onClick={() => { setRole('admin'); resetAll(); }}>
                🛡️ Admin
              </button>
            </div>
          )}

          {/* User info strip - after ID confirmed */}
          {userName && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', background: 'var(--surface2)',
              borderRadius: '10px', marginBottom: '20px'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: role === 'admin'
                  ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                  : 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', color: 'white'
              }}>{userName[0]}</div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{userName}</p>
                <p style={{ color: 'var(--text2)', fontSize: '0.78rem' }}>{id} · {role === 'admin' ? 'Administrator' : 'Student'}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>⚠️ {error}</div>
          )}

          {/* ── PHASE 1: Enter ID ── */}
          {mode === 'id_entry' && (
            <form onSubmit={handleIdSubmit}>
              <div className="form-group">
                <label>{role === 'student' ? 'Roll Number' : 'Admin ID'}</label>
                <input
                  type="text"
                  placeholder={role === 'student' ? 'e.g. 24Z202' : 'e.g. ADM-001'}
                  value={id}
                  onChange={e => setId(e.target.value.toUpperCase())}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
                disabled={loading}>
                {loading ? <><span className="spinner" />Checking...</> : 'Continue →'}
              </button>
            </form>
          )}

          {/* ── PHASE 2a: Set Password (First time) ── */}
          {mode === 'set_password' && (
            <form onSubmit={handleSetPassword}>
              <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                👋 First time login! Set a strong password to continue.
              </div>
              <PasswordFields
                password={password} setPassword={setPassword}
                confirmPw={confirmPw} setConfirmPw={setConfirmPw}
                showPw={showPw} setShowPw={setShowPw}
              />
              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
                disabled={loading}>
                {loading ? <><span className="spinner" />Setting password...</> : '🔐 Set Password & Login'}
              </button>
              <button type="button" className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                onClick={resetAll}>← Back
              </button>
            </form>
          )}

          {/* ── PHASE 2b: Login with Password ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingRight: '48px' }}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: '1rem'
                  }}>{showPw ? '🙈' : '👁️'}</button>
                </div>
                {password.length > 0 && (
                  <div className="pw-strength">
                    <div className="pw-bars">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`pw-bar ${
                          i <= pwStrength
                            ? pwStrength <= 1 ? 'active-weak'
                            : pwStrength <= 2 ? 'active-medium'
                            : 'active-strong'
                            : ''
                        }`} />
                      ))}
                    </div>
                    <span className="pw-label">{pwLabels[pwStrength]}</span>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
                disabled={loading}>
                {loading ? <><span className="spinner" />Signing in...</> : `Sign In as ${role === 'student' ? 'Student' : 'Admin'} →`}
              </button>

              <button type="button"
                onClick={() => { setMode('forgot'); setPassword(''); setConfirmPw(''); }}
                style={{
                  width: '100%', marginTop: '12px', background: 'none', border: 'none',
                  color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline'
                }}>
                Forgot Password?
              </button>

              <button type="button" className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                onClick={resetAll}>← Back
              </button>
            </form>
          )}

          {/* ── PHASE 3: Forgot Password ── */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword}>
              <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                🔑 Reset password for <strong>{userName}</strong>
              </div>
              <PasswordFields
                password={password} setPassword={setPassword}
                confirmPw={confirmPw} setConfirmPw={setConfirmPw}
                showPw={showPw} setShowPw={setShowPw}
              />
              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
                disabled={loading}>
                {loading ? <><span className="spinner" />Resetting...</> : '🔐 Reset Password & Login'}
              </button>
              <button type="button" className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                onClick={() => { setMode('login'); setPassword(''); setConfirmPw(''); }}>
                ← Back to Login
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text3)', marginTop: '20px' }}>
            Use your college-assigned ID to login
          </p>
        </div>
      </div>
    </div>
  );
}