import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [view, setView] = useState('LANDING'); // 'LANDING', 'USER', or 'ADMIN'
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  // Data
  const [queue, setQueue] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Form State
  const [patientName, setPatientName] = useState('');
  const [requestedPriority, setRequestedPriority] = useState('NORMAL');
  const [slotTime, setSlotTime] = useState('');

  // Auto-detect environment: If running on a dev port (like 5173 or 5174), point to backend 8080.
  // If running on 8080 (production build), use relative paths.
  const API_BASE = (window.location.port && window.location.port !== '8080') ? 'http://localhost:8080' : '';

  // Load Data
  useEffect(() => {
    fetchEquipment();
    const interval = setInterval(() => {
      fetchEquipment(); // Periodically sync equipment status (IN_USE vs AVAILABLE)
      if (view === 'ADMIN') fetchPendingRequests();
      if (selectedEquipment) fetchQueue(selectedEquipment.id);
    }, 2000);
    return () => clearInterval(interval);
  }, [view, selectedEquipment]);

  const fetchEquipment = () => {
    fetch(`${API_BASE}/api/equipment`)
      .then(res => res.json())
      .then(data => setEquipment(data));
  };

  const fetchQueue = (id) => {
    fetch(`${API_BASE}/api/queue/${id}`)
      .then(res => res.json())
      .then(data => setQueue(data));
  };

  const fetchPendingRequests = () => {
    fetch(`${API_BASE}/api/bookings/pending`)
      .then(res => res.json())
      .then(data => setPendingRequests(data));
  };

  const handleRequestBooking = (e) => {
    e.preventDefault();
    if (!selectedEquipment) return alert('Please select a piece of equipment first.');

    // Simple Date Validation
    const selectedDate = new Date(slotTime);
    const now = new Date();
    if (selectedDate < now) {
      return alert('Error: You cannot book a slot in the past. Please select a future time.');
    }

    const booking = {
      patientName,
      requestedPriority,
      equipmentId: selectedEquipment.id,
      slotTime: slotTime
    };

    fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    })
      .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.message || 'Error') });
        return res.json();
      })
      .then(() => {
        alert('Success! Your request has been sent to the Triage team.');
        setPatientName('');
        setSlotTime('');
      })
      .catch(err => alert(err.message));
  };

  const handleApprove = (bookingId, assignedPriority) => {
    fetch(`${API_BASE}/api/bookings/${bookingId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedPriority })
    })
      .then(res => res.json())
      .then(() => {
        fetchPendingRequests();
        if (selectedEquipment) fetchQueue(selectedEquipment.id);
      });
  };

  const handleCallNext = () => {
    if (!selectedEquipment) return;
    fetch(`${API_BASE}/api/queue/${selectedEquipment.id}/next`, { method: 'POST' })
      .then(res => {
        if (res.ok) {
          fetchQueue(selectedEquipment.id);
          fetchEquipment();
        }
      });
  };

  const getFilteredPending = () => {
    if (!selectedEquipment) return [];
    return pendingRequests.filter(req => req.equipmentId === selectedEquipment.id);
  };

  return (
    <div className="app-wrapper">
      <nav>
        <div className="container">
          <div className="brand" onClick={() => setView('LANDING')} style={{ cursor: 'pointer' }}>
            🛡️ Ever<span>Vault</span>
          </div>
          <div className="nav-links">
            <button className={view === 'USER' ? 'active' : ''} onClick={() => setView('USER')}>Patient Portal</button>
            <button className={view === 'ADMIN' ? 'active' : ''} onClick={() => setView('ADMIN')}>Admin Control</button>
          </div>
        </div>
      </nav>

      {view === 'LANDING' && (
        <main>
          <div className="hero">
            <div className="container">
              <h1>Advanced Health Logistics</h1>
              <p>Welcome to <strong>EverVault</strong> by <strong>Evernorth</strong>. We provide secure, priority-based equipment management and triage solutions for modern healthcare facilities.</p>
              <div className="hero-btns">
                <button className="btn-primary" onClick={() => setView('USER')}>Go to Patient Portal</button>
                <button className="btn-outline" onClick={() => setView('ADMIN')}>Admin Access</button>
              </div>
            </div>
          </div>

          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', textAlign: 'center', marginBottom: '4rem' }}>
              <div className="section">
                <h2 style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>⚡ Priority Triage</h2>
                <p>Smart algorithms ensure emergency cases are prioritized instantly without disrupting critical workflows.</p>
              </div>
              <div className="section">
                <h2 style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>🕙 Live Tracking</h2>
                <p>Real-time machine availability and automated slot estimations for predictable facility planning.</p>
              </div>
              <div className="section">
                <h2 style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>🛡️ Secure Vault</h2>
                <p>Enterprise-grade security for patient bookings and medical equipment logistics.</p>
              </div>
            </div>
          </div>
        </main>
      )}

      {view !== 'LANDING' && (
        <div className="container view-content">
          {view === 'USER' && (
            <div className="fade-in">
              <div className="section-header">
                <h2>Patient Service Portal</h2>
                <p>Select a facility and request your scheduled scan or procedure.</p>
              </div>

              <div className="grid-layout">
                <div className="section">
                  <h3>Available Facilities</h3>
                  <div className="eq-grid">
                    {equipment.length === 0 ? <p>Loading facilities... (Check if backend is on 8080)</p> :
                      equipment.map(eq => (
                        <div
                          key={eq.id}
                          className={`eq-card ${selectedEquipment?.id === eq.id ? 'selected' : ''}`}
                          onClick={() => setSelectedEquipment(eq)}
                        >
                          <span className={`status-indicator status-${eq.status.toLowerCase()}`}>
                            {eq.status.replace('_', ' ')}
                          </span>
                          <h3>{eq.name}</h3>
                          <div className="eq-meta">
                            <span>⏳ Next: <strong>{eq.nextAvailable}</strong></span>
                            <span>👥 Wait: <strong>{eq.queueLength}</strong></span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="section">
                  <div className="booking-panel">
                    <h3>Request a Booking</h3>
                    <form onSubmit={handleRequestBooking}>
                      <div className="form-group">
                        <label>Patient Full Name</label>
                        <input
                          type="text"
                          value={patientName}
                          onChange={e => setPatientName(e.target.value)}
                          placeholder="e.g. John Doe"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Preferred Date & Time</label>
                        <input
                          type="datetime-local"
                          value={slotTime}
                          onChange={e => setSlotTime(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Service Urgency</label>
                        <select value={requestedPriority} onChange={e => setRequestedPriority(e.target.value)}>
                          <option value="NORMAL">Standard Checkup</option>
                          <option value="URGENT">Urgent Care Needed</option>
                          <option value="EMERGENCY">🚨 Critical Emergency</option>
                        </select>
                      </div>
                      <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={!selectedEquipment}>
                        {selectedEquipment ? `Book ${selectedEquipment.name}` : 'Select a Facility'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'ADMIN' && (
            <div className="fade-in">
              <div className="section-header">
                <h2>Health Logistics Control</h2>
                <p>Manage equipment triage and patient queue flow.</p>
              </div>

              <div className="admin-header-cards">
                {equipment.map(eq => (
                  <div
                    key={eq.id}
                    className={`card ${selectedEquipment?.id === eq.id ? 'selected' : ''}`}
                    onClick={() => setSelectedEquipment(eq)}
                  >
                    <h4>{eq.name}</h4>
                    <small>{eq.status}</small>
                  </div>
                ))}
              </div>

              <div className="grid-layout">
                <div className="section">
                  <h3>🔔 Triage Queue {selectedEquipment && `for ${selectedEquipment.name}`}</h3>
                  <div className="request-list">
                    {!selectedEquipment ? <p>Please select a machine above.</p> :
                      getFilteredPending().length === 0 ? <p>No pending triage requests.</p> :
                        getFilteredPending().map(req => (
                          <div key={req.id} className="item-card">
                            <div className="item-info">
                              <h4>{req.patientName}</h4>
                              <small>Preferred: {req.slotTime.replace('T', ' ')}</small>
                            </div>
                            <div className="action-btns">
                              <button className="btn-icon" onClick={() => handleApprove(req.id, 'NORMAL')}>Normal</button>
                              <button className="btn-icon" onClick={() => handleApprove(req.id, 'URGENT')}>Urgent</button>
                              <button className="btn-icon btn-emergency" onClick={() => handleApprove(req.id, 'EMERGENCY')}>EMERGENCY</button>
                            </div>
                          </div>
                        ))}
                  </div>
                </div>

                <div className="section">
                  <h3>📋 Live Operations {selectedEquipment && `(${selectedEquipment.name})`}</h3>
                  {selectedEquipment ? (
                    <>
                      <button className="btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={handleCallNext}>
                        Call Next Patient
                      </button>
                      <div className="queue-list">
                        {queue.length === 0 ? <p>Operational queue empty.</p> : queue.map((q, idx) => (
                          <div key={q.id} className="item-card">
                            <span style={{ fontWeight: 'bold', width: '20px' }}>#{idx + 1}</span>
                            <div className="item-info">
                              <h4>{q.patientName}</h4>
                              <small>{q.slotTime.replace('T', ' ')}</small>
                            </div>
                            <span className={`prio-tag prio-${q.priority}`}>{q.priority}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <p>Select a facility to view operations.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <footer style={{ textAlign: 'center', padding: '2rem 0', marginTop: '4rem', borderTop: '1px solid #DDD', color: 'var(--text-grey)' }}>
        <p>© 2026 Evernorth Health Services | EverVault Logistics Demo</p>
      </footer>
    </div>
  )
}

export default App
