import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API = 'http://localhost:8000';

export default function StudentProfile() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/profile/student/${user.User_id}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user.User_id]);

  function logout() { localStorage.removeItem('user'); navigate('/'); }

  return (
    <div>
      <nav className="nav">
        <span className="nav-logo">🏛️ Smart Hall Booking</span>
        <div className="nav-links">
          <Link to="/home" className="nav-link">Home</Link>
          <Link to="/new-booking" className="nav-link">New Booking</Link>
          <Link to="/my-bookings" className="nav-link">My Bookings</Link>
          <Link to="/profile" className="nav-link active">Profile</Link>
        </div>
        <div className="nav-user">
          <div className="nav-avatar">{user.Name?.[0] || 'U'}</div>
          <span>{user.Name}</span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <h1>My Profile</h1>
          <p>Your account details and booking statistics</p>
        </div>

        {loading ? (
          <div className="loading"><span className="spinner" />Loading...</div>
        ) : profile ? (
          <div>
            {/* Profile Card */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', fontFamily: 'Syne', fontWeight: 800, color: 'white',
                  flexShrink: 0
                }}>
                  {profile.Name?.[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.6rem', marginBottom: '4px' }}>{profile.Name}</h2>
                  <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>{profile.Email}</p>
                </div>
                <div style={{
                  padding: '8px 16px', background: 'rgba(59,130,246,0.15)',
                  borderRadius: '8px', color: 'var(--accent)',
                  fontFamily: 'Syne', fontWeight: 700, fontSize: '0.85rem'
                }}>
                  🎓 {profile.User_type}
                </div>
              </div>

              <div className="divider" />

              <div className="grid-2">
                {[
                  ['Roll Number', profile.User_id, '🪪'],
                  ['Department', profile.Department, '🏛️'],
                  ['Email', profile.Email, '📧'],
                  ['User Type', profile.User_type, '👤'],
                ].map(([label, value, icon]) => (
                  <div key={label} style={{
                    padding: '16px', background: 'var(--surface2)',
                    borderRadius: '10px', border: '1px solid var(--border)'
                  }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {icon} {label}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Stats */}
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '16px' }}>Booking Statistics</h3>
            <div className="grid-4" style={{ marginBottom: '24px' }}>
              <div className="stat-card cyan"><div className="stat-label">Total</div><div className="stat-value">{profile.total_bookings || 0}</div></div>
              <div className="stat-card green"><div className="stat-label">Approved</div><div className="stat-value">{profile.approved || 0}</div></div>
              <div className="stat-card amber"><div className="stat-label">Pending</div><div className="stat-value">{profile.pending || 0}</div></div>
              <div className="stat-card blue"><div className="stat-label">Rejected</div><div className="stat-value">{profile.rejected || 0}</div></div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/new-booking"><button className="btn btn-primary">+ New Booking</button></Link>
              <Link to="/my-bookings"><button className="btn btn-outline">View All Bookings</button></Link>
            </div>
          </div>
        ) : (
          <div className="card"><div className="empty-state"><h3>Profile not found</h3></div></div>
        )}
      </div>
    </div>
  );
}
