/* ============================================================
   CHARITY MANAGEMENT SYSTEM — utils.js
   Shared utilities, Google Sheets API wrapper, translations
   ============================================================ */

'use strict';

/* ══════════════════════════════════════════════════════════
   GLOBAL CONFIGURATION (loaded from config.js)
══════════════════════════════════════════════════════════ */

// These values are now defined in config.js and made available globally
// If config.js is not loaded, fallback to these defaults for safety
const CLIENT_ID = window.APP_CONFIG?.google?.clientId || '460184547236-7a4jn7lclo4317pnui9qjcu9d62buknn.apps.googleusercontent.com';
const SYSADMIN_EMAIL = window.APP_CONFIG?.admin?.email || 'dina.khedr@gmail.com';
const SYSADMIN_SHEET_ID = window.APP_CONFIG?.admin?.configSheetId || '1m41rWfsHWWh6LkKqDir8nnen0y0Yx8RzhPPQs73Bxis';

// All system pages for permissions matrix
const ALL_PAGES = [
  'Dashboard', 'OwnerDashboard', 'Reports',
  'Transactions', 'Receipts', 'Installments', 'Recurring',
  'Donors', 'Beneficiaries', 'Inventory', 'Projects',
  'Settings', 'Permissions',
  'Categories', 'DonorTypes', 'IslamicClasses', 'NeedTypes',
  'PaymentMethods', 'AidFrequencies', 'ProjectStatuses',
  'ProjectCategories', 'Governorates', 'NotificationPrefs'
];

