// ===== stats.js =====
function buildStats() {
  buildDashboard();
  let filtered = records;
  if (curUser && curUser.role !== 'admin')
    filtered = records.filter(r => r.dept === curUser.role);

  let b = filtered.filter(r => r.dept === 'blood');
  let p = filtered.filter(r => r.dept === 'para');
  let x = filtered.filter(r => r.dept === 'xray');
  let s = filtered.filter(r => r.dept === 'screen');

  let html = `<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
    <button class="btn ok" onclick="sendWhatsAppReport()" style="background:#25D366;color:#fff">📱 إرسال واتساب</button>
    <button class="btn pr" onclick="exportExcel()" style="background:#1a7a4a;color:#fff">📊 تحميل Excel</button>
    <button class="btn pr" onclick="exportPDF()" style="background:#1a4a6b;color:#fff">📄 تصدير PDF</button>
    <button class="btn" onclick="setRecFilter('abnormal');gotoSc('records')" style="background:#c0392b;color:#fff">⚠️ الحالات الغير طبيعية (${filtered.filter(r=>hasAbnormal(r)).length})</button>
  </div>`;

  let d1 = filtered.filter(r => r.day == 1), d2 = filtered.filter(r => r.day == 2);
  html += `<div class="card" style="margin-bottom:12px"><div class="ch pr">📅 ملخص الأيام</div><div class="cb">
  <table style="width:100%;border-collapse:collapse;font-size:12px">
  <thead><tr style="background:var(--pr);color:#fff">
    <th style="padding:8px 12px;text-align:right">القسم</th>
    <th style="padding:8px;text-align:center">اليوم الأول</th>
    <th style="padding:8px;text-align:center">اليوم الثاني</th>
    <th style="padding:8px;text-align:center;background:#0d2d45">الإجمالي</th>
    <th style="padding:8px;text-align:center;background:#8b1a1a">⚠️ غير طبيعي</th>
  </tr></thead><tbody>`;

  [{ dept: 'blood', name: '🩸 معمل الدم', col: '#8b1a1a' },
   { dept: 'para', name: '🔬 الطفيليات', col: '#6b4a1a' },
   { dept: 'xray', name: '📡 الأشعة', col: '#1a4a6b' },
   { dept: 'screen', name: '💊 افحص واطمن', col: '#4a1a6b' }
  ].forEach(({ dept, name, col }) => {
    let all = filtered.filter(r => r.dept === dept);
    let _d1 = d1.filter(r => r.dept === dept);
    let _d2 = d2.filter(r => r.dept === dept);
    let ab = all.filter(r => hasAbnormal(r));
    if (!all.length) return;
    html += `<tr style="border-bottom:1px solid var(--bdr)">
      <td style="padding:8px 12px;font-weight:700;color:${col}">${name}</td>
      <td style="padding:8px;text-align:center;font-size:16px;font-weight:900">${_d1.length}</td>
      <td style="padding:8px;text-align:center;font-size:16px;font-weight:900">${_d2.length}</td>
      <td style="padding:8px;text-align:center;font-size:18px;font-weight:900;background:#f0f4ff">${all.length}</td>
      <td style="padding:8px;text-align:center;font-size:16px;font-weight:900;color:#c0392b;background:#fff8f8">${ab.length}</td>
    </tr>`;
  });
  html += `<tr style="background:#f8faff;font-weight:900">
    <td style="padding:8px 12px">📊 الإجمالي الكلي</td>
    <td style="padding:8px;text-align:center;font-size:18px;font-weight:900">${d1.length}</td>
    <td style="padding:8px;text-align:center;font-size:18px;font-weight:900">${d2.length}</td>
    <td style="padding:8px;text-align:center;font-size:20px;font-weight:900;color:var(--pr)">${filtered.length}</td>
    <td style="padding:8px;text-align:center;font-size:18px;font-weight:900;color:#c0392b">${filtered.filter(r=>hasAbnormal(r)).length}</td>
  </tr></tbody></table>
  </div></div>`;

  if (b.length) html += buildBloodStats(b);
  if (p.length) html += buildParaStats(p);
  if (x.length) html += buildXrayStats(x);
  if (s.length) html += buildScreenStats(s);

  let abnCases = filtered.filter(r => hasAbnormal(r));
  if (abnCases.length) {
    html += `<div class="card" style="margin-top:14px"><div class="ch" style="background:#c0392b;color:#fff">⚠️ بيان تفصيلي بالحالات الغير طبيعية (${abnCases.length} حالة)</div><div class="cb">`;
    html += `<table style="width:100%;border-collapse:collapse;font-size:11px">
    <thead><tr style="background:#c0392b;color:#fff">
      <th style="padding:7px">#</th><th style="padding:7px">الاسم</th><th style="padding:7px">التذكرة</th>
      <th style="padding:7px">القسم</th><th style="padding:7px">اليوم</th><th style="padding:7px">التليفون</th>
      <th style="padding:7px">النتائج الغير طبيعية</th>
    </tr></thead><tbody>`;
    abnCases.forEach((r, i) => {
      const FIELD_LABELS = { hbR: 'Hb', rbsR: 'سكر RBS', hba1cR: 'HbA1c', hpR: 'HP', rbcR: 'RBC', hctR: 'HCT',
        wbcR: 'WBC', pltR: 'PLT', uricR: 'يوريك', ureaR: 'بولينا', creatR: 'كرياتنين',
        tpR: 'TP', albR: 'ألبيومين', biliR: 'بيليروبين', sgotR: 'SGOT', sgptR: 'SGPT',
        ldlR: 'LDL', hdlR: 'HDL', tgR: 'TG', cholR: 'كوليسترول', btR: 'BT', ctR: 'CT', esrR: 'ESR',
        bpR: 'ضغط الدم', result: 'نتيجة الأشعة'
      };
      let abnFields = Object.keys(r).filter(k => ABNORMAL_VALS.has(String(r[k]||'').trim())).map(k => FIELD_LABELS[k] || k).filter(v => v);
      html += `<tr style="border-bottom:1px solid var(--bdr);background:${i%2?'#fff8f8':'#fff'}">
        <td style="padding:6px;text-align:center">${i+1}</td>
        <td style="padding:6px;font-weight:700">${r.name||'—'}</td>
        <td style="padding:6px">${r.ticket||'—'}</td>
        <td style="padding:6px"><span style="background:${r.dept==='blood'?'#8b1a1a':r.dept==='para'?'#6b4a1a':r.dept==='xray'?'#1a4a6b':'#4a1a6b'};color:#fff;padding:2px 8px;border-radius:8px;font-size:10px">${DNAMES[r.dept]||r.dept}</span></td>
        <td style="padding:6px;text-align:center">${r.day==1?'أول':'ثاني'}</td>
        <td style="padding:6px;direction:ltr">${r.phone||'—'}</td>
        <td style="padding:6px"><span style="color:#c0392b;font-weight:700">${abnFields.join(' ، ')||'—'}</span></td>
      </tr>`;
    });
    html += '</tbody></table></div></div>';
  }

  document.getElementById('statsWrap').innerHTML = html;
}

function buildBloodStats(arr) { /* ... نفس الكود السابق ... */ }
function buildParaStats(arr) { /* ... نفس الكود السابق ... */ }
function buildXrayStats(arr) { /* ... نفس الكود السابق ... */ }
function buildScreenStats(arr) { /* ... نفس الكود السابق ... */ }