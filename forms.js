/**
 * ══════════════════════════════════════════════════════
 * forms.js — نماذج إدخال بيانات المرضى
 * ══════════════════════════════════════════════════════
 * نظام التبويبات، فحص التذكرة، حفظ البيانات
 *
 * يعتمد على: config.js, state.js, ui.js, firebase.js
 * ══════════════════════════════════════════════════════
 */

// ══════════════════════════════════════════════════════
// إزاي تستخدم forms.js
// ══════════════════════════════════════════════════════
// - openNewTab(dept, editRec?)  → افتح تبويب جديد (أو تعديل)
// - switchTab(tabId)            → انتقل لتبويب
// - closeTab(tabId)             → أغلق تبويب
// - saveCurrentTab(dept)        → احفظ البيانات (الخطوة الأخيرة)
// - checkTicket(dept, fieldId)  → تحقق من تكرار التذكرة
// - recToFormData(dept, rec)    → حوّل سجل لبيانات فورم
//
// تسلسل الحفظ:
// saveCurrentTab → checkAbnormal → [pmSavePhone؟] → doFinalSave → Firebase
// ══════════════════════════════════════════════════════

// ── Tab System ──────────────────────────────────────
function getFormIds(dept){
  let px=DEPT_PX[dept];
  let ids = [px+'-ticket', px+'-name', px+'-age', px+'-gender', px+'-phone', px+'-nid'];
  if(dept==='blood'){
    ids = ids.concat(['bl-clinic','bl-hp','bl-hp-r','bl-rbc','bl-rbc-r','bl-hct','bl-hct-r','bl-wbc','bl-wbc-r','bl-plt','bl-plt-r',
      'bl-hb','bl-hb-r','bl-rbs','bl-rbs-r','bl-hba1c','bl-hba1c-r','bl-blood','bl-rh',
      'bl-uric','bl-uric-r','bl-urea','bl-urea-r','bl-creat','bl-creat-r',
      'bl-tp','bl-tp-r','bl-alb','bl-alb-r','bl-bili','bl-bili-r','bl-sgot','bl-sgot-r','bl-sgpt','bl-sgpt-r',
      'bl-ldl','bl-ldl-r','bl-hdl','bl-hdl-r','bl-tg','bl-tg-r','bl-chol','bl-chol-r',
      'bl-hpylori','bl-preg','bl-asot','bl-rf','bl-crp','bl-hcv','bl-hbsag','bl-hav',
      'bl-bt','bl-bt-r','bl-ct','bl-ct-r','bl-esr','bl-esr-r']);
  } else if(dept==='para'){
    ids = ids.concat(['pa-urates','pa-phosphate','pa-oxalates','pa-preg','pa-sugar','pa-alb','pa-bili','pa-acetone',
      'pa-hpylori','pa-bilharzia','pa-trichomonas','pa-ameba','pa-giardia','pa-hnana','pa-oxyuris','pa-ascaris']);
  } else if(dept==='xray'){
    ids = ids.concat(['xr-clinic','xr-code','xr-ename','xr-result','xr-remark']);
  } else if(dept==='screen'){
    ids = ids.concat(['sc-smoke','sc-hx-sugar','sc-hx-bp','sc-bp-sys','sc-bp-dia','sc-bp-r','sc-rbs','sc-rbs-r','sc-hba1c','sc-hba1c-r','sc-action','sc-refer']);
  }
  return ids;
}

function saveTabData(tabId){
  let tab = tabs[tabId];
  if(!tab) return;
  let data = {};
  let ids = getFormIds(tab.dept);
  ids.forEach(id => {
    let el = document.getElementById(id);
    if(el) data[id] = el.value;
  });
  tab.data = data;
  let px=DEPT_PX[tab.dept];
  let name = data[px+'-name'] || '';
  tab.label = (name && name.length>0) ? name : (tab.editId ? 'تعديل' : 'جديد');
  renderTabs();
}

