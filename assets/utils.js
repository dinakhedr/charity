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
  // Common
  'loading': 'Loading...',
  'save': 'Save',
  'cancel': 'Cancel',
  'delete': 'Delete',
  'edit': 'Edit',
  'add': 'Add',
  'search': 'Search',
  'filter': 'Filter',
  'export': 'Export',
  'import': 'Import',
  'refresh': 'Refresh',
  'close': 'Close',
  'confirm': 'Confirm',
  'saving': 'Saving...',
  'saved': 'Saved',
  'error': 'Error',
  'success': 'Success',
  'warning': 'Warning',
  'info': 'Info',
  'allSaved': 'All changes saved',
  'requiredFields': 'Please fill all required fields',
  
  // Auth & Navigation
  'signIn': 'Sign In',
  'signOut': 'Sign Out',
  'welcomeBack': 'Welcome Back',
  'tapToContinue': 'Tap to continue',
  'continue': 'Continue',
  'errSignIn': 'Please sign in first',
  'errSetup': 'System not set up — please complete initial setup',
  'errSession': 'Session expired — please sign in again',
  'errNoPermission': 'You don\'t have permission to access this page',
  'errLoadFailed': 'Failed to load data',
  'errSaveFailed': 'Failed to save',
  'errDeleteFailed': 'Failed to delete',
  'signedOut': 'Signed out successfully',
  
  // Permissions Page
  'permissionsTitle': 'Permissions',
  'permissionsSubtitle': 'Manage users, roles and permissions',
  'usersList': 'User List',
  'rolesTitle': 'Roles',
  'rolesSubtitle': 'Manage system roles and their permissions',
  'matrixTitle': 'Permissions Matrix',
  'matrixSubtitle': 'Configure detailed permissions per role',
  'tabUsers': 'Users',
  'tabRoles': 'Roles',
  'tabMatrix': 'Permissions Matrix',
  'addUser': 'Add User',
  'addCustomRole': 'Add Custom Role',
  'showDeleted': 'Show deleted users',
  'colUser': 'User',
  'colRole': 'Role',
  'colStatus': 'Status',
  'colLastLogin': 'Last Login',
  'colDateAdded': 'Date Added',
  'colPage': 'Page',
  'colView': 'View',
  'colCreate': 'Create',
  'colEdit': 'Edit',
  'colDelete': 'Delete',
  'colViewDeleted': 'Deleted',
  'colSensitive': 'Sensitive',
  'colExport': 'Export',
  'selectRole': 'Select a role...',
  'selectRoleFirst': 'Select a role first',
  'selectRoleHint': 'Choose a role from the dropdown above to view and edit permissions',
  'noUsers': 'No users found',
  'noUsersHint': 'Click "Add User" to create your first user',
  'deleted': 'Deleted',
  'restore': 'Restore',
  
  // Matrix column headers (bilingual display)
  'colViewEn': 'View',
  'colViewAr': 'Page View',
  'colCreateEn': 'Create',
  'colCreateAr': 'Add Records',
  'colEditEn': 'Edit',
  'colEditAr': 'Edit Records',
  'colDeleteEn': 'Delete',
  'colDeleteAr': 'Soft Delete',
  'colViewDeletedEn': 'Deleted',
  'colViewDeletedAr': 'View Deleted',
  'colSensitiveEn': 'Sensitive',
  'colSensitiveAr': 'Sensitive Data',
  'colExportEn': 'Export',
  'colExportAr': 'Export Data',
  
  // User Modal
  'addUserTitle': 'Add New User',
  'editUserTitle': 'Edit User',
  'fullName': 'Full Name',
  'emailGoogle': 'Email (Google)',
  'emailHint': 'Must be an active Google account',
  'notes': 'Notes',
  'saveUser': 'Save User',
  'emailExists': 'User with this email already exists',
  
  // Role Modal
  'addRoleTitle': 'Add Custom Role',
  'editRoleTitle': 'Edit Role',
  'roleNameEn': 'Role Name (English)',
  'roleNameHint': 'Used as internal identifier — no spaces',
  'description': 'Description',
  'saveRole': 'Save Role',
  'roleExists': 'Role with this ID already exists',
  
  // Confirm Modal
  'confirmTitle': 'Are you sure?',
  'deleteUserTitle': 'Delete User',
  'deleteRoleTitle': 'Delete Role',
  
  // Status
  'status': 'Status',
  'active': 'Active',
  'inactive': 'Inactive',
  
  // Role labels
  'roleSuperAdmin': 'Super Administrator',
  'roleSuperAdminDesc': 'Full access to all pages and data',
  'roleDirector': 'Executive Director',
  'roleDirectorDesc': 'Full operational permissions with financial deletion capability',
  'roleAccountManager': 'Account Manager',
  'roleAccountManagerDesc': 'Full access to financial modules',
  'roleCaseManager': 'Case Manager',
  'roleCaseManagerDesc': 'Full access to beneficiaries and projects',
  'roleDataEntry': 'Data Entry Clerk',
  'roleDataEntryDesc': 'Add and edit only — no deletion',
  'roleInventoryManager': 'Inventory Manager',
  'roleInventoryManagerDesc': 'Full access to inventory management',
  'roleViewer': 'Viewer Only',
  'roleViewerDesc': 'Read-only access to dashboard and reports',
  
  // Dashboard
  'dashboardTitle': 'Dashboard',
  'totalDonations': 'Total Donations',
  'totalBeneficiaries': 'Total Beneficiaries',
  'totalProjects': 'Total Projects',
  'lowStockItems': 'Low Stock Items',
  'recentTransactions': 'Recent Transactions',
  'upcomingInstallments': 'Upcoming Installments',
  'activeProjects': 'Active Projects',
  
  // Transactions
  'transactionsTitle': 'Transactions',
  'addTransaction': 'Add Transaction',
  'date': 'Date',
  'donor': 'Donor',
  'beneficiary': 'Beneficiary',
  'amount': 'Amount',
  'paymentMethod': 'Payment Method',
  'receiptNumber': 'Receipt Number',
  
  // Donors
  'donorsTitle': 'Donors',
  'addDonor': 'Add Donor',
  'donorName': 'Donor Name',
  'donorType': 'Donor Type',
  'phone': 'Phone',
  'address': 'Address',
  
  // Beneficiaries
  'beneficiariesTitle': 'Beneficiaries',
  'addBeneficiary': 'Add Beneficiary',
  'idNumber': 'ID Number',
  'islamicClass': 'Islamic Class',
  'needType': 'Need Type',
  
  // Inventory
  'inventoryTitle': 'Inventory',
  'addItem': 'Add Item',
  'itemName': 'Item Name',
  'category': 'Category',
  'quantity': 'Quantity',
  'unit': 'Unit',
  'minQuantity': 'Min Quantity',
  'location': 'Location',
  
  // Projects
  'projectsTitle': 'Projects',
  'addProject': 'Add Project',
  'projectName': 'Project Name',
  'projectCategory': 'Project Category',
  'startDate': 'Start Date',
  'endDate': 'End Date',
  'budget': 'Budget',
  'projectStatus': 'Project Status',
  
  // Installments
  'installmentsTitle': 'Installments',
  'addInstallment': 'Add Installment',
  'frequency': 'Frequency',
  'nextDueDate': 'Next Due Date',
  
  // Recurring
  'recurringTitle': 'Recurring Transactions',
  'addRecurring': 'Add Recurring',
  'nextDate': 'Next Date',
  
  // Settings
  'settingsTitle': 'Settings',
  'generalSettings': 'General Settings',
  'language': 'Language',
  'arabic': 'Arabic',
  'english': 'English',
  'theme': 'Theme',
  'light': 'Light',
  'dark': 'Dark',
  'notifications': 'Notifications',
  'backup': 'Backup',
  'restore': 'Restore',
  
  // Reports
  'reportsTitle': 'Reports',
  'financialReports': 'Financial Reports',
  'donorReports': 'Donor Reports',
  'beneficiaryReports': 'Beneficiary Reports',
  'inventoryReports': 'Inventory Reports',
  'projectReports': 'Project Reports',
  
  // Success Messages
  'successSaved': 'Saved successfully',
  'successDeleted': 'Deleted successfully',
  'successRestored': 'Restored successfully',
  'successUpdated': 'Updated successfully',
  
  // Time
  'today': 'Today',
  'yesterday': 'Yesterday',
  'thisWeek': 'This Week',
  'thisMonth': 'This Month',
  'thisYear': 'This Year',
  'allTime': 'All Time'
};

