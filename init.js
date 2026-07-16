// ===== init.js =====
document.addEventListener('DOMContentLoaded', function() {
  // تشغيل Firebase
  initFirebase('https://kawafel-default-rtdb.firebaseio.com');

  // تعبئة قائمة المستخدمين
  populateLoginUsers();

  // عرض حالة القفل
  updateLockUI();

  // عرض حالة القفل في صندوق الدخول
  var lockEl = document.getElementById('lockStatusLogin');
  if (lockEl) {
    lockEl.innerHTML = locked ?
      '<div style="background:#fff0f0;border:1px solid #e0aaaa;border-radius:8px;padding:7px 12px;font-size:11px;color:#7a1a1a;font-weight:700;text-align:center;margin-bottom:10px">🔒 القافلة مغلقة — الدخول للمدير فقط</div>' :
      '';
  }

  console.log('✅ منظومة القوافل العلاجية جاهزة');
});
