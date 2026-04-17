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

// Translation function
function t(key) {
  const translations = {
    // Arabic translations
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
    'close': 'إغلاق',
    'dashboard': 'لوحة التحكم',
    'transactions': 'المعاملات',
    'donors': 'المتبرعون',
    'beneficiaries': 'المستفيدون',
    'inventory': 'المخزون',
    'projects': 'المشاريع',
    'receipts': 'الإيصالات',
    'installments': 'الأقساط',
    'recurring': 'المعاملات الدورية',
    'reports': 'التقارير',
    'settings': 'الإعدادات',
    'permissions': 'الصلاحيات',
    'system': 'النظام',
    'mainMenu': 'القائمة الرئيسية',
    'charityManagement': 'إدارة الجمعية الخيرية',
    'roleSuperAdmin': 'مسؤول النظام الكامل',
    'roleSuperAdminDesc': 'صلاحيات كاملة على جميع الصفحات والبيانات',
    'roleDirector': 'المدير التنفيذي',
    'roleDirectorDesc': 'صلاحيات تشغيلية كاملة مع حذف العمليات المالية',
    'roleAccountManager': 'مسؤول الحسابات',
    'roleAccountManagerDesc': 'صلاحيات كاملة على الوحدات المالية',
    'roleCaseManager': 'مسؤول الحالات',
    'roleCaseManagerDesc': 'صلاحيات كاملة على المستفيدين والمشاريع',
    'roleDataEntry': 'موظف إدخال بيانات',
    'roleDataEntryDesc': 'إضافة وتعديل فقط — بدون حذف',
    'roleInventoryManager': 'مسؤول المخزون',
    'roleInventoryManagerDesc': 'صلاحيات كاملة على المخزون العيني',
    'roleViewer': 'مشاهد فقط',
    'roleViewerDesc': 'قراءة فقط على لوحة التحكم والتقارير'
  };
  
  // For English, return the key itself or a simple mapping
  if (LANG === 'en') {
    const enTranslations = {
      'dashboard': 'Dashboard',
      'transactions': 'Transactions',
      'donors': 'Donors',
      'beneficiaries': 'Beneficiaries',
      'inventory': 'Inventory',
      'projects': 'Projects',
      'settings': 'Settings',
      'permissions': 'Permissions',
      'system': 'SYSTEM',
      'mainMenu': 'MAIN MENU',
      'signOut': 'Sign Out',
      'roleSuperAdmin': 'Super Administrator',
      'roleDirector': 'Executive Director',
      'roleAccountManager': 'Account Manager',
      'roleCaseManager': 'Case Manager',
      'roleDataEntry': 'Data Entry Clerk',
      'roleInventoryManager': 'Inventory Manager',
      'roleViewer': 'Viewer Only'
    };
    return enTranslations[key] || key;
  }
  
  return translations[key] || key;
}

