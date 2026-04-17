/* ============================================================
   CHARITY MANAGEMENT SYSTEM — auth.js
   Shared authentication module — loaded on every secondary page
   Works with the redirect-based OAuth flow from Home.html
   ============================================================

   USAGE on every secondary page:
   ───────────────────────────────
   initPageAuth({
     pageName: 'Transactions',           // '' to skip permission check
     onLoadLocal: (email, sid) => { },   // optional — render cached data immediately
     onReady: async (sid, email, token, perms) => { }
   });

   HOW IT WORKS:
   ─────────────
   1. Reads coms_user from localStorage (set by Home.html after OAuth redirect)
   2. Reads access token from sessionStorage (set by Home.html via saveAccessToken)
   3. If either is missing → redirect to Home.html
   4. Validates the cached token with a quick Drive ping
   5. If token expired → redirect to Home.html (user re-authenticates there)
   6. Loads spreadsheetId from localStorage
   7. Calls onLoadLocal(email, sid) immediately for instant cache render
   8. Checks page permissions (skipped if pageName is empty)
   9. Renders sidebar
   10. Calls onReady(sid, email, token, perms)
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

/* ══════════════════════════════════════════════════════════
   PUBLIC API
══════════════════════════════════════════════════════════ */

/**
 * initPageAuth({ pageName, onLoadLocal, onReady })
 * Main entry point for every secondary page.
 *
 * @param {string}   pageName      - Page name for permission check. Pass '' to skip.
 * @param {Function} onLoadLocal   - Called immediately with (email, sid)
 * @param {Function} onReady       - Called when ready with (sid, email, token, perms)
 */
async function initPageAuth({ pageName = '', onLoadLocal = null, onReady }) {

  /* ── Step 1: Read user from localStorage ─────────────── */
  const user = _loadUser();
  if (!user || !user.email) {
    _redirectHome(typeof t === 'function' ? t('errSignIn') : 'يرجى تسجيل الدخول أولاً');
    return;
  }

  const email = user.email;
  _auth.email    = email;
  _auth.userName = user.name || email;

  /* ── Step 2: Read spreadsheetId ──────────────────────── */
  const sid = localStorage.getItem(SPREADSHEET_ID_KEY(email));
  if (!sid) {
    _redirectHome(typeof t === 'function' ? t('errSetup') : 'لم يتم إعداد النظام — يرجى إكمال الإعداد الأولي');
    return;
  }
  _auth.spreadsheetId = sid;

  /* ── Step 3: Read cached access token ────────────────── */
  const token = getSavedAccessToken();
  if (!token) {
    _redirectHome(typeof t === 'function' ? t('errSession') : 'انتهت صلاحية الجلسة — يرجى تسجيل الدخول مرة أخرى');
    return;
  }
  _auth.accessToken = token;

  /* ── Step 4: Call onLoadLocal immediately ────────────── */
  if (typeof onLoadLocal === 'function') {
    try { onLoadLocal(email, sid); } catch (e) { console.warn('onLoadLocal error:', e); }
  }

  /* ── Step 5: Show loading ────────────────────────────── */
  _showLoading();

  /* ── Step 6: Validate token ──────────────────────────── */
  const valid = await _validateToken(token);
  if (!valid) {
    _redirectHome(typeof t === 'function' ? t('errSession') : 'انتهت صلاحية الجلسة — يرجى تسجيل الدخول مرة أخرى');
    return;
  }

  /* ── Step 7: Finalize ────────────────────────────────── */
  await _finalize(sid, email, token, pageName, onReady);
}

/**
 * getAuthState()
 * Returns the current authenticated session state.
 */
function getAuthState() {
  return { ..._auth };
}

/**
 * signOut()
 * Clears all auth state and redirects to Home.html.
 */
