import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API = 'http://localhost:8000';

const HALL_TYPES = ['All', 'classroom', 'Conference hall', 'Event hall', 'Assembly hall', 'EG hall'];
const BLOCKS = ['All', 'A', 'D', 'F', 'G', 'H', 'J', 'Q', 'Y'];
const PURPOSES = [
  'Academic Class', 'Department Meeting', 'Workshop / Seminar',
  'Cultural Event', 'Technical Event', 'Exam / Test', 'Guest Lecture', 'Other'
];

function generateBookingId() {
  const ts = Date.now().toString().slice(-6);
  return `BK-${ts}`;
}

export default function NewBooking() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterBlock, setFilterBlock] = useState('All');
  const [halls, setHalls] = useState([]);
  const [loadingHalls, setLoadingHalls] = useState(false);
  const [selectedHall, setSelectedHall] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [purposeDetail, setPurposeDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const today = new Date().toISOString().split('T')[0];

  function validate() {
    if (!startDate) return 'Select start date';
    if (!endDate) return 'Select end date';
    if (endDate < startDate) return 'End date must be after start date';
    if (!startTime) return 'Select start time';
    if (!endTime) return 'Select end time';
    if (startTime >= endTime) return 'End time must be after start time';
    return null;
  }

  async function fetchAvailableHalls() {
    const err = validate();
    if (err) return setError(err);
    setError('');
    setLoadingHalls(true);
    setHalls([]);
    setSelectedHall(null);

    try {
      const res = await fetch(
        `${API}/resources/available?start_date=${startDate}&end_date=${endDate}&start=${startTime}&end=${endTime}`
      );
      const data = await res.json();
      setHalls(Array.isArray(data) ? data : []);
      setStep(2);
    } catch {
      setError('Backend connect failed. Please check if the server is running.');
    } finally {
      setLoadingHalls(false);
    }
  }

  async function handleSubmit() {
    if (!selectedHall) return setError('please select a hall');
    if (!purpose) return setError('Purpose is required');
    setError('');
    setSubmitting(true);

    try {
      const booking_id = generateBookingId();
      const res = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id,
          user_id: user.User_id,
          resource_id: selectedHall.Resource_id,
          booking_date: startDate,
          end_date: endDate,
          start_time: startTime + ':00',
          end_time: endTime + ':00',
          status: 'Pending',
          purpose: purpose + (purposeDetail ? ` - ${purposeDetail}` : '')
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Booking failed');
      }
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredHalls = halls.filter(h => {
    const typeMatch = filterType === 'All' || h.Type === filterType;
    const blockMatch = filterBlock === 'All' || h.Block === filterBlock;
    return typeMatch && blockMatch;
  });

  const availableCount = filteredHalls.filter(h => h.available).length;

  return (
    <div>
      {/* NAV */}
      <nav className="nav">
        <span className="nav-logo">🏛️ Smart Hall Booking</span>
        <div className="nav-links">
          <Link to="/home" className="nav-link">Home</Link>
          <Link to="/new-booking" className="nav-link active">New Booking</Link>
          <Link to="/my-bookings" className="nav-link">My Bookings</Link>
        </div>
        <div className="nav-user">
          <div className="nav-avatar">{user.Name?.[0] || 'U'}</div>
          <span>{user.Name}</span>
          <button className="logout-btn" onClick={() => { localStorage.removeItem('user'); navigate('/'); }}>Logout</button>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <h1>New Booking</h1>
          <p>Date, time Choose to find available halls.</p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '32px' }}>
          {['Date & Time', 'Hall Selection', 'Confirm'].map((s, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: step > i + 1 ? 'var(--success)' : step === i + 1 ? 'var(--accent)' : 'var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: 'white', fontFamily: 'Syne'
                }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: '0.85rem', fontWeight: step === i + 1 ? 600 : 400,
                  color: step === i + 1 ? 'var(--text)' : 'var(--text2)'
                }}>{s}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />}
            </React.Fragment>
          ))}
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {/* STEP 1: Date & Time */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '20px' }}>
            📅 Choose Date & Time
          </h3>

          {/* Date Row */}
          <div className="grid-2" style={{ marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={e => {
                  setStartDate(e.target.value);
                  setStep(1); setHalls([]); setSelectedHall(null);
                  // end date auto set same day if not set
                  if (!endDate) setEndDate(e.target.value);
                }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate || today}
                onChange={e => {
                  setEndDate(e.target.value);
                  setStep(1); setHalls([]); setSelectedHall(null);
                }}
              />
            </div>
          </div>

          {/* Time Row */}
          <div className="grid-2" style={{ marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => {
                  setStartTime(e.target.value);
                  setStep(1); setHalls([]);
                }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={e => {
                  setEndTime(e.target.value);
                  setStep(1); setHalls([]);
                }}
              />
            </div>
          </div>

          {/* Selected summary */}
          {startDate && endDate && startTime && endTime && (
            <div style={{
              background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
              fontSize: '0.88rem', color: 'var(--text2)', display: 'flex', gap: '20px', flexWrap: 'wrap'
            }}>
              <span>📅 <strong style={{ color: 'var(--text)' }}>{startDate}</strong> {startDate !== endDate ? `→ ${endDate}` : '(Single day)'}</span>
              <span>⏰ <strong style={{ color: 'var(--text)' }}>{startTime} – {endTime}</strong></span>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={fetchAvailableHalls}
            disabled={loadingHalls}
          >
            {loadingHalls
              ? <><span className="spinner" />Halls...</>
              : '🔍 Available Halls'}
          </button>
        </div>

        {/* STEP 2: Hall Selection */}
        {step >= 2 && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px'
            }}>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700 }}>
                🏫 Halls
                <span style={{
                  fontFamily: 'DM Sans', fontWeight: 400, fontSize: '0.85rem',
                  color: 'var(--success)', marginLeft: '10px'
                }}>
                  {availableCount} available
                </span>
                <span style={{
                  fontFamily: 'DM Sans', fontWeight: 400, fontSize: '0.85rem',
                  color: 'var(--danger)', marginLeft: '8px'
                }}>
                  · {filteredHalls.length - availableCount} booked
                </span>
              </h3>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select
                  value={filterBlock}
                  onChange={e => setFilterBlock(e.target.value)}
                  style={{
                    padding: '8px 12px', background: 'var(--surface2)',
                    border: '1px solid var(--border)', borderRadius: '8px',
                    color: 'var(--text)', fontSize: '0.85rem', outline: 'none'
                  }}
                >
                {BLOCKS.map(b => (
  <option key={b} value={b}>
    {b === 'All' ? 'All Blocks' : `Block ${b}`}
  </option>
))}
                </select>

                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  style={{
                    padding: '8px 12px', background: 'var(--surface2)',
                    border: '1px solid var(--border)', borderRadius: '8px',
                    color: 'var(--text)', fontSize: '0.85rem', outline: 'none'
                  }}
                >
                  {HALL_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '0.8rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }} />
                Available
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)' }} />
                Already Booked
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)' }} />
                Selected
              </span>
            </div>

            {filteredHalls.length === 0 ? (
              <div className="empty-state">
                <h3>Halls Not found</h3>
                <p>Filter the results to find available halls.</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                gap: '14px'
              }}>
                {filteredHalls.map(hall => (
                  <div
                    key={hall.Resource_id}
                    className={`hall-card ${!hall.available ? 'unavailable' : ''} ${selectedHall?.Resource_id === hall.Resource_id ? 'selected' : ''}`}
                    onClick={() => {
                      if (hall.available) {
                        setSelectedHall(hall);
                      }
                    }}
                    title={!hall.available ? 'This hall is already booked for the selected time slot.' : ''}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="hall-no">{hall.Hall_no}</div>
                      {hall.available
                        ? <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.15)', color: 'var(--success)', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>✓ Free</span>
                        : <span style={{ fontSize: '0.7rem', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>✗ Booked</span>
                      }
                    </div>
                    <div className="hall-type">{hall.Type}</div>
                    <div className="hall-meta">
                      <span>👥 {hall.Capacity}</span>
                      <span>🏢 {hall.Block}</span>
                      <span>F{hall.Floor_no}</span>
                    </div>
                    {hall.Amenity_name && (
                      <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--accent2)' }}>
                        ✦ {hall.Amenity_name}
                      </div>
                    )}
                    {!hall.available && (
  <div style={{ marginTop: '8px', fontSize: '0.72rem', color: 'var(--danger)', fontStyle: 'italic' }}>
    {hall.booked_reason ? `📚 ${hall.booked_reason}` : 'Time slot is already booked, please select another hall or change time/date.'}
  </div>
)}
                  </div>
                ))}
              </div>
            )}

            {/* Purpose & Confirm */}
            {selectedHall && (
              <>
                <div className="divider" />
                <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '16px' }}>
                  📝 Booking Details
                </h3>
                <div className="grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Purpose *</label>
                    <select value={purpose} onChange={e => setPurpose(e.target.value)}>
                      <option value="">Select Purpose</option>
                      {PURPOSES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Additional Details (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Department symposium briefing"
                      value={purposeDetail}
                      onChange={e => setPurposeDetail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Booking Summary Box */}
                <div style={{
                  marginTop: '20px',
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: '12px', padding: '18px 20px'
                }}>
                  <p style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '12px', fontSize: '0.9rem' }}>
                    📋 Booking Summary
                  </p>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.88rem', color: 'var(--text2)' }}>
                    <span>🏫 <strong style={{ color: 'var(--text)' }}>{selectedHall.Hall_no}</strong></span>
                    <span>🏢 <strong style={{ color: 'var(--text)' }}>Block {selectedHall.Block}</strong></span>
                    <span>📅 <strong style={{ color: 'var(--text)' }}>{startDate} {startDate !== endDate ? `→ ${endDate}` : ''}</strong></span>
                    <span>⏰ <strong style={{ color: 'var(--text)' }}>{startTime} – {endTime}</strong></span>
                    <span>👥 <strong style={{ color: 'var(--text)' }}>Capacity: {selectedHall.Capacity}</strong></span>
                    <span>🏷️ <strong style={{ color: 'var(--text)' }}>{selectedHall.Type}</strong></span>
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting
                      ? <><span className="spinner" />Submitting...</>
                      : '✅ Confirm Booking'}
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => { setSelectedHall(null); setPurpose(''); setPurposeDetail(''); }}
                  >
                    Clear
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 3: Success */}
        {step === 3 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, marginBottom: '8px' }}>
              Booking Submitted!
            </h2>
            <p style={{ color: 'var(--text2)', marginBottom: '8px' }}>
              Hall: <strong style={{ color: 'var(--text)' }}>{selectedHall?.Hall_no}</strong> |
              Block: <strong style={{ color: 'var(--text)' }}> {selectedHall?.Block}</strong>
            </p>
            <p style={{ color: 'var(--text2)', marginBottom: '28px' }}>
              Status: <strong style={{ color: 'var(--warn)' }}>⏳ Pending</strong> —
              Block {selectedHall?.Block} Wait to Admin approval.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link to="/my-bookings">
                <button className="btn btn-primary">My Bookings</button>
              </Link>
              <button className="btn btn-outline" onClick={() => {
                setStep(1); setStartDate(''); setEndDate('');
                setStartTime(''); setEndTime('');
                setHalls([]); setSelectedHall(null);
                setPurpose(''); setPurposeDetail(''); setError('');
              }}>
                To Book Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}