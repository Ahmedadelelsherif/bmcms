// ===== ux-improvements.js =====
// تحسينات تجربة المستخدم والواجهة

// ===== نظام الإشعارات المحسّن =====
class NotificationSystem {
  constructor() {
    this.queue = [];
    this.isShowing = false;
  }

  show(message, type = 'info', duration = 3000) {
    const notification = {
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration,
      id: Date.now()
    };
    
    this.queue.push(notification);
    
    if (!this.isShowing) {
      this.processQueue();
    }
  }

  processQueue() {
    if (this.queue.length === 0) {
      this.isShowing = false;
      return;
    }

    this.isShowing = true;
    const notification = this.queue.shift();
    this.displayNotification(notification);
  }

  displayNotification(notification) {
    const toast = document.getElementById('toast') || this.createToastElement();
    const colors = {
      success: 'var(--ok)',
      error: 'var(--no)',
      warning: 'var(--ac)',
      info: 'var(--pr)'
    };

    toast.style.background = colors[notification.type] || colors.info;
    document.getElementById('toastMsg').textContent = notification.message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => this.processQueue(), 300);
    }, notification.duration);
  }

  createToastElement() {
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.innerHTML = '<span id="toastMsg"></span>';
    document.body.appendChild(toast);
    return toast;
  }
}

const notificationSystem = new NotificationSystem();

// ===== شريط التقدم للعمليات الطويلة =====
class ProgressBar {
  constructor() {
    this.element = null;
    this.createProgressBar();
  }

  createProgressBar() {
    const style = document.createElement('style');
    style.textContent = `
      .progress-bar-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: #e0e0e0;
        z-index: 9999;
        display: none;
      }
      .progress-bar-container.show {
        display: block;
      }
      .progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--pr), var(--pr2));
        width: 0%;
        transition: width 0.3s ease;
      }
      .progress-bar-fill.complete {
        width: 100%;
      }
    `;
    document.head.appendChild(style);

    this.element = document.createElement('div');
    this.element.className = 'progress-bar-container';
    this.element.innerHTML = '<div class="progress-bar-fill"></div>';
    document.body.appendChild(this.element);
  }

  start() {
    this.element.classList.add('show');
    const fill = this.element.querySelector('.progress-bar-fill');
    fill.classList.remove('complete');
    fill.style.width = '10%';
    
    // محاكاة التقدم
    let progress = 10;
    this.interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress > 90) progress = 90;
      fill.style.width = progress + '%';
    }, 300);
  }

  complete() {
    clearInterval(this.interval);
    const fill = this.element.querySelector('.progress-bar-fill');
    fill.classList.add('complete');
    fill.style.width = '100%';
    
    setTimeout(() => {
      this.element.classList.remove('show');
      fill.classList.remove('complete');
      fill.style.width = '0%';
    }, 500);
  }

  error() {
    clearInterval(this.interval);
    const fill = this.element.querySelector('.progress-bar-fill');
    fill.style.background = 'var(--no)';
    fill.style.width = '100%';
    
    setTimeout(() => {
      this.element.classList.remove('show');
      fill.style.background = 'linear-gradient(90deg, var(--pr), var(--pr2))';
      fill.style.width = '0%';
    }, 2000);
  }
}

const progressBar = new ProgressBar();

// ===== التحقق من صحة الإدخال المحسّن =====
class InputValidator {
  static rules = {
    required: (value) => value.trim().length > 0 ? null : 'هذا الحقل مطلوب',
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'البريد الإلكتروني غير صحيح',
    phone: (value) => /^[0-9]{10,}$/.test(value.replace(/\D/g, '')) ? null : 'رقم الهاتف غير صحيح',
    date: (value) => {
      const date = new Date(value);
      return !isNaN(date.getTime()) ? null : 'التاريخ غير صحيح';
    },
    number: (value) => !isNaN(parseFloat(value)) && isFinite(value) ? null : 'يجب أن تكون قيمة رقمية',
    minLength: (min) => (value) => value.length >= min ? null : `يجب أن تكون على الأقل ${min} أحرف`,
    maxLength: (max) => (value) => value.length <= max ? null : `يجب ألا تتجاوز ${max} أحرف`,
    range: (min, max) => (value) => {
      const num = parseFloat(value);
      return num >= min && num <= max ? null : `يجب أن تكون القيمة بين ${min} و ${max}`;
    }
  };

