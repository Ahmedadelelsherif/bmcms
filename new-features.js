// ===== new-features.js =====
// الميزات الجديدة والتقارير المتقدمة

// ===== نظام التقارير المتقدم =====
class AdvancedReporting {
  static generateComprehensiveReport(records) {
    const report = {
      generatedAt: new Date().toLocaleString('ar-EG'),
      totalRecords: records.length,
      statistics: this.calculateStatistics(records),
      departmentBreakdown: this.getDepartmentBreakdown(records),
      dailyStats: this.getDailyStatistics(records),
      abnormalResults: this.getAbnormalResults(records),
      patientDemographics: this.getPatientDemographics(records)
    };
    return report;
  }

  static calculateStatistics(records) {
    return {
      totalPatients: records.length,
      malePatients: records.filter(r => r.gender === 'ذكر').length,
      femalePatients: records.filter(r => r.gender === 'أنثى').length,
      averageAge: this.calculateAverageAge(records),
      ageGroups: this.groupByAge(records)
    };
  }

  static calculateAverageAge(records) {
    if (records.length === 0) return 0;
    const totalAge = records.reduce((sum, r) => {
      const age = parseInt(r.age) || 0;
      return sum + age;
    }, 0);
    return (totalAge / records.length).toFixed(1);
  }

  static groupByAge(records) {
    const groups = {
      'أقل من 18': 0,
      '18-30': 0,
      '30-50': 0,
      '50-65': 0,
      'أكثر من 65': 0
    };

    records.forEach(r => {
      const age = parseInt(r.age) || 0;
      if (age < 18) groups['أقل من 18']++;
      else if (age < 30) groups['18-30']++;
      else if (age < 50) groups['30-50']++;
      else if (age < 65) groups['50-65']++;
      else groups['أكثر من 65']++;
    });

    return groups;
  }

  static getDepartmentBreakdown(records) {
    const breakdown = {};
    DEPS.forEach(dept => {
      breakdown[DNAMES[dept]] = records.filter(r => r.dept === dept).length;
    });
    return breakdown;
  }

  static getDailyStatistics(records) {
    const daily = {};
    records.forEach(r => {
      const date = r.date || 'غير محدد';
      if (!daily[date]) daily[date] = 0;
      daily[date]++;
    });
    return daily;
  }

  static getAbnormalResults(records) {
    const abnormal = [];
    records.forEach(r => {
      const results = Object.entries(r).filter(([key, value]) => 
        key.includes('result') && ABNORMAL_VALS.has(value)
      );
      if (results.length > 0) {
        abnormal.push({
          patient: r.name,
          date: r.date,
          abnormalities: results.map(([key, value]) => `${key}: ${value}`)
        });
      }
    });
    return abnormal;
  }

  static getPatientDemographics(records) {
    return {
      byGender: this.groupByField(records, 'gender'),
      byAge: this.groupByAge(records),
      byDistrict: this.groupByField(records, 'district')
    };
  }

  static groupByField(records, field) {
    const groups = {};
    records.forEach(r => {
      const value = r[field] || 'غير محدد';
      if (!groups[value]) groups[value] = 0;
      groups[value]++;
    });
    return groups;
  }
}

// ===== نظام التصدير المتقدم =====
class AdvancedExport {
  static async exportToCSV(data, filename = 'export.csv') {
    let csv = '';
    
    // رؤوس الأعمدة
    if (data.length > 0) {
      csv += Object.keys(data[0]).join(',') + '\n';
    }
    
    // البيانات
    data.forEach(row => {
      csv += Object.values(row).map(val => {
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val;
      }).join(',') + '\n';
    });

    this.downloadFile(csv, filename, 'text/csv');
  }

  static async exportToJSON(data, filename = 'export.json') {
    const json = JSON.stringify(data, null, 2);
    this.downloadFile(json, filename, 'application/json');
  }

  static async exportToExcel(data, filename = 'export.xlsx') {
    // يتطلب مكتبة XLSX
    if (typeof XLSX === 'undefined') {
      notificationSystem.show('❌ مكتبة Excel غير متاحة', 'error');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات');
    XLSX.writeFile(workbook, filename);
    notificationSystem.show('✅ تم تصدير البيانات إلى Excel', 'success');
  }

  static async exportToPDF(data, filename = 'export.pdf') {
    // يتطلب مكتبة jsPDF
    if (typeof jsPDF === 'undefined') {
      notificationSystem.show('❌ مكتبة PDF غير متاحة', 'error');
      return;
    }

    const doc = new jsPDF();
    const columns = Object.keys(data[0] || {});
    const rows = data.map(item => columns.map(col => item[col]));

    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 10,
      theme: 'grid',
      styles: { font: 'Arial', fontSize: 10 }
    });

