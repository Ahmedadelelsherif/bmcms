/**
 * config.js — الثوابت والإعدادات الثابتة
 */
const APP = Object.freeze({
  VERSION:        '1.0.0',
  DEVELOPER:      'أحمد عادل الشريف',
  WHATSAPP:       '201212021490',
  SPLASH_MS:      2200,
  SPLASH_FADE_MS: 600,
  Z_SPLASH:       99999,
  Z_MODAL:        9999,
  LOG_MAX:        100,
  SYNC_MS:        5000,
  BP_LOW_SYS:     100,
  BP_LOW_DIA:     70,
  BP_HIGH_SYS:    140,
  BP_HIGH_DIA:    90,
  RBS_LOW:        70,
  RBS_HIGH:       200,
});
// ── مفاتيح localStorage (تم إصلاحها) ──────────────────
const STORAGE = Object.freeze({
  SESSION:   'SESSION',
  RECORDS:   'RECORDS',
  STAFF:     'STAFF',
  PASS:      'PASS',
  LOCKED:    'LOCKED',
  LOG:       'qs_log'
});

// ── باقي الثوابت ──────────────────────────────────────
const DEPT_PX = Object.freeze({ blood:'bl', para:'pa', xray:'xr', screen:'sc' });
const ABNORMAL_VALS = new Set(['غير طبيعي','مرتفع','منخفض','موجب','موجبة','positive','ايجابي']);

// ── أكواد الفحوصات ────────────────────────────────────
const EXAM_CODES = { 1:'تحليل عد دم كامل', 2:'تحليل عد دم أبيض كلي ونوعي', /* ... الباقي كما هو ... */ };

function lookupExamCode() {
  const code = document.getElementById('xr-code')?.value?.trim();
  const nameEl = document.getElementById('xr-ename');
  if (!code || !nameEl) return;