// Set language and update UI
function setLanguage(lang) {
  if (lang !== 'ar' && lang !== 'en') return;
  LANG = lang;
  localStorage.setItem('app_lang', lang);
  
  // Update HTML direction
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  
  // Update all elements with data-t attributes
  if (typeof applyTranslations === 'function') {
    applyTranslations();
  }
  
  // Show toast notification
  if (typeof showToast === 'function') {
    showToast(t('successUpdated'), 'success');
  }
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

/* ══════════════════════════════════════════════════════════
   RENDER SIDEBAR - CRITICAL FUNCTION
══════════════════════════════════════════════════════════ */

function renderSidebar(email, userName, role) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  
  const roleLabel = t(`role${role}`) || role;
  const initials = (userName || email || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  
  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <div class="sidebar-brand-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </div>
      <div>
        <div class="sidebar-brand-text">Charity Org</div>
        <div class="sidebar-brand-sub">${t('charityManagement') || 'Charity Management'}</div>
      </div>
    </div>
    
    <div class="sidebar-section">
      <div class="sidebar-section-label">${t('mainMenu') || 'MAIN MENU'}</div>
      <nav class="sidebar-nav">
        <a href="Dashboard.html" class="nav-item" data-page="Dashboard">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></span>
          <span>${t('dashboard') || 'Dashboard'}</span>
        </a>
        <a href="Transactions.html" class="nav-item" data-page="Transactions">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>
          <span>${t('transactions') || 'Transactions'}</span>
        </a>
        <a href="Donors.html" class="nav-item" data-page="Donors">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
          <span>${t('donors') || 'Donors'}</span>
        </a>
        <a href="Beneficiaries.html" class="nav-item" data-page="Beneficiaries">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg></span>
          <span>${t('beneficiaries') || 'Beneficiaries'}</span>
        </a>
        <a href="Receipts.html" class="nav-item" data-page="Receipts">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></span>
          <span>${t('receipts') || 'Receipts'}</span>
        </a>
        <a href="Inventory.html" class="nav-item" data-page="Inventory">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg></span>
          <span>${t('inventory') || 'Inventory'}</span>
        </a>
        <a href="Projects.html" class="nav-item" data-page="Projects">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-6 9 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="3 9 12 13 21 9"/><line x1="12" y1="13" x2="12" y2="21"/></svg></span>
          <span>${t('projects') || 'Projects'}</span>
        </a>
        <a href="Installments.html" class="nav-item" data-page="Installments">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
          <span>${t('installments') || 'Installments'}</span>
        </a>
        <a href="Recurring.html" class="nav-item" data-page="Recurring">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 2l4 4-4 4"/><path d="M3 12h13"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"/></svg></span>
          <span>${t('recurring') || 'Recurring'}</span>
        </a>
        <a href="Reports.html" class="nav-item" data-page="Reports">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3"/><path d="M12 2v10"/><path d="M9 7l3-3 3 3"/></svg></span>
          <span>${t('reports') || 'Reports'}</span>
        </a>
      </nav>
    </div>
    
    <div class="sidebar-section">
      <div class="sidebar-section-label">${t('system') || 'SYSTEM'}</div>
      <nav class="sidebar-nav">
        <a href="Settings.html" class="nav-item" data-page="Settings">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
          <span>${t('settings') || 'Settings'}</span>
        </a>
        <a href="Permissions.html" class="nav-item" data-page="Permissions">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
          <span>${t('permissions') || 'Permissions'}</span>
        </a>
      </nav>
    </div>
    
    <div class="sidebar-footer">
  <div class="sidebar-user" onclick="toggleUserMenu()">
    <div class="user-avatar">${initials}</div>
    <div class="user-info">
      <div class="user-name">${escapeHTML(userName || email)}</div>
      <div class="user-role">${escapeHTML(roleLabel)}</div>
    </div>
  </div>
  <div class="dropdown-menu" id="userMenu">
    <div class="dropdown-item" onclick="setLanguage('ar')">
      <span>العربية</span>
      ${LANG === 'ar' ? '<span>✓</span>' : ''}
    </div>
    <div class="dropdown-item" onclick="setLanguage('en')">
      <span>English</span>
      ${LANG === 'en' ? '<span>✓</span>' : ''}
    </div>
    <div class="dropdown-divider"></div>
    <div class="dropdown-item danger" onclick="signOut()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      <span>${t('signOut')}</span>
    </div>
  </div>
</div>
  `;
  
  // Set active page
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentPage) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function toggleUserMenu() {
  const menu = document.getElementById('userMenu');
  if (menu) {
    // Toggle the 'open' class instead of display property
    menu.classList.toggle('open');
  }
}

// Close user menu when clicking outside
document.addEventListener('click', function(e) {
  const menu = document.getElementById('userMenu');
  const userBtn = document.querySelector('.sidebar-user');
  if (menu && userBtn && !userBtn.contains(e.target)) {
    menu.style.display = 'none';
  }
});

/* ══════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
══════════════════════════════════════════════════════════ */

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '';
  if (type === 'success') icon = '✓';
  else if (type === 'error') icon = '✗';
  else if (type === 'warning') icon = '⚠';
  else icon = 'ℹ';
  
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-message">${escapeHTML(message)}</div>
  `;
  
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ══════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
══════════════════════════════════════════════════════════ */

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function debounce(func, wait) {
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

function formatCurrency(amount, currency = 'EGP') {
  return new Intl.NumberFormat(LANG === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
}

function formatNumber(num) {
  return new Intl.NumberFormat(LANG === 'ar' ? 'ar-EG' : 'en-US').format(num);
}

/* ══════════════════════════════════════════════════════════
   SYNC INDICATOR
══════════════════════════════════════════════════════════ */

let syncQueue = [];

function updateSyncIndicator(status) {
  const indicator = document.getElementById('syncIndicator');
  if (!indicator) return;
  
  indicator.className = `sync-indicator ${status}`;
  const text = indicator.querySelector('.sync-text');
  if (text) {
    if (status === 'syncing') text.textContent = 'Syncing...';
    else if (status === 'synced') text.textContent = 'All changes saved';
    else if (status === 'error') text.textContent = 'Sync failed';
  }
}

function clearSyncQueue() {
  syncQueue = [];
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

// Make critical functions available globally
window.renderSidebar = renderSidebar;
window.toggleUserMenu = toggleUserMenu;
window.setLanguage = setLanguage;
window.applyTranslations = applyTranslations;
window.showToast = showToast;
window.escapeHTML = escapeHTML;
window.t = t;

// Make lookup data available globally
window.LOOKUP_SEED_DATA = LOOKUP_SEED_DATA;
window.SHEET_DEFINITIONS = SHEET_DEFINITIONS;
window.ALL_PAGES = ALL_PAGES;
window.DEFAULT_ROLES = DEFAULT_ROLES;

// Force declare global functions after all definitions
if (typeof window !== 'undefined') {
    window.toggleUserMenu = toggleUserMenu;
    window.setLanguage = setLanguage;
    window.showToast = showToast;
    window.escapeHTML = escapeHTML;
    window.t = t;
    window.renderSidebar = renderSidebar;
    window.applyTranslations = applyTranslations;
    
    // Also make sure LOOKUP_SEED_DATA is available
    window.LOOKUP_SEED_DATA = LOOKUP_SEED_DATA;
}
