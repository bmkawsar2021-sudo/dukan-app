import React, { useState, useEffect, useRef, useCallback } from 'react';
import { subscribeEvents, saveEvent, deleteEvent as deleteEventFB, getToday, formatDate } from '../utils/storage';

const fmt = (n) => 'Tk. ' + parseFloat(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const formatTaka = fmt;

/* Taka Input: shows plain number when focused, formatted Tk. when blurred */
const TakaInput = ({ value, onChange, style }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={focused ? 'number' : 'text'}
      value={focused ? (value || '') : fmt(value)}
      onChange={e => onChange(Number(e.target.value))}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      min="0"
      style={{ width: 110, padding: '6px 8px', border: '1px solid #475569', borderRadius: 8, fontSize: 13, textAlign: 'right', background: '#1e293b', color: '#f1f5f9', outline: 'none', ...style }}
    />
  );
};

const EVENT_TYPES = ['wedding', 'eid', 'party', 'friends_event', 'other'];
const EVENT_LABELS = {
  wedding: 'Wedding',
  eid: 'Eid',
  party: 'Party',
  friends_event: 'Friends Event',
  other: 'Other',
};
const EXPENSE_CATEGORIES = ['Food', 'Decoration', 'Transport', 'Shopping', 'Other'];

const TYPE_COLORS = {
  wedding: { bg: '#7c3aed', text: '#ede9fe' },
  eid: { bg: '#059669', text: '#d1fae5' },
  party: { bg: '#ea580c', text: '#ffedd5' },
  friends_event: { bg: '#6366f1', text: '#e0e7ff' },
  other: { bg: '#64748b', text: '#e2e8f0' },
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #8b5cf6, #d946ef)',
];

const s = {
  page: { fontFamily: "'Inter', sans-serif" },
  hero: {
    background: 'linear-gradient(135deg, #6366f1, #7c3aed, #a78bfa, #7c3aed, #6366f1)',
    backgroundSize: '200% 200%',
    animation: 'gradientShift 6s ease infinite',
    color: 'white', padding: '2rem 2rem', borderRadius: 16, marginBottom: 24,
    position: 'relative', overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
  },
  heroTitle: { fontSize: 28, fontWeight: 800, marginBottom: 4 },
  heroSub: { opacity: 0.85, fontSize: 14 },
  btnPrimary: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none',
    padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
    fontFamily: "'Inter', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 8,
    boxShadow: '0 2px 8px rgba(99,102,241,0.3)', transition: 'all 0.2s',
  },
  btnDanger: {
    background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none',
    padding: '8px 16px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  },
  btnGhost: {
    background: 'transparent', color: '#94a3b8', border: '1px solid #475569',
    padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: '#1e293b', border: '1px solid #334155', borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)', overflow: 'hidden',
  },
  cardHeader: {
    padding: '14px 18px', borderBottom: '1px solid #334155',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  cardBody: { padding: 18 },
  input: {
    width: '100%', padding: '10px 14px', border: '1px solid #475569', borderRadius: 10,
    background: '#0f172a', color: '#f1f5f9', fontSize: 14, fontFamily: "'Inter', sans-serif",
    outline: 'none', transition: 'border-color 0.2s',
  },
  select: {
    width: '100%', padding: '10px 14px', border: '1px solid #475569', borderRadius: 10,
    background: '#0f172a', color: '#f1f5f9', fontSize: 14, fontFamily: "'Inter', sans-serif",
    outline: 'none',
  },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8',
    background: '#0f172a', borderBottom: '2px solid #334155',
  },
  thRight: {
    textAlign: 'right', padding: '10px 14px', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8',
    background: '#0f172a', borderBottom: '2px solid #334155',
  },
  td: { padding: '10px 14px', fontSize: 14, borderBottom: '1px solid #1e293b', color: '#e2e8f0' },
  tdRight: { padding: '10px 14px', fontSize: 14, borderBottom: '1px solid #1e293b', color: '#e2e8f0', textAlign: 'right' },
  modal: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modalContent: {
    background: '#1e293b', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480,
    border: '1px solid #334155', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  badge: (type) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 9999,
    fontSize: 11, fontWeight: 700,
    background: TYPE_COLORS[type]?.bg || '#64748b',
    color: TYPE_COLORS[type]?.text || '#e2e8f0',
  }),
  statBox: (accent) => ({
    flex: 1, background: '#0f172a', borderRadius: 12, padding: 16, textAlign: 'center',
    border: `1px solid ${accent}33`,
  }),
  statLabel: (accent) => ({ fontSize: 11, color: accent, fontWeight: 600, marginBottom: 4 }),
  statValue: (accent) => ({ fontSize: 20, fontWeight: 800, color: accent }),
  sigCanvas: {
    width: '100%', height: 120, touchAction: 'none', border: '1px solid #475569',
    borderRadius: 8, background: '#fff', cursor: 'crosshair',
  },
};

/* ════════════════════════════════════════════════════════════
   FRIENDS EVENT TEMPLATE
   ════════════════════════════════════════════════════════════ */
