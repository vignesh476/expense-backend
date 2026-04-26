import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import {
  MapPin,
  Users,
  Receipt,
  Trash2,
  Calculator,
  FileSpreadsheet,
  Mail,
  Plus,
  ArrowRight,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Plane,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Scale,
  Pencil,
  X
} from 'lucide-react';

/* ─── Inline Components ─── */

function Spinner({ size = 16 }) {
  return <Loader2 size={size} className="spinner" />;
}

function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast ${t.type}`}
          onAnimationEnd={() => removeToast(t.id)}
        >
          {t.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-icon"><AlertTriangle size={32} /></div>
        <h4>{title}</h4>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn danger" onClick={onConfirm} disabled={loading}>
            {loading ? <Spinner size={14} /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="empty-state">
      <Icon size={40} strokeWidth={1.2} />
      <p className="empty-title">{title}</p>
      {subtitle && <p className="empty-subtitle">{subtitle}</p>}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><Icon size={18} /></div>
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
    </div>
  );
}

function BudgetBar({ spent, budget }) {
  if (!budget || budget <= 0) return null;
  const pct = Math.min((spent / budget) * 100, 100);
  const fillClass = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : '';
  return (
    <div className="budget-bar-wrap">
      <div className="budget-bar-header">
        <span className="budget-bar-label">Budget</span>
        <span className="budget-bar-value">₹{spent.toFixed(2)} / ₹{budget.toFixed(2)} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="budget-bar-track">
        <div className={`budget-bar-fill ${fillClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function Trips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [settlement, setSettlement] = useState(null);
  const [newTripName, setNewTripName] = useState('');
  const [newTripBudget, setNewTripBudget] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [expense, setExpense] = useState({ paid_by: '', amount: '', description: '' });
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm] = useState({ paid_by: '', amount: '', description: '' });

  const displayName = user?.nickname || user?.email || user?.displayName || 'User';

  /* ─── Toast helpers ─── */
  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  /* ─── Budget alert ─── */
  function checkBudgetAlert(trip, total) {
    if (trip.budget && trip.budget > 0) {
      const pct = total / trip.budget;
      if (pct >= 1) {
        addToast(`Budget exceeded! ₹${total.toFixed(2)} / ₹${trip.budget.toFixed(2)}`, 'error');
      } else if (pct >= 0.9) {
        addToast(`Budget alert: ${(pct * 100).toFixed(0)}% spent`, 'error');
      } else if (pct >= 0.75) {
        addToast(`Budget warning: ${(pct * 100).toFixed(0)}% spent`, 'error');
      }
    }
  }

  /* ─── Data loading ─── */
  async function loadTrips() {
    try {
      setLoading(l => ({ ...l, trips: true }));
      const resp = await api.get('/trips/');
      setTrips(resp.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load trips', 'error');
    } finally {
      setLoading(l => ({ ...l, trips: false }));
    }
  }

  async function selectTrip(trip) {
    setSelectedTrip(trip);
    setSettlement(null);
    setEditingExpense(null);
    try {
      setLoading(l => ({ ...l, detail: true }));
      const resp = await api.get(`/trips/${trip.id}/`);
      const tripData = resp.data;
      setSelectedTrip(tripData);
      const total = (tripData.expenses || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
      checkBudgetAlert(tripData, total);
    } catch (err) {
      console.error(err);
      addToast('Failed to load trip details', 'error');
    } finally {
      setLoading(l => ({ ...l, detail: false }));
    }
  }

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Actions ─── */
  async function createTrip(e) {
    e.preventDefault();
    if (!newTripName.trim()) return;
    try {
      setLoading(l => ({ ...l, createTrip: true }));
      const payload = { trip_name: newTripName };
      const b = parseFloat(newTripBudget);
      if (!isNaN(b) && b >= 0) payload.budget = b;
      await api.post('/trips/', payload);
      setNewTripName('');
      setNewTripBudget('');
      addToast('Trip created successfully');
      loadTrips();
    } catch (err) {
      console.error(err);
      addToast('Failed to create trip', 'error');
    } finally {
      setLoading(l => ({ ...l, createTrip: false }));
    }
  }

  async function addParticipant(e) {
    e.preventDefault();
    if (!selectedTrip || !participantName.trim()) return;
    try {
      setLoading(l => ({ ...l, addParticipant: true }));
      await api.post(`/trips/${selectedTrip.id}/participant/`, { name: participantName });
      setParticipantName('');
      addToast('Participant added');
      await selectTrip(selectedTrip);
    } catch (err) {
      console.error(err);
      addToast('Failed to add participant', 'error');
    } finally {
      setLoading(l => ({ ...l, addParticipant: false }));
    }
  }

  async function addExpense(e) {
    e.preventDefault();
    if (!selectedTrip || !expense.paid_by || !expense.amount) return;
    try {
      setLoading(l => ({ ...l, addExpense: true }));
      await api.post(`/trips/${selectedTrip.id}/expense/`, {
        paid_by: expense.paid_by,
        amount: parseFloat(expense.amount),
        description: expense.description
      });
      setExpense({ paid_by: '', amount: '', description: '' });
      addToast('Expense added');
      await selectTrip(selectedTrip);
      setSettlement(null);
    } catch (err) {
      console.error(err);
      addToast('Failed to add expense', 'error');
    } finally {
      setLoading(l => ({ ...l, addExpense: false }));
    }
  }

  async function calculateSettlement() {
    if (!selectedTrip) return;
    try {
      setLoading(l => ({ ...l, settlement: true }));
      const resp = await api.get(`/trips/${selectedTrip.id}/settlement/`);
      setSettlement(resp.data);
      addToast('Settlement calculated');
    } catch (err) {
      console.error(err);
      addToast('Failed to calculate settlement', 'error');
    } finally {
      setLoading(l => ({ ...l, settlement: false }));
    }
  }

  async function exportTrip() {
    if (!selectedTrip) return;
    try {
      setLoading(l => ({ ...l, export: true }));
      const resp = await api.get(`/trips/${selectedTrip.id}/export/`, { responseType: 'blob' });
      const blob = new Blob([resp.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTrip.trip_name.replace(/\s+/g, '_')}_trip.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast('Excel exported');
    } catch (err) {
      console.error('Export error:', err);
      addToast('Failed to export trip', 'error');
    } finally {
      setLoading(l => ({ ...l, export: false }));
    }
  }

  async function emailTripReport() {
    if (!selectedTrip) return;
    try {
      setLoading(l => ({ ...l, email: true }));
      await api.post(`/trips/${selectedTrip.id}/email-report/`);
      addToast('Trip report sent to your email!');
    } catch (err) {
      console.error(err);
      addToast('Failed to send email report', 'error');
    } finally {
      setLoading(l => ({ ...l, email: false }));
    }
  }

  /* ─── Edit expense ─── */
  function startEditExpense(e) {
    setEditingExpense(e.id);
    setEditForm({ paid_by: e.paid_by, amount: String(e.amount), description: e.description || '' });
  }

  function cancelEditExpense() {
    setEditingExpense(null);
    setEditForm({ paid_by: '', amount: '', description: '' });
  }

  async function saveEditExpense(e) {
    try {
      setLoading(l => ({ ...l, saveEdit: e.id }));
      await api.put(`/trips/${selectedTrip.id}/expense/${e.id}/`, {
        paid_by: editForm.paid_by,
        amount: parseFloat(editForm.amount),
        description: editForm.description
      });
      addToast('Expense updated');
      setEditingExpense(null);
      await selectTrip(selectedTrip);
      setSettlement(null);
    } catch (err) {
      console.error(err);
      addToast('Failed to update expense', 'error');
    } finally {
      setLoading(l => ({ ...l, saveEdit: null }));
    }
  }

  /* ─── Delete handlers ─── */
  function promptDeleteTrip(trip) {
    setConfirm({
      title: 'Delete Trip',
      message: `Are you sure you want to delete "${trip.trip_name}"? This will remove all expenses and participants.`,
      onConfirm: async () => {
        try {
          setLoading(l => ({ ...l, deleteTrip: trip.id }));
          await api.delete(`/trips/${trip.id}/`);
          addToast('Trip deleted');
          if (selectedTrip?.id === trip.id) {
            setSelectedTrip(null);
            setSettlement(null);
          }
          loadTrips();
        } catch (err) {
          console.error(err);
          addToast('Failed to delete trip', 'error');
        } finally {
          setLoading(l => ({ ...l, deleteTrip: null }));
          setConfirm(null);
        }
      }
    });
  }

  function promptDeleteExpense(exp) {
    setConfirm({
      title: 'Delete Expense',
      message: `Remove expense of ₹${exp.amount} paid by ${exp.paid_by}?`,
      onConfirm: async () => {
        try {
          setLoading(l => ({ ...l, deleteExpense: exp.id }));
          await api.delete(`/trips/${selectedTrip.id}/expense/${exp.id}/delete/`);
          addToast('Expense deleted');
          await selectTrip(selectedTrip);
          setSettlement(null);
        } catch (err) {
          console.error(err);
          addToast('Failed to delete expense', 'error');
        } finally {
          setLoading(l => ({ ...l, deleteExpense: null }));
          setConfirm(null);
        }
      }
    });
  }

  function promptDeleteParticipant(p) {
    setConfirm({
      title: 'Remove Participant',
      message: `Remove ${p.name} from this trip?`,
      onConfirm: async () => {
        try {
          setLoading(l => ({ ...l, deleteParticipant: p.id }));
          await api.delete(`/trips/${selectedTrip.id}/participant/${p.id}/`);
          addToast('Participant removed');
          await selectTrip(selectedTrip);
          setSettlement(null);
        } catch (err) {
          console.error(err);
          addToast('Failed to remove participant', 'error');
        } finally {
          setLoading(l => ({ ...l, deleteParticipant: null }));
          setConfirm(null);
        }
      }
    });
  }

  /* ─── Derived data ─── */
  const participants = selectedTrip?.participants || [];
  const expenses = selectedTrip?.expenses || [];
  const totalExpense = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  return (
    <div className="dashboard trips-page">
      <Toast toasts={toasts} removeToast={removeToast} />
      <ConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
        loading={loading.deleteTrip || loading.deleteExpense || loading.deleteParticipant}
      />

      <div className="header">
        <div className="welcome">
          <Plane size={22} className="text-blue-600" />
          <div>
            <h2>Trips</h2>
            <h3>Welcome, {displayName}!</h3>
          </div>
        </div>
      </div>

      <div className="trips-layout">
        {/* ─── Sidebar ─── */}
        <div className="trips-sidebar">
          <form onSubmit={createTrip} className="add-form trip-create">
            <input
              type="text"
              placeholder="New trip name..."
              value={newTripName}
              onChange={e => setNewTripName(e.target.value)}
              required
            />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Budget (₹)"
              value={newTripBudget}
              onChange={e => setNewTripBudget(e.target.value)}
              style={{ width: '110px' }}
            />
            <button type="submit" className="btn primary" disabled={loading.createTrip}>
              {loading.createTrip ? <Spinner size={14} /> : <Plus size={16} />}
            </button>
          </form>

          <h4><MapPin size={14} /> Your Trips</h4>
          {trips.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="No trips yet"
              subtitle="Create your first trip above"
            />
          ) : (
            <ul className="trip-list">
              {trips.map(t => (
                <li
                  key={t.id}
                  className={`trip-item ${selectedTrip?.id === t.id ? 'active' : ''}`}
                  onClick={() => selectTrip(t)}
                >
                  <span className="trip-name">{t.trip_name}</span>
                  <button
                    className="trip-delete"
                    onClick={e => { e.stopPropagation(); promptDeleteTrip(t); }}
                    disabled={loading.deleteTrip === t.id}
                    title="Delete trip"
                  >
                    {loading.deleteTrip === t.id ? <Spinner size={12} /> : <Trash2 size={14} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ─── Detail ─── */}
        <div className="trips-detail">
          {!selectedTrip ? (
            <EmptyState
              icon={MapPin}
              title="Select a trip"
              subtitle="Choose a trip from the sidebar to view details"
            />
          ) : loading.detail ? (
            <div className="loading-overlay"><Spinner size={28} /><span>Loading trip...</span></div>
          ) : (
            <div className="trip-detail-inner">
              <div className="trip-header">
                <h3>{selectedTrip.trip_name}</h3>
                <div className="trip-meta">
                  <span><Users size={14} /> {participants.length} participants</span>
                  <span><Receipt size={14} /> {expenses.length} expenses</span>
                </div>
              </div>

              {/* Budget Bar */}
              <BudgetBar spent={totalExpense} budget={selectedTrip.budget} />

              {/* Stats */}
              <div className="stats-grid">
                <StatCard icon={Wallet} label="Total Spent" value={`₹${totalExpense.toFixed(2)}`} color="blue" />
                <StatCard icon={Users} label="Participants" value={participants.length} color="violet" />
                <StatCard icon={Receipt} label="Expenses" value={expenses.length} color="amber" />
                {participants.length > 0 && (
                  <StatCard icon={Scale} label="Per Person" value={`₹${(totalExpense / participants.length).toFixed(2)}`} color="emerald" />
                )}
              </div>

              {/* Participants */}
              <div className="section">
                <div className="section-header">
                  <h4><Users size={14} /> Participants</h4>
                </div>
                <form onSubmit={addParticipant} className="add-form inline">
                  <input
                    type="text"
                    placeholder="Participant name"
                    value={participantName}
                    onChange={e => setParticipantName(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn primary" disabled={loading.addParticipant}>
                    {loading.addParticipant ? <Spinner size={14} /> : <><UserPlus size={14} /> Add</>}
                  </button>
                </form>
                {participants.length === 0 ? (
                  <EmptyState icon={Users} title="No participants yet" subtitle="Add people who joined this trip" />
                ) : (
                  <div className="participant-grid">
                    {participants.map(p => (
                      <div key={p.id} className="participant-chip">
                        <span className="p-name">{p.name}</span>
                        <button
                          className="p-delete"
                          onClick={() => promptDeleteParticipant(p)}
                          disabled={loading.deleteParticipant === p.id}
                          title="Remove"
                        >
                          {loading.deleteParticipant === p.id ? <Spinner size={10} /> : <XCircle size={12} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Expense */}
              <div className="section">
                <div className="section-header">
                  <h4><Receipt size={14} /> Add Expense</h4>
                </div>
                <form onSubmit={addExpense} className="add-form expense-form">
                  <select
                    value={expense.paid_by}
                    onChange={e => setExpense({ ...expense, paid_by: e.target.value })}
                    required
                  >
                    <option value="">Select payer...</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                    <option value="__new__">+ Add new person</option>
                  </select>
                  {expense.paid_by === '__new__' && (
                    <input
                      type="text"
                      placeholder="New payer name"
                      value={expense.paid_by === '__new__' ? '' : expense.paid_by}
                      onChange={e => setExpense({ ...expense, paid_by: e.target.value })}
                      required
                      autoFocus
                    />
                  )}
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount (₹)"
                    value={expense.amount}
                    onChange={e => setExpense({ ...expense, amount: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={expense.description}
                    onChange={e => setExpense({ ...expense, description: e.target.value })}
                  />
                  <button type="submit" className="btn primary" disabled={loading.addExpense}>
                    {loading.addExpense ? <Spinner size={14} /> : <><Plus size={14} /> Add Expense</>}
                  </button>
                </form>
              </div>

              {/* Expenses List */}
              <div className="section">
                <div className="section-header">
                  <h4><Receipt size={14} /> Expenses</h4>
                </div>
                {expenses.length === 0 ? (
                  <EmptyState icon={Receipt} title="No expenses yet" subtitle="Record who paid for what" />
                ) : (
                  <div className="expense-list">
                    {expenses.map(e => (
                      <div key={e.id} className={`expense-row ${editingExpense === e.id ? 'editing' : ''}`}>
                        {editingExpense === e.id ? (
                          <div className="edit-expense-form">
                            <select
                              value={editForm.paid_by}
                              onChange={ev => setEditForm({ ...editForm, paid_by: ev.target.value })}
                            >
                              {participants.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.amount}
                              onChange={ev => setEditForm({ ...editForm, amount: ev.target.value })}
                            />
                            <input
                              type="text"
                              value={editForm.description}
                              onChange={ev => setEditForm({ ...editForm, description: ev.target.value })}
                            />
                            <div className="edit-action">
                              <button className="btn primary" onClick={() => saveEditExpense(e)} disabled={loading.saveEdit === e.id}>
                                {loading.saveEdit === e.id ? <Spinner size={12} /> : <CheckCircle2 size={14} />}
                              </button>
                              <button className="btn secondary" onClick={cancelEditExpense}>
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="expense-info">
                              <span className="expense-payer">{e.paid_by}</span>
                              <span className="expense-desc">{e.description || '—'}</span>
                            </div>
                            <div className="expense-right">
                              <span className="expense-amount">₹{parseFloat(e.amount).toFixed(2)}</span>
                              <button
                                className="expense-delete"
                                onClick={() => startEditExpense(e)}
                                title="Edit expense"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                className="expense-delete"
                                onClick={() => promptDeleteExpense(e)}
                                disabled={loading.deleteExpense === e.id}
                                title="Delete expense"
                              >
                                {loading.deleteExpense === e.id ? <Spinner size={12} /> : <Trash2 size={14} />}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="section actions-bar">
                <button className="btn secondary" onClick={calculateSettlement} disabled={loading.settlement}>
                  {loading.settlement ? <Spinner size={14} /> : <><Calculator size={14} /> Calculate Settlement</>}
                </button>
                <button className="btn secondary" onClick={exportTrip} disabled={loading.export}>
                  {loading.export ? <Spinner size={14} /> : <><FileSpreadsheet size={14} /> Export Excel</>}
                </button>
                <button className="btn secondary" onClick={emailTripReport} disabled={loading.email}>
                  {loading.email ? <Spinner size={14} /> : <><Mail size={14} /> Email Report</>}
                </button>
              </div>

              {/* Settlement */}
              {settlement && (
                <div className="settlement-panel">
                  <h4><Scale size={16} /> Settlement</h4>

                  <div className="settlement-summary">
                    <div className="ss-card total">
                      <Wallet size={18} />
                      <div>
                        <span className="ss-label">Total</span>
                        <span className="ss-value">₹{settlement.total}</span>
                      </div>
                    </div>
                    <div className="ss-card per-person">
                      <Users size={18} />
                      <div>
                        <span className="ss-label">Per Person</span>
                        <span className="ss-value">₹{settlement.per_person}</span>
                      </div>
                    </div>
                    <div className="ss-card remainder">
                      <Receipt size={18} />
                      <div>
                        <span className="ss-label">Remainder</span>
                        <span className="ss-value">₹{(settlement.remainder || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  {(settlement.remainder || 0) > 0 && (
                    <div className="remainder-notice">
                      <AlertTriangle size={14} />
                      <span>₹{settlement.remainder.toFixed(2)} could not be split evenly. Suggested: let <strong>{settlement.remainder_suggestion}</strong> absorb it (they paid the most).</span>
                    </div>
                  )}

                  <h5>Balances</h5>
                  <div className="balance-grid">
                    {Object.entries(settlement.balances).map(([name, bal]) => (
                      <div key={name} className={`balance-chip ${bal >= 0 ? 'credit' : 'debit'}`}>
                        <span className="b-name">{name}</span>
                        <span className="b-amt">
                          {bal >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          ₹{Math.abs(bal).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <h5>Suggested Payments</h5>
                  {settlement.lines.length === 0 ? (
                    <div className="all-settled"><CheckCircle2 size={18} /> All settled up!</div>
                  ) : (
                    <div className="payment-list">
                      {settlement.lines.map((line, idx) => (
                        <div key={idx} className="payment-card">
                          <div className="payment-arrow">
                            <span className="p-debtor">{line.split(' pays ')[0]}</span>
                            <ArrowRight size={14} />
                            <span className="p-creditor">{line.split(' to ')[1]}</span>
                          </div>
                          <span className="p-amount">{line.match(/₹[\d.]+/)[0]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

