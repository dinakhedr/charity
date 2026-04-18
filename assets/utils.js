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
   Source of truth: "Translations" tab in the SysAdmin
   config sheet (SYSADMIN_SHEET_ID from config.js).
   Columns: key | ar | en
   Cached in localStorage for 24 hours.
   Force-refresh available from Settings page.
══════════════════════════════════════════════════════════ */

let LANG = localStorage.getItem('app_lang')
        || window.APP_CONFIG?.ui?.defaultLanguage
        || 'ar';

/* ── Translation cache ────────────────────────────────────
   Populated by loadTranslations(). Falls back to
   FALLBACK_TRANSLATIONS if the sheet hasn't loaded yet.
──────────────────────────────────────────────────────────── */
const TRANSLATIONS_CACHE_KEY = 'coms_translations';
const TRANSLATIONS_TS_KEY    = 'coms_translations_ts';
const TRANSLATIONS_TTL       = window.APP_CONFIG?.app?.translationsTTL || 24 * 60 * 60 * 1000;
const TRANSLATIONS_SHEET     = window.APP_CONFIG?.sheets?.translations  || 'Translations';

let _translationsCache = null; // { key: { ar, en } }

/* ── Critical fallback — used only if sheet hasn't loaded ─
   Keep this minimal: just what auth.js needs before the
   sheet fetch completes.
──────────────────────────────────────────────────────────── */
/* ── FALLBACK_TRANSLATIONS ────────────────────────────────────
   TWO-TIER STATIC FALLBACK — never fetched from the sheet.

   TIER 1 — auth.js critical keys (used before any page loads):
     Error messages, auth toasts, sidebar labels.
     These are safety nets for when loadTranslations() fails.
     They are ALSO in the Translations sheet — sheet wins when loaded.

   TIER 2 — home.* keys (Home.html pre-auth static strings):
     Home.html runs before OAuth, so loadTranslations() cannot
     be called. These strings NEVER go in the Translations sheet.
     If you need to update them, edit this file.

   RULE: Every key NOT prefixed with home.* must also exist
   in the Translations sheet. home.* keys are static only.
──────────────────────────────────────────────────────────── */
const FALLBACK_TRANSLATIONS = {

  /* ── TIER 1: auth / sidebar critical keys ─────────────────
     Safety nets — also exist in the Translations sheet.
  ─────────────────────────────────────────────────────────── */
  loading:         { ar: 'جارٍ التحميل...',  en: 'Loading...' },
  save:            { ar: 'حفظ',              en: 'Save' },
  cancel:          { ar: 'إلغاء',            en: 'Cancel' },
  delete:          { ar: 'حذف',              en: 'Delete' },
  edit:            { ar: 'تعديل',            en: 'Edit' },
  add:             { ar: 'إضافة',            en: 'Add' },
  confirm:         { ar: 'تأكيد',            en: 'Confirm' },
  close:           { ar: 'إغلاق',            en: 'Close' },
  signOut:         { ar: 'تسجيل الخروج',    en: 'Sign Out' },
  signedOut:       { ar: 'تم تسجيل الخروج بنجاح', en: 'Signed out successfully' },
  errSignIn:       { ar: 'يرجى تسجيل الدخول أولاً', en: 'Please sign in first' },
  errSetup:        { ar: 'لم يتم إعداد النظام — يرجى إكمال الإعداد الأولي', en: 'System not set up — please complete initial setup' },
  errSession:      { ar: 'انتهت صلاحية الجلسة — يرجى تسجيل الدخول مرة أخرى', en: 'Session expired — please sign in again' },
  errNoPermission: { ar: 'ليس لديك صلاحية للوصول إلى هذه الصفحة', en: 'You do not have permission to access this page' },
  errLoadFailed:   { ar: 'حدث خطأ أثناء تحميل الصفحة', en: 'An error occurred while loading the page' },
  errSaveFailed:   { ar: 'فشل الحفظ',        en: 'Failed to save' },
  errDeleteFailed: { ar: 'فشل الحذف',        en: 'Failed to delete' },
  errRestoreFailed:{ ar: 'فشل الاستعادة',    en: 'Failed to restore' },
  successUpdated:  { ar: 'تم التحديث بنجاح', en: 'Updated successfully' },
  requiredFields:  { ar: 'الرجاء تعبئة جميع الحقول المطلوبة', en: 'Please fill in all required fields' },
  saving:          { ar: 'جارٍ الحفظ...',    en: 'Saving...' },
  saved:           { ar: 'تم الحفظ',         en: 'Saved' },
  syncing:         { ar: 'جارٍ المزامنة...', en: 'Syncing...' },
  allSaved:        { ar: 'تم حفظ جميع التغييرات', en: 'All changes saved' },
  // iOS tap screen (auth.js)
  welcomeBack:     { ar: 'مرحباً بعودتك',    en: 'Welcome back' },
  tapToContinue:   { ar: 'اضغط للمتابعة',    en: 'Tap to continue' },
  continue:        { ar: 'متابعة',            en: 'Continue' },
  // Sidebar nav labels
  dashboard:       { ar: 'لوحة التحكم',     en: 'Dashboard' },
  transactions:    { ar: 'المعاملات',        en: 'Transactions' },
  donors:          { ar: 'المتبرعون',        en: 'Donors' },
  beneficiaries:   { ar: 'المستفيدون',       en: 'Beneficiaries' },
  inventory:       { ar: 'المخزون',          en: 'Inventory' },
  projects:        { ar: 'المشاريع',         en: 'Projects' },
  receipts:        { ar: 'الإيصالات',        en: 'Receipts' },
  installments:    { ar: 'الأقساط',          en: 'Installments' },
  recurring:       { ar: 'المعاملات الدورية', en: 'Recurring' },
  reports:         { ar: 'التقارير',         en: 'Reports' },
  settings:        { ar: 'الإعدادات',        en: 'Settings' },
  permissions:     { ar: 'الصلاحيات',        en: 'Permissions' },
  system:          { ar: 'النظام',           en: 'SYSTEM' },
  mainMenu:        { ar: 'القائمة الرئيسية', en: 'MAIN MENU' },
  charityManagement: { ar: 'إدارة الجمعية الخيرية', en: 'Charity Management' },
  // Role labels (sidebar footer)
  roleSuperAdmin:       { ar: 'مسؤول النظام الكامل', en: 'Super Administrator' },
  roleDirector:         { ar: 'المدير التنفيذي',      en: 'Executive Director' },
  roleAccountManager:   { ar: 'مسؤول الحسابات',       en: 'Account Manager' },
  roleCaseManager:      { ar: 'مسؤول الحالات',        en: 'Case Manager' },
  roleDataEntry:        { ar: 'موظف إدخال بيانات',    en: 'Data Entry Clerk' },
  roleInventoryManager: { ar: 'مسؤول المخزون',        en: 'Inventory Manager' },
  roleViewer:           { ar: 'مشاهد فقط',            en: 'Viewer Only' },

  /* ── TIER 2: Home.html pre-auth static strings ─────────────
     Home.html runs before OAuth — the sheet cannot be fetched.
     Edit here if you need to change sign-in / wizard text.
     DO NOT add these keys to the Translations sheet.
  ─────────────────────────────────────────────────────────── */
  // Loading screen
  'home.appName':         { ar: 'نظام إدارة الجمعية الخيرية', en: 'Charity Management System' },
  'home.stepInit':        { ar: 'جارٍ التهيئة…',                     en: 'Initializing…' },
  'home.stepSession':     { ar: 'جارٍ التحقق من الجلسة…',            en: 'Verifying session…' },
  'home.stepRedirect':    { ar: 'جارٍ معالجة تسجيل الدخول…',         en: 'Processing sign-in…' },
  'home.stepAccount':     { ar: 'جارٍ التحقق من بيانات الحساب…',     en: 'Fetching account details…' },
  'home.stepAccess':      { ar: 'جارٍ التحقق من الصلاحيات…',         en: 'Checking permissions…' },
  'home.stepUser':        { ar: 'جارٍ التحقق من حساب المستخدم…',     en: 'Verifying user account…' },
  'home.stepRedirecting': { ar: 'جارٍ التوجيه إلى Google…',          en: 'Redirecting to Google…' },
  'home.stepCreating':    { ar: 'جارٍ الإنشاء…',                     en: 'Creating…' },
  'home.stepSaving':      { ar: 'جارٍ الحفظ…',                       en: 'Saving…' },
  'home.stepSettingUp':   { ar: 'جارٍ إعداد نظامك، يرجى الانتظار…', en: 'Setting up your system, please wait…' },
  // Sign-in screen
  'home.signInSubtitle':  { ar: 'سجّل دخولك للمتابعة إلى النظام',   en: 'Sign in to continue to the system' },
  'home.signInBtn':       { ar: 'تسجيل الدخول بحساب Google',          en: 'Sign in with Google' },
  'home.authorizedOnly':  { ar: 'هذا النظام مخصص للمستخدمين المصرّح لهم فقط', en: 'This system is for authorized users only' },
  // Access pending screen
  'home.pendingTitle':    { ar: 'في انتظار تفعيل الحساب',            en: 'Account Pending Activation' },
  'home.pendingDesc':     { ar: 'تم التحقق من حسابك، لكن لم يتم تفعيل وصولك بعد. تواصل مع المسؤول لمنحك الصلاحية.', en: 'Your account was verified, but access has not been activated yet. Contact the administrator to grant you permission.' },
  'home.retryBtn':        { ar: 'إعادة المحاولة',                    en: 'Try Again' },
  'home.switchAccount':   { ar: 'تسجيل الدخول بحساب آخر',            en: 'Sign in with a different account' },
  // Error toasts (Home.html only)
  'home.errNoToken':      { ar: 'لم يتم استلام التوكن — حاول مرة أخرى', en: 'No token received — please try again' },
  'home.errUserInfo':     { ar: 'تعذّر الحصول على بيانات الحساب',       en: 'Could not fetch account details' },
  'home.errCheck':        { ar: 'خطأ أثناء التحقق',                     en: 'Error during verification' },
  'home.errSetup':        { ar: 'فشل الإعداد',                          en: 'Setup failed' },
  'home.errSave':         { ar: 'فشل الحفظ',                            en: 'Failed to save' },
  'home.welcomeUser':     { ar: 'مرحباً',                               en: 'Welcome' },
  'home.registered':      { ar: 'تم التسجيل بنجاح — أخبر المسؤول بفتح التطبيق', en: 'Registered successfully — ask the admin to open the app' },
  'home.requiredFields':  { ar: 'يرجى ملء جميع الحقول المطلوبة',        en: 'Please fill in all required fields' },
  'home.retrySetup':      { ar: 'إعادة المحاولة',                       en: 'Retry' },
  // Setup wizard
  'home.wizStep1Title':   { ar: 'مرحباً بك',                           en: 'Welcome' },
  'home.wizStep1Desc':    { ar: 'لقد تم تعيينك مسؤولاً رئيسياً عن {org}. سنعدّ نظامك الآن.', en: 'You have been assigned as the primary administrator of {org}. We will set up your system now.' },
  'home.wizBullet1':      { ar: 'إنشاء مجلد خاص بجمعيتك على Google Drive', en: 'Create a dedicated folder for your charity on Google Drive' },
  'home.wizBullet2':      { ar: 'إنشاء جداول البيانات وتهيئة النظام كاملاً', en: 'Create spreadsheets and fully configure the system' },
  'home.wizBullet3':      { ar: 'تسجيل حسابك كمسؤول رئيسي',             en: 'Register your account as primary administrator' },
  'home.wizStartBtn':     { ar: 'ابدأ الإعداد',                         en: 'Start Setup' },
  'home.wizStep2Title':   { ar: 'تفاصيل الجمعية',                       en: 'Organisation Details' },
  'home.wizStep2Desc':    { ar: 'راجع وأكمل بيانات جمعيتك',            en: 'Review and complete your organisation details' },
  'home.wizBackBtn':      { ar: 'رجوع',                                  en: 'Back' },
  'home.wizConfirmBtn':   { ar: 'تأكيد والمتابعة',                      en: 'Confirm & Continue' },
  'home.wizStep3Title':   { ar: 'إنشاء النظام',                         en: 'Creating the System' },
  'home.wizStep3Desc':    { ar: 'اضغط أدناه لإنشاء نظامك على Google Drive', en: 'Click below to create your system on Google Drive' },
  'home.wizCheck0':       { ar: 'إنشاء مجلد الجمعية على Drive',         en: 'Create charity folder on Drive' },
  'home.wizCheck1':       { ar: 'إنشاء ملف البيانات الرئيسي',           en: 'Create main data spreadsheet' },
  'home.wizCheck2':       { ar: 'إعداد جداول البيانات (22 جدول)',       en: 'Set up data sheets (22 sheets)' },
  'home.wizCheck3':       { ar: 'تهيئة بيانات الفئات والتصنيفات',      en: 'Seed categories and classifications' },
  'home.wizCheck4':       { ar: 'تسجيل حساب المسؤول الرئيسي',          en: 'Register primary admin account' },
  'home.wizCheck5':       { ar: 'إعداد صلاحيات المستخدمين',            en: 'Set up user permissions' },
  'home.wizCreateBtn':    { ar: 'إنشاء النظام الآن',                   en: 'Create System Now' },
  'home.wizDoneTitle':    { ar: 'النظام جاهز!',                         en: 'System Ready!' },
  'home.wizDoneDesc':     { ar: 'تم إعداد نظامك بنجاح. يمكنك الآن البدء.', en: 'Your system has been set up successfully. You can now get started.' },
  'home.wizManageUsers':  { ar: 'إدارة المستخدمين',                     en: 'Manage Users' },
  'home.wizDashboard':    { ar: 'لوحة التحكم',                          en: 'Dashboard' },
  // SysAdmin panel (also pre-auth — only you see this)
  'home.saTitle':         { ar: 'لوحة مسؤول النظام',                   en: 'System Admin Panel' },
  'home.saOrgsTitle':     { ar: 'المنظمات المُفعَّلة',                 en: 'Registered Organisations' },
  'home.saOrgsSubtitle':  { ar: 'إدارة الجمعيات المسجلة في النظام',   en: 'Manage charities registered in the system' },
  'home.saAddBtn':        { ar: 'تسجيل جمعية جديدة',                   en: 'Register New Charity' },
  'home.saTotal':         { ar: 'إجمالي الجمعيات',                     en: 'Total Charities' },
  'home.saActive':        { ar: 'مفعَّلة',                             en: 'Active' },
  'home.saPending':       { ar: 'في انتظار الإعداد',                   en: 'Pending Setup' },
  'home.saSearch':        { ar: 'بحث…',                                 en: 'Search…' },
  'home.saRefresh':       { ar: 'تحديث',                                en: 'Refresh' },
  'home.saColOrg':        { ar: 'الجمعية',                              en: 'Organisation' },
  'home.saColAdmin':      { ar: 'المسؤول',                              en: 'Admin' },
  'home.saColGov':        { ar: 'المحافظة',                             en: 'Governorate' },
  'home.saColStatus':     { ar: 'الحالة',                               en: 'Status' },
  'home.saColDate':       { ar: 'تاريخ التسجيل',                        en: 'Registered' },
  'home.saColSheet':      { ar: 'الملف',                                en: 'Sheet' },
  'home.saLoading':       { ar: 'جارٍ التحميل…',                       en: 'Loading…' },
  'home.saEmpty':         { ar: 'لا توجد جمعيات مسجلة',                en: 'No charities registered' },
  'home.saEmptyDesc':     { ar: 'اضغط على "تسجيل جمعية جديدة" للبدء',  en: 'Click "Register New Charity" to get started' },
  'home.saFailedLoad':    { ar: 'فشل التحميل',                          en: 'Failed to load' },
  'home.saStatusPending': { ar: 'في الانتظار',                          en: 'Pending' },
  'home.saStatusDone':    { ar: 'مفعَّل',                              en: 'Active' },
  'home.saOpenSheet':     { ar: 'فتح',                                   en: 'Open' },
  'home.saRemind':        { ar: 'تذكير',                                 en: 'Remind' },
  'home.saExit':          { ar: 'خروج',                                  en: 'Sign Out' },
  // Onboard modal
  'home.onboardTitle':    { ar: 'تسجيل جمعية جديدة',                   en: 'Register New Charity' },
  'home.onboardSubmit':   { ar: 'تسجيل الجمعية',                        en: 'Register Charity' },
  'home.selectGov':       { ar: 'اختر المحافظة…',                       en: 'Select governorate…' },
};

