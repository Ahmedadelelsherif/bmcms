/**
 * ══════════════════════════════════════════════════════
 * init.js — تهيئة الصفحة عند الفتح
 * ══════════════════════════════════════════════════════
 * آخر ملف يُشغَّل. يستدعي initFirebase ثم يملأ شاشة الدخول
 *
 * يعتمد على: كل الملفات السابقة
 * ══════════════════════════════════════════════════════
 */

// ══════════════════════════════════════════════════════
// إزاي تستخدم init.js
// ══════════════════════════════════════════════════════
// هذا الملف يُشغَّل مرة واحدة عند فتح الصفحة:
// 1. يشغّل Firebase وبيضع listeners تلقائية
// 2. يملأ قائمة المستخدمين في شاشة الدخول
// 3. يعرض حالة القفل
//
// ⚠️ لا تضيف هنا أي منطق — الملفات الأخرى هي المكان الصح
// ══════════════════════════════════════════════════════

// بيشغّل Firebase ويملأ listeners
initFirebase('https://kawafel-default-rtdb.firebaseio.com');

// بيملأ قائمة المستخدمين في شاشة الدخول
populateLoginUsers();

// يعرض حالة القفل في شاشة الدخول
(function showLockStatus(){
  const el = document.getElementById('lockStatusLogin');
  if(!el) return;
  el.innerHTML = locked
    ? '<div style="background:#fff0f0;border:1px solid #e0aaaa;border-radius:8px;padding:7px 12px;font-size:11px;color:#7a1a1a;font-weight:700;text-align:center;margin-bottom:10px">🔒 القافلة مغلقة — الدخول للمدير فقط</div>'
    : '';
})();