  static validate(element, ...validators) {
    const value = element.value;
    const errors = [];

    validators.forEach(validator => {
      if (typeof validator === 'string' && this.rules[validator]) {
        const error = this.rules[validator](value);
        if (error) errors.push(error);
      } else if (typeof validator === 'function') {
        const error = validator(value);
        if (error) errors.push(error);
      }
    });

    this.showValidationError(element, errors);
    return errors.length === 0;
  }

  static showValidationError(element, errors) {
    // إزالة الرسالة السابقة
    const existingError = element.parentElement.querySelector('.validation-error');
    if (existingError) existingError.remove();

    if (errors.length > 0) {
      element.classList.add('input-error');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'validation-error';
      errorDiv.style.cssText = `
        color: var(--no);
        font-size: 10px;
        margin-top: 3px;
        padding: 4px 8px;
        background: var(--rbg);
        border-radius: 4px;
        border: 1px solid #f5c6c6;
      `;
      errorDiv.textContent = errors[0];
      element.parentElement.appendChild(errorDiv);
    } else {
      element.classList.remove('input-error');
    }
  }
}

// إضافة أنماط الأخطاء
const validationStyle = document.createElement('style');
validationStyle.textContent = `
  .input-error {
    border-color: var(--no) !important;
    background: var(--rbg) !important;
  }
  .validation-error {
    color: var(--no);
    font-size: 10px;
    margin-top: 3px;
    padding: 4px 8px;
    background: var(--rbg);
    border-radius: 4px;
    border: 1px solid #f5c6c6;
  }
`;
document.head.appendChild(validationStyle);

// ===== تحسين رسائل الخطأ =====
const ErrorMessages = {
  NETWORK_ERROR: 'حدث خطأ في الاتصال. يرجى التحقق من اتصالك بالإنترنت.',
  FIREBASE_ERROR: 'حدث خطأ في الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً.',
  INVALID_INPUT: 'البيانات المدخلة غير صحيحة. يرجى التحقق منها.',
  UNAUTHORIZED: 'ليس لديك صلاحية لإجراء هذه العملية.',
  DUPLICATE_ENTRY: 'هذا السجل موجود بالفعل.',
  EMPTY_FIELDS: 'يرجى ملء جميع الحقول المطلوبة.',
  SESSION_EXPIRED: 'انتهت جلستك. يرجى تسجيل الدخول مجدداً.',
  OPERATION_SUCCESS: 'تمت العملية بنجاح.',
  OPERATION_FAILED: 'فشلت العملية. يرجى المحاولة لاحقاً.'
};

// ===== نصائح التوضيح (Tooltips) المحسّنة =====
class TooltipSystem {
  static init() {
    document.addEventListener('mouseover', (e) => {
      const element = e.target.closest('[data-tooltip]');
      if (element) {
        this.show(element);
      }
    });

    document.addEventListener('mouseout', (e) => {
      const element = e.target.closest('[data-tooltip]');
      if (element) {
        this.hide();
      }
    });
  }

