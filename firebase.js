// ===== firebase.js =====
function initFirebase(url) {
  try {
    firebase.initializeApp({ databaseURL: url });
    dbRef = firebase.database().ref();
  } catch (e) {
    console.warn('[Firebase init error]', e.message);
    return;
  }

  dbRef.child('records').on('value', function(snap) {
    var d = snap.val();
    if (!d) return;
    records = Object.values(d).filter(Boolean);
    localStorage.setItem(STORAGE.RECORDS, JSON.stringify(records));
    if (typeof renderRec === 'function') renderRec();
    var statsEl = document.getElementById('sc-stats');
    if (statsEl && statsEl.classList.contains('active') && typeof buildStats === 'function') buildStats();
  });

  dbRef.child('staff').on('value', function(snap) {
    var d = snap.val();
    if (!d) return;
    var arr = Array.isArray(d) ? d : Object.values(d);
    staff = arr.filter(Boolean);
    localStorage.setItem(STORAGE.STAFF, JSON.stringify(staff));
    if (typeof renderStaffList === 'function') renderStaffList();
    if (typeof populateLoginUsers === 'function') populateLoginUsers();
  });

  dbRef.child('config').on('value', function(snap) {
    var d = snap.val();
    if (!d) return;
    if (d.session) {
      session = d.session;
      localStorage.setItem(STORAGE.SESSION, JSON.stringify(session));
      if (typeof applySessUI === 'function') applySessUI();
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
  });
}

function fbWrite(path, data) {
  if (!dbRef) return Promise.resolve();
  return dbRef.child(path).set(data).catch(function(err) {
    console.warn('[Firebase write error]', path, err.message);
  });
}

function fbRemove(path) {
  if (!dbRef) return Promise.resolve();
  return dbRef.child(path).remove().catch(function(err) {
    console.warn('[Firebase remove error]', path, err.message);
  });
}