// Arabic translations
const LANG_AR = {
  // Common
  'loading': 'جارٍ التحميل...',
  'save': 'حفظ',
  'cancel': 'إلغاء',
  'delete': 'حذف',
  'edit': 'تعديل',
  'add': 'إضافة',
  'search': 'بحث',
  'filter': 'تصفية',
  'export': 'تصدير',
  'import': 'استيراد',
  'refresh': 'تحديث',
  'close': 'إغلاق',
  'confirm': 'تأكيد',
  'saving': 'جارٍ الحفظ...',
  'saved': 'تم الحفظ',
  'error': 'خطأ',
  'success': 'نجاح',
  'warning': 'تحذير',
  'info': 'معلومات',
  'allSaved': 'تم حفظ جميع التغييرات',
  'requiredFields': 'الرجاء تعبئة جميع الحقول المطلوبة',
  
  // Auth & Navigation
  'signIn': 'تسجيل الدخول',
  'signOut': 'تسجيل الخروج',
  'welcomeBack': 'مرحباً بعودتك',
  'tapToContinue': 'اضغط للمتابعة',
  'continue': 'متابعة',
  'errSignIn': 'يرجى تسجيل الدخول أولاً',
  'errSetup': 'لم يتم إعداد النظام — يرجى إكمال الإعداد الأولي',
  'errSession': 'انتهت صلاحية الجلسة — يرجى تسجيل الدخول مرة أخرى',
  'errNoPermission': 'ليس لديك صلاحية للوصول إلى هذه الصفحة',
  'errLoadFailed': 'فشل تحميل البيانات',
  'errSaveFailed': 'فشل الحفظ',
  'errDeleteFailed': 'فشل الحذف',
  'signedOut': 'تم تسجيل الخروج بنجاح',
  
  // Permissions Page
  'permissionsTitle': 'الصلاحيات',
  'permissionsSubtitle': 'إدارة المستخدمين والأدوار والصلاحيات',
  'usersList': 'قائمة المستخدمين',
  'rolesTitle': 'الأدوار',
  'rolesSubtitle': 'إدارة أدوار النظام والصلاحيات المرتبطة بها',
  'matrixTitle': 'مصفوفة الصلاحيات',
  'matrixSubtitle': 'تكوين الصلاحيات التفصيلية لكل دور',
  'tabUsers': 'المستخدمون',
  'tabRoles': 'الأدوار',
  'tabMatrix': 'مصفوفة الصلاحيات',
  'addUser': 'إضافة مستخدم',
  'addCustomRole': 'إضافة دور مخصص',
  'showDeleted': 'عرض المستخدمين المحذوفين',
  'colUser': 'المستخدم',
  'colRole': 'الدور',
  'colStatus': 'الحالة',
  'colLastLogin': 'آخر دخول',
  'colDateAdded': 'تاريخ الإضافة',
  'colPage': 'الصفحة',
  'colView': 'عرض',
  'colCreate': 'إضافة',
  'colEdit': 'تعديل',
  'colDelete': 'حذف',
  'colViewDeleted': 'محذوف',
  'colSensitive': 'حساس',
  'colExport': 'تصدير',
  'selectRole': 'اختر دوراً...',
  'selectRoleFirst': 'اختر دوراً أولاً',
  'selectRoleHint': 'اختر دوراً من القائمة أعلاه لعرض وتعديل الصلاحيات',
  'noUsers': 'لا يوجد مستخدمون',
  'noUsersHint': 'انقر على "إضافة مستخدم" لإنشاء أول مستخدم',
  'deleted': 'محذوف',
  'restore': 'استعادة',
  
  // Matrix column headers (bilingual display)
  'colViewEn': 'View',
  'colViewAr': 'رؤية الصفحة',
  'colCreateEn': 'Create',
  'colCreateAr': 'إضافة سجلات',
  'colEditEn': 'Edit',
  'colEditAr': 'تعديل سجلات',
  'colDeleteEn': 'Delete',
  'colDeleteAr': 'حذف ناعم',
  'colViewDeletedEn': 'Deleted',
  'colViewDeletedAr': 'عرض المحذوف',
  'colSensitiveEn': 'Sensitive',
  'colSensitiveAr': 'بيانات حساسة',
  'colExportEn': 'Export',
  'colExportAr': 'تصدير البيانات',
  
  // User Modal
  'addUserTitle': 'إضافة مستخدم جديد',
  'editUserTitle': 'تعديل المستخدم',
  'fullName': 'الاسم الكامل',
  'emailGoogle': 'البريد الإلكتروني (Google)',
  'emailHint': 'يجب أن يكون حساب Google فعّالاً',
  'notes': 'ملاحظات',
  'saveUser': 'حفظ المستخدم',
  'emailExists': 'هذا البريد الإلكتروني مسجل مسبقاً',
  
  // Role Modal
  'addRoleTitle': 'إضافة دور مخصص',
  'editRoleTitle': 'تعديل الدور',
  'roleNameEn': 'اسم الدور (بالإنجليزي)',
  'roleNameHint': 'يُستخدم كمعرّف داخلي — بدون مسافات',
  'description': 'الوصف',
  'saveRole': 'حفظ الدور',
  'roleExists': 'هذا المعرف موجود مسبقاً',
  
  // Confirm Modal
  'confirmTitle': 'هل أنت متأكد؟',
  'deleteUserTitle': 'حذف المستخدم',
  'deleteRoleTitle': 'حذف الدور',
  
  // Status
  'status': 'الحالة',
  'active': 'نشط',
  'inactive': 'غير نشط',
  
  // Role labels
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
  'roleViewerDesc': 'قراءة فقط على لوحة التحكم والتقارير',
  
  // Dashboard
  'dashboardTitle': 'لوحة التحكم',
  'totalDonations': 'إجمالي التبرعات',
  'totalBeneficiaries': 'إجمالي المستفيدين',
  'totalProjects': 'إجمالي المشاريع',
  'lowStockItems': 'الأصناف منخفضة المخزون',
  'recentTransactions': 'آخر المعاملات',
  'upcomingInstallments': 'الأقساط القادمة',
  'activeProjects': 'المشاريع النشطة',
  
  // Transactions
  'transactionsTitle': 'المعاملات',
  'addTransaction': 'إضافة معاملة',
  'date': 'التاريخ',
  'donor': 'المتبرع',
  'beneficiary': 'المستفيد',
  'amount': 'المبلغ',
  'paymentMethod': 'طريقة الدفع',
  'receiptNumber': 'رقم الإيصال',
  
  // Donors
  'donorsTitle': 'المتبرعون',
  'addDonor': 'إضافة متبرع',
  'donorName': 'اسم المتبرع',
  'donorType': 'نوع المتبرع',
  'phone': 'الهاتف',
  'address': 'العنوان',
  
  // Beneficiaries
  'beneficiariesTitle': 'المستفيدون',
  'addBeneficiary': 'إضافة مستفيد',
  'idNumber': 'رقم الهوية',
  'islamicClass': 'التصنيف الإسلامي',
  'needType': 'نوع الاحتياج',
  
  // Inventory
  'inventoryTitle': 'المخزون',
  'addItem': 'إضافة صنف',
  'itemName': 'اسم الصنف',
  'category': 'الفئة',
  'quantity': 'الكمية',
  'unit': 'الوحدة',
  'minQuantity': 'الحد الأدنى',
  'location': 'الموقع',
  
  // Projects
  'projectsTitle': 'المشاريع',
  'addProject': 'إضافة مشروع',
  'projectName': 'اسم المشروع',
  'projectCategory': 'فئة المشروع',
  'startDate': 'تاريخ البداية',
  'endDate': 'تاريخ النهاية',
  'budget': 'الميزانية',
  'projectStatus': 'حالة المشروع',
  
  // Installments
  'installmentsTitle': 'الأقساط',
  'addInstallment': 'إضافة قسط',
  'frequency': 'التكرار',
  'nextDueDate': 'تاريخ الاستحقاق القادم',
  
  // Recurring
  'recurringTitle': 'المعاملات الدورية',
  'addRecurring': 'إضافة معاملة دورية',
  'nextDate': 'التاريخ القادم',
  
  // Settings
  'settingsTitle': 'الإعدادات',
  'generalSettings': 'الإعدادات العامة',
  'language': 'اللغة',
  'arabic': 'العربية',
  'english': 'الإنجليزية',
  'theme': 'المظهر',
  'light': 'فاتح',
  'dark': 'داكن',
  'notifications': 'الإشعارات',
  'backup': 'نسخ احتياطي',
  'restore': 'استعادة',
  
  // Reports
  'reportsTitle': 'التقارير',
  'financialReports': 'التقارير المالية',
  'donorReports': 'تقارير المتبرعين',
  'beneficiaryReports': 'تقارير المستفيدين',
  'inventoryReports': 'تقارير المخزون',
  'projectReports': 'تقارير المشاريع',
  
  // Success Messages
  'successSaved': 'تم الحفظ بنجاح',
  'successDeleted': 'تم الحذف بنجاح',
  'successRestored': 'تمت الاستعادة بنجاح',
  'successUpdated': 'تم التحديث بنجاح',
  
  // Time
  'today': 'اليوم',
  'yesterday': 'أمس',
  'thisWeek': 'هذا الأسبوع',
  'thisMonth': 'هذا الشهر',
  'thisYear': 'هذه السنة',
  'allTime': 'كل الوقت'
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

// Get current timestamp
function getCurrentTimestamp() {
  const now = new Date();
  return now.toISOString();
}

// Format date for display
function formatDisplayDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString(LANG === 'ar' ? 'ar-EG' : 'en-US');
}

