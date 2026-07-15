/**
 * setup.js — إعداد القافلة والـ Dashboard
 * يعتمد على: config.js, state.js, ui.js, firebase.js, auth.js
 *
 * saveSetup()      → حفظ بيانات القافلة (مدير فقط)
 * applySessUI()    → تحديث بيانات القافلة في الشريط العلوي
 * buildDashboard() → لوحة المدير (البطاقات الكبيرة)
 */

// ════════════════════════════════════════════════════════════════════
// 10. SETUP & LOGIN — إعداد القافلة + تسجيل الدخول
//    📌 saveSetup: حفظ بيانات القافلة ← يفتحها للموظفين
//    📌 doLogin: يتحقق من الـ locked أولاً قبل الدخول
//    📌 applyUser: بيحدد إيه اللي يظهر حسب الدور (admin/موظف)
// ════════════════════════════════════════════════════════════════════
function saveSetup(){
  let c=document.getElementById('s-center').value.trim();
  let v=document.getElementById('s-village').value.trim();
  let d1=document.getElementById('s-d1').value;
  if(!c||!v||!d1){ showToast('⚠️ املأ الحقول',false); return; }
  session={center:c, village:v, day1:d1, day2:document.getElementById('s-d2').value};
  localStorage.setItem(STORAGE.SESSION, JSON.stringify(session));
  if(dbRef) fbWrite('config', {session});
  applySessUI(); showToast('✅ حفظ');
}
function applySessUI(){
  if(!session) return;
  document.getElementById('sessBan').style.display='flex';
  document.getElementById('sb-emp').textContent=curUser.name;
  document.getElementById('sb-vil').textContent=session.village||'';
}
// ── Admin Dashboard Quick Stats (shown at top of stats screen) ──────
function buildDashboard(){
  const el=document.getElementById('adminDashboard');
  if(!el||curUser?.role!=='admin')return;
  const today=new Date().toLocaleDateString('ar-EG');
  const todayRecs=records.filter(r=>r.savedAt&&new Date(r.savedAt).toLocaleDateString('ar-EG')===today);
  const abnormal=records.filter(r=>Object.keys(r).some(k=>k.endsWith('R')&&r[k]==='غير طبيعي'));
  const cards=[
    {icon:'👥',label:'إجمالي المرضى',val:records.length,color:'#1a4a6b'},
    {icon:'📅',label:'مرضى اليوم',val:todayRecs.length,color:'#1a6b4a'},
    {icon:'🩸',label:'معمل الدم',val:records.filter(r=>r.dept==='blood').length,color:'#8b1a1a'},
    {icon:'🔬',label:'الطفيليات',val:records.filter(r=>r.dept==='para').length,color:'#6b4a1a'},
    {icon:'📡',label:'الأشعة',val:records.filter(r=>r.dept==='xray').length,color:'#1a4a6b'},
    {icon:'💊',label:'افحص واطمن',val:records.filter(r=>r.dept==='screen').length,color:'#4a1a6b'},
    {icon:'⚠️',label:'حالات غير طبيعية',val:abnormal.length,color:'#8b4a00'},
    {icon:'👤',label:'موظفون نشطون',val:staff.length,color:'#1a5a4a'},
  ];
  el.innerHTML=`
    <div style="font-size:13px;font-weight:900;color:var(--pr);margin-bottom:10px">📊 لوحة المدير — نظرة سريعة</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
      ${cards.map(c=>`
        <div style="background:${c.color};color:#fff;border-radius:10px;padding:12px 10px;text-align:center">
          <div style="font-size:22px;margin-bottom:4px">${c.icon}</div>
          <div style="font-size:22px;font-weight:900;line-height:1">${c.val}</div>
          <div style="font-size:10px;opacity:.85;margin-top:3px">${c.label}</div>
        </div>`).join('')}
    </div>`;
  el.style.display='block';
}
