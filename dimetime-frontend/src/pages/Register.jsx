import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, User, Mail, Phone, Building2, Lock, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    companyName: '',
    gstNumber: '',
    address: '',
    contactPerson: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'SUPPLIER'
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { fullName, email, mobile, companyName, username, password, confirmPassword, gstNumber, address, contactPerson } = formData;

    // Front-end validations
    if (!fullName || !email || !mobile || !companyName || !username || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('https://dime-time-backend.onrender.com/api/auth/register', {
        fullName,
        email,
        mobile,
        companyName,
        username,
        password,
        confirmPassword,
        role: formData.role || 'SUPPLIER',
        gstNumber,
        address,
        contactPerson
      });

      if (response.status === 200) {
        setSuccess('Registration Successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Username or Email may already exist.');
      }
    } finally {
      setLoading(false);
    }
  };

  const registerContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#0f172a',
    padding: '2rem 1.5rem',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '680px',
    backgroundColor: '#111827',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '2.5rem 2.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 40px rgba(34, 197, 94, 0.03)',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.25rem',
  };

  return (
    <div style={registerContainerStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.25rem' }}>
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
            <UserPlus size={22} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}> Registration</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>Create DimeTime SCM Credentials</p>
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
            marginBottom: '1.5rem'
          }}>
            <ShieldCheck size={16} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={gridStyle}>
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                <input
                  type="text"
                  name="fullName"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="operator@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading} required
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                <input
                  type="text"
                  name="mobile"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="+1 (555) 000-0000"
                  value={formData.mobile}
                  onChange={handleChange}
                  disabled={loading} required maxLength={10}
                />
              </div>
            </div>

            {/* Company Name */}
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                <input
                  type="text"
                  name="companyName"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Company GST Number */}
            <div className="form-group">
              <label className="form-label">Company GST Number</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                <input
                  type="text"
                  name="gstNumber"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Enter GST number"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Contact Person */}
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                <input
                  type="text"
                  name="contactPerson"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Contact person name"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Corporate Address */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Corporate Address</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                <input
                  type="text"
                  name="address"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Corporate headquarters address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>


            {/* Account Role Dropdown */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Account Role</label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                <select
                  name="role"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', appearance: 'none', width: '100%' }}
                  value={formData.role}
                  onChange={handleChange}
                  disabled={loading}
                  required
                >
                  <option value="SUPPLIER">Supplier Portal (Procures materials, handles RFQs/POs/GRNs)</option>
                  <option value="MANUFACTURER">Manufacturer Portal (Quotes, produces, dispatches MTCs)</option>
                </select>
              </div>
            </div>

            {/* Username */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                <input
                  type="text"
                  name="username"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Create unique operator username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required

                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.75rem', height: '46px' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register Operator'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          <span>Already have an account? </span>
          <Link to="/login" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 500 }}>
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