function applyTabData(tabId){
  let tab = tabs[tabId];
  if(!tab) return;
  let ids = getFormIds(tab.dept);
  ids.forEach(id => {
    let el = document.getElementById(id);
    if(el && tab.data && tab.data[id] !== undefined) el.value = tab.data[id];
    else if(el) el.value = '';
  });
  // Show the right form
  DEPS.forEach(d => {
    document.getElementById('f'+d.charAt(0).toUpperCase()+d.slice(1)).style.display = (d===tab.dept)?'block':'none';
  });
  // Update day
  curDay = tab.day || 1;
  document.getElementById('db1').classList.toggle('active', curDay===1);
  document.getElementById('db2').classList.toggle('active', curDay===2);
  // Edit banner
  let eb = document.getElementById('editBan');
  if(tab.editId){
    eb.style.display = 'flex';
    document.getElementById('editPtN').textContent = tab.data['bl-name'] || tab.data['pa-name'] || tab.data['xr-name'] || tab.data['sc-name'] || 'مريض';
  } else {
    eb.style.display = 'none';
  }
}

function renderTabs(){
  let container = document.getElementById('tabsList');
  if(!container) return;
  let html = '';
  for(let id in tabs){
    let t = tabs[id];
    let isActive = (id === activeTabId);
    let badgeClass = t.dept;
    let icon = DICONS[t.dept] || '';
    let label = t.label || 'جديد';
    if(t.editId) label = '✏️ '+label;
    html += `<div class="tab-item ${isActive?'active':''}" onclick="switchTab('${id}')">
      <span class="badge ${badgeClass}">${icon}</span>
      <span class="tab-name">${label}</span>
      <span class="close-tab" onclick="event.stopPropagation();closeTab('${id}')">✕</span>
    </div>`;
  }
  container.innerHTML = html;
}

// دالة تحويل بيانات السجل لحقول الفورم (تحل مشكلة التذكرة المكررة)
function recToFormData(dept, rec){
  let px=DEPT_PX[dept];
  let d={};
  d[px+'-name']=rec.name||''; d[px+'-age']=rec.age||''; d[px+'-gender']=rec.gender||'';
  d[px+'-ticket']=rec.ticket||''; d[px+'-phone']=rec.phone||''; d[px+'-nid']=rec.nid||'';
  if(dept!=='screen') d[px+'-clinic']=rec.clinic||'';
  if(dept==='blood'){
    ['hp','rbc','hct','wbc','plt','hb','rbs','hba1c','blood','rh','uric','urea','creat',
     'tp','alb','bili','sgot','sgpt','ldl','hdl','tg','chol','hpylori','preg','asot',
     'rf','crp','hcv','hbsag','hav','bt','ct','esr'].forEach(f=>d['bl-'+f]=rec[f]||'');
    ['hp','rbc','hct','wbc','plt','hb','rbs','hba1c','uric','urea','creat','tp','alb',
     'bili','sgot','sgpt','ldl','hdl','tg','chol','bt','ct','esr'].forEach(f=>d['bl-'+f+'-r']=rec[f+'R']||'');
  }else if(dept==='para'){
    ['urates','phosphate','oxalates','hpylori','bilharzia','trichomonas','ameba',
     'giardia','hnana','oxyuris','ascaris','ankylostoma','demonuta'].forEach(f=>d['pa-'+f]=rec[f]||'');
    d['pa-preg']=rec.preg||''; d['pa-sugar']=rec.sugar||''; d['pa-alb']=rec.palb||'';
    d['pa-bili']=rec.pbili||''; d['pa-acetone']=rec.acetone||'';
  }else if(dept==='xray'){
    d['xr-code']=rec.code||''; d['xr-ename']=rec.examname||'';
    d['xr-result']=rec.result||''; d['xr-remark']=rec.remark||'';
  }else if(dept==='screen'){
    d['sc-smoke']=rec.smoke||''; d['sc-hx-sugar']=rec.hxSugar||''; d['sc-hx-bp']=rec.hxBp||'';
    d['sc-bp-sys']=rec['bp-sys']||rec.bpSys||''; d['sc-bp-dia']=rec['bp-dia']||rec.bpDia||'';
    d['sc-bp-r']=rec.bpR||''; d['sc-rbs']=rec.rbs||''; d['sc-rbs-r']=rec.rbsR||'';
    d['sc-hba1c']=rec.hba1c||''; d['sc-hba1c-r']=rec.hba1cR||'';
    d['sc-action']=rec.action||''; d['sc-refer']=rec.refer||'';
  }
  return d;
}