  static show(element) {
    const text = element.getAttribute('data-tooltip');
    if (!text) return;

    let tooltip = document.getElementById('tooltip-box');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'tooltip-box';
      tooltip.style.cssText = `
        position: fixed;
        background: var(--pr);
        color: #fff;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 11px;
        z-index: 10000;
        pointer-events: none;
        max-width: 200px;
        word-wrap: break-word;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      document.body.appendChild(tooltip);
    }

    tooltip.textContent = text;
    const rect = element.getBoundingClientRect();
    tooltip.style.left = (rect.left + rect.width / 2 - 100) + 'px';
    tooltip.style.top = (rect.top - 40) + 'px';
    tooltip.style.display = 'block';
  }

  static hide() {
    const tooltip = document.getElementById('tooltip-box');
    if (tooltip) tooltip.style.display = 'none';
  }
}

// تفعيل نظام النصائح
TooltipSystem.init();

// ===== تحسين عملية الحفظ مع تأكيد بصري =====
async function saveDataWithFeedback(operation, operationName) {
  progressBar.start();
  
  try {
    await operation();
    progressBar.complete();
    notificationSystem.show(`✅ تم ${operationName} بنجاح`, 'success');
    logActivity(operationName, 'تم بنجاح');
    return true;
  } catch (error) {
    progressBar.error();
    notificationSystem.show(`❌ فشل ${operationName}: ${error.message}`, 'error');
    logActivity(operationName, `فشل: ${error.message}`);
    return false;
  }
}

// ===== تحسين التنقل والتوجيه =====
function navigateToSection(sectionId, withFeedback = true) {
  gotoSc(sectionId);
  if (withFeedback) {
    notificationSystem.show(`تم الانتقال إلى القسم`, 'info', 1500);
  }
}

// ===== تحسين عملية التصدير مع شريط التقدم =====
async function exportDataWithProgress(format) {
  progressBar.start();
  
  try {
    // محاكاة عملية التصدير
    await new Promise(resolve => setTimeout(resolve, 2000));
    progressBar.complete();
    notificationSystem.show(`✅ تم تصدير البيانات بصيغة ${format}`, 'success');
    return true;
  } catch (error) {
    progressBar.error();
    notificationSystem.show(`❌ فشل التصدير: ${error.message}`, 'error');
    return false;
  }
}

// ===== تحسين واجهة تأكيد الحذف =====
function confirmDelete(itemName, onConfirm) {
  const modal = document.createElement('div');
  modal.className = 'mov show';
  modal.innerHTML = `
    <div class="mbox">
      <h3>⚠️ تأكيد الحذف</h3>
      <p>هل أنت متأكد من حذف <strong>${itemName}</strong>؟ لا يمكن التراجع عن هذه العملية.</p>
      <div class="macts">
        <button class="btn pr" onclick="this.parentElement.parentElement.parentElement.remove(); ${onConfirm}">🗑️ حذف</button>
        <button class="btn out" onclick="this.parentElement.parentElement.parentElement.remove()">إلغاء</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ===== تحسين عرض البيانات الكبيرة =====
class DataPagination {
  constructor(data, itemsPerPage = 10) {
    this.data = data;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.totalPages = Math.ceil(data.length / itemsPerPage);
  }

  getCurrentPageData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.data.slice(start, end);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      return true;
    }
    return false;
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      return true;
    }
    return false;
  }

  goToPage(page) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      return true;
    }
    return false;
  }

  getPaginationInfo() {
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      totalItems: this.data.length,
      itemsPerPage: this.itemsPerPage,
      startItem: (this.currentPage - 1) * this.itemsPerPage + 1,
      endItem: Math.min(this.currentPage * this.itemsPerPage, this.data.length)
    };
  }
}

// ===== تحسين البحث والفلترة =====
class SearchFilter {
  static search(data, query, fields) {
    if (!query.trim()) return data;
    
    const lowerQuery = query.toLowerCase();
    return data.filter(item => 
      fields.some(field => {
        const value = this.getNestedValue(item, field);
        return value && value.toString().toLowerCase().includes(lowerQuery);
      })
    );
  }

  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  static filter(data, conditions) {
    return data.filter(item => 
      Object.entries(conditions).every(([key, value]) => {
        const itemValue = this.getNestedValue(item, key);
        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }
        return itemValue === value;
      })
    );
  }

  static sort(data, field, ascending = true) {
    return [...data].sort((a, b) => {
      const aValue = this.getNestedValue(a, field);
      const bValue = this.getNestedValue(b, field);
      
      if (aValue < bValue) return ascending ? -1 : 1;
      if (aValue > bValue) return ascending ? 1 : -1;
      return 0;
    });
  }
}
