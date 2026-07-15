/**
 * records.js — عرض وتعديل وحذف السجلات
 * يعتمد على: config.js, state.js, ui.js, firebase.js, forms.js
 *
 * renderRec()           → ارسم جداول السجلات
 * setRecFilter('blood') → فلتر الجداول
 * editRec(id)           → تعديل سجل (مشرف أو مدير)
 * delRec(id)            → حذف سجل (مدير فقط)
 * hasAbnormal(r)        → هل فيه نتيجة غير طبيعية؟
 * testCell(val, status) → خلية (قيمة + حالة) بلون واحد
 * qualCell(val)         → خلية نتيجة نوعية
 */

let recFilter = 'all';
function setRecFilter(f){ recFilter=f; renderRec(); }

// ════════════════════════════════════════════════════════════════════
// 12. RECORDS — عرض وتعديل وحذف السجلات
//    📌 renderRec: عرض السجلات حسب القسم واليوم
//    📌 editRec: ⚠️ editId يُعيَّن في آخر الدالة (بعد gotoSc)
//    📌 delRec: الحذف من localStorage + Firebase
// ════════════════════════════════════════════════════════════════════
// ── hasAbnormal: تحقق من وجود نتيجة غير طبيعية ──────────────────────
function hasAbnormal(r){
  return Object.keys(r).some(k=>{
    if(k.endsWith('R')||k==='result'||k==='bpR'||k==='rbsR'||k==='hba1cR'){
      return ABNORMAL_VALS.has(String(r[k]||'').trim());
    }
    return false;
  });
}
// ── Helper: render a test result cell (value + status in one cell) ──
function testCell(val, status){
  if(!val && !status) return '<td style="color:#ccc;text-align:center">—</td>';
  const isAb = ABNORMAL_VALS.has(String(status||'').trim());
  const isNorm = status==='طبيعي';
  const bg = isAb?'#fff0f0':isNorm?'#f0fff4':'#fff';
  const color = isAb?'#c0392b':isNorm?'#1a7a4a':'#555';
  const badge = status?`<div style="font-size:9px;font-weight:700;color:${color};margin-top:1px">${status}</div>`:'';
  return `<td style="background:${bg};text-align:center;padding:5px 6px;border-bottom:1px solid #eee">
    <div style="font-weight:700;font-size:12px;color:${isAb?'#c0392b':isNorm?'#1a5a2a':'#333'}">${val||'—'}</div>
    ${badge}
  </td>`;
}
// ── Helper: render a qualitative result cell (موجب/سالب/etc) ──
function qualCell(val){
  if(!val) return '<td style="color:#ccc;text-align:center">—</td>';
  const isAb = ABNORMAL_VALS.has(String(val).trim());
  const bg = isAb?'#fff0f0':'#f0fff4';
  const color = isAb?'#c0392b':'#1a7a4a';
  return `<td style="background:${bg};text-align:center;font-weight:700;font-size:11px;color:${color};padding:5px 6px;border-bottom:1px solid #eee">${val}</td>`;
}

function canEdit(r){
  if(!curUser) return false;
  if(curUser.role==='admin') return true;
  if(curUser.staffRole==='supervisor') return r.dept===curUser.role;
  return false;
}
function canDelete(r){
  if(!curUser) return false;
  return curUser.role==='admin';
}

