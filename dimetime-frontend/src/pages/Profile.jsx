import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Shield, Building, Mail, Phone, Key, ShieldCheck, Lock } from 'lucide-react';

export default function Profile({ user, onLogout }) {
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // State for username change
  const [newUsername, setNewUsername] = useState('');
  const [confirmUsername, setConfirmUsername] = useState('');
  const [usernameMsg, setUsernameMsg] = useState(null);

  // State for password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await axios.get('http://localhost:8080/api/users/profile');
      setProfileData(res.data);
      setFetchError(null);
    } catch (err) {
      console.error("Failed to fetch profile", err);
      setFetchError(err.response?.data?.message || err.message || 'Failed to fetch profile data');
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const profileDetails = {
    username: profileData?.username || user?.username || '',
    email: profileData?.email || user?.email || '',
    mobileNumber: profileData?.mobileNumber || user?.mobileNumber || '',
    companyName: profileData?.companyName || user?.companyName || '',
    role: profileData?.role || user?.role || 'USER',
    fullName: user?.fullName || profileData?.username || 'SCM User'
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const infoRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    padding: '1rem 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  };

  const infoLabelStyle = {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: '#94a3b8',
    width: '140px',
    flexShrink: 0,
    fontWeight: 500,
    letterSpacing: '0.05em'
  };

  const handleStartEdit = () => {
    setEditEmail(profileDetails.email || '');
    setEditMobile(profileDetails.mobileNumber || '');
    setEditError(null);
    setEditSuccess(null);
    setIsEditing(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(null);

    // Validate email format
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/;
    if (!editEmail.trim() || !emailRegex.test(editEmail)) {
      setEditError('Invalid email format.');
      return;
    }

    // Validate mobile number: 10 digit minimum (digits only count)
    const digitsOnly = editMobile.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setEditError('Mobile number must be at least 10 digits.');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await axios.put('http://localhost:8080/api/users/profile', {
        email: editEmail,
        mobileNumber: editMobile
      });
      setProfileData(res.data); // Update frontend state
      
      // Update local storage user object so it stays in sync
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          parsed.email = res.data.email;
          parsed.mobileNumber = res.data.mobileNumber;
          localStorage.setItem('user', JSON.stringify(parsed));
        } catch (e) {}
      }

      setEditSuccess('Profile updated successfully.');
      setTimeout(() => {
        setIsEditing(false);
        setEditSuccess(null);
      }, 1000);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangeUsername = async (e) => {
    e.preventDefault();
    setUsernameMsg(null);

    if (newUsername.length < 5) {
      setUsernameMsg({ text: 'Username must be at least 5 characters long.', isError: true });
      return;
    }

    if (newUsername !== confirmUsername) {
      setUsernameMsg({ text: 'Confirm username does not match.', isError: true });
      return;
    }

    try {
      await axios.put('http://localhost:8080/api/users/change-username', {
        newUsername,
        confirmUsername
      });
      setUsernameMsg({ text: 'Username updated successfully. Requiring re-login...', isError: false });
      setTimeout(() => {
        if (onLogout) onLogout();
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update username';
      setUsernameMsg({ text: errorMsg, isError: true });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'New password must be at least 8 characters long.', isError: true });
      return;
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasNumber) {
      setPasswordMsg({ text: 'New password must contain at least one uppercase letter, one lowercase letter, and one number.', isError: true });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ text: 'Confirm password does not match.', isError: true });
      return;
    }

    try {
      await axios.put('http://localhost:8080/api/users/change-password', {
        oldPassword,
        newPassword,
        confirmPassword: confirmNewPassword
      });
      setPasswordMsg({ text: 'Password changed successfully. Requiring re-login...', isError: false });
      setTimeout(() => {
        if (onLogout) onLogout();
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to change password';
      setPasswordMsg({ text: errorMsg, isError: true });
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '750px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>Operator Configuration</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Authorized security levels, profile details, and role specifications.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Profile Card Banner */}
        <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem' }}>
          <div style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            border: '2px solid #22c55e',
            color: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
            boxShadow: '0 0 15px rgba(34, 197, 94, 0.2)'
          }}>
            {getInitials(profileDetails.fullName)}
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>{profileDetails.fullName}</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Building size={12} />
              <span>{profileDetails.companyName}</span>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span className={`badge ${profileDetails.role === 'ADMIN' ? 'badge-success' : 'badge-info'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
                <Shield size={10} />
                <span>{profileDetails.role} Permissions</span>
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Info Panel */}
        {!isEditing ? (
          <div className="premium-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                Account Specifications
              </h3>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={handleStartEdit}
              >
                <span>Edit Profile</span>
              </button>
            </div>

            {fetchError && (
              <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem 1rem', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {fetchError}
              </div>
            )}

            <div style={infoRowStyle}>
              <div style={infoLabelStyle}>Username</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
                <User size={14} style={{ color: '#22c55e' }} />
                <span>{profileDetails.username}</span>
              </div>
            </div>

            <div style={infoRowStyle}>
              <div style={infoLabelStyle}>Email Address</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
                <Mail size={14} style={{ color: '#22c55e' }} />
                <span style={{ color: profileDetails.email ? '#ffffff' : '#64748b' }}>
                  {profileDetails.email || "Not Configured"}
                </span>
              </div>
            </div>

            <div style={infoRowStyle}>
              <div style={infoLabelStyle}>Mobile Contact</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
                <Phone size={14} style={{ color: '#22c55e' }} />
                <span style={{ color: profileDetails.mobileNumber ? '#ffffff' : '#64748b' }}>
                  {profileDetails.mobileNumber || "Not Configured"}
                </span>
              </div>
            </div>

            <div style={infoRowStyle}>
              <div style={infoLabelStyle}>Affiliated Corporation</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
                <Building size={14} style={{ color: '#22c55e' }} />
                <span>{profileDetails.companyName}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.75rem' }}>
              Account Specifications (Edit Profile)
            </h3>

            {editError && (
              <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem 1rem', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {editError}
              </div>
            )}
            {editSuccess && (
              <div style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.08)', padding: '0.75rem 1rem', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {editSuccess}
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Username (Readonly)</label>
                <input type="text" className="form-input" value={profileDetails.username} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Role (Readonly)</label>
                <input type="text" className="form-input" value={profileDetails.role} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Mobile Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editMobile} 
                  onChange={(e) => setEditMobile(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                  <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={savingProfile}>
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Change Username Section */}
        {profileDetails.role !== 'ADMIN' && (
          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.75rem' }}>
              Account Settings (Change Username)
            </h3>
            {usernameMsg && (
              <div style={{ color: usernameMsg.isError ? '#ef4444' : '#22c55e', backgroundColor: usernameMsg.isError ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)', padding: '0.75rem 1rem', border: `1px solid ${usernameMsg.isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`, borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {usernameMsg.text}
              </div>
            )}
            <form onSubmit={handleChangeUsername} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Current Username</label>
                <input type="text" className="form-input" value={profileDetails.username} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.8rem' }}>New Username</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Minimum 5 characters" 
                  value={newUsername} 
                  onChange={(e) => setNewUsername(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Confirm Username</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Retype new username" 
                  value={confirmUsername} 
                  onChange={(e) => setConfirmUsername(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                <span>Update Username</span>
              </button>
            </form>
          </div>
        )}

        {/* Change Password Section */}
        {profileDetails.role !== 'ADMIN' && (
          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.75rem' }}>
              Security Settings (Change Password)
            </h3>
            {passwordMsg && (
              <div style={{ color: passwordMsg.isError ? '#ef4444' : '#22c55e', backgroundColor: passwordMsg.isError ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)', padding: '0.75rem 1rem', border: `1px solid ${passwordMsg.isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`, borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {passwordMsg.text}
              </div>
            )}
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Old Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter current password" 
                  value={oldPassword} 
                  onChange={(e) => setOldPassword(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.8rem' }}>New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Retype new password" 
                  value={confirmNewPassword} 
                  onChange={(e) => setConfirmNewPassword(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                <span>Update Password</span>
              </button>
            </form>
          </div>
        )}

        {/* Permissions list */}
        <div className="premium-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.75rem' }}>
            Authorized SCM Access Clearances
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <ShieldCheck size={16} style={{ color: '#22c55e' }} />
              <span>Submit Goods Receipt Image Uploads</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <ShieldCheck size={16} style={{ color: '#22c55e' }} />
              <span>Run AI OCR Extraction Models</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <ShieldCheck size={16} style={{ color: '#22c55e' }} />
              <span>Submit Mill Test Certificates (MTC)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <ShieldCheck size={16} style={{ color: '#22c55e' }} />
              <span>Verify Alloy Chemistry Composition</span>
            </div>

            {profileDetails.role === 'ADMIN' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <ShieldCheck size={16} style={{ color: '#22c55e' }} />
                  <span>Execute 3-Way Reconciliation Audit</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <ShieldCheck size={16} style={{ color: '#22c55e' }} />
                  <span>Generate Sequential GRN Documents</span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