const FriendsEventTemplate = ({ event, onUpdate }) => {
  const [members, setMembers] = useState(event.members || []);
  const [expenses, setExpenses] = useState(event.expenses || []);
  const [signatures, setSignatures] = useState(event.signatures || {});
  const [sigNames, setSigNames] = useState(event.sigNames || {});
  const [newMember, setNewMember] = useState({ name: '', contribution: '' });
  const [newExpense, setNewExpense] = useState({ description: '', category: 'Food', amount: '', paidBy: '', date: getToday() });
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);

  const autoSave = useCallback((updatedMembers, updatedExpenses, updatedSigs, updatedSigNames) => {
    const updated = { ...event, members: updatedMembers, expenses: updatedExpenses, signatures: updatedSigs, sigNames: updatedSigNames };
    onUpdate(updated);
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 1500);
  }, [event, onUpdate]);

  useEffect(() => {
    autoSave(members, expenses, signatures, sigNames);
  }, [members, expenses, signatures, sigNames]); // eslint-disable-line

  const addMember = () => {
    if (!newMember.name.trim()) return;
    const updated = [...members, { id: Date.now(), name: newMember.name.trim(), contribution: Number(newMember.contribution) || 0, paid: false }];
    setMembers(updated);
    setNewMember({ name: '', contribution: '' });
    setShowAddMember(false);
  };
  const updateMember = (id, field, value) => setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  const togglePaid = (id) => setMembers(members.map(m => m.id === id ? { ...m, paid: !m.paid } : m));
  const deleteMember = (id) => setMembers(members.filter(m => m.id !== id));

  const addExpense = () => {
    if (!newExpense.description.trim() || !newExpense.amount) return;
    setExpenses([...expenses, { id: Date.now(), ...newExpense, amount: Number(newExpense.amount) }]);
    setNewExpense({ description: '', category: 'Food', amount: '', paidBy: '', date: getToday() });
    setShowAddExpense(false);
  };
  const updateExpense = (id, field, value) => setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e));
  const deleteExpense = (id) => setExpenses(expenses.filter(e => e.id !== id));

  const handleSigChange = (memberId, data) => setSignatures(prev => ({ ...prev, [memberId]: data }));
  const handleSigNameChange = (memberId, name) => setSigNames(prev => ({ ...prev, [memberId]: name }));

  const totalMembers = members.length;
  const totalContribution = members.reduce((s, m) => s + m.contribution, 0);
  const pendingContribution = members.filter(m => !m.paid).reduce((s, m) => s + m.contribution, 0);
  const collectedContribution = members.filter(m => m.paid).reduce((s, m) => s + m.contribution, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalContribution - totalExpense;

  const categoryTotals = {};
  expenses.forEach(e => { categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount; });

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pw = 210;
      let y = 15;
      pdf.setFillColor(99,102,241);
      pdf.rect(0,0,pw,35,'F');
      pdf.setTextColor(255,255,255);
      pdf.setFontSize(18);
      pdf.text(event.name||'Event', pw/2, 14, {align:'center'});
      pdf.setFontSize(11);
      pdf.text((event.date||'') + ' · ' + (event.type||''), pw/2, 24, {align:'center'});
      y = 45;
      pdf.setTextColor(0,0,0);
      if(members&&members.length){
        pdf.setFontSize(13); pdf.setFont(undefined,'bold');
        pdf.text('Member Contributions', 15, y); y+=7;
        pdf.setFont(undefined,'normal'); pdf.setFontSize(10);
        members.forEach((m,i)=>{
          pdf.text((i+1)+'. '+(m.name||''), 15, y);
          pdf.text('Tk. '+(m.contribution||0), 130, y);
          pdf.text(m.status||'pending', 175, y);
          y+=6; if(y>270){pdf.addPage();y=15;}
        });
        const tc = members.reduce((s,m)=>s+Number(m.contribution||0),0);
        const col = members.reduce((s,m)=>m.status==='paid'?s+Number(m.contribution||0):s,0);
        y+=3;
        pdf.setFont(undefined,'bold');
        pdf.text('Total: Tk.'+tc+'  Collected: Tk.'+col+'  Pending: Tk.'+(tc-col), 15, y);
        y+=10; pdf.setFont(undefined,'normal');
      }
      if(expenses&&expenses.length){
        pdf.setFontSize(13); pdf.setFont(undefined,'bold');
        pdf.text('Expenses', 15, y); y+=7;
        pdf.setFont(undefined,'normal'); pdf.setFontSize(10);
        expenses.forEach((e,i)=>{
          pdf.text((i+1)+'. '+(e.description||''), 15, y);
          pdf.text((e.category||''), 120, y);
          pdf.text('Tk.'+(e.amount||0), 175, y);
          y+=6; if(y>270){pdf.addPage();y=15;}
        });
        const te = expenses.reduce((s,e)=>s+Number(e.amount||0),0);
        y+=3; pdf.setFont(undefined,'bold');
        pdf.text('Total Expenses: Tk.'+te, 15, y);
        y+=10; pdf.setFont(undefined,'normal');
      }
      const tc2 = (members||[]).reduce((s,m)=>s+Number(m.contribution||0),0);
      const te2 = (expenses||[]).reduce((s,e)=>s+Number(e.amount||0),0);
      const bal = tc2-te2;
      pdf.setFontSize(13); pdf.setFont(undefined,'bold');
      pdf.text('Settlement', 15, y); y+=7;
      pdf.setFontSize(11); pdf.setFont(undefined,'normal');
      pdf.text('Total Contribution: Tk.'+tc2, 15, y); y+=6;
      pdf.text('Total Expense: Tk.'+te2, 15, y); y+=6;
      pdf.setTextColor(bal>=0?22:220, bal>=0?163:38, bal>=0?74:38);
      pdf.text('Balance: Tk.'+bal, 15, y); y+=10;
      pdf.setTextColor(0,0,0);
      const canvases = document.querySelectorAll('canvas[data-sig]');
      if(canvases.length>0){
        if(y>220){pdf.addPage();y=15;}
        pdf.setFontSize(13); pdf.setFont(undefined,'bold');
        pdf.text('Signatures', 15, y); y+=8;
        let x=15;
        canvases.forEach((c)=>{
          try{
            const img=c.toDataURL('image/png');
            pdf.addImage(img,'PNG',x,y,55,28);
            x+=65; if(x>160){x=15;y+=35;}
            if(y>260){pdf.addPage();y=15;x=15;}
          }catch(e){}
        });
      }
      pdf.save((event.name||'event')+'_'+(event.date||'')+'.pdf');
    } catch(err) {
      alert('PDF error: '+err.message);

const fmt = (n) => 'Tk. ' + parseFloat(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const formatTaka = fmt;

/* Taka Input: shows plain number when focused, formatted Tk. when blurred */
const TakaInput = ({ value, onChange, style }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={focused ? 'number' : 'text'}
      value={focused ? (value || '') : fmt(value)}
      onChange={e => onChange(Number(e.target.value))}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      min="0"
      style={{ width: 110, padding: '6px 8px', border: '1px solid #475569', borderRadius: 8, fontSize: 13, textAlign: 'right', background: '#1e293b', color: '#f1f5f9', outline: 'none', ...style }}
    />
  );
};

const EVENT_TYPES = ['wedding', 'eid', 'party', 'friends_event', 'other'];
const EVENT_LABELS = {
  wedding: 'Wedding',
  eid: 'Eid',
  party: 'Party',
  friends_event: 'Friends Event',
  other: 'Other',
};
const EXPENSE_CATEGORIES = ['Food', 'Decoration', 'Transport', 'Shopping', 'Other'];

const TYPE_COLORS = {
  wedding: { bg: '#7c3aed', text: '#ede9fe' },
  eid: { bg: '#059669', text: '#d1fae5' },
  party: { bg: '#ea580c', text: '#ffedd5' },
  friends_event: { bg: '#6366f1', text: '#e0e7ff' },
  other: { bg: '#64748b', text: '#e2e8f0' },
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #8b5cf6, #d946ef)',
];

const s = {
  page: { fontFamily: "'Inter', sans-serif" },
  hero: {
    background: 'linear-gradient(135deg, #6366f1, #7c3aed, #a78bfa, #7c3aed, #6366f1)',
    backgroundSize: '200% 200%',
    animation: 'gradientShift 6s ease infinite',
    color: 'white', padding: '2rem 2rem', borderRadius: 16, marginBottom: 24,
    position: 'relative', overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
  },
  heroTitle: { fontSize: 28, fontWeight: 800, marginBottom: 4 },
  heroSub: { opacity: 0.85, fontSize: 14 },
  btnPrimary: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none',
    padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
    fontFamily: "'Inter', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 8,
    boxShadow: '0 2px 8px rgba(99,102,241,0.3)', transition: 'all 0.2s',
  },
  btnDanger: {
    background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none',
    padding: '8px 16px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  },
  btnGhost: {
    background: 'transparent', color: '#94a3b8', border: '1px solid #475569',
    padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: '#1e293b', border: '1px solid #334155', borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)', overflow: 'hidden',
  },
  cardHeader: {
    padding: '14px 18px', borderBottom: '1px solid #334155',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  cardBody: { padding: 18 },
  input: {
    width: '100%', padding: '10px 14px', border: '1px solid #475569', borderRadius: 10,
    background: '#0f172a', color: '#f1f5f9', fontSize: 14, fontFamily: "'Inter', sans-serif",
    outline: 'none', transition: 'border-color 0.2s',
  },
  select: {
    width: '100%', padding: '10px 14px', border: '1px solid #475569', borderRadius: 10,
    background: '#0f172a', color: '#f1f5f9', fontSize: 14, fontFamily: "'Inter', sans-serif",
    outline: 'none',
  },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8',
    background: '#0f172a', borderBottom: '2px solid #334155',
  },
  thRight: {
    textAlign: 'right', padding: '10px 14px', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8',
    background: '#0f172a', borderBottom: '2px solid #334155',
  },
  td: { padding: '10px 14px', fontSize: 14, borderBottom: '1px solid #1e293b', color: '#e2e8f0' },
  tdRight: { padding: '10px 14px', fontSize: 14, borderBottom: '1px solid #1e293b', color: '#e2e8f0', textAlign: 'right' },
  modal: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modalContent: {
    background: '#1e293b', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480,
    border: '1px solid #334155', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  badge: (type) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 9999,
    fontSize: 11, fontWeight: 700,
    background: TYPE_COLORS[type]?.bg || '#64748b',
    color: TYPE_COLORS[type]?.text || '#e2e8f0',
  }),
  statBox: (accent) => ({
    flex: 1, background: '#0f172a', borderRadius: 12, padding: 16, textAlign: 'center',
    border: `1px solid ${accent}33`,
  }),
  statLabel: (accent) => ({ fontSize: 11, color: accent, fontWeight: 600, marginBottom: 4 }),
  statValue: (accent) => ({ fontSize: 20, fontWeight: 800, color: accent }),
  sigCanvas: {
    width: '100%', height: 120, touchAction: 'none', border: '1px solid #475569',
    borderRadius: 8, background: '#fff', cursor: 'crosshair',
  },
};

