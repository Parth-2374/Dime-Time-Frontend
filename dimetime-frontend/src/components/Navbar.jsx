import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Shield, Building2, Bell, BellOff } from 'lucide-react';

export default function Navbar({ user }) {
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const username = user?.username || '';

  useEffect(() => {
    if (username) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
      
      const handleCustomRefresh = () => {
        fetchNotifications();
      };
      window.addEventListener('refresh-notifications', handleCustomRefresh);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('refresh-notifications', handleCustomRefresh);
      };
    }
  }, [username]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`https://dime-time-backend.onrender.com/api/notifications?username=${username}&unreadOnly=true`);
      if (response.data) {
        setNotifications(response.data);
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`https://dime-time-backend.onrender.com/api/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  // Map route paths to page titles
  const getPageTitle = (path) => {
    switch (path) {
      case '/dashboard':
        return 'System Overview';
      case '/material-upload':
        return 'Goods Receipt: Material Upload';
      case '/mtc-upload':
        return 'AI MTC Certificate Generator';
      case '/mtc-reports':
        return 'Material Traceability: MTC Reports';
      case '/verification':
        return 'AI 3-Way Reconciliation';
      case '/grn':
        return 'Goods Receipt Note Management';
      case '/audit-trail':
        return 'Audit Logs & Verification Timeline';
      case '/profile':
        return 'Operator Profile & Settings';
      case '/rfqs':
        return 'RFQ Requests & Procurement';
      case '/quotations':
        return 'Quotation Management';
      case '/purchase-orders':
        return 'Purchase Order Tracking';
      case '/production':
        return 'Manufacturer Production Queue';
      case '/dispatches':
        return 'Dispatch Tracking & Logistics';
      case '/admin-panel':
        return 'System User Registry & Controls';
      default:
        return 'DimeTime Dashboard';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'OP';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const navbarStyle = {
    height: '70px',
    borderBottom: '1px solid #1e293b',
    padding: '0 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    flexShrink: 0,
    zIndex: 90,
    position: 'relative'
  };

  const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#ffffff',
  };

  const userSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  };

  const companyPillStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.75rem',
    color: '#94a3b8',
    backgroundColor: '#1e293b',
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #334155',
  };

  const profilePillStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
  };

  const avatarStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1.5px solid #22c55e',
    color: '#22c55e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontWeight: 600,
    boxShadow: '0 0 10px rgba(34, 197, 94, 0.1)'
  };

  const detailsStyle = {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'right',
  };

  const bellContainerStyle = {
    position: 'relative',
    cursor: 'pointer',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.4rem',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    backgroundColor: 'rgba(255, 255, 255, 0.02)'
  };

  const bellBadgeStyle = {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: '0.65rem',
    fontWeight: 700,
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px solid #0f172a'
  };

  const dropdownStyle = {
    position: 'absolute',
    top: '60px',
    right: '200px',
    width: '320px',
    maxHeight: '380px',
    backgroundColor: '#111827',
    border: '1px solid #334155',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    overflowY: 'auto',
    padding: '0.75rem 0'
  };

  return (
    <nav style={navbarStyle}>
      <div style={titleStyle}>{getPageTitle(location.pathname)}</div>

      <div style={userSectionStyle}>
        {/* Notification Bell */}
        {user && (
          <div 
            style={bellContainerStyle} 
            onClick={() => setShowDropdown(!showDropdown)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
          >
            <Bell size={20} style={{ color: notifications.length > 0 ? '#22c55e' : '#94a3b8' }} />
            {notifications.length > 0 && (
              <span style={bellBadgeStyle}>{notifications.length}</span>
            )}
          </div>
        )}

        {/* Notifications Dropdown */}
        {showDropdown && (
          <div style={dropdownStyle}>
            <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #1e293b', fontWeight: 600, color: '#ffffff', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>SCM System Alerts</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{notifications.length} Unread</span>
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                <BellOff size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                <span>No new alerts</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => handleMarkAsRead(notif.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                    fontSize: '0.8rem',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ lineHeight: '1.4' }}>{notif.message}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.35rem' }}>
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Click to Clear
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {user && user.companyName && (
          <div style={companyPillStyle}>
            <Building2 size={12} />
            <span>{user.companyName}</span>
          </div>
        )}

        {user && (
          <div style={profilePillStyle}>
            <div style={detailsStyle}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#f8fafc' }}>
                {user.fullName || 'Operator'}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' }}>
                <Shield size={10} style={{ color: user.role === 'ADMIN' ? '#22c55e' : '#3b82f6' }} />
                {user.role || 'USER'}
              </span>
            </div>
            <div style={avatarStyle}>{getInitials(user.fullName)}</div>
          </div>
        )}
      </div>
    </nav>
  );
}
