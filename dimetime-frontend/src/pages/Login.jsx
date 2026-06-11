import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LogIn, Key, User, ShieldAlert, CheckCircle, Mail, Clock, RefreshCw } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Recovery States
  const [recoveryMode, setRecoveryMode] = useState(null); // 'password' | 'username' | null
  const [recoveryStep, setRecoveryStep] = useState(1); // 1 | 2 | 3 | 4
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveredUsername, setRecoveredUsername] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('https://dime-time-backend.onrender.com/api/auth/login', {
        username,
        password,
      });

      if (response.status === 200 && response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        if (onLoginSuccess) {
          onLoginSuccess(response.data);
        }
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Connection failed. Verify if Spring Boot backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const endpoint = recoveryMode === 'password' 
      ? 'https://dime-time-backend.onrender.com/api/auth/forgot-password/request' 
      : 'https://dime-time-backend.onrender.com/api/auth/forgot-username/request';

    try {
      const response = await axios.post(endpoint, { email });
      setSuccess(response.data.message || 'OTP sent successfully. Check your console log.');
      setRecoveryStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (recoveryMode === 'password') {
      try {
        await axios.post('https://dime-time-backend.onrender.com/api/auth/forgot-password/verify', { email, otp });
        setSuccess('OTP verified successfully.');
        setRecoveryStep(3);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'OTP verification failed');
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const response = await axios.post('https://dime-time-backend.onrender.com/api/auth/forgot-username/verify', { email, otp });
        setRecoveredUsername(response.data.username);
        setSuccess('OTP verified successfully.');
        setRecoveryStep(3);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'OTP verification failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasNumber) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await axios.post('https://dime-time-backend.onrender.com/api/auth/forgot-password/reset', {
        email,
        otp,
        newPassword,
        confirmPassword
      });
      setSuccess('Password reset successfully.');
      setRecoveryStep(4);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const resetRecoveryFlow = () => {
    setRecoveryMode(null);
    setRecoveryStep(1);
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setRecoveredUsername('');
    setError('');
    setSuccess('');
  };

  const loginContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#0f172a',
    padding: '1.5rem',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#111827',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 40px rgba(34, 197, 94, 0.05)',
  };

  return (
    <div style={loginContainerStyle}>
      <div style={cardStyle}>
        
        {/* Normal Login Mode */}
        {!recoveryMode && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '12px',
                color: '#22c55e',
                marginBottom: '1rem'
              }}>
                <LogIn size={22} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>Login</h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>DimeTime Supply Chain Portal</p>
            </div>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: '#ef4444',
                fontSize: '0.85rem',
                marginBottom: '1.5rem'
              }}>
                <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Enter operator username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.8rem' }}>
                <span 
                  onClick={() => { setRecoveryMode('username'); setError(''); setSuccess(''); setRecoveryStep(1); }} 
                  style={{ color: '#22c55e', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Forgot Username?
                </span>
                <span 
                  onClick={() => { setRecoveryMode('password'); setError(''); setSuccess(''); setRecoveryStep(1); }} 
                  style={{ color: '#22c55e', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Forgot Password?
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1.5rem', height: '46px' }}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              <span>Don't have an account? </span>
              <Link to="/register" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 500 }}>
                Register here
              </Link>
            </div>
          </>
        )}

        {/* Forgot Password / Username Recovery Mode */}
        {recoveryMode && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '12px',
                color: '#22c55e',
                marginBottom: '1rem'
              }}>
                {recoveryMode === 'password' ? <Key size={22} /> : <User size={22} />}
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>
                {recoveryMode === 'password' ? 'Reset Password' : 'Recover Username'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Step {recoveryStep} of {recoveryMode === 'password' ? 4 : 3}
              </p>
            </div>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: '#ef4444',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: '#22c55e',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                <CheckCircle size={16} style={{ flexShrink: 0 }} />
                <span>{success}</span>
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {recoveryStep === 1 && (
              <form onSubmit={handleRequestOtp}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                    <input
                      type="email"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="operator@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1.25rem', height: '44px' }}
                  disabled={loading}
                >
                  {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                </button>
              </form>
            )}

            {/* STEP 2: Enter OTP */}
            {recoveryStep === 2 && (
              <form onSubmit={handleVerifyOtp}>
                <div className="form-group">
                  <label className="form-label">6-Digit OTP</label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem', letterSpacing: '0.25rem', fontWeight: 'bold' }}
                      placeholder="000000"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', display: 'block' }}>
                    OTP is valid for 10 minutes (maximum 3 attempts).
                  </span>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1.25rem', height: '44px' }}
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify OTP Code'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    onClick={handleRequestOtp} 
                    style={{ background: 'none', border: 'none', color: '#22c55e', textDecoration: 'underline', fontSize: '0.8rem', cursor: 'pointer' }}
                    disabled={loading}
                  >
                    Resend OTP Code
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3 (Username Recovery): Display recovered username */}
            {recoveryStep === 3 && recoveryMode === 'username' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  marginBottom: '1.5rem'
                }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Recovered Username:</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#22c55e', marginTop: '0.4rem', fontFamily: 'monospace' }}>
                    {recoveredUsername}
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem' }}>
                  A confirmation email was simulated to your inbox.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', height: '44px' }}
                  onClick={resetRecoveryFlow}
                >
                  Back to Login
                </button>
              </div>
            )}

            {/* STEP 3 (Password Recovery): Enter New Password */}
            {recoveryStep === 3 && recoveryMode === 'password' && (
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Retype password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1.25rem', height: '44px' }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Reset Password'}
                </button>
              </form>
            )}

            {/* STEP 4 (Password Recovery): Password reset success */}
            {recoveryStep === 4 && recoveryMode === 'password' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Your password has been successfully updated in the database. Old sessions have been invalidated.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', height: '44px' }}
                  onClick={resetRecoveryFlow}
                >
                  Sign In Now
                </button>
              </div>
            )}

            {/* Cancel Button (Always visible on recovery wizard) */}
            {recoveryStep < (recoveryMode === 'password' ? 4 : 3) && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '0.75rem', height: '44px' }}
                onClick={resetRecoveryFlow}
                disabled={loading}
              >
                Cancel & Return
              </button>
            )}
          </>
        )}

      </div>
    </div>
  );
}