function signOut() {
  clearAccessToken();
  localStorage.removeItem('coms_user');
  sessionStorage.removeItem('coms_permissions');
  sessionStorage.removeItem(`coms_role_${_auth.email}`);
  showToast(typeof t === 'function' ? t('signedOut') : 'تم تسجيل الخروج بنجاح', 'info');
  setTimeout(() => { window.location.href = _homePath(); }, 800);
}

/* ══════════════════════════════════════════════════════════
   INTERNAL
══════════════════════════════════════════════════════════ */

async function _finalize(sid, email, token, pageName, onReady) {
  try {
    /* Load role */
    const role = await _loadRole(sid, email);
    _auth.role = role;

    /* Check permissions */
    let perms = _fullPerms();
    if (pageName) {
      perms = await _checkAndEnforce(pageName, sid, email);
      if (!perms.canView) return;
    }

    /* Render sidebar */
    renderSidebar(email, _auth.userName, role);

    /* Apply UI permissions */
    applyPermissionsToUI(perms);

    /* Reveal page */
    _hideLoading();

    _auth.initialized = true;

    /* Call page handler */
    await onReady(sid, email, token, perms);

    /* Background sync */
    _startHeartbeat(sid, email);

  } catch (e) {
    console.error('Auth finalize error:', e);
    showToast(typeof t === 'function' ? t('errLoadFailed') : 'حدث خطأ أثناء تحميل الصفحة', 'error');
    _hideLoading();
  }
}

/* ── Role loading ─────────────────────────────────────────── */
async function _loadRole(sid, email) {
  const cacheKey = `coms_role_${email}`;
  const cached   = sessionStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const users = await readSheet(sid, 'Users',
      { includeDeleted: false, email, forceRefresh: false });
    const user  = users.find(u => u.Email?.trim().toLowerCase() === email.trim().toLowerCase());
    const role  = user?.Role || 'Viewer';
    sessionStorage.setItem(cacheKey, role);
    return role;
  } catch (e) {
    console.warn('Role load failed:', e);
    return 'Viewer';
  }
}

/* ── Permissions ──────────────────────────────────────────── */
async function _checkAndEnforce(pageName, sid, email) {
  const perms = await checkPagePermissions(pageName, sid, email);
  if (!perms.canView) {
    showToast(typeof t === 'function' ? t('errNoPermission') : 'ليس لديك صلاحية للوصول إلى هذه الصفحة', 'error');
    setTimeout(() => {
      window.location.href = _homePath();
    }, 1500);
  }
  return perms;
}

function _fullPerms() {
  return {
    canView: true, canCreate: true, canEdit: true,
    canDelete: true, canViewDeleted: true,
    canViewSensitive: true, canExport: true
  };
}

/* ── Token validation ─────────────────────────────────────── */
async function _validateToken(token) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.ok;
  } catch {
    return false;
  }
}

/* ── Heartbeat ────────────────────────────────────────────── */
function _startHeartbeat(sid, email) {
  const INTERVAL = 5 * 60 * 1000;
  const sync = async () => {
    updateSyncIndicator('syncing');
    try {
      await new Promise(r => setTimeout(r, 500));
      updateSyncIndicator('synced');
      clearSyncQueue();
    } catch {
      updateSyncIndicator('error');
    }
  };
  setTimeout(sync, 3000);
  setInterval(sync, INTERVAL);
}

/* ── Loading overlay ──────────────────────────────────────── */
function _showLoading() {
  const overlay = document.getElementById('authLoadingOverlay');
  if (overlay) { overlay.style.display = 'flex'; return; }
  const pc = document.getElementById('pageContent');
  if (pc) { pc.style.opacity = '0'; pc.style.transition = 'opacity 0.2s ease'; }
}

function _hideLoading() {
  const overlay = document.getElementById('authLoadingOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s ease';
    setTimeout(() => { overlay.style.display = 'none'; overlay.style.opacity = ''; }, 220);
  }
  const pc = document.getElementById('pageContent');
  if (pc) { pc.style.opacity = '1'; }
}

