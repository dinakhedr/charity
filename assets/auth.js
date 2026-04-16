/* ============================================================
   CHARITY MANAGEMENT SYSTEM — auth.js
   Shared Google OAuth authentication module
   Loaded on every page except Home.html
   ============================================================

   USAGE on every secondary page:
   ─────────────────────────────
   initPageAuth({
     pageName: 'Transactions',
     onLoadLocal: (email, spreadsheetId) => {
       // Render cached data immediately — no API call yet
     },
     onReady: async (spreadsheetId, email, accessToken, perms) => {
       // Google Drive connected, permissions loaded
       // Render full live data
     }
   });

   WHAT THIS FILE DOES:
   ────────────────────
   1. Reads google_token from localStorage → extracts email
   2. If no token → toast + redirect to Home.html
   3. Calls onLoadLocal(email, spreadsheetId) immediately
      so page renders cached data before Drive connects
   4. Initialises GAPI client
   5. Tries cached sessionStorage access token (fast path)
   6. On iOS Safari → shows tap-to-continue overlay (browser policy)
   7. Otherwise → requests token silently (no popup if already granted)
   8. Loads user role + permissions matrix
   9. Calls onReady(spreadsheetId, email, accessToken, perms)

   ============================================================ */

'use strict';

/* ── Auth State ───────────────────────────────────────────── */
const _auth = {
  email:         null,
  spreadsheetId: null,
  accessToken:   null,
  role:          null,
  userName:      null,
  initialized:   false
};

/* ── Public API ───────────────────────────────────────────── */

/**
 * initPageAuth({ pageName, onLoadLocal, onReady })
 *
 * Main entry point for every secondary page.
 * Call this once at the bottom of each page's <script>.
 *
 * @param {object}   options
 * @param {string}   options.pageName      - Page name for permission check e.g. 'Transactions'
 * @param {Function} [options.onLoadLocal] - Called immediately with (email, spreadsheetId)
 * @param {Function} options.onReady       - Called when Drive is ready with (spreadsheetId, email, accessToken, perms)
 */
async function initPageAuth({ pageName = '', onLoadLocal = null, onReady }) {

  /* ── Step 1: Validate stored Google token ─────────────── */
  const token = localStorage.getItem('google_token');
  if (!token) {
    _authShowError('Please sign in first');
    _authRedirectHome(1500);
    return;
  }

  const email = getUserEmailFromToken(token);
  if (!email) {
    _authShowError('Session expired — please sign in again');
    _authRedirectHome(1500);
    return;
  }

  const spreadsheetId = localStorage.getItem(SPREADSHEET_ID_KEY(email));
  if (!spreadsheetId) {
    _authShowError('System not set up — please complete first-run setup');
    _authRedirectHome(2000);
    return;
  }

  /* ── Step 2: Populate auth state ─────────────────────── */
  _auth.email         = email;
  _auth.spreadsheetId = spreadsheetId;
  _auth.userName      = getUserNameFromToken(token);

  /* ── Step 3: Render local cache immediately ───────────── */
  if (typeof onLoadLocal === 'function') {
    try {
      onLoadLocal(email, spreadsheetId);
    } catch (e) {
      console.warn('onLoadLocal threw:', e);
    }
  }

  /* ── Step 4: Show loading state ───────────────────────── */
  _authShowLoading();

  /* ── Step 5: Init GAPI ────────────────────────────────── */
  try {
    await initGapiClient();
  } catch (e) {
    _authShowError('Failed to load Google API — check your connection');
    console.error('GAPI init failed:', e);
    return;
  }

  /* ── Step 6: Try cached access token (fast path) ─────── */
  const cachedToken = getSavedAccessToken();
  if (cachedToken) {
    gapi.client.setToken({ access_token: cachedToken });
    const valid = await _authValidateToken(cachedToken);
    if (valid) {
      _auth.accessToken = cachedToken;
      await _authFinalize(spreadsheetId, email, cachedToken, pageName, onReady);
      return;
    }
    clearAccessToken();
  }

  /* ── Step 7: Request new token ────────────────────────── */
  if (isIOSSafari()) {
    _authShowIOSTapScreen(() => _authRequestToken(spreadsheetId, email, pageName, onReady));
  } else {
    _authRequestToken(spreadsheetId, email, pageName, onReady);
  }
}

