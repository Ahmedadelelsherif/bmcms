/**
 * ══════════════════════════════════════════════════════
 * firebase.js — قاعدة البيانات الفورية
 * ══════════════════════════════════════════════════════
 * كل عمليات Firebase تمر من هنا فقط.
 * لا تكتب dbRef.child() في أي ملف آخر.
 *
 * يعتمد على: config.js, state.js
 * ══════════════════════════════════════════════════════
 *
 * إزاي تستخدمه:
 * - fbWrite('records/123', data) → اكتب مع error handling
 * - fbRemove('records/123')      → احذف مع error handling
 * - initFirebase(url)            → شغّل الاتصال + listeners
 *
 * Listeners تلقائية (بتشتغل بدون ما تستدعيهم):
 *   /records → يحدّث records[] فوراً على كل الأجهزة
 *   /staff   → يحدّث staff[] فوراً على كل الأجهزة
 *   /config  → يحدّث القفل والـ session والكلمة السر
 * ══════════════════════════════════════════════════════
 */

// ── Safe Write ─────────────────────────────────────────────────────
function fbWrite(path, data) {
  if (!dbRef) return Promise.resolve();
  return dbRef.child(path).set(data).catch(function(err) {
    console.warn('[Firebase write error]', path, err.message);
  });
}

// ── Safe Remove ────────────────────────────────────────────────────
function fbRemove(path) {
  if (!dbRef) return Promise.resolve();
  return dbRef.child(path).remove().catch(function(err) {
    console.warn('[Firebase remove error]', path, err.message);
  });
}

// ── Initialize Firebase + Start Listeners ──────────────────────────
function initFirebase(url) {
  try {
    firebase.initializeApp({ databaseURL: url });
    dbRef = firebase.database().ref();
  } catch (e) {
    console.warn('[Firebase init error]', e.message);
    return;
  }

  // ── records listener ── بيحدّث قائمة المرضى فوراً ─────────────
  dbRef.child('records').on('value', function(snap) {
    var d = snap.val();
    if (!d) return;
    records = Object.values(d).filter(Boolean);
    localStorage.setItem(STORAGE.RECORDS, JSON.stringify(records));
    if (typeof renderRec === 'function') renderRec();
    var statsEl = document.getElementById('sc-stats');
    if (statsEl && statsEl.classList.contains('active') && typeof buildStats === 'function') buildStats();
  });

  // ── staff listener ── بيحدّث قائمة الموظفين فوراً ─────────────
  dbRef.child('staff').on('value', function(snap) {
    var d = snap.val();
    if (!d) return;
    var arr = Array.isArray(d) ? d : Object.values(d);
    staff = arr.filter(Boolean);
    localStorage.setItem(STORAGE.STAFF, JSON.stringify(staff));
    if (typeof renderStaffList === 'function') renderStaffList();
    if (typeof populateLoginUsers === 'function') populateLoginUsers();
  });

  // ── config listener ── قفل، session، adminPass ─────────────────
  dbRef.child('config').on('value', function(snap) {
    var d = snap.val();
    if (!d) return;

    if (d.session) {
      session = d.session;
      localStorage.setItem(STORAGE.SESSION, JSON.stringify(session));
    }
    if (typeof d.locked !== 'undefined') {
      locked = d.locked;
      localStorage.setItem(STORAGE.LOCKED, locked ? '1' : '0');
      if (typeof updateLockUI === 'function') updateLockUI();
    }
    if (d.adminPass) {
      adminPass = d.adminPass;
      localStorage.setItem(STORAGE.PASS, adminPass);
    }
    if (d.staff && (Array.isArray(d.staff) || typeof d.staff === 'object')) {
      var arr2 = Array.isArray(d.staff) ? d.staff : Object.values(d.staff);
      staff = arr2.filter(Boolean);
      localStorage.setItem(STORAGE.STAFF, JSON.stringify(staff));
      if (typeof populateLoginUsers === 'function') populateLoginUsers();
    }
  });
}
