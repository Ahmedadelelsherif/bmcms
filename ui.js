/**
 * ui.js — واجهة المستخدم
 * يعتمد على: config.js, state.js
 *
 * showToast(msg, ok)           → رسالة مؤقتة
 * gotoSc('records')            → التنقل بين الشاشات
 * autoBloodResult(id, min, max) → auto-detect طبيعي/غير طبيعي
 * autoBpResult()               → auto-detect ضغط الدم
 * autoRbsResult('sc')          → auto-detect السكر
 * sR(el)                       → لوّن select حسب النتيجة
 * logActivity(action, detail)  → سجّل في سجل النشاط
 */

// ── Splash Screen ────────────────────────────────────────────────
(function(){
  setTimeout(function(){
    var s=document.getElementById('splash');
    if(!s)return;
    s.style.opacity='0';
    setTimeout(function(){s.style.display='none';try{s.remove();}catch(e){}},650);
  },2200);
})();

// ════════════════════════════════════════════════════════════════════
// 15. TOAST & MODAL — الرسائل والنوافذ المنبثقة
//    📌 showToast(msg, ok): رسالة مؤقتة (خضراء=ok، حمراء=false)
//    📌 closeMov(id): إغلاق أي نافذة منبثقة بـ id بتاعها
// ════════════════════════════════════════════════════════════════════
function showToast(msg, ok=true){
  let t = document.getElementById('toast');
  t.style.background = ok ? 'var(--ok)' : 'var(--no)';
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 3200);
}
function closeMov(id){ document.getElementById(id).classList.remove('show'); }
function gotoSc(id){
  document.querySelectorAll('.sc').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('active'));
  document.getElementById('sc-'+id).classList.add('active');
  let nav=document.getElementById('nav-'+id);
  if(nav) nav.classList.add('active');
  if(id==='records') renderRec();
  if(id==='stats') buildStats();
}
// ════════════════════════════════════════════════════════════════════
// 8. UI HELPERS — دوال مساعدة للواجهة
//    📌 autoBpResult: حساب نتيجة الضغط تلقائياً (≥140 أو ≥90)
//    📌 autoRbsResult: حساب نتيجة السكر تلقائياً (>200)
//    📌 sR(el): تلوين الخانة حسب النتيجة (طبيعي/غير طبيعي)
// ════════════════════════════════════════════════════════════════════
// دالة auto-detect للتحاليل الرقمية
function autoBloodResult(id, min, max){
  const val=parseFloat(document.getElementById(id)?.value);
  if(isNaN(val)||val===0)return;
  const sel=document.getElementById(id+'-r');
  if(!sel)return;
  sel.value=(val>=min&&val<=max)?'طبيعي':'غير طبيعي';
  sR(sel);
}
function autoBpResult(){
  let sys=parseInt(document.getElementById('sc-bp-sys')?.value)||0;
  let dia=parseInt(document.getElementById('sc-bp-dia')?.value)||0;
  if(!sys&&!dia) return;
  let sel=document.getElementById('sc-bp-r');
  sel.value = (sys>=140 || dia>=90) ? 'غير طبيعي' : 'طبيعي';
  sR(sel);
}
function autoRbsResult(px){
  let val=parseFloat(document.getElementById(px+'-rbs')?.value)||0;
  if(!val) return;
  let sel=document.getElementById(px+'-rbs-r');
  if(!sel) return;
  sel.value = val>200 ? 'غير طبيعي' : (val>=70 ? 'طبيعي' : 'غير طبيعي');
  sR(sel);
}
function sR(el){
  if(!el) return;
  el.classList.remove('res-pos','res-neg');
  if(el.value==='غير طبيعي') el.classList.add('res-pos');
  else if(el.value==='طبيعي') el.classList.add('res-neg');
}
function logActivity(action, detail){
  const entry = {
    user: curUser?.name||'—', action, detail,
    time: new Date().toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}),
    date: new Date().toLocaleDateString('ar-EG')
  };
  activityLog.unshift(entry);
  if(activityLog.length > APP.LOG_MAX) activityLog.pop();
  localStorage.setItem(STORAGE.LOG, JSON.stringify(activityLog));
}
// ── Activity Log UI ─────────────────────────────────────────────────
function toggleActLog(){
  const wrap=document.getElementById('actLogWrap');
  const btn=document.getElementById('actLogBtn');
  if(!wrap)return;
  if(wrap.style.display==='none'){
    wrap.style.display='block';
    btn.textContent='📜 إخفاء سجل النشاط';
    const list=document.getElementById('actLogList');
    if(!activityLog.length){
      list.innerHTML='<p style="color:var(--mu);text-align:center;padding:12px">لا يوجد نشاط مسجّل بعد</p>';
      return;
    }
    list.innerHTML=activityLog.map(e=>`
      <div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid var(--bdr)">
        <div style="background:var(--pr);color:#fff;padding:3px 7px;border-radius:20px;font-size:9px;white-space:nowrap;font-weight:700">${e.action}</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:11px">${e.detail||''}</div>
          <div style="color:var(--mu);font-size:10px">👤 ${e.user} — ${e.date} ${e.time}</div>
        </div>
      </div>`).join('');
  }else{
    wrap.style.display='none';
    btn.textContent='📜 عرض سجل النشاط';
  }
}