    doc.save(filename);
    notificationSystem.show('✅ تم تصدير البيانات إلى PDF', 'success');
  }

  static downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notificationSystem.show(`✅ تم تحميل ${filename}`, 'success');
  }

  static generateReportHTML(report) {
    let html = `
      <div style="font-family: Arial; direction: rtl; padding: 20px;">
        <h1 style="text-align: center; color: var(--pr);">تقرير شامل</h1>
        <p style="text-align: center; color: var(--mu);">تم الإنشاء: ${report.generatedAt}</p>
        
        <h2 style="color: var(--pr); border-bottom: 2px solid var(--pr); padding-bottom: 10px;">الإحصائيات العامة</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: var(--bg);">
            <td style="padding: 10px; border: 1px solid var(--bdr);">إجمالي السجلات</td>
            <td style="padding: 10px; border: 1px solid var(--bdr);">${report.totalRecords}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid var(--bdr);">إجمالي المرضى</td>
            <td style="padding: 10px; border: 1px solid var(--bdr);">${report.statistics.totalPatients}</td>
          </tr>
          <tr style="background: var(--bg);">
            <td style="padding: 10px; border: 1px solid var(--bdr);">المتوسط العمري</td>
            <td style="padding: 10px; border: 1px solid var(--bdr);">${report.statistics.averageAge} سنة</td>
          </tr>
        </table>

        <h2 style="color: var(--pr); border-bottom: 2px solid var(--pr); padding-bottom: 10px; margin-top: 20px;">توزيع الأقسام</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: var(--pr); color: #fff;">
              <th style="padding: 10px; border: 1px solid var(--bdr);">القسم</th>
              <th style="padding: 10px; border: 1px solid var(--bdr);">العدد</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(report.departmentBreakdown).map(([dept, count]) => `
              <tr style="background: ${count % 2 === 0 ? 'var(--bg)' : '#fff'};">
                <td style="padding: 10px; border: 1px solid var(--bdr);">${dept}</td>
                <td style="padding: 10px; border: 1px solid var(--bdr);">${count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2 style="color: var(--pr); border-bottom: 2px solid var(--pr); padding-bottom: 10px; margin-top: 20px;">النتائج غير الطبيعية</h2>
        ${report.abnormalResults.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: var(--no); color: #fff;">
                <th style="padding: 10px; border: 1px solid var(--bdr);">اسم المريض</th>
                <th style="padding: 10px; border: 1px solid var(--bdr);">التاريخ</th>
                <th style="padding: 10px; border: 1px solid var(--bdr);">التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              ${report.abnormalResults.map(item => `
                <tr style="background: var(--rbg);">
                  <td style="padding: 10px; border: 1px solid var(--bdr);">${item.patient}</td>
                  <td style="padding: 10px; border: 1px solid var(--bdr);">${item.date}</td>
                  <td style="padding: 10px; border: 1px solid var(--bdr);">${item.abnormalities.join(', ')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="color: var(--mu);">لا توجد نتائج غير طبيعية</p>'}
      </div>
    `;
    return html;
  }
}

// ===== نظام البحث والفلترة المتقدم =====
class AdvancedSearch {
  static search(records, query, fields = ['name', 'phone', 'id']) {
    if (!query.trim()) return records;
    
    const lowerQuery = query.toLowerCase();
    return records.filter(record => 
      fields.some(field => {
        const value = record[field];
        return value && value.toString().toLowerCase().includes(lowerQuery);
      })
    );
  }

  static advancedFilter(records, filters) {
    return records.filter(record => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        
        if (Array.isArray(value)) {
          return value.includes(record[key]);
        }
        
        if (typeof value === 'object' && value.min && value.max) {
          const recordValue = parseFloat(record[key]) || 0;
          return recordValue >= value.min && recordValue <= value.max;
        }
        
        return record[key] === value;
      });
    });
  }

  static getFilterOptions(records, field) {
    const options = new Set();
    records.forEach(record => {
      if (record[field]) options.add(record[field]);
    });
    return Array.from(options).sort();
  }
}

