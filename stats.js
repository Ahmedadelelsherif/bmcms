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
    <button class="btn" onclick="setRecFilter('abnormal');gotoSc('records')" style="background:#c0392b;color:#fff">⚠️ الحالات الغير طبيعية (${filtered.filter(r=>hasAbnormal(r)).length})</button>
  </div>`;

  let d1 = filtered.filter(r => r.day == 1),
    d2 = filtered.filter(r => r.day == 2);
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
      let abnFields = Object.keys(r).filter(k => r[k] === 'غير طبيعي').map(k => FIELD_LABELS[k] || k).filter(v => v);
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

function buildBloodStats(arr) {
  let d1 = arr.filter(r => r.day == 1),
    d2 = arr.filter(r => r.day == 2);
  const stat = (a, key) => ({
    total: a.length,
    done: a.filter(r => r[key]).length,
    norm: a.filter(r => r[key + 'R'] === 'طبيعي').length,
    ab: a.filter(r => ['غير طبيعي', 'مرتفع', 'منخفض'].includes(r[key + 'R'] || '')).length
  });
  const tests = [
    { key: 'hb', label: 'Hb هيموجلوبين' }, { key: 'rbs', label: 'RBS سكر عشوائي' }, { key: 'hba1c', label: 'HbA1c سكر تراكمي' },
    { key: 'hp', label: 'HP صفائح دموية' }, { key: 'rbc', label: 'RBC كريات حمراء' }, { key: 'hct', label: 'HCT هيماتوكريت' },
    { key: 'wbc', label: 'WBC كريات بيضاء' }, { key: 'plt', label: 'PLT صفائح' },
    { key: 'uric', label: 'يوريك أسيد' }, { key: 'urea', label: 'بولينا' }, { key: 'creat', label: 'كرياتينين' },
    { key: 'tp', label: 'TP بروتين كلي' }, { key: 'alb', label: 'ألبيومين' }, { key: 'bili', label: 'بيليروبين' },
    { key: 'sgot', label: 'SGOT' }, { key: 'sgpt', label: 'SGPT' },
    { key: 'ldl', label: 'LDL' }, { key: 'hdl', label: 'HDL' }, { key: 'tg', label: 'TG دهون' }, { key: 'chol', label: 'كوليسترول' },
    { key: 'bt', label: 'BT وقت نزف' }, { key: 'ct', label: 'CT وقت تجلط' }, { key: 'esr', label: 'ESR ترسيب' }
  ];
  let html = `<div class="card" style="margin-bottom:12px">
    <div class="ch" style="background:#8b1a1a;color:#fff">🩸 إحصائيات معمل الدم (${arr.length} حالة)</div>
    <div class="cb" style="overflow-x:auto">
    <table style="min-width:700px">
    <thead><tr style="background:#8b1a1a;color:#fff">
      <th style="padding:8px;text-align:right">التحليل</th>
      <th colspan="3" style="padding:8px;text-align:center;border-left:2px solid rgba(255,255,255,.3)">اليوم الأول (${d1.length})</th>
      <th colspan="3" style="padding:8px;text-align:center;border-left:2px solid rgba(255,255,255,.3)">اليوم الثاني (${d2.length})</th>
      <th colspan="3" style="padding:8px;text-align:center;background:#5a0000">الإجمالي (${arr.length})</th>
    </tr>
    <tr style="background:#a52020;color:#fff;font-size:10px">
      <th></th>
      <th>العدد</th><th style="color:#90ee90">طبيعي</th><th style="color:#ffaaaa">غير طبيعي</th>
      <th style="border-left:2px solid rgba(255,255,255,.2)">العدد</th><th style="color:#90ee90">طبيعي</th><th style="color:#ffaaaa">غير طبيعي</th>
      <th style="border-left:2px solid rgba(255,255,255,.2)">العدد</th><th style="color:#90ee90">طبيعي</th><th style="color:#ffaaaa">غير طبيعي</th>
    </tr></thead><tbody>`;
  tests.forEach((t, i) => {
    let s1 = stat(d1, t.key),
      s2 = stat(d2, t.key),
      sT = stat(arr, t.key);
    if (!sT.done) return;
    html += `<tr style="background:${i%2?'#fff8f8':'#fff'}">
      <td style="font-weight:700;padding:6px 10px">${t.label}</td>
      <td style="text-align:center">${s1.done||'—'}</td>
      <td style="text-align:center;color:#1a7a4a;font-weight:700">${s1.norm||'—'}</td>
      <td style="text-align:center;color:#c0392b;font-weight:700">${s1.ab||'—'}</td>
      <td style="text-align:center;border-left:2px solid #e0e0e0">${s2.done||'—'}</td>
      <td style="text-align:center;color:#1a7a4a;font-weight:700">${s2.norm||'—'}</td>
      <td style="text-align:center;color:#c0392b;font-weight:700">${s2.ab||'—'}</td>
      <td style="text-align:center;border-left:2px solid #e0e0e0;background:#fff0f0">${sT.done}</td>
      <td style="text-align:center;color:#1a7a4a;font-weight:900;background:#f0fff4">${sT.norm}</td>
      <td style="text-align:center;color:#c0392b;font-weight:900;background:#fff0f0">${sT.ab}</td>
    </tr>`;
  });
  html += `</tbody></table></div></div>`;
  return html;
}

function buildParaStats(arr) {
  let d1 = arr.filter(r => r.day === 1),
    d2 = arr.filter(r => r.day === 2);
  let fields = [
    { k: 'bilharzia', l: 'بلهارسيا' }, { k: 'ameba', l: 'أميبا' }, { k: 'hpylori', l: 'H.Pylori' },
    { k: 'sugar', l: 'سكر بول' }, { k: 'preg', l: 'حمل بول' }
  ];
  let rows = '';
  fields.forEach(f => {
    let p1 = d1.filter(r => r[f.k] === 'غير طبيعي').length;
    let p2 = d2.filter(r => r[f.k] === 'غير طبيعي').length;
    let t1 = d1.filter(r => r[f.k] && r[f.k] !== '').length;
    let t2 = d2.filter(r => r[f.k] && r[f.k] !== '').length;
    rows += `<tr><td>${f.l}</td><td>${t1||'—'}</td><td style="color:var(--no)">${p1||'—'}</td>
      <td>${t2||'—'}</td><td style="color:var(--no)">${p2||'—'}</td>
      <td>${t1+t2||'—'}</td><td style="color:var(--no)">${p1+p2||'—'}</td></tr>`;
  });
  return `<div class="card"><div class="ch para">🔬 الطفيليات</div><div class="cb">
    <table class="rpt-tbl"><thead><tr><th>الفحص</th><th colspan="2">اليوم الأول</th><th colspan="2">اليوم الثاني</th><th colspan="2">الإجمالي</th></tr>
    <tr><th></th><th>عدد</th><th>إيجابي</th><th>عدد</th><th>إيجابي</th><th>عدد</th><th>إيجابي</th></tr></thead>
    <tbody>${rows}</tbody></table></div></div>`;
}

function buildXrayStats(arr) {
  let d1 = arr.filter(r => r.day === 1),
    d2 = arr.filter(r => r.day === 2);
  let n1 = d1.filter(r => r.result === 'طبيعي').length,
    p1 = d1.filter(r => r.result === 'غير طبيعي').length;
  let n2 = d2.filter(r => r.result === 'طبيعي').length,
    p2 = d2.filter(r => r.result === 'غير طبيعي').length;
  return `<div class="card"><div class="ch xray">📡 الأشعة</div><div class="cb">
    <table class="rpt-tbl"><thead><tr><th>اليوم</th><th>طبيعي</th><th>غير طبيعي</th><th>الإجمالي</th></tr></thead>
    <tbody><tr><td>الأول</td><td>${n1}</td><td style="color:var(--no)">${p1}</td><td>${n1+p1}</td></tr>
    <tr><td>الثاني</td><td>${n2}</td><td style="color:var(--no)">${p2}</td><td>${n2+p2}</td></tr>
    <tr style="font-weight:700;background:#e8f0ff"><td>الإجمالي</td><td>${n1+n2}</td><td style="color:var(--no)">${p1+p2}</td><td>${arr.length}</td></tr>
    </tbody></table></div></div>`;
}

function buildScreenStats(arr) {
  let d1 = arr.filter(r => r.day == 1),
    d2 = arr.filter(r => r.day == 2);
  const m = arr.filter(r => r.gender === 'ذكر'),
    f = arr.filter(r => r.gender === 'أنثى');
  const smk = arr.filter(r => r.smoke === 'مدخن');

  function bpRange(r) {
    let sys = parseInt(r['bp-sys'] || r.bpSys || 0),
      dia = parseInt(r['bp-dia'] || r.bpDia || 0);
    if (!sys) return null;
    if (sys < 100 || dia < 70) return 'منخفض (<100/70)';
    if (sys <= 120 && dia <= 80) return 'طبيعي (≤120/80)';
    if (sys <= 139 && dia <= 89) return 'حدودي (121-139/81-89)';
    if (sys <= 159 && dia <= 99) return 'مرتفع درجة 1 (140-159/90-99)';
    return 'مرتفع درجة 2 (≥160/100)';
  }

  function rbsRange(r) {
    let v = parseInt(r.rbs || 0);
    if (!v) return null;
    if (v < 70) return 'منخفض (<70)';
    if (v <= 140) return 'طبيعي (70-140)';
    if (v <= 200) return 'حدودي (141-200)';
    return 'مرتفع (>200)';
  }
  const BP_RANGES = ['منخفض (<100/70)', 'طبيعي (≤120/80)', 'حدودي (121-139/81-89)', 'مرتفع درجة 1 (140-159/90-99)', 'مرتفع درجة 2 (≥160/100)'];
  const RBS_RANGES = ['منخفض (<70)', 'طبيعي (70-140)', 'حدودي (141-200)', 'مرتفع (>200)'];

  let html = `<div class="card" style="margin-bottom:12px">
    <div class="ch" style="background:#4a1a6b;color:#fff">💊 إحصائيات افحص واطمن (${arr.length} حالة)</div>
    <div class="cb">`;

  html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
    <div style="background:#4a1a6b;color:#fff;border-radius:8px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:900">${arr.length}</div><div style="font-size:11px">الإجمالي</div></div>
    <div style="background:#1a4a6b;color:#fff;border-radius:8px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:900">${m.length}</div><div style="font-size:11px">ذكور</div></div>
    <div style="background:#6b1a4a;color:#fff;border-radius:8px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:900">${f.length}</div><div style="font-size:11px">إناث</div></div>
    <div style="background:#1a6b4a;color:#fff;border-radius:8px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:900">${d1.length}</div><div style="font-size:11px">اليوم الأول</div></div>
    <div style="background:#1a6b4a;color:#fff;border-radius:8px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:900">${d2.length}</div><div style="font-size:11px">اليوم الثاني</div></div>
    <div style="background:#7a5000;color:#fff;border-radius:8px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:900">${smk.length}</div><div style="font-size:11px">مدخنون</div></div>
  </div>`;

  // BP Table
  html += `<div style="font-weight:900;color:#4a1a6b;margin-bottom:8px;font-size:13px">📊 ضغط الدم</div>
  <table style="width:100%;margin-bottom:14px"><thead><tr style="background:#4a1a6b;color:#fff">
    <th style="padding:8px">النطاق</th>
    <th style="padding:8px;text-align:center">اليوم الأول</th><th style="padding:8px;text-align:center">ذكور</th><th style="padding:8px;text-align:center">إناث</th>
    <th style="padding:8px;text-align:center;border-left:2px solid rgba(255,255,255,.3)">اليوم الثاني</th><th style="padding:8px;text-align:center">ذكور</th><th style="padding:8px;text-align:center">إناث</th>
    <th style="padding:8px;text-align:center;border-left:2px solid rgba(255,255,255,.3);background:#2d0d45">الإجمالي</th>
  </tr></thead><tbody>`;
  BP_RANGES.forEach((range, i) => {
    let all = arr.filter(r => bpRange(r) === range);
    let _d1 = d1.filter(r => bpRange(r) === range),
      _d2 = d2.filter(r => bpRange(r) === range);
    if (!all.length) return;
    let d1m = _d1.filter(r => r.gender === 'ذكر'),
      d1f = _d1.filter(r => r.gender === 'أنثى');
    let d2m = _d2.filter(r => r.gender === 'ذكر'),
      d2f = _d2.filter(r => r.gender === 'أنثى');
    let isAb = range.includes('مرتفع') || range.includes('منخفض');
    html += `<tr style="background:${isAb?'#fff0f0':i%2?'#f8f4ff':'#fff'}">
      <td style="padding:7px;font-weight:700;color:${isAb?'#c0392b':range.includes('حدودي')?'#f0a832':'#1a7a4a'}">${range}</td>
      <td style="text-align:center">${_d1.length}</td><td style="text-align:center">${d1m.length}</td><td style="text-align:center">${d1f.length}</td>
      <td style="text-align:center;border-left:2px solid #e0e0e0">${_d2.length}</td><td style="text-align:center">${d2m.length}</td><td style="text-align:center">${d2f.length}</td>
      <td style="text-align:center;font-weight:900;border-left:2px solid #e0e0e0;background:${isAb?'#ffe8e8':'#f0f8f0'}">${all.length}</td>
    </tr>`;
  });
  html += `</tbody></table>`;

  // Sugar Table
  html += `<div style="font-weight:900;color:#4a1a6b;margin-bottom:8px;font-size:13px">📊 السكر العشوائي (RBS)</div>
  <table style="width:100%;margin-bottom:14px"><thead><tr style="background:#4a1a6b;color:#fff">
    <th style="padding:8px">النطاق</th>
    <th style="padding:8px;text-align:center">اليوم الأول</th><th style="padding:8px;text-align:center">ذكور</th><th style="padding:8px;text-align:center">إناث</th>
    <th style="padding:8px;text-align:center;border-left:2px solid rgba(255,255,255,.3)">اليوم الثاني</th><th style="padding:8px;text-align:center">ذكور</th><th style="padding:8px;text-align:center">إناث</th>
    <th style="padding:8px;text-align:center;border-left:2px solid rgba(255,255,255,.3);background:#2d0d45">الإجمالي</th>
  </tr></thead><tbody>`;
  RBS_RANGES.forEach((range, i) => {
    let all = arr.filter(r => rbsRange(r) === range);
    let _d1 = d1.filter(r => rbsRange(r) === range),
      _d2 = d2.filter(r => rbsRange(r) === range);
    if (!all.length) return;
    let d1m = _d1.filter(r => r.gender === 'ذكر'),
      d1f = _d1.filter(r => r.gender === 'أنثى');
    let d2m = _d2.filter(r => r.gender === 'ذكر'),
      d2f = _d2.filter(r => r.gender === 'أنثى');
    let isAb = range.includes('مرتفع') || range.includes('منخفض');
    html += `<tr style="background:${isAb?'#fff0f0':i%2?'#f8f4ff':'#fff'}">
      <td style="padding:7px;font-weight:700;color:${isAb?'#c0392b':range.includes('حدودي')?'#f0a832':'#1a7a4a'}">${range}</td>
      <td style="text-align:center">${_d1.length}</td><td style="text-align:center">${d1m.length}</td><td style="text-align:center">${d1f.length}</td>
      <td style="text-align:center;border-left:2px solid #e0e0e0">${_d2.length}</td><td style="text-align:center">${d2m.length}</td><td style="text-align:center">${d2f.length}</td>
      <td style="text-align:center;font-weight:900;border-left:2px solid #e0e0e0;background:${isAb?'#ffe8e8':'#f0f8f0'}">${all.length}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  html += `</div></div>`;
  return html;
                     }