function openNewTab(dept=null, editRec=null){
  if(activeTabId) saveTabData(activeTabId);
  if(curUser && curUser.role !== 'admin'){
    if(dept && dept !== curUser.role){ showToast('⚠️ ليس لديك صلاحية لهذا القسم',false); return; }
    dept = curUser.role;
  }
  if(!dept){
    if(curUser && curUser.role !== 'admin') dept = curUser.role;
    else { showToast('اختر القسم من الأزرار',true); return; }
  }
  let id='tab_'+(++tabCounter);
  let editId=editRec?editRec.id:null;
  let label=editRec?editRec.name:'جديد';
  let data = editRec ? recToFormData(dept, editRec) : {};
  if(editRec) label = editRec.name||'تعديل';
  tabs[id]={dept,day:curDay,editId,data,label};
  activeTabId=id;
  applyTabData(id);
  renderTabs();
  gotoSc('entry');
}

function switchTab(tabId){
  if(activeTabId) saveTabData(activeTabId);
  activeTabId = tabId;
  applyTabData(tabId);
  renderTabs();
}

function closeTab(tabId){
  if(activeTabId === tabId){
    let keys = Object.keys(tabs);
    let idx = keys.indexOf(tabId);
    let nextId = null;
    if(keys.length > 1){
      if(idx < keys.length-1) nextId = keys[idx+1];
      else nextId = keys[idx-1];
    }
    delete tabs[tabId];
    if(nextId){
      activeTabId = nextId;
      applyTabData(nextId);
    } else {
      activeTabId = null;
      DEPS.forEach(d => document.getElementById('f'+d.charAt(0).toUpperCase()+d.slice(1)).style.display='none');
      document.getElementById('editBan').style.display='none';
    }
    renderTabs();
  } else {
    delete tabs[tabId];
    renderTabs();
  }
}

function closeCurrentTab(){
  if(activeTabId) closeTab(activeTabId);
  else showToast('لا يوجد تبويب مفتوح', false);
}

// ════════════════════════════════════════════════════════════════════
// 5. CHECK TICKET — التحقق من تكرار رقم التذكرة
//    📌 بيشتغل عند: onblur على خانة التذكرة في كل الأقسام
//    ⚠️ لا تعدّل editId داخل الدالة دي
// ════════════════════════════════════════════════════════════════════
function checkTicket(dept, ticketId) {
    let ticket = document.getElementById(ticketId).value.trim();
    if (!ticket) return;
    let existing = records.find(r => r.ticket === ticket && r.dept === dept && r.id !== (tabs[activeTabId]?.editId || null));
    if (existing) {
        let msg = `⚠️ رقم التذكرة "${ticket}" مسجل من قبل للحالة: "${existing.name}"\n\nهل تريد فتح بياناتها للتعديل؟`;
        if (confirm(msg)) {
            if (activeTabId) closeTab(activeTabId);
            openNewTab(dept, existing);
        } else {
            document.getElementById(ticketId).value = '';
            document.getElementById(ticketId).focus();
            showToast('⚠️ يرجى إدخال رقم تذكرة آخر', false);
        }
    }
}

// ════════════════════════════════════════════════════════════════════
// 6. PHONE MODAL — نافذة تسجيل التليفون عند النتائج الغير طبيعية
//    📌 بيتفتح تلقائياً لو: نتيجة غير طبيعية + مفيش تليفون
//    📌 الزرارين في HTML: pmSavePhone() و pmSkipPhone()
// ════════════════════════════════════════════════════════════════════
function pmSavePhone() {
    document.getElementById('phoneMov').classList.remove('show');
    if (!pendingPhone) return;
    let ps = pendingPhone; pendingPhone = null;
    let phone = document.getElementById('phoneModalInput').value.trim();
    ps.r.phone = phone;
    // حدّث حقل التليفون في الفورم
    let px=DEPT_PX[ps.dept];
    let el=document.getElementById(px+'-phone');
    if(el) el.value=phone;
    doFinalSave(ps.r);
    showToast('✅ تم الحفظ مع الرقم: ' + phone);
}
function pmSkipPhone() {
    document.getElementById('phoneMov').classList.remove('show');
    if (!pendingPhone) return;
    let ps = pendingPhone; pendingPhone = null;
    doFinalSave(ps.r);
    showToast('✅ تم الحفظ');
}