/* ════════════════════════════════════════════════════════════
   FRIENDS EVENT TEMPLATE
   ════════════════════════════════════════════════════════════ */
const FriendsEventTemplate = ({ event, onUpdate }) => {
  const [members, setMembers] = useState(event.members || []);
  const [expenses, setExpenses] = useState(event.expenses || []);
  const [signatures, setSignatures] = useState(event.signatures || {});
  const [sigNames, setSigNames] = useState(event.sigNames || {});
  const [newMember, setNewMember] = useState({ name: '', contribution: '' });
  const [newExpense, setNewExpense] = useState({ description: '', category: 'Food', amount: '', paidBy: '', date: getToday() });
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);

  const autoSave = useCallback((updatedMembers, updatedExpenses, updatedSigs, updatedSigNames) => {
    const updated = { ...event, members: updatedMembers, expenses: updatedExpenses, signatures: updatedSigs, sigNames: updatedSigNames };
    onUpdate(updated);
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 1500);
  }, [event, onUpdate]);

  useEffect(() => {
    autoSave(members, expenses, signatures, sigNames);
  }, [members, expenses, signatures, sigNames]); // eslint-disable-line

  const addMember = () => {
    if (!newMember.name.trim()) return;
    const updated = [...members, { id: Date.now(), name: newMember.name.trim(), contribution: Number(newMember.contribution) || 0, paid: false }];
    setMembers(updated);
    setNewMember({ name: '', contribution: '' });
    setShowAddMember(false);
  };
  const updateMember = (id, field, value) => setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  const togglePaid = (id) => setMembers(members.map(m => m.id === id ? { ...m, paid: !m.paid } : m));
  const deleteMember = (id) => setMembers(members.filter(m => m.id !== id));

  const addExpense = () => {
    if (!newExpense.description.trim() || !newExpense.amount) return;
    setExpenses([...expenses, { id: Date.now(), ...newExpense, amount: Number(newExpense.amount) }]);
    setNewExpense({ description: '', category: 'Food', amount: '', paidBy: '', date: getToday() });
    setShowAddExpense(false);
  };
  const updateExpense = (id, field, value) => setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e));
  const deleteExpense = (id) => setExpenses(expenses.filter(e => e.id !== id));

  const handleSigChange = (memberId, data) => setSignatures(prev => ({ ...prev, [memberId]: data }));
  const handleSigNameChange = (memberId, name) => setSigNames(prev => ({ ...prev, [memberId]: name }));

  const totalMembers = members.length;
  const totalContribution = members.reduce((s, m) => s + m.contribution, 0);
  const pendingContribution = members.filter(m => !m.paid).reduce((s, m) => s + m.contribution, 0);
  const collectedContribution = members.filter(m => m.paid).reduce((s, m) => s + m.contribution, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalContribution - totalExpense;

  const categoryTotals = {};
  expenses.forEach(e => { categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount; });

  const handleExportPDF = async () => {
    const el = document.getElementById('event-detail-print');
    if (!el) return;
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;
    await new Promise(r => setTimeout(r, 300));
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', width: 794, windowWidth: 794 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    const pageH = pdf.internal.pageSize.getHeight();
    let hLeft = pdfH, pos = 0;
    pdf.addImage(imgData, 'PNG', pos, 0, pdfW, pdfH);
    hLeft -= pageH;
    while (hLeft > 0) { pos -= pageH; pdf.addPage(); pdf.addImage(imgData, 'PNG', pos, 0, pdfW, pdfH); hLeft -= pageH; }
    pdf.save(`${event.name}_${event.date}.pdf`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Auto-saved indicator */}
      {savedIndicator && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50, background: '#6366f1', color: 'white', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
          Auto-saved
        </div>
      )}

      {/* Event Info */}
      <div style={s.card}>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>{event.name}</h3>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>{formatDate(event.date)}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={s.badge('friends_event')}>Friends Event</span>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Members: <strong style={{ color: '#f1f5f9' }}>{totalMembers}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Members */}
      <div style={s.card}>
        <div style={{ ...s.cardHeader, background: 'linear-gradient(135deg, #312e81, #3730a3)' }}>
          <div>
            <h3 style={{ fontWeight: 700, color: '#e0e7ff', fontSize: 15 }}>Member Contributions</h3>
            <p style={{ fontSize: 11, color: '#a5b4fc' }}>সদস্যদের চাঁদার হিসাব</p>
          </div>
          <button onClick={() => setShowAddMember(!showAddMember)} style={{ ...s.btnPrimary, padding: '7px 14px', fontSize: 13 }}>+ Add Member</button>
        </div>
        <div style={s.cardBody}>
          {showAddMember && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, padding: 12, background: '#0f172a', borderRadius: 10 }}>
              <input type="text" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} placeholder="Name" style={{ ...s.input, flex: 1, minWidth: 140 }} />
              <input type="number" value={newMember.contribution} onChange={e => setNewMember({ ...newMember, contribution: e.target.value })} placeholder="Amount" min="0" style={{ ...s.input, width: 120 }} />
              <button onClick={addMember} style={{ ...s.btnPrimary, padding: '8px 16px', fontSize: 13 }}>Add</button>
              <button onClick={() => setShowAddMember(false)} style={{ ...s.btnGhost, padding: '8px 12px', fontSize: 13 }}>Cancel</button>
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>#</th>
                  <th style={s.th}>Name</th>
                  <th style={s.thRight}>Contribution</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>Status</th>
                  <th style={{ ...s.th, width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan="5" style={{ ...s.td, textAlign: 'center', padding: 24, color: '#64748b' }}>No members added yet.</td></tr>
                ) : members.map((m, i) => (
                  <tr key={m.id} style={{ background: i % 2 === 0 ? '#1e293b' : '#172033' }}>
                    <td style={s.td}>{i + 1}</td>
                    <td style={s.td}>
                      <input type="text" value={m.name} onChange={e => updateMember(m.id, 'name', e.target.value)} style={{ width: '100%', padding: '5px 8px', border: '1px solid #475569', borderRadius: 6, fontSize: 13, background: '#0f172a', color: '#f1f5f9', outline: 'none' }} />
                    </td>
                    <td style={s.tdRight}>
                      <TakaInput value={m.contribution} onChange={val => updateMember(m.id, 'contribution', val)} />
                    </td>
                    <td style={{ ...s.td, textAlign: 'center' }}>
                      <button onClick={() => togglePaid(m.id)} style={{
                        padding: '4px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                        background: m.paid ? '#312e81' : '#7f1d1d', color: m.paid ? '#a5b4fc' : '#fca5a5',
                      }}>
                        {m.paid ? 'Paid' : 'Pending'}
                      </button>
                    </td>
                    <td style={s.td}><button onClick={() => deleteMember(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>X</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #334155', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ background: '#0f172a', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Total Members</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>{totalMembers}</p>
            </div>
            <div style={{ background: '#1e1b4b', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#a5b4fc', marginBottom: 4 }}>Collected</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#a5b4fc' }}>{formatTaka(collectedContribution)}</p>
            </div>
            <div style={{ background: '#450a0a', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#fca5a5', marginBottom: 4 }}>Pending</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#fca5a5' }}>{formatTaka(pendingContribution)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses */}
      <div style={s.card}>
        <div style={{ ...s.cardHeader, background: 'linear-gradient(135deg, #7c2d12, #9a3412)' }}>
          <div>
            <h3 style={{ fontWeight: 700, color: '#ffedd5', fontSize: 15 }}>Expense Details</h3>
            <p style={{ fontSize: 11, color: '#fdba74' }}>খরচের বিবরণ</p>
          </div>
          <button onClick={() => setShowAddExpense(!showAddExpense)} style={{ ...s.btnPrimary, background: 'linear-gradient(135deg, #ea580c, #f97316)', padding: '7px 14px', fontSize: 13 }}>+ Add Expense</button>
        </div>
        <div style={s.cardBody}>
          {showAddExpense && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, marginBottom: 16, padding: 12, background: '#0f172a', borderRadius: 10 }}>
              <input type="text" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} placeholder="Description" style={s.input} />
              <select value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} style={s.select}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} placeholder="Amount" min="0" style={s.input} />
              <select value={newExpense.paidBy} onChange={e => setNewExpense({ ...newExpense, paidBy: e.target.value })} style={s.select}>
                <option value="">Paid by</option>
                {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={addExpense} style={{ ...s.btnPrimary, background: 'linear-gradient(135deg, #ea580c, #f97316)', padding: '8px 14px', fontSize: 13 }}>Add</button>
                <button onClick={() => setShowAddExpense(false)} style={{ ...s.btnGhost, padding: '8px 10px', fontSize: 13 }}>X</button>
              </div>
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>#</th>
                  <th style={s.th}>Description</th>
                  <th style={s.th}>Category</th>
                  <th style={s.thRight}>Amount</th>
                  <th style={s.th}>Paid By</th>
                  <th style={s.th}>Date</th>
                  <th style={{ ...s.th, width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan="7" style={{ ...s.td, textAlign: 'center', padding: 24, color: '#64748b' }}>No expenses added yet.</td></tr>
                ) : expenses.map((e, i) => (
                  <tr key={e.id} style={{ background: i % 2 === 0 ? '#1e293b' : '#172033' }}>
                    <td style={s.td}>{i + 1}</td>
                    <td style={s.td}>
                      <input type="text" value={e.description} onChange={ev => updateExpense(e.id, 'description', ev.target.value)} style={{ width: '100%', padding: '5px 8px', border: '1px solid #475569', borderRadius: 6, fontSize: 13, background: '#0f172a', color: '#f1f5f9', outline: 'none' }} />
                    </td>
                    <td style={s.td}>
                      <select value={e.category} onChange={ev => updateExpense(e.id, 'category', ev.target.value)} style={{ padding: '5px 8px', border: '1px solid #475569', borderRadius: 6, fontSize: 12, background: '#0f172a', color: '#f1f5f9', outline: 'none' }}>
                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td style={s.tdRight}>
                      <TakaInput value={e.amount} onChange={val => updateExpense(e.id, 'amount', val)} style={{ width: 90 }} />
                    </td>
                    <td style={s.td}>
                      <select value={e.paidBy || ''} onChange={ev => updateExpense(e.id, 'paidBy', ev.target.value)} style={{ padding: '5px 8px', border: '1px solid #475569', borderRadius: 6, fontSize: 12, background: '#0f172a', color: '#f1f5f9', outline: 'none' }}>
                        <option value="">-</option>
                        {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                      </select>
                    </td>
                    <td style={s.td}>
                      <input type="date" value={e.date || ''} onChange={ev => updateExpense(e.id, 'date', ev.target.value)} style={{ padding: '5px 8px', border: '1px solid #475569', borderRadius: 6, fontSize: 12, background: '#0f172a', color: '#f1f5f9', outline: 'none' }} />
                    </td>
                    <td style={s.td}><button onClick={() => deleteExpense(e.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>X</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {Object.keys(categoryTotals).length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #334155', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(categoryTotals).map(([cat, amt]) => (
                <span key={cat} style={{ padding: '4px 12px', background: '#0f172a', borderRadius: 9999, fontSize: 12, color: '#94a3b8', border: '1px solid #334155' }}>
                  {cat}: <strong style={{ color: '#f1f5f9' }}>{formatTaka(amt)}</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settlement */}
      <div style={s.card}>
        <div style={{ ...s.cardHeader, background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
          <div>
            <h3 style={{ fontWeight: 700, color: '#dbeafe', fontSize: 15 }}>Settlement</h3>
            <p style={{ fontSize: 11, color: '#93c5fd' }}>হিসাব মেলানো</p>
          </div>
        </div>
        <div style={s.cardBody}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={s.statBox('#6366f1')}>
              <p style={s.statLabel('#818cf8')}>Total Contribution</p>
              <p style={s.statValue('#a5b4fc')}>{formatTaka(totalContribution)}</p>
            </div>
            <div style={s.statBox('#ef4444')}>
              <p style={s.statLabel('#f87171')}>Total Expense</p>
              <p style={s.statValue('#fca5a5')}>{formatTaka(totalExpense)}</p>
            </div>
            <div style={s.statBox(balance >= 0 ? '#10b981' : '#f59e0b')}>
              <p style={s.statLabel(balance >= 0 ? '#34d399' : '#fbbf24')}>Balance</p>
              <p style={s.statValue(balance >= 0 ? '#6ee7b7' : '#fde68a')}>{formatTaka(balance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <h3 style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>Signatures / স্বাক্ষর</h3>
        </div>
        <div style={s.cardBody}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
            {[0, 1, 2].map(idx => (
              <div key={idx} style={{ flex: '1 1 240px', maxWidth: 300, border: '1px solid #334155', borderRadius: 12, padding: 16, background: '#0f172a' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 10, textAlign: 'center' }}>স্বাক্ষর / Signature</p>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => {
                      const canvas = document.getElementById(`sig-canvas-${idx}`);
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#fff';
                        ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
                        handleSigChange(`sig_${idx}`, null);
                      }
                    }}
                    style={{ position: 'absolute', top: 4, right: 4, zIndex: 10, padding: '2px 8px', fontSize: 10, color: '#ef4444', background: '#1e293b', borderRadius: 4, border: '1px solid #475569', cursor: 'pointer' }}
                  >
                    মুছুন
                  </button>
                  <canvas
                    id={`sig-canvas-${idx}`}
                    width={560}
                    height={240}
                    style={s.sigCanvas}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const canvas = e.target;
                      const ctx = canvas.getContext('2d');
                      const rect = canvas.getBoundingClientRect();
                      const x = (e.clientX - rect.left) * 2;
                      const y = (e.clientY - rect.top) * 2;
                      canvas.drawing = true;
                      ctx.beginPath();
                      ctx.moveTo(x, y);
                    }}
                    onMouseMove={(e) => {
                      e.preventDefault();
                      const canvas = e.target;
                      if (!canvas.drawing) return;
                      const ctx = canvas.getContext('2d');
                      const rect = canvas.getBoundingClientRect();
                      const x = (e.clientX - rect.left) * 2;
                      const y = (e.clientY - rect.top) * 2;
                      ctx.lineWidth = 4;
                      ctx.lineCap = 'round';
                      ctx.strokeStyle = '#000000';
                      ctx.lineTo(x, y);
                      ctx.stroke();
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault();
                      const canvas = e.target;
                      canvas.drawing = false;
                      handleSigChange(`sig_${idx}`, canvas.toDataURL('image/png'));
                    }}
                    onMouseLeave={(e) => {
                      e.preventDefault();
                      const canvas = e.target;
                      canvas.drawing = false;
                      handleSigChange(`sig_${idx}`, canvas.toDataURL('image/png'));
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      const canvas = e.target;
                      const ctx = canvas.getContext('2d');
                      const rect = canvas.getBoundingClientRect();
                      const x = (e.touches[0].clientX - rect.left) * 2;
                      const y = (e.touches[0].clientY - rect.top) * 2;
                      canvas.drawing = true;
                      ctx.beginPath();
                      ctx.moveTo(x, y);
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      const canvas = e.target;
                      if (!canvas.drawing) return;
                      const ctx = canvas.getContext('2d');
                      const rect = canvas.getBoundingClientRect();
                      const x = (e.touches[0].clientX - rect.left) * 2;
                      const y = (e.touches[0].clientY - rect.top) * 2;
                      ctx.lineWidth = 4;
                      ctx.lineCap = 'round';
                      ctx.strokeStyle = '#000000';
                      ctx.lineTo(x, y);
                      ctx.stroke();
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      const canvas = e.target;
                      canvas.drawing = false;
                      handleSigChange(`sig_${idx}`, canvas.toDataURL('image/png'));
                    }}
                  />
                </div>
                <div style={{ borderTop: '2px solid #f1f5f9', marginTop: 10, paddingTop: 10 }}>
                  <input
                    type="text"
                    value={sigNames[`sig_${idx}`] || ''}
                    onChange={e => handleSigNameChange(`sig_${idx}`, e.target.value)}
                    placeholder="নাম লিখুন"
                    style={{ width: '100%', padding: '6px 8px', fontSize: 13, textAlign: 'center', border: 'none', outline: 'none', background: 'transparent', color: '#f1f5f9' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PDF Export */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleExportPDF} style={{ ...s.btnPrimary, background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>Export PDF</button>
      </div>

      {/* Hidden Print Area */}
      <div id="event-detail-print" style={{ position: 'fixed', left: -9999, top: 0, width: 794, background: '#fff', fontFamily: "'Inter', Arial, sans-serif", color: '#1e293b', padding: 0, boxSizing: 'border-box' }}>
        <div style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', padding: '28px 30px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{event.name}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{formatDate(event.date)} &middot; Friends Event</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Members: {totalMembers}</div>
        </div>
        <div style={{ padding: '20px 30px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#7c3aed' }}>Member Contributions / সদস্যদের চাঁদা</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #cbd5e1' }}>#</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #cbd5e1' }}>Name</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #cbd5e1' }}>Contribution</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, borderBottom: '2px solid #cbd5e1' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 10px' }}>{i + 1}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 500 }}>{m.name}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(m.contribution)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: m.paid ? '#d1fae5' : '#fee2e2', color: m.paid ? '#059669' : '#dc2626' }}>{m.paid ? 'Paid' : 'Pending'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, marginTop: 8, fontSize: 12 }}>
            <span>Total: <strong>{formatTaka(totalContribution)}</strong></span>
            <span>Collected: <strong>{formatTaka(collectedContribution)}</strong></span>
            <span style={{ color: '#dc2626' }}>Pending: <strong>{formatTaka(pendingContribution)}</strong></span>
          </div>
        </div>
        <div style={{ padding: '0 30px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#ea580c' }}>Expense Details / খরচের বিবরণ</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #cbd5e1' }}>#</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #cbd5e1' }}>Description</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #cbd5e1' }}>Category</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #cbd5e1' }}>Amount</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #cbd5e1' }}>Paid By</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 10px' }}>{i + 1}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 500 }}>{e.description}</td>
                  <td style={{ padding: '8px 10px' }}>{e.category}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(e.amount)}</td>
                  <td style={{ padding: '8px 10px' }}>{e.paidBy || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {Object.keys(categoryTotals).length > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Object.entries(categoryTotals).map(([cat, amt]) => (
                <span key={cat} style={{ padding: '3px 10px', background: '#f1f5f9', borderRadius: 10 }}>{cat}: <strong>{fmt(amt)}</strong></span>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '0 30px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#2563eb' }}>Settlement / হিসাব মেলানো</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, background: '#d1fae5', padding: 14, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#059669' }}>Total Contribution</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>{formatTaka(totalContribution)}</div>
            </div>
            <div style={{ flex: 1, background: '#fee2e2', padding: 14, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#dc2626' }}>Total Expense</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>{formatTaka(totalExpense)}</div>
            </div>
            <div style={{ flex: 1, background: balance >= 0 ? '#fef9c3' : '#ffedd5', padding: 14, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: balance >= 0 ? '#ca8a04' : '#ea580c' }}>Balance</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: balance >= 0 ? '#ca8a04' : '#ea580c' }}>{formatTaka(balance)}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '20px 30px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>Signatures / স্বাক্ষর</div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[0, 1, 2].map(idx => (
              <div key={idx} style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>স্বাক্ষর / Signature</div>
                {signatures[`sig_${idx}`] && <img src={signatures[`sig_${idx}`]} alt={`Signature ${idx + 1}`} style={{ height: 50, margin: '0 auto 4px', display: 'block' }} />}
                {!signatures[`sig_${idx}`] && <div style={{ height: 50 }} />}
                <div style={{ borderTop: '2px solid #000', paddingTop: 6, marginTop: 4 }}>
                  <div style={{ fontSize: 11, minHeight: 16 }}>{sigNames[`sig_${idx}`] || ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '16px 30px', textAlign: 'center', borderTop: '1px solid #e2e8f0', marginTop: 10 }}>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>This account is approved by all members</div>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN EVENT ACCOUNTS PAGE
   ════════════════════════════════════════════════════════════ */
const EventAccounts = () => {
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({ name: '', date: getToday(), type: 'other' });
  const [newIncome, setNewIncome] = useState({ description: '', amount: '' });
  const [newExpense, setNewExpense] = useState({ description: '', amount: '' });

  useEffect(() => {
    const unsub = subscribeEvents(setEvents);
    return () => unsub();
  }, []);

  const handleCreateEvent = async () => {
    if (!newEvent.name.trim()) return;
    const eventData = { name: newEvent.name, date: newEvent.date, type: newEvent.type, income: [], expenses: [], members: [], signatures: {}, sigNames: {} };
    const newId = await saveEvent(eventData);
    if (newId) {
      setNewEvent({ name: '', date: getToday(), type: 'other' });
      setShowCreate(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Delete this event and all its data?')) {
      await deleteEventFB(id);
      if (selectedEvent?.id === id) setSelectedEvent(null);
    }
  };

  const handleUpdateEvent = async (updatedEvent) => {
    await saveEvent(updatedEvent);
    setSelectedEvent(updatedEvent);
  };

  const handleAddIncome = () => {
    if (!newIncome.amount || Number(newIncome.amount) <= 0) return;
    const updatedEvent = { ...selectedEvent, income: [...selectedEvent.income, { id: Date.now(), description: newIncome.description, amount: Number(newIncome.amount) }] };
    handleUpdateEvent(updatedEvent);
    setNewIncome({ description: '', amount: '' });
  };
  const handleAddExpense = () => {
    if (!newExpense.amount || Number(newExpense.amount) <= 0) return;
    const updatedEvent = { ...selectedEvent, expenses: [...selectedEvent.expenses, { id: Date.now(), description: newExpense.description, amount: Number(newExpense.amount) }] };
    handleUpdateEvent(updatedEvent);
    setNewExpense({ description: '', amount: '' });
  };
  const handleDeleteIncome = (id) => handleUpdateEvent({ ...selectedEvent, income: selectedEvent.income.filter(i => i.id !== id) });
  const handleDeleteExpense = (id) => handleUpdateEvent({ ...selectedEvent, expenses: selectedEvent.expenses.filter(e => e.id !== id) });
  const getEventTotal = (ev) => {
    const totalIncome = ev.income.reduce((s, i) => s + i.amount, 0);
    const totalExpense = ev.expenses.reduce((s, e) => s + e.amount, 0);
    return { totalIncome, totalExpense, profit: totalIncome - totalExpense };
  };

  const sortedEvents = [...events].reverse();

  return (
    <div style={s.page}>
      {/* Hero Header */}
      <div style={s.hero}>
        <div style={{ position: 'absolute', top: -50, right: -20, width: 300, height: 300, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <h1 style={s.heroTitle}>Event Accounts</h1>
        <p style={s.heroSub}>Manage Event Finances</p>
      </div>

      {/* Create Button */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setShowCreate(true)} style={s.btnPrimary}>+ Create New Event</button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={s.modal} onClick={() => setShowCreate(false)}>
          <div style={s.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 24 }}>Create New Event</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={s.label}>Event Name</label>
                <input type="text" value={newEvent.name} onChange={e => setNewEvent({ ...newEvent, name: e.target.value })} placeholder="e.g., Gittu's Wedding" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Date</label>
                <input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Event Type</label>
                <select value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })} style={s.select}>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_LABELS[t]}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button onClick={handleCreateEvent} style={{ ...s.btnPrimary, flex: 1, justifyContent: 'center' }}>Create Event</button>
                <button onClick={() => setShowCreate(false)} style={s.btnGhost}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Event List (Left) */}
        <div>
          <div style={s.card}>
            <div style={s.cardHeader}>
              <h3 style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>Events</h3>
              <span style={{ fontSize: 12, color: '#64748b' }}>{events.length} total</span>
            </div>
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {sortedEvents.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>No events yet.</div>
              ) : sortedEvents.map((ev, idx) => {
                const { profit } = getEventTotal(ev);
                const isActive = selectedEvent?.id === ev.id;
                const avatarGrad = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    style={{
                      padding: '14px 18px', cursor: 'pointer', transition: 'all 0.2s',
                      background: isActive ? '#312e81' : 'transparent',
                      borderLeft: isActive ? '4px solid #6366f1' : '4px solid transparent',
                      borderBottom: '1px solid #1e293b',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#0f172a'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, background: avatarGrad,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 800, color: 'white', flexShrink: 0,
                      }}>
                        {ev.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: isActive ? '#e0e7ff' : '#f1f5f9', fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={s.badge(ev.type)}>{EVENT_LABELS[ev.type]}</span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{formatDate(ev.date)}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: profit >= 0 ? '#818cf8' : '#f87171', flexShrink: 0 }}>{formatTaka(profit)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Event Detail (Right) */}
        <div>
          {selectedEvent ? (
            selectedEvent.type === 'friends_event' ? (
              <FriendsEventTemplate event={selectedEvent} onUpdate={handleUpdateEvent} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Event Header Card */}
                <div style={s.card}>
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>{selectedEvent.name}</h3>
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>{EVENT_LABELS[selectedEvent.type]} &middot; {formatDate(selectedEvent.date)}</p>
                      </div>
                      <button onClick={() => handleDeleteEvent(selectedEvent.id)} style={s.btnDanger}>Delete</button>
                    </div>
                    {(() => { const { totalIncome, totalExpense, profit } = getEventTotal(selectedEvent); return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
                        <div style={s.statBox('#6366f1')}>
                          <p style={s.statLabel('#818cf8')}>Income</p>
                          <p style={s.statValue('#a5b4fc')}>{formatTaka(totalIncome)}</p>
                        </div>
                        <div style={s.statBox('#ef4444')}>
                          <p style={s.statLabel('#f87171')}>Expense</p>
                          <p style={s.statValue('#fca5a5')}>{formatTaka(totalExpense)}</p>
                        </div>
                        <div style={s.statBox(profit >= 0 ? '#10b981' : '#f59e0b')}>
                          <p style={s.statLabel(profit >= 0 ? '#34d399' : '#fbbf24')}>Profit/Loss</p>
                          <p style={s.statValue(profit >= 0 ? '#6ee7b7' : '#fde68a')}>{formatTaka(profit)}</p>
                        </div>
                      </div>
                    ); })()}
                  </div>
                </div>

                {/* Income Card */}
                <div style={s.card}>
                  <div style={{ ...s.cardHeader, background: 'linear-gradient(135deg, #312e81, #3730a3)' }}>
                    <h3 style={{ fontWeight: 700, color: '#e0e7ff', fontSize: 15 }}>Income</h3>
                  </div>
                  <div style={s.cardBody}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      <input type="text" value={newIncome.description} onChange={e => setNewIncome({ ...newIncome, description: e.target.value })} placeholder="Description" style={{ ...s.input, flex: 1 }} />
                      <input type="number" value={newIncome.amount} onChange={e => setNewIncome({ ...newIncome, amount: e.target.value })} placeholder="Amount" min="0" style={{ ...s.input, width: 130 }} />
                      <button onClick={handleAddIncome} style={{ ...s.btnPrimary, padding: '8px 16px', fontSize: 13 }}>+ Add</button>
                    </div>
                    <div>
                      {selectedEvent.income.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 13 }}>No income entries</p>
                      ) : selectedEvent.income.map((inc, i) => (
                        <div key={inc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
                          <span style={{ fontSize: 14, color: '#e2e8f0' }}>{inc.description || '-'}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#818cf8' }}>{formatTaka(inc.amount)}</span>
                            <button onClick={() => handleDeleteIncome(inc.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>X</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expenses Card */}
                <div style={s.card}>
                  <div style={{ ...s.cardHeader, background: 'linear-gradient(135deg, #7f1d1d, #991b1b)' }}>
                    <h3 style={{ fontWeight: 700, color: '#fecaca', fontSize: 15 }}>Expenses</h3>
                  </div>
                  <div style={s.cardBody}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      <input type="text" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} placeholder="Description" style={{ ...s.input, flex: 1 }} />
                      <input type="number" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} placeholder="Amount" min="0" style={{ ...s.input, width: 130 }} />
                      <button onClick={handleAddExpense} style={{ ...s.btnPrimary, background: 'linear-gradient(135deg, #ef4444, #dc2626)', padding: '8px 16px', fontSize: 13 }}>+ Add</button>
                    </div>
                    <div>
                      {selectedEvent.expenses.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 13 }}>No expense entries</p>
                      ) : selectedEvent.expenses.map((exp, i) => (
                        <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
                          <span style={{ fontSize: 14, color: '#e2e8f0' }}>{exp.description || '-'}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#f87171' }}>{formatTaka(exp.amount)}</span>
                            <button onClick={() => handleDeleteExpense(exp.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>X</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div style={{ ...s.card, padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>&#128197;</div>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>Select an event</p>
              <p style={{ fontSize: 13, color: '#64748b' }}>Choose an event from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventAccounts;