// ===== نظام الإشعارات والتنبيهات =====
class AlertSystem {
  static checkAbnormalResults(record) {
    const alerts = [];
    
    // فحص النتائج غير الطبيعية
    Object.entries(record).forEach(([key, value]) => {
      if (ABNORMAL_VALS.has(value)) {
        alerts.push({
          type: 'abnormal_result',
          message: `⚠️ نتيجة غير طبيعية: ${key}`,
          severity: 'high'
        });
      }
    });

    // فحص ضغط الدم
    if (record.bpSys >= 140 || record.bpDia >= 90) {
      alerts.push({
        type: 'high_bp',
        message: '⚠️ ضغط دم مرتفع',
        severity: 'high'
      });
    }

    // فحص السكر
    if (record.rbs > 200 || record.rbs < 70) {
      alerts.push({
        type: 'abnormal_rbs',
        message: '⚠️ مستوى السكر غير طبيعي',
        severity: 'high'
      });
    }

    return alerts;
  }

  static displayAlerts(alerts) {
    alerts.forEach(alert => {
      const color = alert.severity === 'high' ? 'var(--no)' : 'var(--ac)';
      notificationSystem.show(alert.message, alert.severity === 'high' ? 'error' : 'warning');
    });
  }
}

// ===== نظام التقويمات والجداول الزمنية =====
class ScheduleManager {
  static createSchedule(convoyData) {
    return {
      id: Date.now(),
      name: convoyData.name,
      startDate: convoyData.startDate,
      endDate: convoyData.endDate,
      location: convoyData.location,
      coordinator: convoyData.coordinator,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
  }

  static getUpcomingConvoys(convoys) {
    const now = new Date();
    return convoys.filter(c => new Date(c.startDate) > now).sort((a, b) => 
      new Date(a.startDate) - new Date(b.startDate)
    );
  }

  static getConvoyStats(convoys) {
    return {
      total: convoys.length,
      scheduled: convoys.filter(c => c.status === 'scheduled').length,
      ongoing: convoys.filter(c => c.status === 'ongoing').length,
      completed: convoys.filter(c => c.status === 'completed').length
    };
  }
}

// ===== نظام النسخ الاحتياطية التلقائية =====
class BackupSystem {
  static createBackup() {
    const backup = {
      timestamp: new Date().toISOString(),
      records: records,
      staff: staff,
      session: session,
      config: {
        locked: locked,
        adminPass: adminPass
      }
    };
    
    localStorage.setItem('backup_' + Date.now(), JSON.stringify(backup));
    notificationSystem.show('✅ تم إنشاء نسخة احتياطية', 'success');
    return backup;
  }

  static restoreBackup(backupKey) {
    const backup = JSON.parse(localStorage.getItem(backupKey));
    if (!backup) {
      notificationSystem.show('❌ لم يتم العثور على النسخة الاحتياطية', 'error');
      return false;
    }

    records = backup.records;
    staff = backup.staff;
    session = backup.session;
    locked = backup.config.locked;
    adminPass = backup.config.adminPass;

    localStorage.setItem(STORAGE.RECORDS, JSON.stringify(records));
    localStorage.setItem(STORAGE.STAFF, JSON.stringify(staff));
    localStorage.setItem(STORAGE.SESSION, JSON.stringify(session));
    localStorage.setItem(STORAGE.LOCKED, locked ? '1' : '0');
    localStorage.setItem(STORAGE.PASS, adminPass);

    notificationSystem.show('✅ تم استعادة النسخة الاحتياطية', 'success');
    return true;
  }

  static listBackups() {
    const backups = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('backup_')) {
        const backup = JSON.parse(localStorage.getItem(key));
        backups.push({
          key,
          timestamp: backup.timestamp,
          recordsCount: backup.records.length
        });
      }
    }
    return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  static deleteBackup(backupKey) {
    localStorage.removeItem(backupKey);
    notificationSystem.show('✅ تم حذف النسخة الاحتياطية', 'success');
  }

  static enableAutoBackup(intervalMinutes = 60) {
    setInterval(() => {
      this.createBackup();
      console.log('🔄 تم إنشاء نسخة احتياطية تلقائية');
    }, intervalMinutes * 60 * 1000);
  }
}

// تفعيل النسخ الاحتياطية التلقائية كل ساعة
BackupSystem.enableAutoBackup(60);