// ════════════════════════════════════════════════════════════════════
// 7. SAVE — حفظ البيانات (localStorage + Firebase)
//    📌 التسلسل: saveCurrentTab ← hasAbnormal ← doFinalSave ← Firebase
//    ⚠️ لو أضفت حقل جديد: أضفه في saveCurrentTab بتاع القسم المناسب
// ════════════════════════════════════════════════════════════════════
function doFinalSave(r) {
    logActivity(records.find(x=>String(x.id)===String(r.id))?'تعديل مريض':'إضافة مريض',
      (r.name||'—') + ' — ' + (DNAMES[r.dept]||r.dept));
    if (r.id) {
        let idx = records.findIndex(x => x.id === r.id);
        if (idx >= 0) records[idx] = r;
        else records.push(r);
    } else {
        records.push(r);
    }
    localStorage.setItem(STORAGE.RECORDS, JSON.stringify(records));
    fbWrite('records/'+r.id, r);
    if (activeTabId) closeTab(activeTabId);
    renderRec();
    buildStats();
}

function saveCurrentTab(dept) {
    if (!activeTabId) { showToast('افتح تبويب أولاً', false); return; }
    saveTabData(activeTabId);
    let tab = tabs[activeTabId];
    let data = tab.data;
    let editId = tab.editId;
    
    let px = DEPT_PX[dept];
    let name = data[px+'-name'] || '';
    let age = data[px+'-age'] || '';
    let gender = data[px+'-gender'] || '';
    let ticket = data[px+'-ticket'] || '';
    let phone = data[px+'-phone'] || '';
    let nid = data[px+'-nid'] || '';
    
    if (!ticket || !name || !age || !gender) {
        showToast('⚠️ مطلوب: التذكرة، الاسم، السن، الجنس', false);
        return;
    }
    
    let r = { id: editId || Date.now(), dept, day: curDay, emp: curUser?.name, savedAt: new Date().toISOString(), name, age, gender, ticket, phone, nid };
    
    let ids = getFormIds(dept);
    ids.forEach(fid => {
        let key = fid.split('-')[1];
        if (['ticket','name','age','gender','phone','nid'].includes(key)) return;
        if (fid.includes('clinic')) { r.clinic = data[fid]; return; }
        r[key] = data[fid] || '';
    });
    
    // Phone warning: screen dept only for BP/sugar abnormal
    const screenAbnormal = dept==='screen' && (
      ['مرتفع','منخفض'].includes(r.bpR||'') ||
      ['مرتفع','منخفض'].includes(r.rbsR||'') ||
      r.hba1cR==='غير طبيعي'
    );
    if (screenAbnormal && !phone) {
        pendingPhone = { r: r, dept: dept };
        document.getElementById('phoneModalInput').value = '';
        document.getElementById('phoneMov').classList.add('show');
        setTimeout(() => document.getElementById('phoneModalInput').focus(), 200);
        return;
    }
    
    doFinalSave(r);
}

// ════════════════════════════════════════════════════════════════════
// 8. UI HELPERS — دوال مساعدة للواجهة
//    📌 autoBpResult: حساب نتيجة الضغط تلقائياً (≥140 أو ≥90)
//    📌 autoRbsResult: حساب نتيجة السكر تلقائياً (>200)
//    📌 sR(el): تلوين الخانة حسب النتيجة (طبيعي/غير طبيعي)
// ════════════════════════════════════════════════════════════════════
// دالة auto-detect للتحاليل الرقمية

