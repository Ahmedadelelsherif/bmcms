// ===== security-improvements.js =====
// تحسينات الأمان والمصادقة المتقدمة

// ===== تشفير كلمات المرور باستخدام SHA-256 =====
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ===== التحقق من قوة كلمة المرور =====
function validatePasswordStrength(password) {
  const strength = {
    score: 0,
    feedback: [],
    isStrong: false
  };

  if (password.length >= 8) strength.score++;
  else strength.feedback.push('يجب أن تكون كلمة المرور 8 أحرف على الأقل');

  if (/[A-Z]/.test(password)) strength.score++;
  else strength.feedback.push('أضف أحرف كبيرة');

  if (/[a-z]/.test(password)) strength.score++;
  else strength.feedback.push('أضف أحرف صغيرة');

  if (/[0-9]/.test(password)) strength.score++;
  else strength.feedback.push('أضف أرقام');

  if (/[!@#$%^&*]/.test(password)) strength.score++;
  else strength.feedback.push('أضف رموز خاصة (!@#$%^&*)');

  strength.isStrong = strength.score >= 4;
  return strength;
}

// ===== إدارة الجلسات المحسّنة =====
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 دقيقة
let sessionTimer = null;
let lastActivityTime = Date.now();

function resetSessionTimer() {
  lastActivityTime = Date.now();
  
  if (sessionTimer) clearTimeout(sessionTimer);
  
  if (curUser) {
    sessionTimer = setTimeout(() => {
      showToast('⏱️ انتهت مهلة الجلسة - يرجى تسجيل الدخول مجدداً', false);
      logout();
    }, SESSION_TIMEOUT_MS);
  }
}

// تفعيل مراقبة النشاط
document.addEventListener('click', resetSessionTimer);
document.addEventListener('keydown', resetSessionTimer);
document.addEventListener('mousemove', resetSessionTimer);

// ===== تسجيل الأنشطة الأمنية =====
let activityLog = JSON.parse(localStorage.getItem(STORAGE.LOG) || '[]');

function logSecurityEvent(eventType, details) {
  const event = {
    type: eventType,
    user: curUser?.name || 'مجهول',
    timestamp: new Date().toISOString(),
    details: details,
    ipInfo: 'local' // في بيئة حقيقية، يتم الحصول على IP من الخادم
  };
  
  activityLog.unshift(event);
  if (activityLog.length > APP.LOG_MAX) activityLog.pop();
  localStorage.setItem(STORAGE.LOG, JSON.stringify(activityLog));
  
  // إرسال إلى Firebase إذا كان متاحاً
  if (dbRef) {
    fbWrite('security_logs/' + Date.now(), event).catch(e => console.warn('خطأ في تسجيل الحدث الأمني', e));
  }
}

// ===== تحسين دالة تسجيل الدخول =====
async function doLoginImproved() {
  let u = document.getElementById('l-user-sel').value.trim();
  let p = document.getElementById('l-pass').value.trim();
  
  if (!u || !p) {
    showToast('⚠️ أدخل البيانات', false);
    logSecurityEvent('LOGIN_ATTEMPT_FAILED', 'بيانات فارغة');
    return;
  }
  
  try {
    // تشفير كلمة المرور
    const hashedPassword = await hashPassword(p);
    
    if (u === 'admin' && hashedPassword === await hashPassword(adminPass)) {
      curUser = { name: 'المدير', role: 'admin' };
      logSecurityEvent('LOGIN_SUCCESS', 'تسجيل دخول المدير');
    } else {
      if (locked) {
        showToast('🔒 القافلة مغلقة', false);
        logSecurityEvent('LOGIN_ATTEMPT_LOCKED', 'محاولة دخول والقافلة مغلقة');
        return;
      }
      
      let emp = staff.find(s => s.name === u);
      if (!emp) {
        showToast('⚠️ المستخدم غير موجود', false);
        logSecurityEvent('LOGIN_ATTEMPT_INVALID_USER', `محاولة دخول باسم: ${u}`);
        return;
      }
      
      const storedHashedPassword = emp.passHash || await hashPassword(emp.pass);
      if (hashedPassword !== storedHashedPassword) {
        showToast('⚠️ كلمة سر خاطئة', false);
        logSecurityEvent('LOGIN_ATTEMPT_WRONG_PASSWORD', `محاولة دخول خاطئة للمستخدم: ${u}`);
        return;
      }
      
      curUser = { name: emp.name, role: emp.dept, staffRole: emp.staffRole || 'data_entry' };
      logSecurityEvent('LOGIN_SUCCESS', `تسجيل دخول: ${emp.name}`);
    }
    
    curDay = loginDay || 1;
    document.getElementById('loginOv').style.display = 'none';
    resetSessionTimer();
    applyUser();
    
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    showToast('❌ حدث خطأ في تسجيل الدخول', false);
    logSecurityEvent('LOGIN_ERROR', error.message);
  }
}

// ===== تحسين دالة إضافة الموظف =====
async function addStaffImproved() {
  let n = document.getElementById('ns-name').value.trim();
  let d = document.getElementById('ns-dept').value;
  let p = document.getElementById('ns-pass').value.trim();
  let r = document.getElementById('ns-role')?.value || 'data_entry';
  
  if (!n || !d || !p) {
    showToast('⚠️ املأ الكل', false);
    return;
  }
  
  // التحقق من قوة كلمة المرور
  const strength = validatePasswordStrength(p);
  if (!strength.isStrong) {
    showToast('⚠️ كلمة المرور ضعيفة: ' + strength.feedback.join(', '), false);
    return;
  }
  
  if (staff.find(s => s.name === n)) {
    showToast('⚠️ المستخدم موجود بالفعل', false);
    return;
  }
  
  try {
    const hashedPassword = await hashPassword(p);
    
    staff.push({
      name: n,
      dept: d,
      pass: p, // الاحتفاظ بالأصلي للتوافقية
      passHash: hashedPassword, // الجديد المشفر
      staffRole: r,
      createdAt: new Date().toISOString(),
      lastLogin: null
    });
    
    localStorage.setItem(STORAGE.STAFF, JSON.stringify(staff));
    renderStaffList();
    populateLoginUsers();
    
    if (dbRef) {
      dbRef.child(STORAGE.STAFF).set(staff);
    }
    
    logSecurityEvent('STAFF_ADDED', `إضافة موظف: ${n}`);
    logActivity('إضافة موظف', n + ' — ' + (r === 'supervisor' ? 'مشرف' : 'موظف إدخال'));
    showToast('✅ تم إضافة ' + n);
    
    // تنظيف النموذج
    document.getElementById('ns-name').value = '';
    document.getElementById('ns-pass').value = '';
    
  } catch (error) {
    console.error('خطأ في إضافة الموظف:', error);
    showToast('❌ حدث خطأ في إضافة الموظف', false);
  }
}

// ===== تحسين دالة تسجيل الخروج =====
function logoutImproved() {
  if (curUser) {
    logSecurityEvent('LOGOUT', `تسجيل خروج: ${curUser.name}`);
  }
  
  if (sessionTimer) clearTimeout(sessionTimer);
  
  curUser = null;
  document.getElementById('loginOv').style.display = 'flex';
  gotoSc('setup');
  showToast('👋 تم تسجيل الخروج بنجاح');
}

// ===== عرض سجل الأمان =====
function showSecurityLog() {
  const logEntries = activityLog.filter(e => e.type && e.type.includes('LOGIN'));
  
  let html = '<div style="max-height:400px;overflow-y:auto">';
  
  if (!logEntries.length) {
    html += '<p style="color:var(--mu);text-align:center;padding:20px">لا توجد عمليات تسجيل دخول</p>';
  } else {
    html += '<table style="width:100%;border-collapse:collapse;font-size:11px">';
    html += '<thead><tr style="background:var(--pr);color:#fff"><th style="padding:8px">النوع</th><th style="padding:8px">المستخدم</th><th style="padding:8px">الوقت</th><th style="padding:8px">التفاصيل</th></tr></thead>';
    html += '<tbody>';
    
    logEntries.forEach(e => {
      const bgColor = e.type === 'LOGIN_SUCCESS' ? '#f0fff4' : '#fff0f0';
      html += `<tr style="background:${bgColor};border-bottom:1px solid var(--bdr)">
        <td style="padding:8px">${e.type}</td>
        <td style="padding:8px">${e.user}</td>
        <td style="padding:8px">${new Date(e.timestamp).toLocaleString('ar-EG')}</td>
        <td style="padding:8px">${e.details}</td>
      </tr>`;
    });
    
    html += '</tbody></table>';
  }
  
  html += '</div>';
  
  // عرض في نافذة منفصلة أو modal
  const modal = document.getElementById('securityLogModal') || createSecurityLogModal();
  modal.querySelector('.mbox').innerHTML = '<h3>📋 سجل الأمان</h3>' + html;
  modal.classList.add('show');
}

function createSecurityLogModal() {
  const modal = document.createElement('div');
  modal.id = 'securityLogModal';
  modal.className = 'mov';
  modal.innerHTML = `
    <div class="mbox" style="max-width:600px">
      <h3>📋 سجل الأمان</h3>
      <div id="securityLogContent"></div>
      <div class="macts" style="margin-top:20px">
        <button class="btn pr" onclick="document.getElementById('securityLogModal').classList.remove('show')">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

// ===== تنبيهات الأمان =====
function checkSecurityAlerts() {
  const loginAttempts = activityLog.filter(e => 
    e.type === 'LOGIN_ATTEMPT_FAILED' && 
    new Date(e.timestamp) > new Date(Date.now() - 15 * 60 * 1000) // آخر 15 دقيقة
  );
  
  if (loginAttempts.length >= 5) {
    showToast('⚠️ تنبيه أمني: محاولات دخول متعددة فاشلة', false);
    logSecurityEvent('SECURITY_ALERT', 'محاولات دخول متعددة فاشلة');
  }
}

// التحقق من التنبيهات كل دقيقة
setInterval(checkSecurityAlerts, 60000);
