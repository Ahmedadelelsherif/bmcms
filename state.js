// ===== state.js =====
// يستخدم STORAGE من config.js

let session = JSON.parse(localStorage.getItem(STORAGE.SESSION) || 'null');
let records = JSON.parse(localStorage.getItem(STORAGE.RECORDS) || '[]');
let staff = JSON.parse(localStorage.getItem(STORAGE.STAFF) || '[]');
let adminPass = localStorage.getItem(STORAGE.PASS) || '1234';
let locked = localStorage.getItem(STORAGE.LOCKED) === '1';
let curUser = null, curDay = 1, loginDay = 1;

// حالة التبويبات
let tabs = {};
let activeTabId = null;
let tabCounter = 0;
let pendingPhone = null;

// Firebase
let fbUrl = 'https://kawafel-default-rtdb.firebaseio.com';
let dbRef = null;
