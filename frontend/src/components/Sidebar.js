import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SessionTimer from './SessionTimer';
import Icon from './Icons';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <Icon name="shield" size={18} color="var(--accent-hover)" />
          <h1>Obelisk</h1>
        </div>
        <p>Secret Protection System</p>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Navigation</span>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Icon name="grid" size={16} /> Dashboard
        </NavLink>
        <NavLink to="/secrets" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Icon name="lock" size={16} /> Trade Secrets
        </NavLink>
        <NavLink to="/logs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Icon name="logs" size={16} /> Activity Logs
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <SessionTimer />
        <div className="user-row">
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div>
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          <Icon name="logout" size={13} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
