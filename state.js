/**
 * ══════════════════════════════════════════════════════
 * state.js — الحالة العامة للتطبيق
 * ══════════════════════════════════════════════════════
 * كل المتغيرات العامة في مكان واحد. لو محتاج متغير جديد: ضيفه هنا.
 *
 * يعتمد على: config.js
 * ══════════════════════════════════════════════════════
 */

// ══════════════════════════════════════════════════════
// إزاي تستخدم state.js
// ══════════════════════════════════════════════════════
// - records: مصفوفة كل المرضى المسجلين
// - staff: مصفوفة الموظفين
// - session: بيانات القافلة الحالية
// - curUser: المستخدم الحالي {name, role, staffRole}
// - tabs: التبويبات المفتوحة {id: {dept, data, editId, ...}}
// - activeTabId: التبويب الحالي
// - locked: هل القافلة مغلقة؟
// ══════════════════════════════════════════════════════

// ── بيانات القافلة والمرضى ──────────────────────────
let session=JSON.parse(localStorage.getItem(STORAGE.SESSION)||'null');
let records=JSON.parse(localStorage.getItem(STORAGE.RECORDS)||'[]');
let staff=JSON.parse(localStorage.getItem(STORAGE.STAFF)||'[]');
let adminPass=localStorage.getItem(STORAGE.PASS)||'1234';
let locked=localStorage.getItem(STORAGE.LOCKED)==='1';
let curUser=null, curDay=1, loginDay=1;

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

// ════════════════════════════════════════════════════════════════════
// 3. FIREBASE — إعداد قاعدة البيانات والاتصال
//    🔗 Database URL: https://kawafel-default-rtdb.firebaseio.com
//    ⚠️ لو غيّرت الـ URL: غيّره هنا فقط في السطر التالي مباشرة
// ════════════════════════════════════════════════════════════════════
let fbUrl = 'https://kawafel-default-rtdb.firebaseio.com';
let dbRef=null;

// ── حالة التبويبات ──────────────────────────────────
let tabs = {};
let activeTabId = null;
let tabCounter = 0;
let pendingPhone = null;