/**
 * getAuthState()
 * Returns the current authenticated session state.
 * Useful for any page script that needs email/role without re-fetching.
 * @returns {{ email, spreadsheetId, accessToken, role, userName }}
 */
function getAuthState() {
  return { ..._auth };
}

/**
 * signOut()
 * Clears all auth state and redirects to Home.html.
 * Call from a "Sign Out" button.
 */
function signOut() {
  clearAccessToken();
  sessionStorage.removeItem('coms_permissions');
  sessionStorage.removeItem(`coms_role_${_auth.email}`);
  localStorage.removeItem('google_token');
  showToast('Signed out successfully', 'info');
  setTimeout(() => { window.location.href = _authHomePath(); }, 1000);
}

/* ── Internal: Token Request ──────────────────────────────── */

function _authRequestToken(spreadsheetId, email, pageName, onReady) {
  try {
    google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope:     SCOPES,
      prompt:    '',
      hint:      email,
      callback:  async (resp) => {
        if (resp.error || !resp.access_token) {
          _authShowError('Authentication failed — please try again');
          console.error('Token request failed:', resp);
          _authHideLoading();
          return;
        }
        saveAccessToken(resp.access_token);
        gapi.client.setToken({ access_token: resp.access_token });
        _auth.accessToken = resp.access_token;
        await _authFinalize(spreadsheetId, email, resp.access_token, pageName, onReady);
      }
    }).requestAccessToken();
  } catch (e) {
    _authShowError('Could not initialize Google authentication');
    console.error('initTokenClient failed:', e);
    _authHideLoading();
  }
}

/* ── Internal: Finalize Auth ──────────────────────────────── */

/**
 * _authFinalize
 * Called once we have a valid access token.
 * Loads role, checks page permissions, renders sidebar, calls onReady.
 */
async function _authFinalize(spreadsheetId, email, accessToken, pageName, onReady) {
  try {
    /* Load role */
    const role = await getUserRole(spreadsheetId, email);
    _auth.role = role;

    /* Check page permissions */
    let perms = {
      canView: true, canCreate: true, canEdit: true,
      canDelete: false, canViewDeleted: false,
      canViewSensitive: false, canExport: true
    };

    if (pageName) {
      perms = await enforceViewPermission(pageName, spreadsheetId, email);
      if (!perms.canView) return;
    }

    /* Render sidebar */
    renderSidebar(email, _auth.userName, role);

    /* Apply permission-based UI state */
    applyPermissionsToUI(perms);

    /* Hide loading */
    _authHideLoading();

    /* Mark initialized */
    _auth.initialized = true;

    /* Call page's onReady */
    await onReady(spreadsheetId, email, accessToken, perms);

    /* Start background sync refresh */
    _authStartSyncHeartbeat(spreadsheetId, email);

  } catch (e) {
    console.error('Auth finalize error:', e);
    _authShowError('Something went wrong loading your session');
    _authHideLoading();
  }
}

/* ── Internal: Token Validation ───────────────────────────── */

/**
 * _authValidateToken(token)
 * Validates a cached token with a lightweight Drive API call.
 * Returns true if valid, false if expired or failed.
 */
