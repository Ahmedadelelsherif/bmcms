/**
 * init.js — تهيئة الصفحة (آخر ملف يُشغَّل)
 * يعتمد على: كل الملفات السابقة
 *
 * ⚠️ لا تضيف هنا أي منطق — الملفات الأخرى هي المكان الصح
 */

// شغّل Firebase (URL ثابت في config.js)
initFirebase('https://kawafel-default-rtdb.firebaseio.com');

// ملأ شاشة الدخول
populateLoginUsers();

// حالة القفل في شاشة الدخول
showLockStatusOnLogin();
