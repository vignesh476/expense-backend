
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import {
  Pencil, Trash2, CheckCircle2, X,
  Mic, MicOff, Calendar as CalendarIcon, List, TrendingUp,
  Bell, BellOff, StickyNote, ChevronLeft, ChevronRight,
  FileSpreadsheet
} from 'lucide-react';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({ type: 'expense', amount: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ type: 'expense', amount: '', description: '' });
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [summaryResp, transResp] = await Promise.all([
        api.get('/transactions/summary/'),
        api.get('/transactions/')
      ]);
      setSummary(summaryResp.data);
      setTransactions(transResp.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load data');
    }
  }

  async function addTransaction(e) {
    e.preventDefault();
    try {
      await api.post('/transactions/', newTransaction);
      setNewTransaction({ type: 'expense', amount: '', description: '' });
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to add transaction');
    }
  }

  function startEdit(t) {
    setEditingId(t.id);
    setEditForm({ type: t.type, amount: t.amount.toString(), description: t.description || '' });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ type: 'expense', amount: '', description: '' });
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      await api.patch(`/transactions/${editingId}/`, {
        type: editForm.type,
        amount: parseFloat(editForm.amount),
        description: editForm.description
      });
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to update transaction');
    }
  }

  async function deleteTransaction(id) {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}/`);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete transaction');
    }
  }

  async function downloadExcel(monthly = false) {
    try {
      const resp = await api.get('/transactions/download-excel/', {
        params: monthly ? { monthly: 'true' } : {},
        responseType: 'blob'
      });
      const blob = new Blob([resp.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = monthly ? 'monthly-summary.xlsx' : 'daily-summary.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download Excel');
    }
  }

  if (!summary) return <div className="dashboard">Loading...</div>;

  const displayName = user?.nickname || user?.email || user?.displayName || 'User';
  const isGuest = user?.is_guest;

  return (
    <div className="dashboard">
      <div className="header">
        <div className="welcome">
          <h2>Dashboard</h2>
          <h3>Welcome, {displayName}!</h3>
          {isGuest && <span className="guest-badge">Guest</span>}
        </div>
      </div>

      <div className="summary-grid">
        <div className="card">
          <h4>Today's Income</h4>
          <div>₹{summary.today.income.toFixed(2)}</div>
        </div>
        <div className="card">
          <h4>Today's Expense</h4>
          <div>₹{summary.today.expense.toFixed(2)}</div>
        </div>
        <div className="card">
          <h4>Month Income</h4>
          <div>₹{summary.month.income.toFixed(2)}</div>
        </div>
        <div className="card">
          <h4>Month Expense</h4>
          <div>₹{summary.month.expense.toFixed(2)}</div>
        </div>
      </div>

      <div className="excel-actions">
        <button className="btn secondary" onClick={downloadExcel}>Download Daily Excel</button>
        <button className="btn secondary" onClick={() => downloadExcel(true)}>Download Monthly Excel</button>
        <button className="btn secondary" onClick={async () => { try { await api.post('/transactions/send-summary-email/'); alert('Daily report sent to your email!'); } catch (err) { console.error(err); alert('Failed to send email'); } }}>Send Daily Email</button>
        <button className="btn secondary" onClick={async () => { try { await api.post('/transactions/send-summary-email/?monthly=true'); alert('Monthly report sent to your email!'); } catch (err) { console.error(err); alert('Failed to send email'); } }}>Send Monthly Email</button>
      </div>

      <div className="add-transaction">
        <h3>Add Transaction</h3>
        <form onSubmit={addTransaction} className="add-form">
          <select value={newTransaction.type} onChange={e => setNewTransaction({...newTransaction, type: e.target.value})}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input type="number" step="0.01" placeholder="Amount" value={newTransaction.amount} onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})} required />
          <input type="text" placeholder="Description" value={newTransaction.description} onChange={e => setNewTransaction({...newTransaction, description: e.target.value})} required />
          <button type="submit" className="btn primary">Add</button>
        </form>
      </div>

      <div className="transactions">
        <h3>Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p>No transactions yet.</p>
        ) : (
          transactions.map(t => (
            <div key={t.id} className={`transaction-item ${editingId === t.id ? 'editing' : ''}`}>
              {editingId === t.id ? (
                <form onSubmit={saveEdit} className="transaction-edit-row">
                  <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                  <input type="number" step="0.01" placeholder="Amount" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} required />
                  <input type="text" placeholder="Description" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} required />
                  <div className="edit-actions">
                    <button type="submit" className="transaction-btn save" title="Save"><CheckCircle2 size={16} /></button>
                    <button type="button" className="transaction-btn cancel" onClick={cancelEdit} title="Cancel"><X size={16} /></button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <span className={`transaction-type ${t.type}`}>{t.type.toUpperCase()}</span> - {t.description}
                  </div>
                  <div className="transaction-right">
                    <span>₹{t.amount.toFixed(2)}</span>
                    <div className="transaction-actions">
                      <button className="transaction-btn edit" onClick={() => startEdit(t)} title="Edit"><Pencil size={16} /></button>
                      <button className="transaction-btn delete" onClick={() => deleteTransaction(t.id)} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