async function _authValidateToken(token) {
  try {
    const res = await fetch(
      `${DRIVE_API}/files?pageSize=1&fields=files(id)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.ok;
  } catch {
    return false;
  }
}

/* ── Internal: Background Sync Heartbeat ─────────────────── */

/**
 * _authStartSyncHeartbeat(spreadsheetId, email)
 * Refreshes the local data cache every 5 minutes silently.
 * Updates the sync indicator dot in the sidebar.
 */
function _authStartSyncHeartbeat(spreadsheetId, email) {
  const INTERVAL = 5 * 60 * 1000;

  const sync = async () => {
    const token = getSavedAccessToken();
    if (!token) return;

    updateSyncIndicator('syncing');

    try {
      const pending = getPendingSyncCount();
      if (pending > 0) {
        updateSyncIndicator('syncing', `${pending} pending…`);
      }

      await new Promise(r => setTimeout(r, 600));
      updateSyncIndicator('synced', `Synced ${formatDisplayDateTime(getCurrentTimestamp())}`);
      clearSyncQueue();
    } catch (e) {
      updateSyncIndicator('error');
      console.warn('Sync heartbeat error:', e);
    }
  };

  setTimeout(sync, 3000);
  setInterval(sync, INTERVAL);
}

/* ── Internal: iOS Safari Tap Screen ─────────────────────── */

/**
 * _authShowIOSTapScreen(onTap)
 * Shows a tap-to-continue overlay required by iOS Safari
 * before any OAuth token request (browser security policy).
 */
function _authShowIOSTapScreen(onTap) {
  let overlay = document.getElementById('authLoadingOverlay');
  let created = false;

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'authLoadingOverlay';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:var(--bg-topbar)',
      'z-index:9999',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'flex-direction:column',
      'padding:24px'
    ].join(';');
    document.body.appendChild(overlay);
    created = true;
  }

  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div style="
      background:#fff;
      border-radius:20px;
      padding:32px 28px;
      text-align:center;
      max-width:320px;
      width:100%;
      box-shadow:0 20px 60px rgba(0,0,0,0.2);
    ">
      <div style="
        width:56px;height:56px;border-radius:50%;
        background:var(--green-50,#E1F5EE);
        display:flex;align-items:center;justify-content:center;
        margin:0 auto 16px;
      ">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="var(--green-400,#1D9E75)" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06
            a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78
            1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
      <h2 style="
        font-family:var(--font-sans);
        font-size:18px;font-weight:600;
        color:var(--text-primary,#14213D);
        margin-bottom:8px;
      ">مرحباً بعودتك</h2>
      <p style="
        color:var(--text-secondary,#4A5568);
        font-size:14px;margin-bottom:24px;
        line-height:1.6;
      ">اضغط للاتصال بـ Google Drive ومتابعة العمل</p>
      <button id="_authIOSTapBtn" style="
        width:100%;padding:13px;
        background:var(--blue-600,#185FA5);
        color:#fff;border:none;
        border-radius:10px;
        font-size:15px;font-weight:600;
        font-family:var(--font-sans);
        cursor:pointer;
        transition:background 0.15s;
      ">
        الاتصال بـ Google Drive
      </button>
    </div>
  `;

  const btn = document.getElementById('_authIOSTapBtn');
  btn.addEventListener('mouseover', () => { btn.style.background = 'var(--blue-700,#0C447C)'; });
  btn.addEventListener('mouseout',  () => { btn.style.background = 'var(--blue-600,#185FA5)'; });
  btn.addEventListener('click', () => {
    overlay.innerHTML = `
      <div style="
        background:#fff;border-radius:20px;
        padding:40px 28px;text-align:center;
        max-width:320px;width:100%;
      ">
        <div style="
          width:36px;height:36px;
          border:3px solid var(--blue-100,#B5D4F4);
          border-top-color:var(--blue-600,#185FA5);
          border-radius:50%;
          animation:spin 0.7s linear infinite;
          margin:0 auto 16px;
        "></div>
        <p style="color:var(--text-secondary,#4A5568);font-size:14px;">
          جارٍ الاتصال…
        </p>
      </div>
      <style>
        @keyframes spin { to { transform:rotate(360deg); } }
      </style>
    `;
    onTap();
  });
}

/* ── Internal: Loading Overlay ────────────────────────────── */

/**
 * _authShowLoading()
 * Shows a page-level loading state while auth resolves.
 * Uses existing #authLoadingOverlay if present,
 * otherwise degrades gracefully (content just appears when ready).
 */
function _authShowLoading() {
  const existing = document.getElementById('authLoadingOverlay');
  if (existing) {
    existing.style.display = 'flex';
    return;
  }

  const pageContent = document.getElementById('pageContent');
  if (pageContent) {
    pageContent.style.opacity = '0';
    pageContent.style.transition = 'opacity 0.2s ease';
  }
}

/**
 * _authHideLoading()
 * Hides the loading overlay and reveals page content.
 */
function _authHideLoading() {
  const overlay = document.getElementById('authLoadingOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s ease';
    setTimeout(() => { overlay.style.display = 'none'; overlay.style.opacity = ''; }, 220);
  }

  const pageContent = document.getElementById('pageContent');
  if (pageContent) {
    pageContent.style.opacity = '1';
  }
}

/* ── Internal: Error & Redirect ───────────────────────────── */

function _authShowError(message) {
  showToast(message, 'error');
}

function _authRedirectHome(delay = 1500) {
  setTimeout(() => {
    window.location.href = _authHomePath();
  }, delay);
}

function _authHomePath() {
  const path = window.location.pathname;
  if (path.includes('/lookups/')) return '../../pages/Home.html';
  if (path.includes('/pages/'))  return '../pages/Home.html';
  return 'pages/Home.html';
}

/* ── Session Refresh ──────────────────────────────────────── */

/**
 * refreshTokenIfNeeded()
 * Silently refreshes the access token before it expires.
 * Call from long-running page operations.
 * @returns {Promise<string|null>} Valid access token or null
 */
async function refreshTokenIfNeeded() {
  const token = getSavedAccessToken();
  if (token) return token;

  return new Promise((resolve) => {
    try {
      google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope:     SCOPES,
        prompt:    '',
        hint:      _auth.email,
        callback:  (resp) => {
          if (resp.access_token) {
            saveAccessToken(resp.access_token);
            gapi.client.setToken({ access_token: resp.access_token });
            _auth.accessToken = resp.access_token;
            resolve(resp.access_token);
          } else {
            resolve(null);
          }
        }
      }).requestAccessToken();
    } catch {
      resolve(null);
    }
  });
}

