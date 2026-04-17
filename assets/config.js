/* ============================================================
   CHARITY MANAGEMENT SYSTEM — config.js
   Centralized configuration file
   ============================================================ */

'use strict';

/* ══════════════════════════════════════════════════════════
   GOOGLE OAUTH CONFIGURATION
══════════════════════════════════════════════════════════ */

const CONFIG = {
  // Google OAuth 2.0 Configuration
  google: {
    // Client ID from Google Cloud Console
    clientId: '460184547236-7a4jn7lclo4317pnui9qjcu9d62buknn.apps.googleusercontent.com',
    
    // OAuth Scopes required for the application
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    
    // OAuth endpoints
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },

  // System Admin Configuration
  admin: {
    // Master admin email - this user has access to the SysAdmin panel
    email: 'dina.khedr@gmail.com',
    
    // System configuration spreadsheet ID
    // This sheet contains the 'Organizations' tab that tracks all registered charities
    configSheetId: '1m41rWfsHWWh6LkKqDir8nnen0y0Yx8RzhPPQs73Bxis'
  },

  // Application Settings
  app: {
    // App display name — use t('charityManagement') in the UI, not this field directly
    name: 'Charity Management System',
    nameEn: 'Charity Management System',
    version: '1.0.0',
    environment: 'production',  // 'development' or 'production'
    
    // Session and cache settings
    sessionTimeout: 60 * 60 * 1000,       // 1 hour in milliseconds
    syncInterval: 5 * 60 * 1000,          // 5 minutes
    translationsTTL: 24 * 60 * 60 * 1000, // 24 hours — how long translation cache is valid
    
    // Feature flags
    features: {
      enableOfflineMode: false,
      enableEmailNotifications: false,
      enableAuditLog: true
    }
  },

  // Sheet Names Configuration
  sheets: {
    organizations: 'Organizations',
    users: 'Users',
    roles: 'Roles',
    permissions: 'Permissions',
    donors: 'Donors',
    beneficiaries: 'Beneficiaries',
    transactions: 'Transactions',
    receipts: 'Receipts',
    inventory: 'Inventory',
    projects: 'Projects',
    installments: 'Installments',
    recurring: 'Recurring',
    categories: 'Categories',
    donorTypes: 'DonorTypes',
    islamicClasses: 'IslamicClasses',
    needTypes: 'NeedTypes',
    paymentMethods: 'PaymentMethods',
    aidFrequencies: 'AidFrequencies',
    projectStatuses: 'ProjectStatuses',
    projectCategories: 'ProjectCategories',
    governorates: 'Governorates',
    notificationPrefs: 'NotificationPrefs',
    translations: 'Translations'
  },

  // Role Configuration
  roles: {
    builtin: ['SuperAdmin', 'Director', 'AccountManager', 'CaseManager', 'DataEntry', 'InventoryManager', 'Viewer'],
    // Role hierarchy (higher index = more privileges)
    hierarchy: {
      'SuperAdmin': 100,
      'Director': 90,
      'AccountManager': 70,
      'CaseManager': 70,
      'InventoryManager': 60,
      'DataEntry': 50,
      'Viewer': 10
    }
  },

  // UI Configuration
  ui: {
    defaultLanguage: 'ar',  // 'ar' or 'en'
    rtlLanguages: ['ar'],
    ltrLanguages: ['en'],
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'EGP',
    itemsPerPage: 25,
    toastDuration: 3000  // milliseconds
  },

  // API Endpoints (for future backend integration)
  api: {
    baseUrl: '',  // Set this if using a backend proxy
    endpoints: {
      auth: '/api/auth',
      sheets: '/api/sheets',
      drive: '/api/drive'
    }
  }
};

/* ══════════════════════════════════════════════════════════
   HELPER FUNCTIONS
══════════════════════════════════════════════════════════ */

// Get the OAuth scopes as a space-separated string
function getOAuthScopes() {
  return CONFIG.google.scopes.join(' ');
}

// Get the full OAuth URL for redirect
function getOAuthUrl(redirectUri) {
  const params = new URLSearchParams({
    client_id: CONFIG.google.clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: getOAuthScopes(),
    include_granted_scopes: 'true',
    prompt: 'select_account'
  });
  return `${CONFIG.google.authUrl}?${params.toString()}`;
}

// Check if the current environment is development
function isDevelopment() {
  return CONFIG.app.environment === 'development' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
}

// Check if the user is the system admin
function isSystemAdmin(email) {
  return email && email.toLowerCase() === CONFIG.admin.email.toLowerCase();
}

// Get the config sheet ID (with environment override if needed)
function getConfigSheetId() {
  // Allow runtime override via sessionStorage for testing
  const override = sessionStorage.getItem('config_sheet_override');
  if (override && isDevelopment()) {
    return override;
  }
  return CONFIG.admin.configSheetId;
}

/* ══════════════════════════════════════════════════════════
   VALIDATION (runs when loaded)
══════════════════════════════════════════════════════════ */

// Validate that critical config values are set (not default)
function validateConfig() {
  const warnings = [];
  
  if (CONFIG.google.clientId === 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com') {
    warnings.push('⚠️ Please replace CLIENT_ID in config.js with your actual Google OAuth Client ID');
  }
  
  if (CONFIG.admin.email === 'your-email@example.com') {
    warnings.push('⚠️ Please replace SYSADMIN_EMAIL in config.js with your actual admin email');
  }
  
  if (CONFIG.admin.configSheetId === 'YOUR_SHEET_ID_HERE') {
    warnings.push('⚠️ Please replace SYSADMIN_SHEET_ID in config.js with your actual config spreadsheet ID');
  }
  
  if (warnings.length > 0) {
    console.warn('=== CONFIGURATION WARNINGS ===');
    warnings.forEach(w => console.warn(w));
    console.warn('================================');
  }
  
  return warnings;
}

// Auto-validate when loaded (only in development)
if (isDevelopment()) {
  validateConfig();
}

/* ══════════════════════════════════════════════════════════
   EXPORT
══════════════════════════════════════════════════════════ */

// Make config globally available
window.APP_CONFIG = CONFIG;
window.getOAuthScopes = getOAuthScopes;
window.getOAuthUrl = getOAuthUrl;
window.isDevelopment = isDevelopment;
window.isSystemAdmin = isSystemAdmin;
window.getConfigSheetId = getConfigSheetId;

// For module exports (if using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    getOAuthScopes,
    getOAuthUrl,
    isDevelopment,
    isSystemAdmin,
    getConfigSheetId
  };
}
