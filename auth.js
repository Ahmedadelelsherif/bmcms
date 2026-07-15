/**
 * auth.js — الصلاحيات والمستخدمين
 * يعتمد على: config.js, state.js, ui.js, firebase.js
 *
 * doLogin()           → تسجيل الدخول
 * logout()            → تسجيل الخروج
 * applyUser()         → ضبط الشاشة حسب الدور
 * addStaff()          → إضافة موظف (يحفظ Firebase فوراً)
 * lockCaravan()       → قفل القافلة
 *
 * أدوار المستخدمين:
 * 'admin'       → كل الصلاحيات
 * 'supervisor'  → إضافة + تعديل (بدون حذف)
 * 'data_entry'  → إضافة فقط
 */

function setLoginDay(d){
  loginDay=d;
  const pr='var(--pr)', bd='var(--bdr)';
  const b1=document.getElementById('ldb1'), b2=document.getElementById('ldb2');
  b1.style.cssText=`flex:1;padding:9px;border:2px solid ${d===1?pr:bd};border-radius:8px;background:${d===1?'var(--pr)':'#fff'};color:${d===1?'#fff':'var(--mu)'};font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;cursor:pointer`;
  b2.style.cssText=`flex:1;padding:9px;border:2px solid ${d===2?pr:bd};border-radius:8px;background:${d===2?'var(--pr)':'#fff'};color:${d===2?'#fff':'var(--mu)'};font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;cursor:pointer`;
  const dateEl=document.getElementById('loginDayDate');
  if(session && dateEl) dateEl.textContent = d===1?(session.day1?'📅 '+session.day1:''):(session.day2?'📅 '+session.day2:'');
}
function onLoginUserSel(){
  const u=document.getElementById('l-user-sel').value;
  document.getElementById('daySelLogin').style.display=(u&&session)?'block':'none';
  if(u&&session) setLoginDay(loginDay||1);
}
function populateLoginUsers(){
  let sel=document.getElementById('l-user-sel');
  let cur=sel.value||'';
  sel.innerHTML='<option value="">-- اختر --</option><option value="admin">⚙️ المدير</option>'+
    staff.map(s=>`<option value="${s.name}">${DICONS[s.dept]||''} ${s.name}</option>`).join('');
  if(cur) sel.value=cur;
}
function doLogin(){
  let u=document.getElementById('l-user-sel').value.trim();
  let p=document.getElementById('l-pass').value.trim();
  if(!u||!p){ showToast('⚠️ أدخل البيانات',false); return; }
  if(u==='admin' && p===adminPass){ curUser={name:'المدير',role:'admin'}; }
  else {
    if(locked){ showToast('🔒 القافلة مغلقة',false); return; }
    let emp=staff.find(s=>s.name===u && s.pass===p);
    if(!emp){ showToast('⚠️ كلمة سر خاطئة',false); return; }
    curUser={name:emp.name, role:emp.dept, staffRole:emp.staffRole||'data_entry'};
  }
  curDay = loginDay || 1;
  document.getElementById('loginOv').style.display='none';
  applyUser();
}
function logout(){ curUser=null; document.getElementById('loginOv').style.display='flex'; gotoSc('setup'); }
function applyUser(){
  let isAdmin = (curUser.role === 'admin');
  document.getElementById('ubadge').style.display='flex';
  document.getElementById('uname').textContent=curUser.name;
  document.getElementById('logoutBtn').style.display='flex';
  ['entry','records','stats'].forEach(id=>{
    let b=document.getElementById('nav-'+id);
    if(b) b.removeAttribute('disabled');
  });
  
  if(isAdmin){
    document.getElementById('staffCard').style.display='block';
    document.getElementById('adminCard').style.display='block';
    document.getElementById('deptChooser').style.display='block';
    renderStaffList(); updateLockUI();
  } else {
    document.getElementById('staffCard').style.display='none';
    document.getElementById('adminCard').style.display='none';
    document.getElementById('deptChooser').style.display='none';
    let db=document.getElementById('dbadge');
    db.className='dbadge '+curUser.role;
    db.textContent=DICONS[curUser.role]+' '+DNAMES[curUser.role];
    db.style.display='flex';
  }
  
  if(session){ applySessUI(); gotoSc('entry'); }
  else { gotoSc('setup'); }
  showToast('✅ مرحباً');
}
// ════════════════════════════════════════════════════════════════════
// 9. STAFF — إدارة الموظفين
//    📌 addStaff: إضافة ← بيتحفظ localStorage + Firebase تلقائياً
//    📌 removeStaff: حذف ← نفس الشيء
//    ✅ أي تغيير هنا يظهر فوراً على كل الأجهزة
// ════════════════════════════════════════════════════════════════════
function addStaff(){
  let n=document.getElementById('ns-name').value.trim();
  let d=document.getElementById('ns-dept').value;
  let p=document.getElementById('ns-pass').value.trim();
  let r=document.getElementById('ns-role')?.value||'data_entry';
  if(!n||!d||!p){ showToast('⚠️ املأ الكل',false); return; }
  if(staff.find(s=>s.name===n)){ showToast('⚠️ موجود',false); return; }
  staff.push({name:n, dept:d, pass:p, staffRole:r});
  localStorage.setItem(STORAGE.STAFF, JSON.stringify(staff));
  renderStaffList(); populateLoginUsers();
  if(dbRef) dbRef.child(STORAGE.STAFF).set(staff);
  logActivity('إضافة موظف', n+' — '+(r==='supervisor'?'مشرف':'موظف إدخال'));
  showToast('✅ تم إضافة '+n);
}
function removeStaff(i){
  if(!confirm('حذف؟')) return;
  logActivity('حذف موظف', staff[i]?.name||'');
  staff.splice(i,1);
  localStorage.setItem(STORAGE.STAFF, JSON.stringify(staff));
  renderStaffList(); populateLoginUsers();
  if(dbRef) dbRef.child(STORAGE.STAFF).set(staff);
}
function renderStaffList(){
  let c=document.getElementById('staffList');
  if(!staff.length){ c.innerHTML='<p style="color:var(--mu)">لا يوجد</p>'; return; }
  const ROLE_LABELS={supervisor:'🔑 مشرف',data_entry:'📝 إدخال'};
  c.innerHTML=staff.map((s,i)=>`
    <div class="staff-row">
      <span style="font-weight:700">${s.name}</span>
      <span class="staff-dep ${s.dept}">${DNAMES[s.dept]||s.dept}</span>
      <span style="font-size:10px;background:#f0f4ff;padding:2px 8px;border-radius:8px;color:var(--pr)">${ROLE_LABELS[s.staffRole]||'📝 إدخال'}</span>
      <button class="btn sm del" onclick="removeStaff(${i})">🗑️</button>
    </div>
  `).join('');
}
function changeAdminPass(){
  var p=document.getElementById('newAdminPass').value.trim();
  if(p.length<3){showToast('⚠️ كلمة السر قصيرة جداً',false);return;}
  adminPass=p; localStorage.setItem(STORAGE.PASS,p); fbWrite('config/adminPass',p);
  showToast('✅ تم تغيير كلمة السر');
}
// ════════════════════════════════════════════════════════════════════
// 11. LOCK — قفل وفتح القافلة
//    📌 lockCaravan: يمنع الموظفين من الدخول + يحفظ في Firebase
//    📌 unlockCaravan: يسمح بالدخول تاني
//    ✅ القفل يظهر فوراً على كل الأجهزة عبر Firebase
// ════════════════════════════════════════════════════════════════════
function lockCaravan(){ locked=true; localStorage.setItem(STORAGE.LOCKED,'1'); updateLockUI(); if(dbRef) dbRef.child('config').update({locked:true}); showToast('🔒 مغلقة'); }
function unlockCaravan(){ locked=false; localStorage.setItem(STORAGE.LOCKED,'0'); updateLockUI(); if(dbRef) dbRef.child('config').update({locked:false}); showToast('🔓 مفتوحة'); }
function updateLockUI(){
  let l=document.getElementById('lockBtn'), u=document.getElementById('unlockBtn'), b=document.getElementById('lockBannerWrap');
  if(locked){ l.style.display='none'; u.style.display='block'; b.innerHTML='<div style="background:#fff0f0;padding:8px;color:#7a1a1a;text-align:center">🔒 مغلقة</div>'; }
  else { l.style.display='block'; u.style.display='none'; b.innerHTML='<div style="background:#f0fff4;padding:8px;color:#1a5a2a;text-align:center">✅ مفتوحة</div>'; }
}
function showLockStatusOnLogin(){
  var el=document.getElementById('lockStatusLogin');
  if(!el)return;
  el.innerHTML=locked
    ?'<div style="background:#fff0f0;border:1px solid #e0aaaa;border-radius:8px;padding:7px 12px;font-size:11px;color:#7a1a1a;font-weight:700;text-align:center;margin-bottom:10px">🔒 القافلة مغلقة — الدخول للمدير فقط</div>'
    :'';
}
function selDay(d){
  curDay=d;
  document.querySelectorAll('.db').forEach(b=>b.classList.remove('active'));
  var btn=document.getElementById('db'+d);
  if(btn)btn.classList.add('active');
}