/* ── Redirect ─────────────────────────────────────────────── */
function _redirectHome(message) {
  if (message) showToast(message, 'error');
  setTimeout(() => { window.location.href = _homePath(); }, 1000);
}

function _homePath() {
  const path = window.location.pathname;
  if (path.includes('/lookups/')) return '../../pages/Home.html';
  if (path.includes('/pages/'))   return 'Home.html';
  return 'pages/Home.html';
}

/* ── User persistence ─────────────────────────────────────── */
function _loadUser() {
  try { return JSON.parse(localStorage.getItem('coms_user')); }
  catch { return null; }
}

/* ══════════════════════════════════════════════════════════
   FIRST RUN — called from Home.html only
══════════════════════════════════════════════════════════ */

/**
 * setupSpreadsheet(spreadsheetId, accessToken, adminEmail)
 * Seeds all sheets with headers and initial data.
 * Called once during the Setup Wizard in Home.html.
 */
async function setupSpreadsheet(spreadsheetId, accessToken, adminEmail) {
  const now = getCurrentTimestamp();

  /* ── Create all sheet tabs ─────────────────────────── */
  const sheetNames = Object.keys(SHEET_DEFINITIONS);
  const requests   = sheetNames.map((name, idx) =>
    idx === 0
      ? { updateSheetProperties: { properties: { sheetId: 0, title: name }, fields: 'title' } }
      : { addSheet: { properties: { title: name } } }
  );

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests })
  });

  /* ── Write all data in one batch ───────────────────── */
  const valueData = [];

  /* Headers for every sheet */
  for (const [sheetName, headers] of Object.entries(SHEET_DEFINITIONS)) {
    valueData.push({ range: `${sheetName}!A1`, values: [headers] });
  }

  /* Lookup seed data */
  for (const [sheetName, rows] of Object.entries(LOOKUP_SEED_DATA)) {
    const headers = SHEET_DEFINITIONS[sheetName];
    const ridIdx  = headers.indexOf('RecordID');
    const seeded  = rows.map(row => {
      const full = [...row];
      while (full.length < ridIdx) full.push('');
      full.push(generateRecordID(), now, adminEmail, '', '', 'FALSE', '', '');
      return full;
    });
    valueData.push({ range: `${sheetName}!A2`, values: seeded });
  }

  /* Roles */
  const rolesRows = DEFAULT_ROLES.map(([roleID, name, desc]) => [
    roleID, name, desc,
    generateRecordID(), now, adminEmail, '', '', 'FALSE', '', ''
  ]);
  valueData.push({ range: 'Roles!A2', values: rolesRows });

  /* Admin user — LastLogin intentionally empty so first login redirects to Permissions */
const stored = _loadUser();
const adminName = (stored?.name && stored.name !== stored.email)
  ? stored.name
  : adminEmail;

const adminUserRow = [
  adminEmail,
  adminName,
  'SuperAdmin',
    'Active',
    '',
    'First admin user',
    generateRecordID(), now, adminEmail, '', '', 'FALSE', '', ''
  ];
  valueData.push({ range: 'Users!A2', values: [adminUserRow] });

  /* Permissions matrix */
  const permRows = _buildDefaultPermissions(now, adminEmail);
  valueData.push({ range: 'Permissions!A2', values: permRows });

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data: valueData })
    }
  );
}

/**
 * _buildDefaultPermissions
 * Generates the full permissions matrix for all built-in roles × all pages.
 */