/* ── t(key) ───────────────────────────────────────────────
   Looks up the active cache, then falls back to
   FALLBACK_TRANSLATIONS, then returns the key itself.
──────────────────────────────────────────────────────────── */
function t(key) {
  const cache = _translationsCache || FALLBACK_TRANSLATIONS;
  const entry = cache[key];
  if (!entry) return key;
  return entry[LANG] || entry['ar'] || key;
}

/* ── loadTranslations(token, forceRefresh) ────────────────
   Fetches the "Translations" sheet from the SysAdmin
   config spreadsheet and stores the result in memory
   and localStorage.

   - token        : Google OAuth access token
   - forceRefresh : if true, ignores the 24-hour TTL

   Returns: true on success, false on failure.
   On failure, the fallback translations remain active.
──────────────────────────────────────────────────────────── */
async function loadTranslations(token, forceRefresh = false) {
  /* 1. Try localStorage cache first (unless forced) */
  if (!forceRefresh) {
    const cached = _readTranslationsCache();
    if (cached) {
      _translationsCache = cached;
      return true;
    }
  }

  /* 2. Fetch from the SysAdmin config sheet */
  if (!token) {
    console.warn('loadTranslations: no token — using fallback');
    return false;
  }

  const sheetId = window.APP_CONFIG?.admin?.configSheetId || SYSADMIN_SHEET_ID;

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${TRANSLATIONS_SHEET}!A:C`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      console.warn('loadTranslations: fetch failed', res.status);
      _loadFallbackIntoCache();
      return false;
    }

    const data = await res.json();
    const rows = data.values || [];

    if (rows.length < 2) {
      console.warn('loadTranslations: sheet is empty');
      _loadFallbackIntoCache();
      return false;
    }

    /* 3. Build cache object { key: { ar, en } } */
    const header = rows[0].map(h => h.trim().toLowerCase()); // ['key','ar','en']
    const keyIdx = header.indexOf('key');
    const arIdx  = header.indexOf('ar');
    const enIdx  = header.indexOf('en');

    if (keyIdx === -1 || arIdx === -1 || enIdx === -1) {
      console.warn('loadTranslations: missing columns — expected key, ar, en');
      _loadFallbackIntoCache();
      return false;
    }

    const parsed = {};
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const key = (row[keyIdx] || '').trim();
      if (!key) continue;
      parsed[key] = {
        ar: (row[arIdx] || '').trim(),
        en: (row[enIdx] || '').trim()
      };
    }

    /* 4. Merge with fallback so critical keys are always present */
    _translationsCache = { ...FALLBACK_TRANSLATIONS, ...parsed };

    /* 5. Persist to localStorage */
    _writeTranslationsCache(_translationsCache);

    console.info(`loadTranslations: loaded ${Object.keys(parsed).length} keys from sheet`);
    return true;

  } catch (e) {
    console.warn('loadTranslations: error —', e.message);
    _loadFallbackIntoCache();
    return false;
  }
}

/* ── Cache helpers ────────────────────────────────────────── */
function _readTranslationsCache() {
  try {
    const ts   = parseInt(localStorage.getItem(TRANSLATIONS_TS_KEY) || '0', 10);
    const aged = Date.now() - ts > TRANSLATIONS_TTL;
    if (aged) return null;
    const raw = localStorage.getItem(TRANSLATIONS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function _writeTranslationsCache(data) {
  try {
    localStorage.setItem(TRANSLATIONS_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(TRANSLATIONS_TS_KEY, String(Date.now()));
  } catch (e) {
    console.warn('loadTranslations: could not write cache —', e.message);
  }
}

function _loadFallbackIntoCache() {
  if (!_translationsCache) _translationsCache = { ...FALLBACK_TRANSLATIONS };
}

/* ── clearTranslationsCache() — called from Settings ─────── */
function clearTranslationsCache() {
  localStorage.removeItem(TRANSLATIONS_CACHE_KEY);
  localStorage.removeItem(TRANSLATIONS_TS_KEY);
  _translationsCache = null;
}

/* ── setLanguage(lang) ────────────────────────────────────── */
function setLanguage(lang) {
  if (lang !== 'ar' && lang !== 'en') return;
  LANG = lang;
  localStorage.setItem('app_lang', lang);

  document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.body.dir             = lang === 'ar' ? 'rtl' : 'ltr';

  if (typeof getAuthState === 'function') {
    const authState = getAuthState();
    if (authState?.email) {
      renderSidebar(authState.email, authState.userName, authState.role);
    }
  }

  applyTranslations();

  if (typeof showToast === 'function') {
    showToast(t('successUpdated'), 'success');
  }
}

/* ── applyTranslations() ──────────────────────────────────── */
function applyTranslations() {
  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t');
    if (!key) return;
    const val = t(key);
    if (val === key) return; // key not found — leave as-is
    const isInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
    if (isInput && el.hasAttribute('data-t-placeholder')) {
      el.placeholder = val;
    } else if (!isInput) {
      el.textContent = val;
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
  return 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
}

async function readSheet(spreadsheetId, sheetName, options = {}) {
  const { includeDeleted = false, email = null } = options;
  let token = getSavedAccessToken();
  if (!token) throw new Error('No access token');
  
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:Z`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  // If token expired, redirect to home to re-authenticate
  if (response.status === 401) {
    clearAccessToken();
    localStorage.removeItem('coms_user');
    sessionStorage.removeItem('coms_permissions');
    // Remove role cache for any logged-in user (not hardcoded email)
    const _u = JSON.parse(localStorage.getItem('coms_user') || '{}');
    if (_u?.email) sessionStorage.removeItem(`coms_role_${_u.email}`);
    if (typeof showToast === 'function') {
      showToast(typeof t === 'function' ? t('errSession') : 'Session expired', 'error');
    }
    setTimeout(() => {
      // Use _homePath if available (defined in auth.js), otherwise best-guess
      const home = typeof _homePath === 'function' ? _homePath() : '../pages/Home.html';
      window.location.href = home;
    }, 1500);
    throw new Error('Session expired');
  }
  
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
  if (!menu) {
    console.warn('User menu element not found');
    return;
  }
  // Remove any inline display style that might interfere
  menu.style.display = '';
  // Toggle the 'open' class
  menu.classList.toggle('open');
}

// Close user menu when clicking outside
document.addEventListener('click', function(e) {
  const menu = document.getElementById('userMenu');
  const userBtn = document.querySelector('.sidebar-user');
  if (menu && userBtn && !userBtn.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.remove('open');  // Use classList.remove instead of style.display
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
  const duration = window.APP_CONFIG?.ui?.toastDuration || 3000;
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
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
    if (status === 'syncing') text.textContent = typeof t === 'function' ? t('syncing') : 'Syncing...';
    else if (status === 'synced') text.textContent = typeof t === 'function' ? t('allSaved') : 'All changes saved';
    else if (status === 'error') text.textContent = typeof t === 'function' ? t('errSaveFailed') : 'Sync failed';
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
window.loadTranslations = loadTranslations;
window.clearTranslationsCache = clearTranslationsCache;
window.showToast = showToast;
window.escapeHTML = escapeHTML;
window.t = t;

// Make lookup data available globally
window.LOOKUP_SEED_DATA = LOOKUP_SEED_DATA;
window.SHEET_DEFINITIONS = SHEET_DEFINITIONS;
window.ALL_PAGES = ALL_PAGES;
window.DEFAULT_ROLES = DEFAULT_ROLES;
