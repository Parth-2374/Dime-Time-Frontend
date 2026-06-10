import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  FileCode,
  ShieldCheck,
  ClipboardCheck,
  Activity,
  User,
  LogOut,
  Layers,
  Calculator,
  FileText,
  PlusCircle,
  Briefcase,
  Truck,
  Users,
  Sliders,
  TrendingUp,
  BarChart2,
  Settings,
  HelpCircle,
  Receipt,
  CreditCard
} from 'lucide-react';

export default function Sidebar({ user, onLogout, features = [] }) {
  const navigate = useNavigate();

  let menuItems = [];
  const role = user?.role || 'SUPPLIER';

  if (role === 'ADMIN') {
    menuItems = [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'User Management', path: '/admin-panel', icon: Users },
      { name: 'Purchase Orders', path: '/purchase-orders', icon: Briefcase },
      { name: 'Material OCR', path: '/material-upload', icon: Upload },
      { name: 'MTC Verification', path: '/mtc-upload', icon: FileCode },
      // { name: 'Match Analytics', path: '/verification', icon: ShieldCheck },
      { name: 'GRN Registry', path: '/grn', icon: ClipboardCheck },
      { name: 'Invoice Management', path: '/invoices', icon: Receipt },
      { name: 'Payment Management', path: '/payments', icon: CreditCard },
      { name: 'Audit Logs', path: '/audit-trail', icon: Activity },
      { name: 'Plate Calculator', path: '/plate-calculator', icon: Calculator },
      { name: 'Master Templates', path: '/master-data', icon: Sliders },
      { name: 'Supplier Performance', path: '/supplier-performance', icon: TrendingUp },
      { name: 'Manufacturer Performance', path: '/manufacturer-performance', icon: BarChart2 },
      { name: 'Reports Center', path: '/reports-center', icon: FileText },
      { name: 'System Settings', path: '/system-settings', icon: Settings },
      { name: 'Feature Requests', path: '/feature-requests', icon: HelpCircle },
      { name: 'Feature Manager', path: '/feature-manager', icon: Sliders },
      { name: 'Profile', path: '/profile', icon: User }
    ];
  } else if (role === 'MANUFACTURER') {
    menuItems = [
      { name: 'Manufacturer Portal', path: '/dashboard', icon: LayoutDashboard },
      { name: 'RFQ Requests', path: '/rfqs', icon: FileText },
      { name: 'Quotation Management', path: '/quotations', icon: PlusCircle },
      { name: 'Purchase Orders', path: '/purchase-orders', icon: Briefcase },
      { name: 'Production Queue', path: '/production', icon: ClipboardCheck },
      { name: 'AI MTC Certificate Generator', path: '/mtc-upload', icon: FileCode },
      { name: 'Dispatch Management', path: '/dispatches', icon: Truck },
      { name: 'Invoice Management', path: '/invoices', icon: Receipt },
      { name: 'Payment Management', path: '/payments', icon: CreditCard },
      { name: 'Profile', path: '/profile', icon: User },
    ];
  } else {
    // SUPPLIER or default USER
    menuItems = [
      { name: 'Supplier Portal', path: '/dashboard', icon: LayoutDashboard },
      { name: 'RFQ Management', path: '/rfqs', icon: FileText },
      { name: 'Quotation Compare', path: '/quotations', icon: PlusCircle },
      { name: 'Purchase Orders', path: '/purchase-orders', icon: Briefcase },
      { name: 'Order Tracking', path: '/dispatches', icon: Truck },
      { name: 'Material Receipt OCR', path: '/material-upload', icon: Upload },
      { name: 'MTC Reports', path: '/mtc-reports', icon: FileCode },
      { name: 'AI Reconciliation', path: '/verification', icon: ShieldCheck },
      { name: 'GRN Management', path: '/grn', icon: ClipboardCheck },
      { name: 'Invoice Management', path: '/invoices', icon: Receipt },
      { name: 'Payment Management', path: '/payments', icon: CreditCard },
      { name: 'Plate Calculator', path: '/plate-calculator', icon: Calculator },
      { name: 'Profile', path: '/profile', icon: User },
    ];
  }

  // Filter menu items by active feature toggles (for all roles)
  let finalMenuItems = menuItems;
  if (features && features.length > 0) {
    finalMenuItems = menuItems.filter(item => {
      const match = features.find(f => f.name.toLowerCase() === item.name.toLowerCase());
      if (match) {
        return match.status === 'ENABLED';
      }
      return true;
    });
  }

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const sidebarStyle = {
    width: '260px',
    backgroundColor: '#0b0f19',
    borderRight: '1px solid #1e293b',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    zIndex: 100
  };

  const headerStyle = {
    padding: '1.75rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '8px',
    color: '#22c55e',
  };

  const logoTextStyle = {
    fontSize: '1.2rem',
    fontWeight: 700,
    letterSpacing: '0.03em',
    color: '#ffffff',
  };

  const versionStyle = {
    fontSize: '0.65rem',
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    fontWeight: 500,
  };

  const navListStyle = {
    listStyle: 'none',
    padding: '1.5rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    flex: 1,
    overflowY: 'auto'
  };

  const footerStyle = {
    padding: '1rem 0.75rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.03)',
  };

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>
        <div style={logoStyle}>
          <Layers size={18} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={logoTextStyle}>DimeTime</span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            SCM Automation <span style={versionStyle}>MVP</span>
          </span>
        </div>
      </div>

      <ul style={navListStyle}>
        {finalMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.name}>
              <NavLink
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  backgroundColor: isActive ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(34, 197, 94, 0.15)' : '1px solid transparent',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 500 : 400,
                  transition: 'all 0.2s ease',
                })}
                className={({ isActive }) => isActive ? 'active-nav-link' : ''}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>

      <div style={footerStyle}>
        <button
          onClick={handleLogoutClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            color: '#ef4444',
            backgroundColor: 'transparent',
            border: 'none',
            textDecoration: 'none',
            fontSize: '0.9rem',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