function renderRec(){
  const w=document.getElementById('recWrap');
  const cnt=document.getElementById('recCnt');
  const srch=(document.getElementById('srch')?.value||'').trim().toLowerCase();

  let filtered=records;
  if(curUser&&curUser.role!=='admin') filtered=filtered.filter(r=>r.dept===curUser.role);
  if(recFilter==='abnormal') filtered=filtered.filter(r=>hasAbnormal(r));
  else if(recFilter!=='all') filtered=filtered.filter(r=>r.dept===recFilter);
  if(srch) filtered=filtered.filter(r=>(r.name||'').toLowerCase().includes(srch)||(r.ticket||'').includes(srch)||(r.phone||'').includes(srch));

  cnt.textContent=filtered.length;
  if(!filtered.length){w.innerHTML='<div style="padding:30px;text-align:center;color:var(--mu)">لا توجد سجلات</div>';return;}

  const DEPT_COLORS_MAP={blood:'#8b1a1a',para:'#6b4a1a',xray:'#1a4a6b',screen:'#4a1a6b'};
  const allDepts=recFilter==='all'||recFilter==='abnormal'?['blood','para','xray','screen']:[recFilter];
  let html='';

  allDepts.forEach(dept=>{
    const items=filtered.filter(r=>r.dept===dept);
    if(!items.length)return;
    const col=DEPT_COLORS_MAP[dept];

    html+=`<div style="margin-bottom:24px">
      <div style="background:${col};color:#fff;padding:9px 14px;border-radius:8px 8px 0 0;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:space-between">
        <span>${DICONS[dept]} ${DNAMES[dept]} (${items.length} حالة)</span>
        <button onclick="exportDeptExcel('${dept}')" style="background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);color:#fff;padding:4px 12px;border-radius:6px;font-family:'Cairo',sans-serif;font-size:11px;cursor:pointer">📊 Excel</button>
      </div>
      <div style="overflow-x:auto"><table>`;

    // ── BLOOD ──────────────────────────────────────────────────────
    if(dept==='blood'){
      html+=`<thead><tr>
        <th>#</th><th>الاسم</th><th>السن</th><th>الجنس</th><th>التذكرة</th><th>التليفون</th><th>التاريخ</th><th>الوقت</th><th>اليوم</th><th>العيادة</th>
        <th>Hb</th><th>RBS</th><th>HbA1c</th><th>فصيلة/Rh</th>
        <th>HP</th><th>RBC</th><th>HCT</th><th>WBC</th><th>PLT</th>
        <th>يوريك</th><th>بولينا</th><th>كرياتنين</th>
        <th>TP</th><th>ألبيومين</th><th>بيليروبين</th><th>SGOT</th><th>SGPT</th>
        <th>LDL</th><th>HDL</th><th>TG</th><th>كوليسترول</th>
        <th>H.Pylori</th><th>HCV</th><th>HBsAg</th><th>حمل</th>
        <th>BT</th><th>CT</th><th>ESR</th><th>إجراءات</th>
      </tr></thead><tbody>`;
      items.forEach((r,i)=>{
        const dt=r.savedAt?new Date(r.savedAt):null;
        const isAb=hasAbnormal(r);
        html+=`<tr style="background:${isAb?'#fff8f8':i%2?'#fafafa':'#fff'}">
          <td style="text-align:center">${i+1}${isAb?'<div style="font-size:9px;color:#c0392b">⚠️</div>':''}</td>
          <td style="font-weight:700">${r.name||'—'}</td>
          <td style="text-align:center">${r.age||'—'}</td>
          <td style="text-align:center">${r.gender||'—'}</td>
          <td style="text-align:center">${r.ticket||'—'}</td>
          <td style="direction:ltr">${r.phone||'—'}</td>
          <td style="font-size:10px">${dt?dt.toLocaleDateString('ar-EG'):''}</td>
          <td style="font-size:10px">${dt?dt.toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}):''}</td>
          <td style="text-align:center">${r.day==1?'أول':'ثاني'}</td>
          <td style="font-size:10px">${r.clinic||'—'}</td>
          ${testCell(r.hb,r.hbR)}${testCell(r.rbs,r.rbsR)}${testCell(r.hba1c,r.hba1cR)}
          <td style="text-align:center;font-size:11px">${r.blood||''}${r.blood&&r.rh?'/':''}${r.rh||''}${!r.blood&&!r.rh?'—':''}</td>
          ${testCell(r.hp,r.hpR)}${testCell(r.rbc,r.rbcR)}${testCell(r.hct,r.hctR)}${testCell(r.wbc,r.wbcR)}${testCell(r.plt,r.pltR)}
          ${testCell(r.uric,r.uricR)}${testCell(r.urea,r.ureaR)}${testCell(r.creat,r.creatR)}
          ${testCell(r.tp,r.tpR)}${testCell(r.alb,r.albR)}${testCell(r.bili,r.biliR)}${testCell(r.sgot,r.sgotR)}${testCell(r.sgpt,r.sgptR)}
          ${testCell(r.ldl,r.ldlR)}${testCell(r.hdl,r.hdlR)}${testCell(r.tg,r.tgR)}${testCell(r.chol,r.cholR)}
          ${qualCell(r.hpylori)}${qualCell(r.hcv)}${qualCell(r.hbsag)}${qualCell(r.preg)}
          ${testCell(r.bt,r.btR)}${testCell(r.ct,r.ctR)}${testCell(r.esr,r.esrR)}
          <td><div style="display:flex;gap:4px">
            ${canEdit(r)?`<button class="btn sm edit" onclick="editRec(${r.id})">✏️</button>`:''}
            ${canDelete(r)?`<button class="btn sm del" onclick="delRec(${r.id})">🗑️</button>`:''}
          </div></td>
        </tr>`;
      });
    }

    // ── PARA ───────────────────────────────────────────────────────
    else if(dept==='para'){
      html+=`<thead><tr>
        <th>#</th><th>الاسم</th><th>السن</th><th>الجنس</th><th>التذكرة</th><th>التليفون</th><th>التاريخ</th><th>اليوم</th>
        <th>Urates</th><th>Phosphate</th><th>Oxalates</th><th>حمل بول</th><th>سكر بول</th><th>ألبيومين بول</th><th>بيليروبين</th><th>أسيتون</th>
        <th>H.Pylori</th><th>بلهارسيا</th><th>تريكومونس</th><th>أميبا</th><th>جيارديا</th><th>H.nana</th><th>أكسيورس</th><th>أسكارس</th>
        <th>إجراءات</th>
      </tr></thead><tbody>`;
      items.forEach((r,i)=>{
        const dt=r.savedAt?new Date(r.savedAt):null;
        const isAb=hasAbnormal(r);
        html+=`<tr style="background:${isAb?'#fff8f8':i%2?'#fafafa':'#fff'}">
          <td style="text-align:center">${i+1}${isAb?'<div style="font-size:9px;color:#c0392b">⚠️</div>':''}</td>
          <td style="font-weight:700">${r.name||'—'}</td>
          <td style="text-align:center">${r.age||'—'}</td>
          <td style="text-align:center">${r.gender||'—'}</td>
          <td>${r.ticket||'—'}</td><td style="direction:ltr">${r.phone||'—'}</td>
          <td style="font-size:10px">${dt?dt.toLocaleDateString('ar-EG'):''}</td>
          <td style="text-align:center">${r.day==1?'أول':'ثاني'}</td>
          ${qualCell(r.urates)}${qualCell(r.phosphate)}${qualCell(r.oxalates)}
          ${qualCell(r.preg)}${qualCell(r.sugar)}${qualCell(r.palb)}${qualCell(r.pbili)}${qualCell(r.acetone)}
          ${qualCell(r.hpylori)}${qualCell(r.bilharzia)}${qualCell(r.trichomonas)}${qualCell(r.ameba)}
          ${qualCell(r.giardia)}${qualCell(r.hnana)}${qualCell(r.oxyuris)}${qualCell(r.ascaris)}
          <td><div style="display:flex;gap:4px">
            ${canEdit(r)?`<button class="btn sm edit" onclick="editRec(${r.id})">✏️</button>`:''}
            ${canDelete(r)?`<button class="btn sm del" onclick="delRec(${r.id})">🗑️</button>`:''}
          </div></td>
        </tr>`;
      });
    }

    // ── XRAY ───────────────────────────────────────────────────────
    else if(dept==='xray'){
      html+=`<thead><tr>
        <th>#</th><th>الاسم</th><th>السن</th><th>الجنس</th><th>التذكرة</th><th>التليفون</th><th>التاريخ</th><th>اليوم</th><th>العيادة</th><th>الكود</th><th>الفحص</th><th>النتيجة</th><th>ملاحظات</th><th>إجراءات</th>
      </tr></thead><tbody>`;
      items.forEach((r,i)=>{
        const dt=r.savedAt?new Date(r.savedAt):null;
        const isAb=r.result&&ABNORMAL_VALS.has(r.result);
        html+=`<tr style="background:${isAb?'#fff8f8':i%2?'#fafafa':'#fff'}">
          <td style="text-align:center">${i+1}</td>
          <td style="font-weight:700">${r.name||'—'}</td>
          <td style="text-align:center">${r.age||'—'}</td>
          <td style="text-align:center">${r.gender||'—'}</td>
          <td>${r.ticket||'—'}</td><td style="direction:ltr">${r.phone||'—'}</td>
          <td style="font-size:10px">${dt?dt.toLocaleDateString('ar-EG'):''}</td>
          <td style="text-align:center">${r.day==1?'أول':'ثاني'}</td>
          <td style="font-size:10px">${r.clinic||'—'}</td>
          <td style="text-align:center;font-weight:700">${r.code||'—'}</td>
          <td>${r.examname||'—'}</td>
          ${qualCell(r.result)}
          <td style="font-size:10px">${r.remark||'—'}</td>
          <td><div style="display:flex;gap:4px">
            ${canEdit(r)?`<button class="btn sm edit" onclick="editRec(${r.id})">✏️</button>`:''}
            ${canDelete(r)?`<button class="btn sm del" onclick="delRec(${r.id})">🗑️</button>`:''}
          </div></td>
        </tr>`;
      });
    }

    // ── SCREEN ─────────────────────────────────────────────────────
    else if(dept==='screen'){
      html+=`<thead><tr>
        <th>#</th><th>الاسم</th><th>السن</th><th>الجنس</th><th>التذكرة</th><th>التليفون</th><th>التاريخ</th><th>اليوم</th><th>تدخين</th>
        <th>انقباضي</th><th>انبساطي</th><th>نتيجة الضغط</th>
        <th>سكر RBS</th><th>نتيجة السكر</th>
        <th>HbA1c</th><th>نتيجة HbA1c</th>
        <th>الإجراء</th><th>تحويل</th><th>إجراءات</th>
      </tr></thead><tbody>`;
      items.forEach((r,i)=>{
        const dt=r.savedAt?new Date(r.savedAt):null;
        const isAb=hasAbnormal(r);
        const bpSys=r['bp-sys']||r.bpSys||'';
        const bpDia=r['bp-dia']||r.bpDia||'';
        const bpIsAb=ABNORMAL_VALS.has(r.bpR||'');
        const rbsIsAb=ABNORMAL_VALS.has(r.rbsR||'');
        const hbaIsAb=ABNORMAL_VALS.has(r.hba1cR||'');
        html+=`<tr style="background:${isAb?'#fff8f8':i%2?'#fafafa':'#fff'}">
          <td style="text-align:center">${i+1}${isAb?'<div style="font-size:9px;color:#c0392b">⚠️</div>':''}</td>
          <td style="font-weight:700">${r.name||'—'}</td>
          <td style="text-align:center">${r.age||'—'}</td>
          <td style="text-align:center">${r.gender||'—'}</td>
          <td>${r.ticket||'—'}</td><td style="direction:ltr">${r.phone||'—'}</td>
          <td style="font-size:10px">${dt?dt.toLocaleDateString('ar-EG'):''}</td>
          <td style="text-align:center">${r.day==1?'أول':'ثاني'}</td>
          <td style="text-align:center;font-size:11px">${r.smoke||'—'}</td>
          <td style="text-align:center;font-weight:700;background:${bpIsAb?'#fff0f0':'#fff'};color:${bpIsAb?'#c0392b':'#333'}">${bpSys||'—'}</td>
          <td style="text-align:center;font-weight:700;background:${bpIsAb?'#fff0f0':'#fff'};color:${bpIsAb?'#c0392b':'#333'}">${bpDia||'—'}</td>
          ${qualCell(r.bpR||'')}
          <td style="text-align:center;font-weight:700;background:${rbsIsAb?'#fff0f0':'#fff'};color:${rbsIsAb?'#c0392b':'#333'}">${r.rbs||'—'}</td>
          ${qualCell(r.rbsR||'')}
          <td style="text-align:center;font-weight:700;background:${hbaIsAb?'#fff0f0':'#fff'};color:${hbaIsAb?'#c0392b':'#333'}">${r.hba1c||'—'}</td>
          ${qualCell(r.hba1cR||'')}
          <td style="font-size:10px">${r.action||'—'}</td>
          <td style="font-size:10px">${r.refer||'—'}</td>
          <td><div style="display:flex;gap:4px">
            ${canEdit(r)?`<button class="btn sm edit" onclick="editRec(${r.id})">✏️</button>`:''}
            ${canDelete(r)?`<button class="btn sm del" onclick="delRec(${r.id})">🗑️</button>`:''}
          </div></td>
        </tr>`;
      });
    }

    html+=`</tbody></table></div></div>`;
  });
  w.innerHTML=html;
}
function editRec(id){
  let r=records.find(x=>String(x.id)===String(id));
  if(!r)return;
  if(!canEdit(r)){showToast('⚠️ ليس لديك صلاحية التعديل',false);return;}
  logActivity('تعديل مريض', r.name+' — '+DNAMES[r.dept]);
  if(activeTabId) saveTabData(activeTabId);
  openNewTab(r.dept, r);
}
function delRec(id){
  let r=records.find(x=>String(x.id)===String(id));
  if(!r)return;
  if(!canDelete(r)){showToast('⚠️ الحذف للمدير فقط',false);return;}
  if(!confirm('حذف سجل "'+r.name+'"؟')) return;
  logActivity('حذف مريض', r.name+' — '+DNAMES[r.dept]);
  records=records.filter(x=>String(x.id)!==String(id));
  localStorage.setItem(STORAGE.RECORDS,JSON.stringify(records));
  fbRemove('records/'+id);
  renderRec();
  showToast('🗑️ تم الحذف');
}
function clearAllRecords(){
  if(!confirm('⚠️ هل أنت متأكد من مسح كل البيانات؟')) return;
  records=[]; staff=[];
  localStorage.setItem(STORAGE.RECORDS,'[]'); localStorage.setItem(STORAGE.STAFF,'[]');
  if(dbRef){ fbWrite('records', {}); dbRef.child(STORAGE.STAFF).set({}); }
  renderRec(); buildStats(); renderStaffList(); populateLoginUsers();
  showToast('🗑️ تم مسح كل البيانات');
}