// Format datetime for display
function formatDisplayDateTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString(LANG === 'ar' ? 'ar-EG' : 'en-US');
}

// Generate unique RecordID
function generateRecordID() {
  return 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Read sheet data
async function readSheet(spreadsheetId, sheetName, options = {}) {
  const {
    includeDeleted = false,
    email = null,
    forceRefresh = false
  } = options;
  
  const token = getSavedAccessToken();
  if (!token) throw new Error('No access token');
  
  const range = `${sheetName}!A:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?majorDimension=ROWS`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Failed to read sheet');
  
  const data = await response.json();
  const rows = data.values || [];
  if (rows.length < 2) return [];
  
  const headers = rows[0];
  const records = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = row[idx] || '';
    });
    
    // Filter deleted
    if (!includeDeleted && record.IsDeleted === 'TRUE') continue;
    
    // Filter by email if provided
    if (email && record.Email && record.Email.toLowerCase() !== email.toLowerCase()) continue;
    
    records.push(record);
  }
  
  return records;
}

// Append row to sheet
async function appendRow(spreadsheetId, sheetName, data, userEmail) {
  const token = getSavedAccessToken();
  if (!token) throw new Error('No access token');
  
  const now = getCurrentTimestamp();
  const recordID = generateRecordID();
  
  // Get headers
  const headers = SHEET_DEFINITIONS[sheetName];
  if (!headers) throw new Error(`Unknown sheet: ${sheetName}`);
  
  // Prepare row data
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
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:${String.fromCharCode(65 + headers.length - 1)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });
  
  if (!response.ok) throw new Error('Failed to append row');
  
  return { RecordID: recordID, ...data };
}

// Update row in sheet
async function updateRow(spreadsheetId, sheetName, recordID, updates, userEmail) {
  const token = getSavedAccessToken();
  if (!token) throw new Error('No access token');
  
  // First find the row
  const records = await readSheet(spreadsheetId, sheetName, { includeDeleted: true });
  const record = records.find(r => r.RecordID === recordID);
  if (!record) throw new Error('Record not found');
  
  // Find row index (add 2 because of 1-indexed and header row)
  const headers = SHEET_DEFINITIONS[sheetName];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:${String.fromCharCode(65
