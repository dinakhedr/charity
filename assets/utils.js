/* ============================================================
   CHARITY MANAGEMENT SYSTEM — utils.js
   Shared utilities, Google Sheets API wrapper, translations
   ============================================================ */

'use strict';

/* ══════════════════════════════════════════════════════════
   GLOBAL CONFIGURATION
══════════════════════════════════════════════════════════ */

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
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:${String.fromCharCode(65 + headers.length - 1)}`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Failed to read sheet for update');
  
  const data = await response.json();
  const rows = data.values || [];
  
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    const recordIDIndex = headers.indexOf('RecordID');
    if (rows[i][recordIDIndex] === recordID) {
      rowIndex = i + 1; // 1-indexed for API
      break;
    }
  }
  
  if (rowIndex === -1) throw new Error('Row not found');
  
  // Prepare updated row
  const now = getCurrentTimestamp();
  const updatedRow = [...rows[rowIndex - 1]];
  
  headers.forEach((header, idx) => {
    if (header === 'ModifiedAt') updatedRow[idx] = now;
    else if (header === 'ModifiedBy') updatedRow[idx] = userEmail;
    else if (updates[header] !== undefined) updatedRow[idx] = updates[header];
  });
  
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A${rowIndex}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex}?valueInputOption=USER_ENTERED`;
  
  const updateResponse = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [updatedRow]
    })
  });
  
  if (!updateResponse.ok) throw new Error('Failed to update row');
  
  return true;
}

// Soft delete a record
async function softDelete(spreadsheetId, sheetName, recordID, userEmail) {
  return updateRow(spreadsheetId, sheetName, recordID, {
    IsDeleted: 'TRUE',
    DeletedAt: getCurrentTimestamp()
  }, userEmail);
}

// Restore a soft-deleted record
async function restoreRecord(spreadsheetId, sheetName, recordID, userEmail) {
  return updateRow(spreadsheetId, sheetName, recordID, {
    IsDeleted: 'FALSE',
    DeletedAt: ''
  }, userEmail);
}

// Check page permissions for a user
async function checkPagePermissions(pageName, spreadsheetId, email) {
  // SuperAdmin has all permissions
  const users = await readSheet(spreadsheetId, 'Users', { includeDeleted: false });
  const user = users.find(u => u.Email?.toLowerCase() === email.toLowerCase());
  
  if (!user) return { canView: false, canCreate: false, canEdit: false, canDelete: false, canViewDeleted: false, canViewSensitive: false, canExport: false };
  
  if (user.Role === 'SuperAdmin') {
    return { canView: true, canCreate: true, canEdit: true, canDelete: true, canViewDeleted: true, canViewSensitive: true, canExport: true };
  }
  
  // Get permissions for this role and page
  const permissions = await readSheet(spreadsheetId, 'Permissions', { includeDeleted: false });
  const perm = permissions.find(p => p.RoleID === user.Role && p.PageName === pageName);
  
  if (!perm) {
    return { canView: false, canCreate: false, canEdit: false, canDelete: false, canViewDeleted: false, canViewSensitive: false, canExport: false };
  }
  
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

// Apply permissions to UI (disable buttons/elements)
function applyPermissionsToUI(perms) {
  if (!perms) return;
  
  // Disable create buttons
  if (!perms.canCreate) {
    document.querySelectorAll('[data-requires="create"]').forEach(el => {
      el.classList.add('permission-disabled');
      el.disabled = true;
    });
  }
  
  // Disable edit buttons
  if (!perms.canEdit) {
    document.querySelectorAll('[data-requires="edit"]').forEach(el => {
      el.classList.add('permission-disabled');
      el.disabled = true;
    });
  }
  
  // Disable delete buttons
  if (!perms.canDelete) {
    document.querySelectorAll('[data-requires="delete"]').forEach(el => {
      el.classList.add('permission-disabled');
      el.disabled = true;
    });
  }
  
  // Hide deleted records toggle
  if (!perms.canViewDeleted) {
    const deletedToggle = document.getElementById('showDeletedToggle');
    if (deletedToggle) deletedToggle.style.display = 'none';
  }
  
  // Disable export buttons
  if (!perms.canExport) {
    document.querySelectorAll('[data-requires="export"]').forEach(el => {
      el.classList.add('permission-disabled');
      el.disabled = true;
    });
  }
}

// Render sidebar
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
        <a href="Permissions.html" class="nav-item active" data-page="Permissions">
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
      <div class="dropdown-menu" id="userMenu" style="display:none;">
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

// Toggle user menu
function toggleUserMenu() {
  const menu = document.getElementById('userMenu');
  if (menu) {
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
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
  
  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ══════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
══════════════════════════════════════════════════════════ */

// Escape HTML to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Debounce function for search inputs
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

// Format currency
function formatCurrency(amount, currency = 'EGP') {
  return new Intl.NumberFormat(LANG === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
}

// Format number
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
    if (status === 'syncing') text.textContent = t('syncing') || 'Syncing...';
    else if (status === 'synced') text.textContent = t('synced') || 'All changes saved';
    else if (status === 'error') text.textContent = t('syncError') || 'Sync failed';
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
  // Apply translations
  applyTranslations();
  
  // Set document direction based on language
  document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = LANG;
  document.body.dir = LANG === 'ar' ? 'rtl' : 'ltr';
});

// Export for use in other files (if using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    t, setLanguage, applyTranslations,
    readSheet, appendRow, updateRow, softDelete, restoreRecord,
    checkPagePermissions, applyPermissionsToUI,
    getCurrentTimestamp, formatDisplayDate, formatDisplayDateTime,
    generateRecordID, escapeHTML, debounce, formatCurrency, formatNumber,
    showToast, updateSyncIndicator, clearSyncQueue,
    getSavedAccessToken, saveAccessToken, clearAccessToken,
    SPREADSHEET_ID_KEY, ALL_PAGES, SHEET_DEFINITIONS
  };
}
