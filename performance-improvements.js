// ===== performance-improvements.js =====
// تحسينات الأداء والتخزين المؤقت

// ===== نظام التخزين المؤقت (Caching) =====
class CacheManager {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
  }

  set(key, value, ttl = 5 * 60 * 1000) { // 5 دقائق افتراضياً
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.misses++;
      return null;
    }

    // التحقق من انتهاء صلاحية البيانات
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return item.value;
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(2) + '%' : '0%',
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

const cacheManager = new CacheManager();

// ===== تحسين استعلامات Firebase =====
class FirebaseOptimizer {
  static queryCache = new CacheManager(100);

  static async getCachedData(path, ttl = 5 * 60 * 1000) {
    const cached = this.queryCache.get(path);
    if (cached) {
      console.log('📦 البيانات من الذاكرة المؤقتة:', path);
      return cached;
    }

    try {
      const data = await this.fetchFromFirebase(path);
      this.queryCache.set(path, data, ttl);
      return data;
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      return null;
    }
  }

  static fetchFromFirebase(path) {
    return new Promise((resolve, reject) => {
      if (!dbRef) {
        reject(new Error('Firebase غير متصل'));
        return;
      }

      dbRef.child(path).once('value', (snapshot) => {
        resolve(snapshot.val());
      }, (error) => {
        reject(error);
      });
    });
  }

  static invalidateCache(path) {
    this.queryCache.cache.delete(path);
    console.log('🔄 تم تحديث الذاكرة المؤقتة:', path);
  }

  static invalidateAllCache() {
    this.queryCache.clear();
    console.log('🔄 تم تحديث جميع الذاكرة المؤقتة');
  }
}

// ===== تحسين تحميل البيانات الكبيرة =====
class LazyLoader {
  static loadInChunks(data, chunkSize = 50, callback) {
    let index = 0;

    const loadChunk = () => {
      const chunk = data.slice(index, index + chunkSize);
      if (chunk.length > 0) {
        callback(chunk);
        index += chunkSize;
        // استخدام requestAnimationFrame لتحسين الأداء
        requestAnimationFrame(loadChunk);
      }
    };

    loadChunk();
  }

  static async loadWithDelay(data, delayMs = 100, callback) {
    for (let i = 0; i < data.length; i++) {
      callback(data[i], i);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// ===== تحسين معالجة الأحداث (Event Delegation) =====
class EventOptimizer {
  static attachDelegatedListener(parentSelector, eventType, childSelector, handler) {
    const parent = document.querySelector(parentSelector);
    if (!parent) return;

    parent.addEventListener(eventType, (e) => {
      const target = e.target.closest(childSelector);
      if (target) {
        handler.call(target, e);
      }
    });
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// ===== تحسين معالجة الصور والملفات =====
class FileOptimizer {
  static compressImage(file, quality = 0.8) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(resolve, 'image/jpeg', quality);
        };
      };
    });
  }

  static getFileSizeInMB(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  static validateFileSize(file, maxSizeMB = 5) {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxBytes;
  }
}

// ===== تحسين معالجة البيانات الضخمة =====
class DataProcessor {
  static async processLargeArray(array, processor, batchSize = 100) {
    const results = [];
    
    for (let i = 0; i < array.length; i += batchSize) {
      const batch = array.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      results.push(...batchResults);
      
      // السماح للمتصفح بالاستجابة
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return results;
  }

  static groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    }, {});
  }

  static aggregateData(array, groupKey, aggregateKey, operation = 'sum') {
    const grouped = this.groupBy(array, groupKey);
    const result = {};

    Object.entries(grouped).forEach(([group, items]) => {
      const values = items.map(item => parseFloat(item[aggregateKey]) || 0);
      
      switch (operation) {
        case 'sum':
          result[group] = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          result[group] = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'max':
          result[group] = Math.max(...values);
          break;
        case 'min':
          result[group] = Math.min(...values);
          break;
        case 'count':
          result[group] = items.length;
          break;
      }
    });

    return result;
  }
}

// ===== تحسين الذاكرة (Memory Management) =====
class MemoryManager {
  static cleanup() {
    // تنظيف المتغيرات الكبيرة غير المستخدمة
    if (typeof gc !== 'undefined') {
      gc();
    }
    
    // تنظيف الذاكرة المؤقتة
    cacheManager.clear();
    FirebaseOptimizer.queryCache.clear();
    
    console.log('🧹 تم تنظيف الذاكرة');
  }

  static getMemoryUsage() {
    if (performance.memory) {
      return {
        usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
      };
    }
    return null;
  }

  static monitorMemory(intervalMs = 30000) {
    setInterval(() => {
      const usage = this.getMemoryUsage();
      if (usage) {
        console.log('💾 استخدام الذاكرة:', usage);
      }
    }, intervalMs);
  }
}

// ===== تحسين الشبكة (Network Optimization) =====
class NetworkOptimizer {
  static async fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return response;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  static async batchRequests(urls, batchSize = 5) {
    const results = [];
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(url => fetch(url).then(r => r.json()).catch(() => null))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  static isOnline() {
    return navigator.onLine;
  }

  static onConnectionChange(callback) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }
}

// ===== تحسين الأداء عند الطباعة =====
class PrintOptimizer {
  static preparePrint() {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body { font-size: 12pt; }
        .no-print { display: none !important; }
        .page-break { page-break-after: always; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 8px; }
      }
    `;
    document.head.appendChild(style);
  }

  static print(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(element.innerHTML);
    printWindow.document.close();
    printWindow.print();
  }
}

// ===== مراقبة الأداء =====
class PerformanceMonitor {
  static markStart(label) {
    performance.mark(label + '-start');
  }

  static markEnd(label) {
    performance.mark(label + '-end');
    try {
      performance.measure(label, label + '-start', label + '-end');
      const measure = performance.getEntriesByName(label)[0];
      console.log(`⏱️ ${label}: ${measure.duration.toFixed(2)}ms`);
    } catch (e) {
      console.warn('خطأ في قياس الأداء:', e);
    }
  }

  static getMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation) return null;

    return {
      'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
      'TCP Connection': navigation.connectEnd - navigation.connectStart,
      'Request Time': navigation.responseStart - navigation.requestStart,
      'Response Time': navigation.responseEnd - navigation.responseStart,
      'DOM Interactive': navigation.domInteractive - navigation.fetchStart,
      'DOM Complete': navigation.domComplete - navigation.fetchStart,
      'Load Complete': navigation.loadEventEnd - navigation.fetchStart
    };
  }

  static logMetrics() {
    const metrics = this.getMetrics();
    if (metrics) {
      console.log('📊 مقاييس الأداء:');
      Object.entries(metrics).forEach(([key, value]) => {
        console.log(`  ${key}: ${value.toFixed(2)}ms`);
      });
    }
  }
}

// تفعيل مراقبة الأداء عند تحميل الصفحة
window.addEventListener('load', () => {
  PerformanceMonitor.logMetrics();
  MemoryManager.monitorMemory();
});

// تنظيف الذاكرة عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
  MemoryManager.cleanup();
});
