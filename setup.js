// ===== setup.js =====
function buildDashboard() {
  const el = document.getElementById('adminDashboard');
  if (!el || curUser?.role !== 'admin') return;
  const today = new Date().toLocaleDateString('ar-EG');
  const todayRecs = records.filter(r => r.savedAt && new Date(r.savedAt).toLocaleDateString('ar-EG') === today);
  const abnormal = records.filter(r => Object.keys(r).some(k => k.endsWith('R') && ABNORMAL_VALS.has(String(r[k]||'').trim())));
  const cards = [
    { icon: '👥', label: 'إجمالي المرضى', val: records.length, color: '#1a4a6b' },
    { icon: '📅', label: 'مرضى اليوم', val: todayRecs.length, color: '#1a6b4a' },
    { icon: '🩸', label: 'معمل الدم', val: records.filter(r => r.dept === 'blood').length, color: '#8b1a1a' },
    { icon: '🔬', label: 'الطفيليات', val: records.filter(r => r.dept === 'para').length, color: '#6b4a1a' },
    { icon: '📡', label: 'الأشعة', val: records.filter(r => r.dept === 'xray').length, color: '#1a4a6b' },
    { icon: '💊', label: 'افحص واطمن', val: records.filter(r => r.dept === 'screen').length, color: '#4a1a6b' },
    { icon: '⚠️', label: 'حالات غير طبيعية', val: abnormal.length, color: '#8b4a00' },
    { icon: '👤', label: 'موظفون نشطون', val: staff.length, color: '#1a5a4a' },
  ];
  el.innerHTML = `
    <div style="font-size:13px;font-weight:900;color:var(--pr);margin-bottom:10px">📊 لوحة المدير — نظرة سريعة</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
      ${cards.map(c => `
        <div style="background:${c.color};color:#fff;border-radius:10px;padding:12px 10px;text-align:center">
          <div style="font-size:22px;margin-bottom:4px">${c.icon}</div>
          <div style="font-size:22px;font-weight:900;line-height:1">${c.val}</div>
          <div style="font-size:10px;opacity:.85;margin-top:3px">${c.label}</div>
        </div>`).join('')}
    </div>`;
  el.style.display = 'block';
}

let activityLog = JSON.parse(localStorage.getItem(STORAGE.LOG) || '[]');