/* ── Page Template Helper ─────────────────────────────────── */

/**
 * buildPageShell(options)
 * Injects the standard app shell HTML into document.body
 * for pages that don't have it hardcoded.
 * Includes: sidebar placeholder, topbar, page content wrapper.
 *
 * @param {object} options
 * @param {string} options.pageTitle   - e.g. "العمليات | Transactions"
 * @param {string} options.pageSubtitle
 * @param {string} [options.contentHTML] - Inner HTML for #pageContent
 */
function buildPageShell({ pageTitle = '', pageSubtitle = '', contentHTML = '' } = {}) {
  const topbarActions = `
    <div class="topbar-actions">
      <div class="sync-indicator synced" id="topbarSync" style="display:none;">
        <div class="sync-dot"></div>
      </div>
      <button class="btn btn-ghost btn-icon" onclick="signOut()" title="Sign out"
        style="color:rgba(255,255,255,0.7);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  `;

  document.body.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar"></aside>
      <div class="main-content">
        <header class="topbar">
          <div>
            <div class="topbar-title">${pageTitle}</div>
            ${pageSubtitle ? `<div class="topbar-subtitle">${pageSubtitle}</div>` : ''}
          </div>
          ${topbarActions}
        </header>
        <main class="page-content" id="pageContent" style="opacity:0;">
          ${contentHTML}
        </main>
      </div>
    </div>
    <div id="toastContainer" class="toast-container"></div>
  `;
}

/* ── Home.html specific helpers ───────────────────────────── */

/**
 * initHomeAuth({ onReady })
 * Simplified auth for Home.html — does NOT require a spreadsheet to exist yet.
 * Used during first-run setup wizard.
 *
 * @param {object} options
 * @param {Function} options.onReady - Called with (email, accessToken) once signed in
 */
async function initHomeAuth({ onReady }) {
  await initGapiClient();

  const token = localStorage.getItem('google_token');
  if (token) {
    const email = getUserEmailFromToken(token);
    if (email) {
      const cachedToken = getSavedAccessToken();
      if (cachedToken) {
        const valid = await _authValidateToken(cachedToken);
        if (valid) {
          gapi.client.setToken({ access_token: cachedToken });
          _auth.email       = email;
          _auth.accessToken = cachedToken;
          _auth.userName    = getUserNameFromToken(token);
          await onReady(email, cachedToken);
          return;
        }
        clearAccessToken();
      }
    }
  }

  _authRequestHomeToken(onReady);
}

function _authRequestHomeToken(onReady) {
  google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope:     SCOPES,
    prompt:    'select_account',
    callback:  async (resp) => {
      if (resp.error || !resp.access_token) {
        showToast('Sign-in failed — please try again', 'error');
        return;
      }

      saveAccessToken(resp.access_token);
      gapi.client.setToken({ access_token: resp.access_token });
      _auth.accessToken = resp.access_token;

      await onReady(resp.access_token);
    }
  }).requestAccessToken();
}

/**
 * handleGoogleSignIn(response)
 * Called by Google Identity Services One Tap / Sign-In button callback.
 * Stores the credential JWT and proceeds to token request.
 *
 * @param {object} response - Google credential response
 */
async function handleGoogleSignIn(response) {
  if (!response.credential) {
    showToast('Sign-in failed — no credential received', 'error');
    return;
  }

  localStorage.setItem('google_token', response.credential);

  const email    = getUserEmailFromToken(response.credential);
  const userName = getUserNameFromToken(response.credential);

  _auth.email    = email;
  _auth.userName = userName;

  showToast(`Welcome, ${userName || email}`, 'success');
}

/* ── Spreadsheet Creation (First Run) ─────────────────────── */

/**
 * createSpreadsheet(title, accessToken)
 * Creates a new Google Spreadsheet via Drive API.
 * @param {string} title
 * @param {string} accessToken
 * @returns {Promise<string>} spreadsheetId
 */
async function createSpreadsheet(title, accessToken) {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify({ properties: { title } })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create spreadsheet');
  }

  const data = await res.json();
  return data.spreadsheetId;
}

/**
 * setupSpreadsheet(spreadsheetId, accessToken, adminEmail)
 * Seeds all sheets with headers and initial lookup data.
 * Called once during first-run setup wizard in Home.html.
 *
 * @param {string} spreadsheetId
 * @param {string} accessToken
 * @param {string} adminEmail - The first SuperAdmin user's email
 * @returns {Promise<void>}
 */
async function setupSpreadsheet(spreadsheetId, accessToken, adminEmail) {
  const now = getCurrentTimestamp();

  const requests = [];

  const sheetNames  = Object.keys(SHEET_DEFINITIONS);
  const firstSheet  = sheetNames[0];

  sheetNames.forEach((name, idx) => {
    if (idx === 0) {
      requests.push({
        updateSheetProperties: {
          properties: { sheetId: 0, title: name },
          fields: 'title'
        }
      });
    } else {
      requests.push({ addSheet: { properties: { title: name } } });
    }
  });

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify({ requests })
  });

  const valueData = [];

  for (const [sheetName, headers] of Object.entries(SHEET_DEFINITIONS)) {
    valueData.push({
      range:  `${sheetName}!A1`,
      values: [headers]
    });
  }

  for (const [sheetName, rows] of Object.entries(LOOKUP_SEED_DATA)) {
    const headers = SHEET_DEFINITIONS[sheetName];
    const seeded  = rows.map(row => {
      const full = [...row];
      while (full.length < headers.indexOf('RecordID')) full.push('');
      full.push(
        generateRecordID(),
        now,
        adminEmail,
        '', '',
        'FALSE', '', ''
      );
      return full;
    });
    valueData.push({ range: `${sheetName}!A2`, values: seeded });
  }

  const rolesRows = DEFAULT_ROLES.map(([roleID, name, desc]) => [
    roleID, name, desc,
    generateRecordID(), now, adminEmail, '', '',
    'FALSE', '', ''
  ]);
  valueData.push({ range: 'Roles!A2', values: rolesRows });

  const adminUserRow = [
    adminEmail,
    _auth.userName || adminEmail,
    'SuperAdmin',
    'Active',
    now,
    'First admin user',
    generateRecordID(), now, adminEmail, '', '',
    'FALSE', '', ''
  ];
  valueData.push({ range: 'Users!A2', values: [adminUserRow] });

  const permRows = _buildDefaultPermissions(now, adminEmail);
  valueData.push({ range: 'Permissions!A2', values: permRows });

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data: valueData })
    }
  );
}

/**
 * _buildDefaultPermissions(now, adminEmail)
 * Generates the default permissions matrix rows for all roles × all pages.
 * @private
 */
function _buildDefaultPermissions(now, adminEmail) {
  const matrix = {
    SuperAdmin:      { view: true,  create: true,  edit: true,  del: true,  viewDel: true,  sensitive: true,  export: true },
    Director:        { view: true,  create: true,  edit: true,  del: true,  viewDel: true,  sensitive: true,  export: true },
    AccountManager:  { view: true,  create: true,  edit: true,  del: false, viewDel: false, sensitive: false, export: true },
    CaseManager:     { view: true,  create: true,  edit: true,  del: false, viewDel: false, sensitive: true,  export: true },
    DataEntry:       { view: true,  create: true,  edit: true,  del: false, viewDel: false, sensitive: false, export: false },
    InventoryManager:{ view: true,  create: true,  edit: true,  del: false, viewDel: false, sensitive: false, export: true },
    Viewer:          { view: true,  create: false, edit: false, del: false, viewDel: false, sensitive: false, export: false }
  };

  const restrictedPages = {
    AccountManager:   ['Beneficiaries','CaseManager pages'],
    CaseManager:      ['Transactions','Receipts','Installments','Recurring','Reports'],
    InventoryManager: ['Transactions','Donors','Beneficiaries','Receipts','Projects','Installments','Recurring','Reports'],
    Viewer:           ['Dashboard','OwnerDashboard','Reports']
  };

  const rows = [];

  for (const [role, perms] of Object.entries(matrix)) {
    for (const page of ALL_PAGES) {
      const b = (v) => v ? 'TRUE' : 'FALSE';

      let canView = perms.view;

      if (role === 'Viewer' && !['Dashboard','OwnerDashboard','Reports'].includes(page)) {
        canView = false;
      }
      if (role === 'InventoryManager' && page !== 'Inventory' &&
          !['Dashboard','Settings'].includes(page)) {
        canView = page === 'Inventory';
      }
      if (role === 'Permissions' && role !== 'SuperAdmin') {
        canView = false;
      }
      if (page === 'Permissions' && role !== 'SuperAdmin') {
        canView = false;
      }
      if (page === 'OwnerDashboard' && !['SuperAdmin','Director'].includes(role)) {
        canView = false;
      }

      const txSensitive = ['Transactions','Receipts'].includes(page);
      const canDel = txSensitive
        ? ['SuperAdmin','Director'].includes(role) && perms.del
        : perms.del;

      rows.push([
        role,
        page,
        b(canView),
        b(canView && perms.create),
        b(canView && perms.edit),
        b(canView && canDel),
        b(canView && perms.viewDel),
        b(canView && perms.sensitive),
        b(canView && perms.export),
        generateRecordID(),
        now,
        adminEmail,
        '', '',
        'FALSE', '', ''
      ]);
    }
  }

  return rows;
}