function _buildDefaultPermissions(now, adminEmail) {
  const matrix = {
    SuperAdmin:      { view:true,  create:true,  edit:true,  del:true,  viewDel:true,  sensitive:true,  export:true  },
    Director:        { view:true,  create:true,  edit:true,  del:true,  viewDel:true,  sensitive:true,  export:true  },
    AccountManager:  { view:true,  create:true,  edit:true,  del:false, viewDel:false, sensitive:false, export:true  },
    CaseManager:     { view:true,  create:true,  edit:true,  del:false, viewDel:false, sensitive:true,  export:true  },
    DataEntry:       { view:true,  create:true,  edit:true,  del:false, viewDel:false, sensitive:false, export:false },
    InventoryManager:{ view:true,  create:true,  edit:true,  del:false, viewDel:false, sensitive:false, export:true  },
    Viewer:          { view:true,  create:false, edit:false, del:false, viewDel:false, sensitive:false, export:false }
  };

  const b    = v => v ? 'TRUE' : 'FALSE';
  const rows = [];

  for (const [role, p] of Object.entries(matrix)) {
    for (const page of ALL_PAGES) {
      let canView = p.view;

      if (role === 'Viewer' && !['Dashboard','OwnerDashboard','Reports'].includes(page))
        canView = false;
      if (role === 'InventoryManager' && !['Inventory','Dashboard','Settings'].includes(page))
        canView = false;
      if (page === 'Permissions' && role !== 'SuperAdmin')
        canView = false;
      if (page === 'OwnerDashboard' && !['SuperAdmin','Director'].includes(role))
        canView = false;

      const txSensitive = ['Transactions','Receipts'].includes(page);
      const canDel = txSensitive
        ? ['SuperAdmin','Director'].includes(role) && p.del
        : p.del;

      rows.push([
        role, page,
        b(canView),
        b(canView && p.create),
        b(canView && p.edit),
        b(canView && canDel),
        b(canView && p.viewDel),
        b(canView && p.sensitive),
        b(canView && p.export),
        generateRecordID(), now, adminEmail, '', '', 'FALSE', '', ''
      ]);
    }
  }

  return rows;
}

/* ══════════════════════════════════════════════════════════
   KEEP THESE for backward compatibility with any page
   that might call them — they now delegate to Home.html flow
══════════════════════════════════════════════════════════ */

function getUserEmailFromToken(jwtOrFake) {
  try {
    const parts   = (jwtOrFake || '').split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.email || null;
  } catch { return null; }
}

function getUserNameFromToken(jwtOrFake) {
  try {
    const parts   = (jwtOrFake || '').split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.name || payload.email || null;
  } catch { return null; }
}

function isIOSSafari() {
  const ua = navigator.userAgent;
  return /iP(ad|hone|od)/.test(ua) && /WebKit/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
}

async function initGapiClient() {
  if (typeof gapi === 'undefined') return;
  await new Promise(resolve => gapi.load('client', resolve));
  await gapi.client.init({
    discoveryDocs: [
      'https://sheets.googleapis.com/$discovery/rest?version=v4',
      'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
    ]
  }).catch(() => {});
}

/* ══════════════════════════════════════════════════════════
   iOS tap screen — kept for any edge case
══════════════════════════════════════════════════════════ */
function _authShowIOSTapScreen(onTap) {
  let overlay = document.getElementById('authLoadingOverlay') || document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:var(--bg-topbar);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:24px;';
  if (!overlay.id) { overlay.id = 'authLoadingOverlay'; document.body.appendChild(overlay); }
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:32px 28px;text-align:center;max-width:320px;width:100%;">
      <h2 style="font-family:var(--font-sans);font-size:18px;font-weight:600;color:var(--text-primary);margin-bottom:8px;">${typeof t === 'function' ? t('welcomeBack') : 'مرحباً بعودتك'}</h2>
      <p style="color:var(--text-secondary);font-size:14px;margin-bottom:24px;">${typeof t === 'function' ? t('tapToContinue') : 'اضغط للمتابعة'}</p>
      <button id="_iosTapBtn" style="width:100%;padding:13px;background:var(--blue-600);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;font-family:var(--font-sans);cursor:pointer;">
        ${typeof t === 'function' ? t('continue') : 'متابعة'}
      </button>
    </div>`;
  document.getElementById('_iosTapBtn').addEventListener('click', () => { onTap(); });
}