// ── Phone Modal ─────────────────────────────────────
function pmSavePhone() {
    document.getElementById('phoneMov').classList.remove('show');
    if (!pendingPhone) return;
    let ps = pendingPhone; pendingPhone = null;
    let phone = document.getElementById('phoneModalInput').value.trim();
    ps.r.phone = phone;
    // حدّث حقل التليفون في الفورم
    let px=DEPT_PX[ps.dept];
    let el=document.getElementById(px+'-phone');
    if(el) el.value=phone;
    doFinalSave(ps.r);
    showToast('✅ تم الحفظ مع الرقم: ' + phone);
}
function pmSkipPhone() {
    document.getElementById('phoneMov').classList.remove('show');
    if (!pendingPhone) return;
    let ps = pendingPhone; pendingPhone = null;
    doFinalSave(ps.r);
    showToast('✅ تم الحفظ');
}

// ════════════════════════════════════════════════════════════════════
// 7. SAVE — حفظ البيانات (localStorage + Firebase)
//    📌 التسلسل: saveCurrentTab ← hasAbnormal ← doFinalSave ← Firebase
//    ⚠️ لو أضفت حقل جديد: أضفه في saveCurrentTab بتاع القسم المناسب
// ════════════════════════════════════════════════════════════════════

// ── Save ────────────────────────────────────────────
function doFinalSave(r) {
    logActivity(records.find(x=>String(x.id)===String(r.id))?'تعديل مريض':'إضافة مريض',
      (r.name||'—') + ' — ' + (DNAMES[r.dept]||r.dept));
    if (r.id) {
        let idx = records.findIndex(x => x.id === r.id);
        if (idx >= 0) records[idx] = r;
        else records.push(r);
    } else {
        records.push(r);
    }
    localStorage.setItem(STORAGE.RECORDS, JSON.stringify(records));
    fbWrite('records/'+r.id, r);
    if (activeTabId) closeTab(activeTabId);
    renderRec();
    buildStats();
}

function saveCurrentTab(dept) {
    if (!activeTabId) { showToast('افتح تبويب أولاً', false); return; }
    saveTabData(activeTabId);
    let tab = tabs[activeTabId];
    let data = tab.data;
    let editId = tab.editId;
    
    let px = DEPT_PX[dept];
    let name = data[px+'-name'] || '';
    let age = data[px+'-age'] || '';
    let gender = data[px+'-gender'] || '';
    let ticket = data[px+'-ticket'] || '';
    let phone = data[px+'-phone'] || '';
    let nid = data[px+'-nid'] || '';
    
    if (!ticket || !name || !age || !gender) {
        showToast('⚠️ مطلوب: التذكرة، الاسم، السن، الجنس', false);
        return;
    }
    
    let r = { id: editId || Date.now(), dept, day: curDay, emp: curUser?.name, savedAt: new Date().toISOString(), name, age, gender, ticket, phone, nid };
    
    let ids = getFormIds(dept);
    ids.forEach(fid => {
        let key = fid.split('-')[1];
        if (['ticket','name','age','gender','phone','nid'].includes(key)) return;
        if (fid.includes('clinic')) { r.clinic = data[fid]; return; }
        r[key] = data[fid] || '';
    });
    
    // Phone warning: screen dept only for BP/sugar abnormal
    const screenAbnormal = dept==='screen' && (
      ['مرتفع','منخفض'].includes(r.bpR||'') ||
      ['مرتفع','منخفض'].includes(r.rbsR||'') ||
      r.hba1cR==='غير طبيعي'
    );
    if (screenAbnormal && !phone) {
        pendingPhone = { r: r, dept: dept };
        document.getElementById('phoneModalInput').value = '';
        document.getElementById('phoneMov').classList.add('show');
        setTimeout(() => document.getElementById('phoneModalInput').focus(), 200);
        return;
    }
    
    doFinalSave(r);
}

// ════════════════════════════════════════════════════════════════════
// 8. UI HELPERS — دوال مساعدة للواجهة
//    📌 autoBpResult: حساب نتيجة الضغط تلقائياً (≥140 أو ≥90)
//    📌 autoRbsResult: حساب نتيجة السكر تلقائياً (>200)
//    📌 sR(el): تلوين الخانة حسب النتيجة (طبيعي/غير طبيعي)
// ════════════════════════════════════════════════════════════════════
// دالة auto-detect للتحاليل الرقمية
