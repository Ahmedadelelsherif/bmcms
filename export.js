/**
 * export.js — تصدير البيانات
 * يعتمد على: config.js, state.js, records.js (+ SheetJS CDN)
 *
 * exportExcel()            → Excel كامل (4 شيتات)
 * exportDeptExcel('blood') → Excel لقسم واحد
 * exportAbnormalExcel()    → Excel للحالات الغير طبيعية
 * sendWhatsAppReport()     → تقرير واتساب
 *
 * ⚠️ لو أضفت حقل في forms.js: أضفه في addDeptSheet المناسب
 */

// ════════════════════════════════════════════════════════════════════
// 14. WHATSAPP & EXCEL — تصدير البيانات
//    📌 sendWhatsAppReport: بيبعت تقرير على واتساب 01212021490
//    📌 exportExcel: بيصدر ملف xlsx بـ 4 شيتات (شيت لكل قسم)
//    ⚠️ لو أضفت حقل في الفورم: أضفه في الشيت المناسب في exportExcel
// ════════════════════════════════════════════════════════════════════
function generateReportText(){
  let total=records.length;
  let blood=records.filter(r=>r.dept==='blood');
  let para=records.filter(r=>r.dept==='para');
  let xray=records.filter(r=>r.dept==='xray');
  let screen=records.filter(r=>r.dept==='screen');
  let abn=records.filter(r=>{
    if(r.dept==='blood') return r.hbR==='غير طبيعي'||r.rbsR==='غير طبيعي';
    if(r.dept==='para') return r.bilharzia==='غير طبيعي'||r.ameba==='غير طبيعي';
    if(r.dept==='xray') return r.result==='غير طبيعي';
    if(r.dept==='screen') return r.bpR==='غير طبيعي'||r.rbsR==='غير طبيعي';
    return false;
  });
  let lines = ['📊 *تقرير القافلة*','🏥 '+ (session?.village||''),'📍 '+ (session?.center||''),'📅 '+new Date().toLocaleDateString('ar-EG'),'──────────────────',
    '👥 الإجمالي: '+total,'🩸 الدم: '+blood.length,'🔬 الطفيليات: '+para.length,'📡 الأشعة: '+xray.length,'💊 افحص: '+screen.length,'──────────────────'];
  if(abn.length){
    lines.push('⚠️ حالات غير طبيعية:');
    abn.slice(0,15).forEach((r,i)=>lines.push((i+1)+'. '+r.name+' ('+r.ticket+')'+(r.phone?' 📞'+r.phone:'')));
    if(abn.length>15) lines.push('... و'+(abn.length-15)+' أخرى');
  } else lines.push('✅ لا توجد حالات غير طبيعية');
  return lines.join('\n');
}
function sendWhatsAppReport(){
  window.open('https://wa.me/201212021490?text='+encodeURIComponent(generateReportText()),'_blank');
}
function exportExcel(){
  if(typeof XLSX === 'undefined'){ showToast('⚠️ مكتبة Excel غير محملة',false); return; }
  if(!records.length){ showToast('⚠️ لا توجد بيانات',false); return; }
  
  let wb = XLSX.utils.book_new();
  
  // Summary sheet
  let summary = [['ملخص القافلة'],[session?.village||''],[session?.center||''],[new Date().toLocaleDateString('ar-EG')],[''],['القسم','الإجمالي']];
  let b = records.filter(r=>r.dept==='blood');
  let p = records.filter(r=>r.dept==='para');
  let x = records.filter(r=>r.dept==='xray');
  let s = records.filter(r=>r.dept==='screen');
  summary.push(['معمل الدم',b.length],['الطفيليات',p.length],['الأشعة',x.length],['افحص واطمن',s.length]);
  summary.push(['الإجمالي',records.length]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'الملخص');
  
  // Detailed sheets per department
  function addDeptSheet(dept, name, headers, rowFn){
    let items = records.filter(r=>r.dept===dept);
    if(!items.length) return;
    let data = [headers];
    items.forEach((r,i) => {
      let base = [i+1, r.name, r.age, r.gender, r.nid||'', r.ticket, r.phone||'', r.day===1?'أول':'ثاني', r.savedAt?.substring(0,10)||'', r.emp||''];
      data.push(base.concat(rowFn(r)));
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), name);
  }
  let baseHdr = ['#','الاسم','السن','الجنس','الرقم القومي','التذكرة','التليفون','اليوم','التاريخ','الموظف'];
  
  addDeptSheet('blood', 'معمل_الدم',
    [...baseHdr,'العيادة','Hb','نتيجة','سكر','نتيجة','فصيلة','HP','نتيجة','RBC','نتيجة','HCT','نتيجة','WBC','نتيجة','PLT','نتيجة','يوريك','نتيجة','بولينا','نتيجة','كرياتنين','نتيجة','TP','نتيجة','ألبيومين','نتيجة','بيليروبين','نتيجة','SGOT','نتيجة','SGPT','نتيجة','LDL','نتيجة','HDL','نتيجة','TG','نتيجة','كوليسترول','نتيجة','H.Pylori','حمل','ASOT','RF','CRP','HCV','HBsAg','HAV','BT','نتيجة','CT','نتيجة','ESR','نتيجة'],
    r => [r.clinic||'', r.hb||'', r.hbR||'', r.rbs||'', r.rbsR||'', r.blood||'', r.hp||'', r.hpR||'', r.rbc||'', r.rbcR||'', r.hct||'', r.hctR||'', r.wbc||'', r.wbcR||'', r.plt||'', r.pltR||'', r.uric||'', r.uricR||'', r.urea||'', r.ureaR||'', r.creat||'', r.creatR||'', r.tp||'', r.tpR||'', r.alb||'', r.albR||'', r.bili||'', r.biliR||'', r.sgot||'', r.sgotR||'', r.sgpt||'', r.sgptR||'', r.ldl||'', r.ldlR||'', r.hdl||'', r.hdlR||'', r.tg||'', r.tgR||'', r.chol||'', r.cholR||'', r.hpylori||'', r.preg||'', r.asot||'', r.rf||'', r.crp||'', r.hcv||'', r.hbsag||'', r.hav||'', r.bt||'', r.btR||'', r.ct||'', r.ctR||'', r.esr||'', r.esrR||'']
  );
  
  addDeptSheet('para', 'الطفيليات',
    [...baseHdr,'Urates','Phosphate','Oxalates','حمل بول','سكر بول','ألبيومين بول','بيليروبين بول','أسيتون','H.Pylori','بلهارسيا','تريكومونس','أميبا','جيارديا','H.nana','أكسيورس','أسكارس'],
    r => [r.urates||'', r.phosphate||'', r.oxalates||'', r.preg||'', r.sugar||'', r.palb||'', r.pbili||'', r.acetone||'', r.hpylori||'', r.bilharzia||'', r.trichomonas||'', r.ameba||'', r.giardia||'', r.hnana||'', r.oxyuris||'', r.ascaris||'']
  );
  
  addDeptSheet('xray', 'الأشعة',
    [...baseHdr,'العيادة','الكود','اسم الفحص','النتيجة','ملاحظات'],
    r => [r.clinic||'', r.code||'', r.examname||'', r.result||'', r.remark||'']
  );
  
  addDeptSheet('screen', 'افحص_واطمن',
    [...baseHdr,'تدخين','تاريخ سكر','تاريخ ضغط','ضغط انقباضي','ضغط انبساطي','نتيجة الضغط','سكر','نتيجة السكر','HbA1c','نتيجة HbA1c','الإجراء','تحويل'],
    r => [r.smoke||'', r.hxSugar||'', r.hxBp||'',
      r['bp-sys']||r.bpSys||(r.bp?r.bp.split('/')[0]:''),
      r['bp-dia']||r.bpDia||(r.bp?r.bp.split('/')[1]:''),
      r.bpR||'', r.rbs||'', r.rbsR||'', r.hba1c||'', r.hba1cR||'', r.action||'', r.refer||'']
  );
  
  let out = XLSX.write(wb, {bookType:'xlsx',type:'array'});
  let blob = new Blob([out], {type:'application/octet-stream'});
  let fn = 'تقرير_القافلة_'+new Date().toISOString().slice(0,10)+'.xlsx';
  let a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fn;
  a.click();
  showToast('📥 تم تحميل ملف Excel');
}
// ── Export single dept to Excel ──────────────────────────────────
function exportDeptExcel(dept){
  if(typeof XLSX==='undefined'){showToast('⚠️ مكتبة Excel غير محملة',false);return;}
  let items=records.filter(r=>r.dept===dept);
  if(recFilter==='abnormal') items=items.filter(r=>hasAbnormal(r));
  if(!items.length){showToast('⚠️ لا توجد بيانات',false);return;}
  const wb=XLSX.utils.book_new();
  const baseHdr=['#','الاسم','السن','الجنس','الرقم القومي','التذكرة','التليفون','التاريخ','الوقت','اليوم','الموظف'];
  const baseRow=(r,i)=>[i+1,r.name,r.age,r.gender,r.nid||'',r.ticket,r.phone||'',
    r.savedAt?new Date(r.savedAt).toLocaleDateString('ar-EG'):'',
    r.savedAt?new Date(r.savedAt).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}):'',
    r.day===1?'اليوم الأول':'اليوم الثاني',r.emp||''];

  const deptConfig={
    blood:{hdr:[...baseHdr,'العيادة','Hb','ن Hb','RBS','ن RBS','HbA1c','ن HbA1c','فصيلة','Rh','HP','ن HP','RBC','ن RBC','HCT','ن HCT','WBC','ن WBC','PLT','ن PLT','يوريك','ن','بولينا','ن','كرياتنين','ن','TP','ن','ألبيومين','ن','بيليروبين','ن','SGOT','ن','SGPT','ن','LDL','ن','HDL','ن','TG','ن','كوليسترول','ن','H.Pylori','حمل','ASOT','RF','CRP','HCV','HBsAg','HAV','BT','ن BT','CT','ن CT','ESR','ن ESR'],
      row:r=>[r.clinic||'',r.hb||'',r.hbR||'',r.rbs||'',r.rbsR||'',r.hba1c||'',r.hba1cR||'',r.blood||'',r.rh||'',r.hp||'',r.hpR||'',r.rbc||'',r.rbcR||'',r.hct||'',r.hctR||'',r.wbc||'',r.wbcR||'',r.plt||'',r.pltR||'',r.uric||'',r.uricR||'',r.urea||'',r.ureaR||'',r.creat||'',r.creatR||'',r.tp||'',r.tpR||'',r.alb||'',r.albR||'',r.bili||'',r.biliR||'',r.sgot||'',r.sgotR||'',r.sgpt||'',r.sgptR||'',r.ldl||'',r.ldlR||'',r.hdl||'',r.hdlR||'',r.tg||'',r.tgR||'',r.chol||'',r.cholR||'',r.hpylori||'',r.preg||'',r.asot||'',r.rf||'',r.crp||'',r.hcv||'',r.hbsag||'',r.hav||'',r.bt||'',r.btR||'',r.ct||'',r.ctR||'',r.esr||'',r.esrR||'']},
    para:{hdr:[...baseHdr,'Urates','Phosphate','Oxalates','حمل بول','سكر بول','ألبيومين بول','بيليروبين بول','أسيتون','H.Pylori','بلهارسيا','تريكومونس','أميبا','جيارديا','H.nana','أكسيورس','أسكارس'],
      row:r=>[r.urates||'',r.phosphate||'',r.oxalates||'',r.preg||'',r.sugar||'',r.palb||'',r.pbili||'',r.acetone||'',r.hpylori||'',r.bilharzia||'',r.trichomonas||'',r.ameba||'',r.giardia||'',r.hnana||'',r.oxyuris||'',r.ascaris||'']},
    xray:{hdr:[...baseHdr,'العيادة','كود الفحص','اسم الفحص','النتيجة','ملاحظات'],
      row:r=>[r.clinic||'',r.code||'',r.examname||'',r.result||'',r.remark||'']},
    screen:{hdr:[...baseHdr,'تدخين','تاريخ سكر','تاريخ ضغط','انقباضي','انبساطي','نتيجة الضغط','سكر RBS','نتيجة السكر','HbA1c','نتيجة HbA1c','الإجراء','تحويل'],
      row:r=>[r.smoke||'',r.hxSugar||'',r.hxBp||'',r['bp-sys']||r.bpSys||'',r['bp-dia']||r.bpDia||'',r.bpR||'',r.rbs||'',r.rbsR||'',r.hba1c||'',r.hba1cR||'',r.action||'',r.refer||'']}
  };
  const cfg=deptConfig[dept];
  const data=[cfg.hdr,...items.map((r,i)=>[...baseRow(r,i),...cfg.row(r)])];
  const ws=XLSX.utils.aoa_to_sheet(data);
  ws['!cols']=cfg.hdr.map(()=>({wch:14}));
  XLSX.utils.book_append_sheet(wb,ws,DNAMES[dept]||dept);
  const vil=session?.village||'القافلة';
  XLSX.writeFile(wb,`${vil}_${DNAMES[dept]}_${new Date().toLocaleDateString('ar-EG').replace(/\//g,'-')}.xlsx`);
  showToast(`📊 تم تصدير ${DNAMES[dept]}`);
}
function exportAbnormalExcel(){
  if(typeof XLSX==='undefined'){showToast('⚠️ مكتبة Excel غير محملة',false);return;}
  const filtered=records.filter(r=>curUser?.role==='admin'||r.dept===curUser?.role);
  const abn=filtered.filter(r=>hasAbnormal(r));
  if(!abn.length){showToast('⚠️ لا توجد حالات غير طبيعية',false);return;}
  const wb=XLSX.utils.book_new();
  const hdr=['#','الاسم','السن','الجنس','الرقم القومي','التذكرة','التليفون','اليوم','القسم','الموظف','النتائج الغير طبيعية'];
  const data=[hdr,...abn.map((r,i)=>{
    const FIELD_LABELS={hbR:'Hb',rbsR:'سكر',hba1cR:'HbA1c',bpR:'ضغط',wbcR:'WBC',rbcR:'RBC',hctR:'HCT',pltR:'PLT',result:'أشعة'};
    const aFields=Object.keys(r).filter(k=>ABNORMAL_VALS.has(String(r[k]).trim())).map(k=>FIELD_LABELS[k]||k).filter(Boolean);
    return [i+1,r.name,r.age,r.gender,r.nid||'',r.ticket,r.phone||'',r.day===1?'اليوم الأول':'اليوم الثاني',DNAMES[r.dept]||r.dept,r.emp||'',aFields.join(' - ')];
  })];
  const ws=XLSX.utils.aoa_to_sheet(data);
  ws['!cols']=hdr.map(()=>({wch:16}));
  XLSX.utils.book_append_sheet(wb,ws,'الحالات الغير طبيعية');
  XLSX.writeFile(wb,`بيان_غير_طبيعي_${(session?.village||'القافلة')}_${new Date().toLocaleDateString('ar-EG').replace(/\//g,'-')}.xlsx`);
  showToast('📊 تم تصدير بيان الحالات الغير طبيعية');
}