// Sheet definitions - each sheet name and its headers
const SHEET_DEFINITIONS = {
  'Users': ['Email', 'FullName', 'Role', 'Status', 'LastLogin', 'Notes', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'Roles': ['RoleID', 'RoleName', 'Description', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'Permissions': ['RoleID', 'PageName', 'CanView', 'CanCreate', 'CanEdit', 'CanDelete', 'CanViewDeleted', 'CanViewSensitive', 'CanExport', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'Donors': ['Name', 'Email', 'Phone', 'Address', 'DonorType', 'Notes', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'Beneficiaries': ['FullName', 'IDNumber', 'Phone', 'Address', 'IslamicClass', 'NeedType', 'Notes', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'Transactions': ['Date', 'DonorID', 'BeneficiaryID', 'Amount', 'PaymentMethod', 'ReceiptNumber', 'Notes', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'Receipts': ['ReceiptNumber', 'TransactionID', 'Date', 'DonorName', 'Amount', 'Notes', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'Inventory': ['ItemName', 'Category', 'Quantity', 'Unit', 'MinQuantity', 'Location', 'Notes', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'Projects': ['ProjectName', 'Category', 'StartDate', 'EndDate', 'Budget', 'Status', 'Notes', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'Installments': ['BeneficiaryID', 'Amount', 'Frequency', 'StartDate', 'EndDate', 'NextDueDate', 'Status', 'Notes', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'Recurring': ['DonorID', 'Amount', 'Frequency', 'StartDate', 'EndDate', 'NextDate', 'Status', 'Notes', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'Categories': ['CategoryName', 'Type', 'Notes', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'DonorTypes': ['TypeName', 'Description', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'IslamicClasses': ['ClassName', 'Description', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'NeedTypes': ['NeedName', 'Description', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'PaymentMethods': ['MethodName', 'Description', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'AidFrequencies': ['FrequencyName', 'Months', 'Description', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'ProjectStatuses': ['StatusName', 'Color', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'ProjectCategories': ['CategoryName', 'Description', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'Governorates': ['GovernorateName', 'Region', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt'],
  'NotificationPrefs': ['UserEmail', 'NotifyOnNewDonation', 'NotifyOnNewBeneficiary', 'NotifyOnLowStock', 'NotifyOnProjectDue', 'RecordID', 'CreatedAt', 'CreatedBy', 'ModifiedAt', 'ModifiedBy', 'IsDeleted', 'DeletedAt']
};

// Lookup seed data for initial setup
const LOOKUP_SEED_DATA = {
  'Categories': [
    ['Food', 'inventory'],
    ['Clothing', 'inventory'],
    ['Medical', 'inventory'],
    ['Educational', 'inventory']
  ],
  'DonorTypes': [
    ['Individual', 'Individual donor'],
    ['Corporate', 'Corporate donor'],
    ['Foundation', 'Foundation donor']
  ],
  'IslamicClasses': [
    ['Poor', 'Al-Fuqara (The Poor)'],
    ['Needy', 'Al-Masakin (The Needy)'],
    ['Zakat Admin', 'Those employed to collect Zakat'],
    ['New Muslims', 'Those whose hearts are to be reconciled'],
    ['Debtors', 'Those in debt'],
    ['In the Cause of Allah', 'Fi Sabilillah'],
    ['Wayfarer', 'Ibn al-Sabil']
  ],
  'NeedTypes': [
    ['Financial', 'Financial assistance needed'],
    ['Medical', 'Medical treatment needed'],
    ['Educational', 'Educational support needed'],
    ['Housing', 'Housing assistance needed'],
    ['Food', 'Food assistance needed']
  ],
  'PaymentMethods': [
    ['Cash', 'Cash payment'],
    ['Bank Transfer', 'Bank transfer payment'],
    ['Credit Card', 'Credit card payment'],
    ['Check', 'Check payment']
  ],
  'AidFrequencies': [
    ['One-time', 0, 'One-time assistance'],
    ['Monthly', 1, 'Monthly assistance'],
    ['Quarterly', 3, 'Quarterly assistance'],
    ['Semi-annual', 6, 'Semi-annual assistance'],
    ['Annual', 12, 'Annual assistance']
  ],
  'ProjectStatuses': [
    ['Planning', '#FFA500', 'Project in planning phase'],
    ['Active', '#1D9E75', 'Project is active'],
    ['Completed', '#185FA5', 'Project completed'],
    ['On Hold', '#BA7517', 'Project on hold'],
    ['Cancelled', '#A32D2D', 'Project cancelled']
  ],
  'ProjectCategories': [
    ['Education', 'Educational projects'],
    ['Healthcare', 'Healthcare projects'],
    ['Infrastructure', 'Infrastructure projects'],
    ['Emergency', 'Emergency relief projects']
  ],
  'Governorates': [
    ['Cairo', 'Capital'],
    ['Alexandria', 'Coastal'],
    ['Giza', 'Greater Cairo'],
    ['Port Said', 'Canal'],
    ['Suez', 'Canal']
  ],
  'NotificationPrefs': []  // Empty - will be populated as users are added
};

// Default roles for initial setup
const DEFAULT_ROLES = [
  ['SuperAdmin', 'Super Administrator', 'Full system access with all permissions'],
  ['Director', 'Executive Director', 'Full operational permissions with financial deletion'],
  ['AccountManager', 'Account Manager', 'Full access to financial modules'],
  ['CaseManager', 'Case Manager', 'Full access to beneficiaries and projects'],
  ['DataEntry', 'Data Entry Clerk', 'Add and edit only — no deletion'],
  ['InventoryManager', 'Inventory Manager', 'Full access to inventory management'],
  ['Viewer', 'Viewer Only', 'Read-only access to dashboard and reports']
];

/* ══════════════════════════════════════════════════════════
   LANGUAGE / TRANSLATION SYSTEM
══════════════════════════════════════════════════════════ */

let LANG = localStorage.getItem('app_lang') || 'ar';

// English translations
const LANG_EN = {
  'loading': 'Loading...',
  'save': 'Save',
  'cancel': 'Cancel',
  'delete': 'Delete',
  'edit': 'Edit',
  'add': 'Add',
  'search': 'Search',
  'signIn': 'Sign In',
  'signOut': 'Sign Out',
  'errSignIn': 'Please sign in first',
  'errSetup': 'System not set up — please complete initial setup',
  'errSession': 'Session expired — please sign in again',
  'errNoPermission': 'You don\'t have permission to access this page',
  'errLoadFailed': 'Failed to load data',
  'errSaveFailed': 'Failed to save',
  'errDeleteFailed': 'Failed to delete',
  'signedOut': 'Signed out successfully',
  'successSaved': 'Saved successfully',
  'successDeleted': 'Deleted successfully',
  'successRestored': 'Restored successfully',
  'successUpdated': 'Updated successfully',
  'requiredFields': 'Please fill all required fields',
  'allSaved': 'All changes saved',
  'saving': 'Saving...',
  'saved': 'Saved',
  'error': 'Error',
  'success': 'Success',
  'warning': 'Warning',
  'info': 'Info',
  'active': 'Active',
  'inactive': 'Inactive',
  'deleted': 'Deleted',
  'restore': 'Restore',
  'confirm': 'Confirm',
  'close': 'Close'
};

// Arabic translations
const LANG_AR = {
  'loading': 'جارٍ التحميل...',
  'save': 'حفظ',
  'cancel': 'إلغاء',
  'delete': 'حذف',
  'edit': 'تعديل',
  'add': 'إضافة',
  'search': 'بحث',
  'signIn': 'تسجيل الدخول',
  'signOut': 'تسجيل الخروج',
  'errSignIn': 'يرجى تسجيل الدخول أولاً',
  'errSetup': 'لم يتم إعداد النظام — يرجى إكمال الإعداد الأولي',
  'errSession': 'انتهت صلاحية الجلسة — يرجى تسجيل الدخول مرة أخرى',
  'errNoPermission': 'ليس لديك صلاحية للوصول إلى هذه الصفحة',
  'errLoadFailed': 'فشل تحميل البيانات',
  'errSaveFailed': 'فشل الحفظ',
  'errDeleteFailed': 'فشل الحذف',
  'signedOut': 'تم تسجيل الخروج بنجاح',
  'successSaved': 'تم الحفظ بنجاح',
  'successDeleted': 'تم الحذف بنجاح',
  'successRestored': 'تمت الاستعادة بنجاح',
  'successUpdated': 'تم التحديث بنجاح',
  'requiredFields': 'الرجاء تعبئة جميع الحقول المطلوبة',
  'allSaved': 'تم حفظ جميع التغييرات',
  'saving': 'جارٍ الحفظ...',
  'saved': 'تم الحفظ',
  'error': 'خطأ',
  'success': 'نجاح',
  'warning': 'تحذير',
  'info': 'معلومات',
  'active': 'نشط',
  'inactive': 'غير نشط',
  'deleted': 'محذوف',
  'restore': 'استعادة',
  'confirm': 'تأكيد',
  'close': 'إغلاق'
};

// Translation function
function t(key) {
  const translations = LANG === 'ar' ? LANG_AR : LANG_EN;
  return translations[key] || key;
}

// Set language and update UI
function setLanguage(lang) {
  if (lang !== 'ar' && lang !== 'en') return;
  LANG = lang;
  localStorage.setItem('app_lang', lang);
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  if (typeof applyTranslations === 'function') applyTranslations();
  if (typeof showToast === 'function') showToast(t('successUpdated'), 'success');
}

// Apply translations to all elements with data-t attributes
function applyTranslations() {
  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t');
    if (key && t(key) !== key) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.getAttribute('data-t-placeholder') !== null) {
          el.placeholder = t(key);
        }
      } else {
        el.textContent = t(key);
      }
    }
  });
}

/* ══════════════════════════════════════════════════════════
   GOOGLE SHEETS API WRAPPER
══════════════════════════════════════════════════════════ */

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function formatDisplayDate(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString(LANG === 'ar' ? 'ar-EG' : 'en-US');
}

function formatDisplayDateTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString(LANG === 'ar' ? 'ar-EG' : 'en-US');
}

function generateRecordID() {
  return 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function readSheet(spreadsheetId, sheetName, options = {}) {
  const { includeDeleted = false, email = null } = options;
  const token = getSavedAccessToken();
  if (!token) throw new Error('No access token');
  
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:Z`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to read sheet');
  
  const data = await response.json();
  const rows = data.values || [];
  if (rows.length < 2) return [];
  
  const headers = rows[0];
  const records = [];
  
  for (let i = 1; i < rows.length; i++) {
    const record = {};
    headers.forEach((header, idx) => { record[header] = rows[i][idx] || ''; });
    if (!includeDeleted && record.IsDeleted === 'TRUE') continue;
    if (email && record.Email && record.Email.toLowerCase() !== email.toLowerCase()) continue;
    records.push(record);
  }
  return records;
}

async function appendRow(spreadsheetId, sheetName, data, userEmail) {
  const token = getSavedAccessToken();
  if (!token) throw new Error('No access token');
  
  const now = getCurrentTimestamp();
  const recordID = generateRecordID();
  const headers = SHEET_DEFINITIONS[sheetName];
  if (!headers) throw new Error(`Unknown sheet: ${sheetName}`);
  
  const row = headers.map(header => {
    if (header === 'RecordID') return recordID;
    if (header === 'CreatedAt') return now;
    if (header === 'CreatedBy') return userEmail;
    if (header === 'ModifiedAt') return now;
    if (header === 'ModifiedBy') return userEmail;
    if (header === 'IsDeleted') return 'FALSE';
    if (header === 'DeletedAt') return '';
    return data[header] || '';
  });
  
  const lastCol = String.fromCharCode(65 + headers.length - 1);
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:${lastCol}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [row] })
  });
  if (!response.ok) throw new Error('Failed to append row');
  return { RecordID: recordID, ...data };
}

async function updateRow(spreadsheetId, sheetName, recordID, updates, userEmail) {
  const token = getSavedAccessToken();
  if (!token) throw new Error('No access token');
  
  const records = await readSheet(spreadsheetId, sheetName, { includeDeleted: true });
  const record = records.find(r => r.RecordID === recordID);
  if (!record) throw new Error('Record not found');
  
  const headers = SHEET_DEFINITIONS[sheetName];
  const lastCol = String.fromCharCode(65 + headers.length - 1);
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:${lastCol}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to read sheet for update');
  
  const data = await response.json();
  const rows = data.values || [];
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    const recordIDIndex = headers.indexOf('RecordID');
    if (rows[i][recordIDIndex] === recordID) {
      rowIndex = i + 1;
      break;
    }
  }
  if (rowIndex === -1) throw new Error('Row not found');
  
  const now = getCurrentTimestamp();
  const updatedRow = [...rows[rowIndex - 1]];
  headers.forEach((header, idx) => {
    if (header === 'ModifiedAt') updatedRow[idx] = now;
    else if (header === 'ModifiedBy') updatedRow[idx] = userEmail;
    else if (updates[header] !== undefined) updatedRow[idx] = updates[header];
  });
  
  const updateResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A${rowIndex}:${lastCol}${rowIndex}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [updatedRow] })
  });
  if (!updateResponse.ok) throw new Error('Failed to update row');
  return true;
}

async function softDelete(spreadsheetId, sheetName, recordID, userEmail) {
  return updateRow(spreadsheetId, sheetName, recordID, { IsDeleted: 'TRUE', DeletedAt: getCurrentTimestamp() }, userEmail);
}

async function restoreRecord(spreadsheetId, sheetName, recordID, userEmail) {
  return updateRow(spreadsheetId, sheetName, recordID, { IsDeleted: 'FALSE', DeletedAt: '' }, userEmail);
}

async function checkPagePermissions(pageName, spreadsheetId, email) {
  const users = await readSheet(spreadsheetId, 'Users', { includeDeleted: false });
  const user = users.find(u => u.Email?.toLowerCase() === email.toLowerCase());
  if (!user) return { canView: false, canCreate: false, canEdit: false, canDelete: false, canViewDeleted: false, canViewSensitive: false, canExport: false };
  if (user.Role === 'SuperAdmin') return { canView: true, canCreate: true, canEdit: true, canDelete: true, canViewDeleted: true, canViewSensitive: true, canExport: true };
  
  const permissions = await readSheet(spreadsheetId, 'Permissions', { includeDeleted: false });
  const perm = permissions.find(p => p.RoleID === user.Role && p.PageName === pageName);
  if (!perm) return { canView: false, canCreate: false, canEdit: false, canDelete: false, canViewDeleted: false, canViewSensitive: false, canExport: false };
  
  return {
    canView: perm.CanView === 'TRUE',
    canCreate: perm.CanCreate === 'TRUE',
    canEdit: perm.CanEdit === 'TRUE',
    canDelete: perm.CanDelete === 'TRUE',
    canViewDeleted: perm.CanViewDeleted === 'TRUE',
    canViewSensitive: perm.CanViewSensitive === 'TRUE',
    canExport: perm.CanExport === 'TRUE'
  };
}

function applyPermissionsToUI(perms) {
  if (!perms) return;
  if (!perms.canCreate) document.querySelectorAll('[data-requires="create"]').forEach(el => { el.disabled = true; });
  if (!perms.canEdit) document.querySelectorAll('[data-requires="edit"]').forEach(el => { el.disabled = true; });
  if (!perms.canDelete) document.querySelectorAll('[data-requires="delete"]').forEach(el => { el.disabled = true; });
  if (!perms.canViewDeleted) { const toggle = document.getElementById('showDeletedToggle'); if (toggle) toggle.style.display = 'none'; }
  if (!perms.canExport) document.querySelectorAll('[data-requires="export"]').forEach(el => { el.disabled = true; });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'}</div><div class="toast-message">${escapeHTML(message)}</div>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

/* ══════════════════════════════════════════════════════════
   ACCESS TOKEN MANAGEMENT
══════════════════════════════════════════════════════════ */

const SPREADSHEET_ID_KEY = (email) => `coms_spreadsheet_${email}`;

function getSavedAccessToken() {
  return sessionStorage.getItem('coms_access_token');
}

function saveAccessToken(token) {
  sessionStorage.setItem('coms_access_token', token);
}

function clearAccessToken() {
  sessionStorage.removeItem('coms_access_token');
}

/* ══════════════════════════════════════════════════════════
   INITIALIZE ON PAGE LOAD
══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();
  document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = LANG;
  document.body.dir = LANG === 'ar' ? 'rtl' : 'ltr';
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    t, setLanguage, applyTranslations,
    readSheet, appendRow, updateRow, softDelete, restoreRecord,
    checkPagePermissions, applyPermissionsToUI,
    getCurrentTimestamp, formatDisplayDate, formatDisplayDateTime,
    generateRecordID, escapeHTML, showToast,
    getSavedAccessToken, saveAccessToken, clearAccessToken,
    SPREADSHEET_ID_KEY, ALL_PAGES, SHEET_DEFINITIONS, LOOKUP_SEED_DATA, DEFAULT_ROLES,
    CLIENT_ID, SYSADMIN_EMAIL, SYSADMIN_SHEET_ID
  };
}
