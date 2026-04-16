/* ============================================================
   CHARITY MANAGEMENT SYSTEM — utils.js
   Shared utility library — loaded on every page
   ============================================================ */

'use strict';

/* ── Constants ────────────────────────────────────────────── */
const CLIENT_ID   = '460184547236-7a4jn7lclo4317pnui9qjcu9d62buknn.apps.googleusercontent.com';
const SYSADMIN_EMAIL    = 'dina.khedr@gmail.com';
const SYSADMIN_SHEET_ID = '1m41rWfsHWWh6LkKqDir8nnen0y0Yx8RzhPPQs73Bxis';
const SCOPES      = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
const SHEETS_API  = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API   = 'https://www.googleapis.com/drive/v3';

const SPREADSHEET_ID_KEY  = (email) => `spreadsheet_id_${email}`;
const ACCESS_TOKEN_KEY    = 'coms_access_token';
const ACCESS_TOKEN_EXP    = 'coms_access_token_exp';
const PERMISSIONS_CACHE   = 'coms_permissions';
const LOOKUP_CACHE_PREFIX = 'coms_lkp_';
const CACHE_TTL           = 5 * 60 * 1000;   // 5 minutes for lookups
const PENDING_SYNC_KEY    = 'coms_pending_sync';

/* ── Character set for ID generation (no O/0 or I/1 confusion) */
const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/* ============================================================
   SECTION 1 — ID GENERATION
   ============================================================ */

/**
 * generateRecordID()
 * Returns a unique 8-character alphanumeric system ID.
 * Characters drawn from ID_CHARS (no O/0 or I/1 ambiguity).
 * @param {string[]} [existingIDs=[]] - Array of existing IDs to check against
 * @returns {string} 8-character unique ID e.g. "A3F9K2M7"
 */
function generateRecordID(existingIDs = []) {
  const existing = new Set(existingIDs);
  let id;
  let attempts = 0;
  do {
    id = '';
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      id += ID_CHARS[byte % ID_CHARS.length];
    }
    attempts++;
    if (attempts > 100) throw new Error('Could not generate unique RecordID after 100 attempts');
  } while (existing.has(id));
  return id;
}

/**
 * generateDomainID(prefix, existingIDs)
 * Returns the next sequential human-readable domain ID.
 * @param {string} prefix - e.g. "TX-2026-", "DNR-", "BNF-"
 * @param {string[]} existingIDs - Array of existing domain IDs for this entity
 * @returns {string} e.g. "TX-2026-006", "DNR-004"
 */
function generateDomainID(prefix, existingIDs = []) {
  let maxNum = 0;
  for (const id of existingIDs) {
    if (id && id.startsWith(prefix)) {
      const num = parseInt(id.replace(prefix, ''), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * generateTxID(existingIDs)
 * Shorthand for transaction IDs — always uses current year.
 * @param {string[]} existingIDs
 * @returns {string} e.g. "TX-2026-007"
 */
function generateTxID(existingIDs = []) {
  const year = new Date().getFullYear();
  return generateDomainID(`TX-${year}-`, existingIDs);
}

/* ============================================================
   SECTION 2 — TIMESTAMPS & DATE UTILITIES
   ============================================================ */

/**
 * getCurrentTimestamp()
 * Returns current datetime as ISO-style string: "YYYY-MM-DD HH:MM:SS"
 * @returns {string}
 */
function getCurrentTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
         `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

/**
 * getCurrentDate()
 * Returns current date as "YYYY-MM-DD"
 * @returns {string}
 */
function getCurrentDate() {
  return getCurrentTimestamp().split(' ')[0];
}

/**
 * formatDisplayDate(isoString)
 * Formats ISO date string for UI display as "DD/MM/YYYY"
 * @param {string} isoString
 * @returns {string}
 */
function formatDisplayDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * formatDisplayDateTime(isoString)
 * Formats ISO datetime string as "DD/MM/YYYY HH:MM"
 * @param {string} isoString
 * @returns {string}
 */
function formatDisplayDateTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * formatCurrency(amount)
 * Formats a number as Egyptian Pounds
 * @param {number|string} amount
 * @returns {string} e.g. "5,000 ج.م"
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = parseFloat(amount);
  if (isNaN(num)) return '—';
  return num.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ج.م';
}

/**
 * timeAgo(isoString)
 * Returns a human-readable relative time string e.g. "3 minutes ago"
 * @param {string} isoString
 * @returns {string}
 */
function timeAgo(isoString) {
  if (!isoString) return '';
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60)    return 'Just now';
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/* ============================================================
   SECTION 3 — TOKEN & SESSION MANAGEMENT
   ============================================================ */

/**
 * saveAccessToken(token)
 * Saves OAuth access token to sessionStorage with 55-minute expiry
 * @param {string} token
 */
function saveAccessToken(token) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  sessionStorage.setItem(ACCESS_TOKEN_EXP, Date.now() + 55 * 60 * 1000);
}

/**
 * getSavedAccessToken()
 * Returns cached access token if still valid, null otherwise
 * @returns {string|null}
 */
function getSavedAccessToken() {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const exp   = parseInt(sessionStorage.getItem(ACCESS_TOKEN_EXP) || '0', 10);
  if (token && Date.now() < exp) return token;
  clearAccessToken();
  return null;
}

/**
 * clearAccessToken()
 * Removes cached access token from sessionStorage
 */
function clearAccessToken() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_EXP);
}

/**
 * getUserEmailFromToken(jwtToken)
 * Decodes a Google JWT ID token and returns the email
 * @param {string} jwtToken
 * @returns {string|null}
 */
function getUserEmailFromToken(jwtToken) {
  try {
    const parts = jwtToken.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.email || null;
  } catch {
    return null;
  }
}

/**
 * getUserNameFromToken(jwtToken)
 * Decodes a Google JWT ID token and returns the display name
 * @param {string} jwtToken
 * @returns {string|null}
 */
function getUserNameFromToken(jwtToken) {
  try {
    const payload = JSON.parse(atob(jwtToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.name || payload.email || null;
  } catch {
    return null;
  }
}

/**
 * isIOSSafari()
 * Detects iOS Safari for tap-to-auth overlay requirement
 * @returns {boolean}
 */
function isIOSSafari() {
  const ua = navigator.userAgent;
  return /iP(ad|hone|od)/.test(ua) && /WebKit/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
}

/**
 * initGapiClient()
 * Initializes the Google API client with Sheets and Drive discovery
 * @returns {Promise<void>}
 */
async function initGapiClient() {
  await new Promise((resolve) => gapi.load('client', resolve));
  await gapi.client.init({
    discoveryDocs: [
      'https://sheets.googleapis.com/$discovery/rest?version=v4',
      'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
    ]
  });
}

/* ============================================================
   SECTION 4 — LOCAL CACHE (localStorage)
   ============================================================ */

/**
 * cacheWrite(key, data)
 * Writes data to localStorage with a timestamp
 * @param {string} key
 * @param {*} data
 */
function cacheWrite(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch (e) {
    console.warn('Cache write failed:', key, e);
  }
}

/**
 * cacheRead(key, maxAge)
 * Reads data from localStorage if within maxAge milliseconds
 * @param {string} key
 * @param {number} [maxAge=Infinity]
 * @returns {*|null}
 */
function cacheRead(key, maxAge = Infinity) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > maxAge) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * cacheClear(key)
 * Removes a specific key from localStorage
 * @param {string} key
 */
function cacheClear(key) {
  localStorage.removeItem(key);
}

/**
 * getCacheKey(sheetName, email)
 * Returns a namespaced localStorage key for a sheet's data
 * @param {string} sheetName
 * @param {string} email
 * @returns {string}
 */
function getCacheKey(sheetName, email) {
  return `coms_sheet_${email}_${sheetName}`;
}

/* ============================================================
   SECTION 5 — GOOGLE SHEETS API (db layer)
   ============================================================ */

/**
 * sheetsRequest(spreadsheetId, method, endpoint, body)
 * Low-level authenticated Sheets API request
 * @param {string} spreadsheetId
 * @param {string} method - GET | PUT | POST | DELETE
 * @param {string} endpoint - path after /v4/spreadsheets/{id}
 * @param {object} [body]
 * @returns {Promise<object>}
 */
async function sheetsRequest(spreadsheetId, method, endpoint, body = null) {
  const token = getSavedAccessToken();
  if (!token) throw new Error('No access token available');

  const url = `${SHEETS_API}/${spreadsheetId}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Sheets API error: ${res.status}`);
  }
  return res.json();
}

/**
 * getSheetHeaders(spreadsheetId, sheetName)
 * Returns the first row of a sheet as an array of header strings
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @returns {Promise<string[]>}
 */
async function getSheetHeaders(spreadsheetId, sheetName) {
  const range  = encodeURIComponent(`${sheetName}!1:1`);
  const result = await sheetsRequest(spreadsheetId, 'GET', `/values/${range}`);
  return (result.values?.[0] || []).map(h => String(h).trim());
}

/**
 * readSheet(spreadsheetId, sheetName, options)
 * Reads all rows from a sheet and returns an array of objects keyed by header.
 * Soft-deleted rows (IsDeleted=TRUE) are filtered out by default.
 *
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @param {object} [options]
 * @param {boolean} [options.includeDeleted=false] - Include soft-deleted rows
 * @param {string}  [options.email] - User email for cache namespacing
 * @param {boolean} [options.forceRefresh=false] - Bypass cache
 * @returns {Promise<object[]>}
 */
async function readSheet(spreadsheetId, sheetName, options = {}) {
  const { includeDeleted = false, email = '', forceRefresh = false } = options;

  const cacheKey = getCacheKey(sheetName, email);

  if (!forceRefresh) {
    const cached = cacheRead(cacheKey, CACHE_TTL);
    if (cached) {
      return includeDeleted ? cached : cached.filter(r => r.IsDeleted !== 'TRUE');
    }
  }

  const range  = encodeURIComponent(`${sheetName}`);
  const result = await sheetsRequest(spreadsheetId, 'GET', `/values/${range}`);
  const rows   = result.values || [];

  if (rows.length < 2) {
    cacheWrite(cacheKey, []);
    return [];
  }

  const headers = rows[0].map(h => String(h).trim());
  const records = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
    return obj;
  });

  cacheWrite(cacheKey, records);
  return includeDeleted ? records : records.filter(r => r.IsDeleted !== 'TRUE');
}

/**
 * appendRow(spreadsheetId, sheetName, rowData, userEmail)
 * Appends a new record to a sheet.
 * Automatically injects universal fields:
 *   RecordID, CreatedAt, CreatedBy, ModifiedAt, ModifiedBy,
 *   IsDeleted, DeletedAt, DeletedBy
 *
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @param {object} rowData - Field key/value pairs (excluding universal fields)
 * @param {string} userEmail - Authenticated user's email
 * @returns {Promise<object>} The complete record that was appended
 */
async function appendRow(spreadsheetId, sheetName, rowData, userEmail) {
  const headers = await getSheetHeaders(spreadsheetId, sheetName);

  const existing = await readSheet(spreadsheetId, sheetName,
    { includeDeleted: true, email: userEmail, forceRefresh: true });
  const existingIDs = existing.map(r => r.RecordID).filter(Boolean);

  const now      = getCurrentTimestamp();
  const recordID = generateRecordID(existingIDs);

  const fullRecord = {
    ...rowData,
    RecordID:   recordID,
    CreatedAt:  now,
    CreatedBy:  userEmail,
    ModifiedAt: '',
    ModifiedBy: '',
    IsDeleted:  'FALSE',
    DeletedAt:  '',
    DeletedBy:  ''
  };

  const rowValues = headers.map(h => fullRecord[h] !== undefined ? fullRecord[h] : '');

  await sheetsRequest(spreadsheetId, 'POST',
    `/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { values: [rowValues] }
  );

  await writeAuditLog(spreadsheetId, {
    action:     'CREATE',
    sheetName,
    recordID,
    fieldName:  '',
    oldValue:   '',
    newValue:   JSON.stringify(rowData),
    userEmail
  });

  cacheClear(getCacheKey(sheetName, userEmail));

  queueSyncWrite(sheetName, recordID, 'CREATE', fullRecord);

  return fullRecord;
}

/**
 * updateRow(spreadsheetId, sheetName, recordID, updatedFields, userEmail)
 * Updates specific fields on a row identified by RecordID.
 * Auto-updates ModifiedAt and ModifiedBy.
 * Writes EDIT entries to AuditLog for each changed field.
 *
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @param {string} recordID
 * @param {object} updatedFields - Only the fields that changed
 * @param {string} userEmail
 * @returns {Promise<boolean>} True if updated successfully
 */
async function updateRow(spreadsheetId, sheetName, recordID, updatedFields, userEmail) {
  const headers = await getSheetHeaders(spreadsheetId, sheetName);
  const allRows = await sheetsRequest(spreadsheetId, 'GET',
    `/values/${encodeURIComponent(sheetName)}`);

  const rows    = allRows.values || [];
  const rowIdx  = rows.findIndex((row, i) => i > 0 && row[headers.indexOf('RecordID')] === recordID);

  if (rowIdx === -1) throw new Error(`Record ${recordID} not found in ${sheetName}`);

  const existingRow = {};
  headers.forEach((h, i) => { existingRow[h] = rows[rowIdx][i] || ''; });

  const now = getCurrentTimestamp();
  const updates = { ...updatedFields, ModifiedAt: now, ModifiedBy: userEmail };

  const updatedRow = headers.map(h => updates[h] !== undefined ? updates[h] : (existingRow[h] || ''));

  const sheetRowNum = rowIdx + 1;
  const range = encodeURIComponent(`${sheetName}!A${sheetRowNum}`);

  await sheetsRequest(spreadsheetId, 'PUT',
    `/values/${range}?valueInputOption=USER_ENTERED`,
    { values: [updatedRow] }
  );

  for (const [field, newVal] of Object.entries(updatedFields)) {
    const oldVal = existingRow[field] || '';
    if (String(oldVal) !== String(newVal)) {
      await writeAuditLog(spreadsheetId, {
        action: 'EDIT',
        sheetName,
        recordID,
        fieldName: field,
        oldValue:  String(oldVal),
        newValue:  String(newVal),
        userEmail
      });
    }
  }

  cacheClear(getCacheKey(sheetName, userEmail));
  return true;
}

/**
 * findRowIndex(spreadsheetId, sheetName, recordID)
 * Finds the 1-based sheet row number for a given RecordID
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @param {string} recordID
 * @returns {Promise<number>} 1-based row number, or -1 if not found
 */
async function findRowIndex(spreadsheetId, sheetName, recordID) {
  const result  = await sheetsRequest(spreadsheetId, 'GET',
    `/values/${encodeURIComponent(sheetName)}`);
  const rows    = result.values || [];
  const headers = rows[0] || [];
  const idCol   = headers.indexOf('RecordID');
  if (idCol === -1) return -1;
  const idx = rows.findIndex((row, i) => i > 0 && row[idCol] === recordID);
  return idx === -1 ? -1 : idx + 1;
}

/* ============================================================
   SECTION 6 — SOFT-DELETE & RESTORE
   ============================================================ */

/**
 * softDelete(spreadsheetId, sheetName, recordID, userEmail)
 * Soft-deletes a record by setting IsDeleted=TRUE, DeletedAt, DeletedBy.
 * NEVER physically removes the row.
 * Writes a DELETE entry to AuditLog.
 *
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @param {string} recordID
 * @param {string} userEmail
 * @returns {Promise<boolean>}
 */
async function softDelete(spreadsheetId, sheetName, recordID, userEmail) {
  const now = getCurrentTimestamp();
  await updateRow(spreadsheetId, sheetName, recordID, {
    IsDeleted: 'TRUE',
    DeletedAt: now,
    DeletedBy: userEmail
  }, userEmail);

  await writeAuditLog(spreadsheetId, {
    action:    'DELETE',
    sheetName,
    recordID,
    fieldName: 'IsDeleted',
    oldValue:  'FALSE',
    newValue:  'TRUE',
    userEmail
  });

  cacheClear(getCacheKey(sheetName, userEmail));
  showToast('Record removed successfully', 'success');
  return true;
}

/**
 * restoreRecord(spreadsheetId, sheetName, recordID, userEmail)
 * Reverses a soft-delete. Clears IsDeleted, DeletedAt, DeletedBy.
 * Writes a RESTORE entry to AuditLog.
 *
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @param {string} recordID
 * @param {string} userEmail
 * @returns {Promise<boolean>}
 */
async function restoreRecord(spreadsheetId, sheetName, recordID, userEmail) {
  await updateRow(spreadsheetId, sheetName, recordID, {
    IsDeleted: 'FALSE',
    DeletedAt: '',
    DeletedBy: ''
  }, userEmail);

  await writeAuditLog(spreadsheetId, {
    action:    'RESTORE',
    sheetName,
    recordID,
    fieldName: 'IsDeleted',
    oldValue:  'TRUE',
    newValue:  'FALSE',
    userEmail
  });

  cacheClear(getCacheKey(sheetName, userEmail));
  showToast('Record restored successfully', 'success');
  return true;
}

/* ============================================================
   SECTION 7 — AUDIT LOG
   ============================================================ */

/**
 * writeAuditLog(spreadsheetId, entry)
 * Appends an entry to the AuditLog sheet.
 * Silent — never throws (audit failure should not block main operation).
 *
 * @param {string} spreadsheetId
 * @param {object} entry
 * @param {string} entry.action     - CREATE | EDIT | DELETE | RESTORE
 * @param {string} entry.sheetName
 * @param {string} entry.recordID
 * @param {string} entry.fieldName
 * @param {string} entry.oldValue
 * @param {string} entry.newValue
 * @param {string} entry.userEmail
 */
async function writeAuditLog(spreadsheetId, entry) {
  try {
    const logID = generateRecordID();
    const row = [
      logID,
      getCurrentTimestamp(),
      entry.userEmail,
      entry.action,
      entry.sheetName,
      entry.recordID,
      entry.fieldName,
      entry.oldValue,
      entry.newValue
    ];
    await sheetsRequest(spreadsheetId, 'POST',
      `/values/${encodeURIComponent('AuditLog')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      { values: [row] }
    );
  } catch (e) {
    console.warn('AuditLog write failed (non-critical):', e);
  }
}

/* ============================================================
   SECTION 8 — OFFLINE SYNC QUEUE
   ============================================================ */

/**
 * queueSyncWrite(sheetName, recordID, action, data)
 * Adds a write operation to the pending sync queue in localStorage.
 * Used as a fallback indicator — the app writes to Sheets immediately,
 * but this queue tracks operations that may need retry.
 *
 * @param {string} sheetName
 * @param {string} recordID
 * @param {string} action - CREATE | EDIT | DELETE
 * @param {object} data
 */
function queueSyncWrite(sheetName, recordID, action, data) {
  try {
    const queue = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    queue.push({ sheetName, recordID, action, data, ts: Date.now() });
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Sync queue write failed:', e);
  }
}

/**
 * clearSyncQueue()
 * Clears the pending sync queue after successful sync
 */
function clearSyncQueue() {
  localStorage.removeItem(PENDING_SYNC_KEY);
}

/**
 * getPendingSyncCount()
 * Returns the number of operations pending sync
 * @returns {number}
 */
function getPendingSyncCount() {
  try {
    const queue = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    return queue.length;
  } catch {
    return 0;
  }
}

/**
 * updateSyncIndicator(state)
 * Updates the sync status dot in the UI.
 * @param {'syncing'|'synced'|'error'} state
 * @param {string} [message]
 */
function updateSyncIndicator(state, message = '') {
  const el = document.getElementById('syncIndicator');
  if (!el) return;
  el.className = `sync-indicator ${state}`;
  const text = el.querySelector('.sync-text');
  if (text) {
    text.textContent = {
      syncing: 'Syncing…',
      synced:  message || 'All changes saved',
      error:   message || 'Sync failed — will retry'
    }[state] || '';
  }
}

/* ============================================================
   SECTION 9 — LOOKUP UTILITIES
   ============================================================ */

/**
 * loadLookup(spreadsheetId, lookupSheetName, userEmail)
 * Fetches all active records from a lookup sheet.
 * Results cached in localStorage for CACHE_TTL ms.
 *
 * @param {string} spreadsheetId
 * @param {string} lookupSheetName - e.g. "LKP_Categories"
 * @param {string} userEmail
 * @returns {Promise<object[]>} Array of { code, nameAR, nameEN, description, sortOrder }
 */
async function loadLookup(spreadsheetId, lookupSheetName, userEmail) {
  const cacheKey = `${LOOKUP_CACHE_PREFIX}${lookupSheetName}`;
  const cached   = cacheRead(cacheKey, CACHE_TTL);
  if (cached) return cached;

  const records = await readSheet(spreadsheetId, lookupSheetName,
    { includeDeleted: false, email: userEmail });

  const active = records
    .filter(r => r.IsActive !== 'FALSE')
    .sort((a, b) => (parseInt(a.SortOrder) || 0) - (parseInt(b.SortOrder) || 0))
    .map(r => ({
      code:        r.Code        || '',
      nameAR:      r.NameAR      || '',
      nameEN:      r.NameEN      || '',
      description: r.Description || '',
      sortOrder:   parseInt(r.SortOrder) || 0,
      recordID:    r.RecordID    || ''
    }));

  cacheWrite(cacheKey, active);
  return active;
}

/**
 * populateDropdown(selectEl, lookupSheetName, options)
 * Populates an HTML <select> element with lookup options.
 *
 * @param {HTMLSelectElement|string} selectEl - Element or selector string
 * @param {string} spreadsheetId
 * @param {string} lookupSheetName
 * @param {string} userEmail
 * @param {object} [options]
 * @param {string}  [options.valueField='code']     - Field to use as option value
 * @param {string}  [options.lang='AR']             - 'AR' or 'EN' for display
 * @param {string}  [options.placeholder='اختر...'] - Placeholder option text
 * @param {string}  [options.selectedValue='']      - Pre-select this value
 */
async function populateDropdown(selectEl, spreadsheetId, lookupSheetName, userEmail, options = {}) {
  const {
    valueField    = 'code',
    lang          = 'AR',
    placeholder   = 'اختر...',
    selectedValue = ''
  } = options;

  const el = typeof selectEl === 'string' ? document.querySelector(selectEl) : selectEl;
  if (!el) return;

  el.innerHTML = `<option value="">${placeholder}</option>`;

  try {
    const items = await loadLookup(spreadsheetId, lookupSheetName, userEmail);
    for (const item of items) {
      const opt   = document.createElement('option');
      opt.value   = item[valueField];
      opt.textContent = lang === 'AR' ? item.nameAR : item.nameEN;
      if (item[valueField] === selectedValue) opt.selected = true;
      el.appendChild(opt);
    }
  } catch (e) {
    console.error(`Failed to populate dropdown from ${lookupSheetName}:`, e);
    showToast(`Failed to load ${lookupSheetName} options`, 'error');
  }
}

/**
 * getLookupLabel(lookupSheetName, code, lang, spreadsheetId, userEmail)
 * Returns the display label for a lookup code.
 * Uses cached lookup data — does not make an API call if cache is warm.
 *
 * @param {string} lookupSheetName
 * @param {string} code
 * @param {string} [lang='AR']
 * @param {string} spreadsheetId
 * @param {string} userEmail
 * @returns {Promise<string>}
 */
async function getLookupLabel(lookupSheetName, code, lang = 'AR', spreadsheetId, userEmail) {
  try {
    const items = await loadLookup(spreadsheetId, lookupSheetName, userEmail);
    const item  = items.find(i => i.code === code);
    if (!item) return code;
    return lang === 'AR' ? item.nameAR : item.nameEN;
  } catch {
    return code;
  }
}

/* ============================================================
   SECTION 10 — PERMISSIONS
   ============================================================ */

/**
 * loadPermissionsMatrix(spreadsheetId, userEmail)
 * Fetches and caches the permissions matrix from the Permissions sheet.
 * @param {string} spreadsheetId
 * @param {string} userEmail
 * @returns {Promise<object[]>}
 */
async function loadPermissionsMatrix(spreadsheetId, userEmail) {
  const cached = sessionStorage.getItem(PERMISSIONS_CACHE);
  if (cached) return JSON.parse(cached);

  const records = await readSheet(spreadsheetId, 'Permissions',
    { includeDeleted: false, email: userEmail, forceRefresh: true });

  sessionStorage.setItem(PERMISSIONS_CACHE, JSON.stringify(records));
  return records;
}

/**
 * getUserRole(spreadsheetId, userEmail)
 * Returns the role assigned to the current authenticated user.
 * @param {string} spreadsheetId
 * @param {string} userEmail
 * @returns {Promise<string>} Role name e.g. "DataEntry", "SuperAdmin"
 */
async function getUserRole(spreadsheetId, userEmail) {
  const roleKey = `coms_role_${userEmail}`;
  const cached  = sessionStorage.getItem(roleKey);
  if (cached) return cached;

  const users = await readSheet(spreadsheetId, 'Users',
    { includeDeleted: false, email: userEmail, forceRefresh: true });

  const user = users.find(u => u.Email === userEmail);
  const role = user?.Role || 'Viewer';
  sessionStorage.setItem(roleKey, role);
  return role;
}

/**
 * checkPagePermissions(pageName, spreadsheetId, userEmail)
 * Returns a permissions object for the current user on a given page.
 *
 * @param {string} pageName - e.g. "Transactions", "Beneficiaries"
 * @param {string} spreadsheetId
 * @param {string} userEmail
 * @returns {Promise<object>} {
 *   canView, canCreate, canEdit, canDelete,
 *   canViewDeleted, canViewSensitive, canExport
 * }
 */
async function checkPagePermissions(pageName, spreadsheetId, userEmail) {
  const denied = {
    canView: false, canCreate: false, canEdit: false,
    canDelete: false, canViewDeleted: false,
    canViewSensitive: false, canExport: false
  };

  try {
    const role   = await getUserRole(spreadsheetId, userEmail);
    const matrix = await loadPermissionsMatrix(spreadsheetId, userEmail);
    const entry  = matrix.find(r => r.RoleID === role && r.PageName === pageName);
    if (!entry) return denied;

    const bool = (val) => String(val).toUpperCase() === 'TRUE';

    return {
      canView:         bool(entry.CanView),
      canCreate:       bool(entry.CanCreate),
      canEdit:         bool(entry.CanEdit),
      canDelete:       bool(entry.CanDelete),
      canViewDeleted:  bool(entry.CanViewDeleted),
      canViewSensitive:bool(entry.CanViewSensitive),
      canExport:       bool(entry.CanExport)
    };
  } catch (e) {
    console.error('checkPagePermissions failed:', e);
    return denied;
  }
}

/**
 * enforceViewPermission(pageName, spreadsheetId, userEmail)
 * If the current user cannot view this page, shows toast and redirects.
 * Call at the top of every page's onReady() function.
 *
 * @param {string} pageName
 * @param {string} spreadsheetId
 * @param {string} userEmail
 * @returns {Promise<object>} permissions object (if access granted)
 */
async function enforceViewPermission(pageName, spreadsheetId, userEmail) {
  if (!pageName) return {
    canView: true, canCreate: true, canEdit: true,
    canDelete: true, canViewDeleted: true,
    canViewSensitive: true, canExport: true
  };

  const perms = await checkPagePermissions(pageName, spreadsheetId, userEmail);
  if (!perms.canView) {
    showToast('ليس لديك صلاحية للوصول إلى هذه الصفحة', 'error');
    const isDashboardBuilt = false;
    setTimeout(() => {
      window.location.href = getRelativePath('pages/Home.html');
    }, 1500);
  }
  return perms;
}

/**
 * applyPermissionsToUI(perms)
 * Hides or disables UI elements based on the permissions object.
 * Elements with data-requires="create|edit|delete|export" are handled automatically.
 * @param {object} perms
 */
function applyPermissionsToUI(perms) {
  document.querySelectorAll('[data-requires]').forEach(el => {
    const req = el.getAttribute('data-requires');
    const allowed = {
      create:       perms.canCreate,
      edit:         perms.canEdit,
      delete:       perms.canDelete,
      export:       perms.canExport,
      viewDeleted:  perms.canViewDeleted,
      sensitive:    perms.canViewSensitive
    }[req];

    if (!allowed) {
      if (el.tagName === 'BUTTON' || el.tagName === 'A') {
        el.classList.add('permission-disabled');
      } else {
        el.style.display = 'none';
      }
    }
  });

  const showDeletedToggle = document.getElementById('showDeletedToggle');
  if (showDeletedToggle) {
    showDeletedToggle.style.display = perms.canViewDeleted ? '' : 'none';
  }
}

/**
 * renderActionButtons(record, perms, callbacks)
 * Renders Edit and Delete/Restore action buttons for a table row.
 * Respects permissions — disabled state if no permission, hidden if delete not allowed.
 *
 * @param {object} record - The data record
 * @param {object} perms  - Permissions object from checkPagePermissions
 * @param {object} callbacks
 * @param {Function} callbacks.onEdit    - Called with (record)
 * @param {Function} callbacks.onDelete  - Called with (record)
 * @param {Function} callbacks.onRestore - Called with (record) — for deleted records
 * @returns {HTMLElement} A div containing the action buttons
 */
function renderActionButtons(record, perms, callbacks = {}) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:center;gap:6px;';

  const isDeleted = record.IsDeleted === 'TRUE';

  if (isDeleted && perms.canViewDeleted) {
    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'btn btn-sm btn-secondary';
    restoreBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg> Restore`;
    restoreBtn.addEventListener('click', () => callbacks.onRestore?.(record));
    wrap.appendChild(restoreBtn);
    return wrap;
  }

  if (perms.canEdit) {
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-secondary btn-icon';
    editBtn.title = 'Edit';
    editBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    editBtn.addEventListener('click', () => callbacks.onEdit?.(record));
    wrap.appendChild(editBtn);
  } else {
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-secondary btn-icon permission-disabled';
    editBtn.title = 'Edit (no permission)';
    editBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    wrap.appendChild(editBtn);
  }

  if (perms.canDelete) {
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-danger btn-icon';
    delBtn.title = 'Delete';
    delBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
    delBtn.addEventListener('click', () => callbacks.onDelete?.(record));
    wrap.appendChild(delBtn);
  }

  return wrap;
}

/* ============================================================
   SECTION 11 — TOAST NOTIFICATIONS
   ============================================================ */

/**
 * showToast(message, type, duration)
 * Displays a floating toast notification.
 * Auto-dismisses after duration ms.
 *
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} [type='success']
 * @param {number} [duration=3500]
 */
function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✓',
    error:   '✕',
    warning: '!',
    info:    'i'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || 'i'}</div>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.add('hide');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}

/* ============================================================
   SECTION 12 — MODAL MANAGEMENT
   ============================================================ */

/**
 * openModal(modalID)
 * Opens a modal overlay by ID. Locks body scroll.
 * @param {string} modalID
 */
function openModal(modalID) {
  const modal = document.getElementById(modalID);
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modalID);
  }, { once: true });
}

/**
 * closeModal(modalID)
 * Closes a modal overlay by ID. Restores body scroll.
 * @param {string} modalID
 */
function closeModal(modalID) {
  const modal = document.getElementById(modalID);
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

/**
 * showConfirmModal(options)
 * Shows a confirmation dialog and returns a Promise<boolean>.
 * Resolves true if confirmed, false if cancelled.
 *
 * @param {object} options
 * @param {string} [options.title='Are you sure?']
 * @param {string} [options.message]
 * @param {string} [options.confirmText='Confirm']
 * @param {string} [options.cancelText='Cancel']
 * @param {'danger'|'warning'} [options.type='danger']
 * @returns {Promise<boolean>}
 */
function showConfirmModal({ title = 'Are you sure?', message = '', confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' } = {}) {
  return new Promise((resolve) => {
    let modal = document.getElementById('globalConfirmModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'globalConfirmModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-box modal-sm">
          <div class="modal-body" style="text-align:center;padding:32px 24px 20px;">
            <div class="modal-confirm-icon ${type}" id="confirmIcon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <div class="modal-confirm-title" id="confirmTitle"></div>
            <div class="modal-confirm-text" id="confirmMessage"></div>
          </div>
          <div class="modal-footer" style="justify-content:center;gap:12px;">
            <button class="btn btn-secondary" id="confirmCancel"></button>
            <button class="btn btn-danger" id="confirmOk"></button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    document.getElementById('confirmTitle').textContent   = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmOk').textContent      = confirmText;
    document.getElementById('confirmCancel').textContent  = cancelText;
    document.getElementById('confirmIcon').className      = `modal-confirm-icon ${type}`;

    openModal('globalConfirmModal');

    const ok     = document.getElementById('confirmOk');
    const cancel = document.getElementById('confirmCancel');

    const cleanup = (result) => {
      closeModal('globalConfirmModal');
      ok.replaceWith(ok.cloneNode(true));
      cancel.replaceWith(cancel.cloneNode(true));
      resolve(result);
    };

    document.getElementById('confirmOk').addEventListener('click', () => cleanup(true), { once: true });
    document.getElementById('confirmCancel').addEventListener('click', () => cleanup(false), { once: true });
  });
}

/* ============================================================
   SECTION 13 — FORM UTILITIES
   ============================================================ */

/**
 * clearForm(formIDOrEl)
 * Resets all inputs, selects, and textareas within a form.
 * @param {string|HTMLElement} formIDOrEl
 */
function clearForm(formIDOrEl) {
  const form = typeof formIDOrEl === 'string'
    ? document.getElementById(formIDOrEl)
    : formIDOrEl;
  if (!form) return;
  form.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.type === 'checkbox' || el.type === 'radio') {
      el.checked = false;
    } else {
      el.value = '';
    }
    el.classList.remove('error');
  });
  form.querySelectorAll('.form-error').forEach(e => e.style.display = 'none');
  form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
}

/**
 * serializeForm(formIDOrEl)
 * Returns an object of all named form field values.
 * @param {string|HTMLElement} formIDOrEl
 * @returns {object}
 */
function serializeForm(formIDOrEl) {
  const form = typeof formIDOrEl === 'string'
    ? document.getElementById(formIDOrEl)
    : formIDOrEl;
  if (!form) return {};
  const data = {};
  form.querySelectorAll('[name]').forEach(el => {
    if (el.type === 'checkbox') {
      data[el.name] = el.checked ? 'TRUE' : 'FALSE';
    } else if (el.type === 'radio') {
      if (el.checked) data[el.name] = el.value;
    } else {
      data[el.name] = el.value.trim();
    }
  });
  return data;
}

/**
 * validateRequired(formIDOrEl)
 * Validates all fields marked with data-required="true".
 * Highlights missing fields with error state.
 *
 * @param {string|HTMLElement} formIDOrEl
 * @returns {{ valid: boolean, missingFields: string[] }}
 */
function validateRequired(formIDOrEl) {
  const form = typeof formIDOrEl === 'string'
    ? document.getElementById(formIDOrEl)
    : formIDOrEl;
  if (!form) return { valid: false, missingFields: [] };

  const missing = [];

  form.querySelectorAll('[data-required="true"]').forEach(el => {
    const group = el.closest('.form-group');
    const empty = el.value.trim() === '';
    el.classList.toggle('error', empty);
    if (group) group.classList.toggle('has-error', empty);
    if (empty) missing.push(el.name || el.id || 'unknown');
  });

  return { valid: missing.length === 0, missingFields: missing };
}

/**
 * fillForm(formIDOrEl, data)
 * Populates form fields from a data object (for edit mode).
 * @param {string|HTMLElement} formIDOrEl
 * @param {object} data
 */
function fillForm(formIDOrEl, data) {
  const form = typeof formIDOrEl === 'string'
    ? document.getElementById(formIDOrEl)
    : formIDOrEl;
  if (!form) return;
  Object.entries(data).forEach(([key, val]) => {
    const el = form.querySelector(`[name="${key}"]`);
    if (!el) return;
    if (el.type === 'checkbox') {
      el.checked = val === 'TRUE' || val === true;
    } else {
      el.value = val || '';
    }
  });
}

/* ============================================================
   SECTION 14 — TABLE HELPERS
   ============================================================ */

/**
 * sortTableData(data, field, direction)
 * Sorts an array of record objects by a given field.
 * @param {object[]} data
 * @param {string} field
 * @param {'asc'|'desc'} direction
 * @returns {object[]}
 */
function sortTableData(data, field, direction = 'asc') {
  return [...data].sort((a, b) => {
    const av = a[field] || '';
    const bv = b[field] || '';
    const numA = parseFloat(av);
    const numB = parseFloat(bv);
    const isNum = !isNaN(numA) && !isNaN(numB);
    const cmp = isNum ? numA - numB : String(av).localeCompare(String(bv), 'ar');
    return direction === 'asc' ? cmp : -cmp;
  });
}

/**
 * filterTableData(data, query, fields)
 * Filters records by searching query string across specified fields.
 * @param {object[]} data
 * @param {string} query
 * @param {string[]} fields - Field names to search in
 * @returns {object[]}
 */
function filterTableData(data, query, fields) {
  if (!query || !query.trim()) return data;
  const q = query.trim().toLowerCase();
  return data.filter(record =>
    fields.some(field => {
      const val = record[field];
      return val && String(val).toLowerCase().includes(q);
    })
  );
}

/**
 * paginateData(data, page, pageSize)
 * Returns a slice of data for the given page.
 * @param {object[]} data
 * @param {number} page - 1-based page number
 * @param {number} pageSize
 * @returns {{ rows: object[], totalPages: number, totalRows: number }}
 */
function paginateData(data, page, pageSize = 25) {
  const totalRows  = data.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage   = Math.min(Math.max(1, page), totalPages);
  const start      = (safePage - 1) * pageSize;
  return {
    rows: data.slice(start, start + pageSize),
    totalPages,
    totalRows,
    currentPage: safePage
  };
}

/* ============================================================
   SECTION 15 — NAVIGATION & PATH UTILITIES
   ============================================================ */

/**
 * getRelativePath(targetPath)
 * Returns the correct relative path to a file from the current page location.
 * Handles pages/ and lookups/ depth automatically.
 * @param {string} targetPath - e.g. "pages/Dashboard.html", "assets/styles.css"
 * @returns {string}
 */
function getRelativePath(targetPath) {
  const path = window.location.pathname;
  const depth = (path.match(/\//g) || []).length;
  const inLookups = path.includes('/lookups/');
  const prefix    = inLookups ? '../../' : (path.includes('/pages/') ? '../' : '');
  return `${prefix}${targetPath}`;
}

/**
 * navigateTo(page)
 * Navigates to a page using the correct relative path.
 * @param {string} page - e.g. "Dashboard.html", "lookups/Categories.html"
 */
function navigateTo(page) {
  const inLookups = window.location.pathname.includes('/lookups/');
  const inPages   = window.location.pathname.includes('/pages/');
  const prefix    = inLookups ? '../../pages/' : (inPages ? '' : 'pages/');
  window.location.href = `${prefix}${page}`;
}

/**
 * getActivePage()
 * Returns the current page filename without extension.
 * @returns {string} e.g. "Transactions", "Dashboard"
 */
function getActivePage() {
  return window.location.pathname.split('/').pop().replace('.html', '');
}

/**
 * setActiveNavItem()
 * Marks the correct sidebar nav item as active based on current page.
 */
function setActiveNavItem() {
  const current = getActivePage();
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href') || '';
    const page = href.split('/').pop().replace('.html', '');
    item.classList.toggle('active', page === current);
  });
}

/* ============================================================
   SECTION 16 — SPREADSHEET INITIALIZATION
   ============================================================ */

/**
 * SHEET_DEFINITIONS
 * Defines all sheets and their header rows for first-run setup.
 * Used by Home.html to create the spreadsheet structure.
 */
const SHEET_DEFINITIONS = {
  Transactions: [
    'TxID','Date','Direction','CategoryAR','CategoryCode','IslamicClass',
    'CashAmount','InKindValue','InKindDescription','DonorID','BeneficiaryID',
    'PaymentMethod','ReceiptRef','ProjectID','Notes',
    'RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy',
    'IsDeleted','DeletedAt','DeletedBy'
  ],
  Donors: [
    'DonorID','FullNameAR','FullNameEN','DonorType','Phone','Email',
    'Address','Governorate','FirstDonationDate','TotalDonated',
    'LastDonationDate','NotificationPref','Notes',
    'RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy',
    'IsDeleted','DeletedAt','DeletedBy'
  ],
  Beneficiaries: [
    'BeneficiaryID','FullNameAR','Phone','FamilySize','Governorate',
    'District','NeedType','RegistrationDate','FileStatus','TotalAidReceived',
    'LastAidDate','AidFrequency','Verified','Notes',
    'RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy',
    'IsDeleted','DeletedAt','DeletedBy'
  ],
  Receipts: [
    'ReceiptNo','Date','Direction','CategoryAR','CategoryCode','Amount',
    'PaymentMethod','TxID','DonorName','BeneficiaryName','IssuedBy',
    'ReceiptStatus','Notes',
    'RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy',
    'IsDeleted','DeletedAt','DeletedBy'
  ],
  Inventory: [
    'ItemCode','ItemNameAR','Category','Unit','OpeningStock','TotalIN',
    'TotalOUT','CurrentStock','EstUnitValue','TotalValue','StorageLocation',
    'ExpiryDate','Notes',
    'RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy',
    'IsDeleted','DeletedAt','DeletedBy'
  ],
  Projects: [
    'ProjectCode','ProjectNameAR','Category','StartDate','EndDate',
    'Budget','ActualSpent','Remaining','BeneficiaryCount','ProjectManager',
    'Status','FundingSource','Notes',
    'RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy',
    'IsDeleted','DeletedAt','DeletedBy'
  ],
  Installments: [
    'InstallmentID','DonorID','PledgeTotal','InstallmentCount',
    'InstallmentNo','DueDate','AmountDue','AmountPaid','PaymentDate',
    'PaymentMethod','ReceiptRef','Status','Notes',
    'RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy',
    'IsDeleted','DeletedAt','DeletedBy'
  ],
  Recurring: [
    'RecurringID','Description','CategoryCode','Amount','Frequency',
    'StartDate','EndDate','NextDueDate','LastPaidDate','LinkedTxID',
    'Status','Notes',
    'RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy',
    'IsDeleted','DeletedAt','DeletedBy'
  ],
  Users: [
    'Email','FullName','Role','Status','LastLogin','Notes',
    'RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy',
    'IsDeleted','DeletedAt','DeletedBy'
  ],
  Roles: [
    'RoleID','RoleName','Description',
    'RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy',
    'IsDeleted','DeletedAt','DeletedBy'
  ],
  Permissions: [
    'RoleID','PageName','CanView','CanCreate','CanEdit','CanDelete',
    'CanViewDeleted','CanViewSensitive','CanExport',
    'RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy',
    'IsDeleted','DeletedAt','DeletedBy'
  ],
  AuditLog: [
    'LogID','Timestamp','UserEmail','Action','SheetName',
    'RecordID','FieldName','OldValue','NewValue'
  ],
  LKP_Categories: [
    'LookupID','Code','NameAR','NameEN','Type','SubType','IslamicClass',
    'AccountCode','Description','SortOrder','IsActive',
    'RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy',
    'IsDeleted','DeletedAt','DeletedBy'
  ],
  LKP_DonorTypes:        ['LookupID','Code','NameAR','NameEN','Description','SortOrder','IsActive','RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy','IsDeleted','DeletedAt','DeletedBy'],
  LKP_IslamicClasses:    ['LookupID','Code','NameAR','NameEN','Description','SortOrder','IsActive','RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy','IsDeleted','DeletedAt','DeletedBy'],
  LKP_NeedTypes:         ['LookupID','Code','NameAR','NameEN','Description','SortOrder','IsActive','RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy','IsDeleted','DeletedAt','DeletedBy'],
  LKP_PaymentMethods:    ['LookupID','Code','NameAR','NameEN','Description','SortOrder','IsActive','RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy','IsDeleted','DeletedAt','DeletedBy'],
  LKP_AidFrequencies:    ['LookupID','Code','NameAR','NameEN','Description','SortOrder','IsActive','RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy','IsDeleted','DeletedAt','DeletedBy'],
  LKP_ProjectStatuses:   ['LookupID','Code','NameAR','NameEN','Description','SortOrder','IsActive','RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy','IsDeleted','DeletedAt','DeletedBy'],
  LKP_ProjectCategories: ['LookupID','Code','NameAR','NameEN','Description','SortOrder','IsActive','RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy','IsDeleted','DeletedAt','DeletedBy'],
  LKP_Governorates:      ['LookupID','Code','NameAR','NameEN','Description','SortOrder','IsActive','RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy','IsDeleted','DeletedAt','DeletedBy'],
  LKP_NotificationPrefs: ['LookupID','Code','NameAR','NameEN','Description','SortOrder','IsActive','RecordID','CreatedAt','CreatedBy','ModifiedAt','ModifiedBy','IsDeleted','DeletedAt','DeletedBy']
};

/**
 * LOOKUP_SEED_DATA
 * Initial data for all lookup sheets — seeded on first run.
 */
const LOOKUP_SEED_DATA = {
  LKP_Categories: [
    ['CAT001','IN-ZK-001','زكاة المال','Zakat Al-Mal','IN','زكاة | Zakat','زكاة | Zakat','IN-ZK-001','Zakat on savings & financial assets',1,'TRUE'],
    ['CAT002','IN-ZK-002','زكاة الفطر','Zakat Al-Fitr','IN','زكاة | Zakat','زكاة | Zakat','IN-ZK-002','Zakat Al-Fitr paid during Ramadan',2,'TRUE'],
    ['CAT003','IN-ZK-003','زكاة التجارة','Zakat Al-Tijarah','IN','زكاة | Zakat','زكاة | Zakat','IN-ZK-003','Zakat on trade goods & business assets',3,'TRUE'],
    ['CAT004','IN-SD-001','صدقة عامة','General Sadaqah','IN','صدقات | Sadaqat','صدقة | Sadaqah','IN-SD-001','Voluntary donations with no specified purpose',4,'TRUE'],
    ['CAT005','IN-SD-002','صدقة جارية','Sadaqah Jariyah','IN','صدقات | Sadaqat','صدقة جارية | Sadaqah Jariyah','IN-SD-002','Ongoing charity with lasting impact',5,'TRUE'],
    ['CAT006','IN-TN-001','تبرع نقدي محدد الغرض','Designated Cash Donation','IN','تبرعات نقدية | Cash Donations','تبرع | Tabarru','IN-TN-001','Cash donation restricted to a specific cause',6,'TRUE'],
    ['CAT007','IN-TN-002','تبرع نقدي غير محدد','Undesignated Cash Donation','IN','تبرعات نقدية | Cash Donations','تبرع | Tabarru','IN-TN-002','Cash donation with no restriction on use',7,'TRUE'],
    ['CAT008','IN-TN-003','تبرع لدفع إيجار المقر','Donation for HQ Rent','IN','تبرعات نقدية | Cash Donations','تبرع | Tabarru','IN-TN-003','Donation designated to cover rent',8,'TRUE'],
    ['CAT009','IN-TE-001','تبرع عيني — ملابس','In-Kind Donation — Clothing','IN','تبرعات عينية | In-Kind Donations','تبرع عيني | In-Kind','IN-TE-001','Clothing suitable for distribution',9,'TRUE'],
    ['CAT010','IN-TE-002','تبرع عيني — طعام','In-Kind Donation — Food','IN','تبرعات عينية | In-Kind Donations','تبرع عيني | In-Kind','IN-TE-002','Food supplies or ready meals',10,'TRUE'],
    ['CAT011','IN-TE-003','تبرع عيني — أدوية','In-Kind Donation — Medical','IN','تبرعات عينية | In-Kind Donations','تبرع عيني | In-Kind','IN-TE-003','Medicines and medical supplies',11,'TRUE'],
    ['CAT012','IN-TE-004','تبرع عيني — أثاث','In-Kind Donation — Furniture','IN','تبرعات عينية | In-Kind Donations','تبرع عيني | In-Kind','IN-TE-004','Household furniture or appliances',12,'TRUE'],
    ['CAT013','IN-TE-005','تبرع عيني — أخرى','In-Kind Donation — Other','IN','تبرعات عينية | In-Kind Donations','تبرع عيني | In-Kind','IN-TE-005','Other in-kind items',13,'TRUE'],
    ['CAT014','OUT-MN-001','مساعدة نقدية — أسرة','Cash Aid — Needy Family','OUT','توزيع نقدي | Cash Distribution','صدقة / زكاة','OUT-MN-001','Monthly or emergency cash aid for a needy family',14,'TRUE'],
    ['CAT015','OUT-MN-002','مساعدة نقدية — طارئة','Cash Aid — Emergency Case','OUT','توزيع نقدي | Cash Distribution','صدقة / زكاة','OUT-MN-002','Urgent cash payment for emergency',15,'TRUE'],
    ['CAT016','OUT-TE-001','كسوة — ملابس','In-Kind Aid — Clothing','OUT','توزيع عيني | In-Kind Distribution','صدقة عينية','OUT-TE-001','Distribution of clothing to beneficiaries',16,'TRUE'],
    ['CAT017','OUT-TE-002','توزيع طعام — وجبات','In-Kind Aid — Food / Meals','OUT','توزيع عيني | In-Kind Distribution','صدقة عينية','OUT-TE-002','Distribution of meals or food supplies',17,'TRUE'],
    ['CAT018','OUT-TE-003','مستلزمات طبية — توزيع','In-Kind Aid — Medical Supplies','OUT','توزيع عيني | In-Kind Distribution','صدقة عينية','OUT-TE-003','Distribution of medicines or medical supplies',18,'TRUE'],
    ['CAT019','OUT-OP-001','إيجار مقر الجمعية','HQ Rent','OUT','مصروفات تشغيلية | Operational Expenses','مصروف تشغيلي','OUT-OP-001','Monthly or annual rent for the organization',19,'TRUE'],
    ['CAT020','OUT-OP-002','مرتبات / مكافآت العاملين','Staff Salaries / Allowances','OUT','مصروفات تشغيلية | Operational Expenses','مصروف تشغيلي','OUT-OP-002','Salaries or incentives paid to staff',20,'TRUE'],
    ['CAT021','OUT-OP-003','مصاريف إدارية ومكتبية','Administrative & Office Expenses','OUT','مصروفات تشغيلية | Operational Expenses','مصروف تشغيلي','OUT-OP-003','Stationery, printing, communications',21,'TRUE'],
    ['CAT022','OUT-OP-004','مصاريف نقل وتوصيل','Transport & Delivery Costs','OUT','مصروفات تشغيلية | Operational Expenses','مصروف تشغيلي','OUT-OP-004','Transportation of in-kind aid or team visits',22,'TRUE'],
    ['CAT023','OUT-MK-001','مشروع خيري — تعليم','Ongoing Project — Education','OUT','مشاريع خيرية | Charity Projects','صدقة جارية','OUT-MK-001','Student support, scholarships',23,'TRUE'],
    ['CAT024','OUT-MK-002','مشروع خيري — صحة','Ongoing Project — Health','OUT','مشاريع خيرية | Charity Projects','صدقة جارية','OUT-MK-002','Recurring healthcare, ongoing medication',24,'TRUE'],
    ['CAT025','OUT-MK-003','مشروع خيري — إسكان','Ongoing Project — Housing','OUT','مشاريع خيرية | Charity Projects','صدقة جارية','OUT-MK-003','Assistance with rent or maintenance',25,'TRUE'],
    ['CAT026','OUT-MK-004','مشروع خيري — أخرى','Ongoing Project — Other','OUT','مشاريع خيرية | Charity Projects','صدقة جارية','OUT-MK-004','Other ongoing sustainable projects',26,'TRUE']
  ],
  LKP_DonorTypes: [
    ['DT001','INDIVIDUAL','فرد','Individual','Individual person donor',1,'TRUE'],
    ['DT002','CORPORATE','شركة','Corporate','Company or business entity',2,'TRUE'],
    ['DT003','ASSOCIATION','جمعية','Association / NGO','Non-governmental organization',3,'TRUE'],
    ['DT004','GOVERNMENT','جهة حكومية','Government Entity','Government body or ministry',4,'TRUE'],
    ['DT005','ANONYMOUS','مجهول','Anonymous','Anonymous donor',5,'TRUE']
  ],
  LKP_IslamicClasses: [
    ['IC001','ZAKAT','زكاة','Zakat','Obligatory Islamic almsgiving',1,'TRUE'],
    ['IC002','SADAQAH','صدقة','Sadaqah','Voluntary charity',2,'TRUE'],
    ['IC003','SADAQAH_JARIYAH','صدقة جارية','Sadaqah Jariyah','Ongoing charity with lasting benefit',3,'TRUE'],
    ['IC004','TABARRU','تبرع','Tabarru','Voluntary donation',4,'TRUE'],
    ['IC005','IN_KIND','تبرع عيني','In-Kind Tabarru','Non-cash voluntary donation',5,'TRUE'],
    ['IC006','OPERATIONAL','مصروف تشغيلي','Operational Expense','Non-charitable operational cost',6,'TRUE']
  ],
  LKP_NeedTypes: [
    ['NT001','MONTHLY_CASH','مساعدة شهرية','Monthly Cash Aid','Regular monthly financial support',1,'TRUE'],
    ['NT002','IN_KIND','مساعدة عينية','In-Kind Aid','Non-cash goods distribution',2,'TRUE'],
    ['NT003','EDUCATION','مشروع تعليمي','Education Project','Educational support and scholarships',3,'TRUE'],
    ['NT004','HEALTHCARE','رعاية صحية','Healthcare Support','Medical treatment and supplies',4,'TRUE'],
    ['NT005','HOUSING','دعم إسكان','Housing Support','Rent assistance and housing',5,'TRUE'],
    ['NT006','EMERGENCY','حالة طارئة','Emergency Case','Urgent one-time support',6,'TRUE'],
    ['NT007','OTHER','أخرى','Other','Other need types',7,'TRUE']
  ],
  LKP_PaymentMethods: [
    ['PM001','CASH','نقدي','Cash','Physical cash payment',1,'TRUE'],
    ['PM002','BANK_TRANSFER','تحويل بنكي','Bank Transfer','Electronic bank transfer',2,'TRUE'],
    ['PM003','CHEQUE','شيك','Cheque','Bank cheque',3,'TRUE'],
    ['PM004','VODAFONE_CASH','فودافون كاش','Vodafone Cash','Mobile wallet payment',4,'TRUE'],
    ['PM005','INSTAPAY','إنستاباي','InstaPay','InstaPay electronic payment',5,'TRUE'],
    ['PM006','CARD','بطاقة ائتمانية','Credit / Debit Card','Card payment',6,'TRUE'],
    ['PM007','OTHER','أخرى','Other','Other payment methods',7,'TRUE']
  ],
  LKP_AidFrequencies: [
    ['AF001','MONTHLY','شهري','Monthly','Every month',1,'TRUE'],
    ['AF002','QUARTERLY','فصلي','Quarterly','Every three months',2,'TRUE'],
    ['AF003','SEASONAL','موسمي','Seasonal','Ramadan, Eid, etc.',3,'TRUE'],
    ['AF004','ANNUAL','سنوي','Annual','Once per year',4,'TRUE'],
    ['AF005','ONE_TIME','مرة واحدة','One-Time','Single occurrence only',5,'TRUE'],
    ['AF006','AS_NEEDED','عند الحاجة','As Needed','On demand',6,'TRUE']
  ],
  LKP_ProjectStatuses: [
    ['PS001','ACTIVE','نشط','Active','Project is running',1,'TRUE'],
    ['PS002','UNDER_REVIEW','قيد المراجعة','Under Review','Being evaluated',2,'TRUE'],
    ['PS003','ON_HOLD','موقوف مؤقتاً','On Hold','Temporarily paused',3,'TRUE'],
    ['PS004','COMPLETED','مكتمل','Completed','Successfully finished',4,'TRUE'],
    ['PS005','CANCELLED','ملغي','Cancelled','Cancelled before completion',5,'TRUE']
  ],
  LKP_ProjectCategories: [
    ['PC001','EDUCATION','تعليم','Education','Educational programs and scholarships',1,'TRUE'],
    ['PC002','HEALTH','صحة','Health','Healthcare and medical programs',2,'TRUE'],
    ['PC003','HOUSING','إسكان','Housing','Housing and shelter support',3,'TRUE'],
    ['PC004','EMERGENCY','إغاثة طارئة','Emergency Relief','Urgent relief operations',4,'TRUE'],
    ['PC005','EMPOWERMENT','تمكين اقتصادي','Economic Empowerment','Livelihood and income support',5,'TRUE'],
    ['PC006','OTHER','أخرى','Other','Other project categories',6,'TRUE']
  ],
  LKP_Governorates: [
    ['GOV01','CAIRO','القاهرة','Cairo','',1,'TRUE'],
    ['GOV02','GIZA','الجيزة','Giza','',2,'TRUE'],
    ['GOV03','ALEX','الإسكندرية','Alexandria','',3,'TRUE'],
    ['GOV04','DAKAHLIA','الدقهلية','Dakahlia','',4,'TRUE'],
    ['GOV05','SHARQIA','الشرقية','Sharqia','',5,'TRUE'],
    ['GOV06','MONUFIA','المنوفية','Monufia','',6,'TRUE'],
    ['GOV07','GHARBIA','الغربية','Gharbia','',7,'TRUE'],
    ['GOV08','KAFR_SHEIKH','كفر الشيخ','Kafr El-Sheikh','',8,'TRUE'],
    ['GOV09','DAMIETTA','دمياط','Damietta','',9,'TRUE'],
    ['GOV10','BEHEIRA','البحيرة','Beheira','',10,'TRUE'],
    ['GOV11','ISMAILIA','الإسماعيلية','Ismailia','',11,'TRUE'],
    ['GOV12','PORT_SAID','بورسعيد','Port Said','',12,'TRUE'],
    ['GOV13','SUEZ','السويس','Suez','',13,'TRUE'],
    ['GOV14','N_SINAI','شمال سيناء','North Sinai','',14,'TRUE'],
    ['GOV15','S_SINAI','جنوب سيناء','South Sinai','',15,'TRUE'],
    ['GOV16','FAYOUM','الفيوم','Fayoum','',16,'TRUE'],
    ['GOV17','BENI_SUEF','بني سويف','Beni Suef','',17,'TRUE'],
    ['GOV18','MINYA','المنيا','Minya','',18,'TRUE'],
    ['GOV19','ASSIUT','أسيوط','Assiut','',19,'TRUE'],
    ['GOV20','SOHAG','سوهاج','Sohag','',20,'TRUE'],
    ['GOV21','QENA','قنا','Qena','',21,'TRUE'],
    ['GOV22','LUXOR','الأقصر','Luxor','',22,'TRUE'],
    ['GOV23','ASWAN','أسوان','Aswan','',23,'TRUE'],
    ['GOV24','RED_SEA','البحر الأحمر','Red Sea','',24,'TRUE'],
    ['GOV25','NEW_VALLEY','الوادي الجديد','New Valley','',25,'TRUE'],
    ['GOV26','MATROUH','مطروح','Matrouh','',26,'TRUE'],
    ['GOV27','QALYUBIA','القليوبية','Qalyubia','',27,'TRUE']
  ],
  LKP_NotificationPrefs: [
    ['NP001','WHATSAPP','واتساب','WhatsApp','WhatsApp message',1,'TRUE'],
    ['NP002','SMS','SMS','SMS','Text message',2,'TRUE'],
    ['NP003','EMAIL','بريد إلكتروني','Email','Email notification',3,'TRUE'],
    ['NP004','PHONE','اتصال هاتفي','Phone Call','Direct phone call',4,'TRUE'],
    ['NP005','NONE','لا أرغب','No Notification','No contact preference',5,'TRUE']
  ]
};

/**
 * DEFAULT_ROLES_AND_PERMISSIONS
 * Seed data for Roles and Permissions sheets.
 */
const DEFAULT_ROLES = [
  ['SuperAdmin','Super Administrator','Full system access — all pages and all actions'],
  ['Director','Director','Full operational access including sensitive delete'],
  ['AccountManager','Account Manager','Full financial module access'],
  ['CaseManager','Case Manager','Full access to beneficiaries and projects'],
  ['DataEntry','Data Entry','Create and edit — no delete'],
  ['InventoryManager','Inventory Manager','Full inventory access, view-only elsewhere'],
  ['Viewer','Viewer','Read-only dashboard and reports']
];

const ALL_PAGES = [
  'Dashboard','OwnerDashboard','Transactions','Donors','Beneficiaries',
  'Receipts','Inventory','Projects','Installments','Recurring',
  'Reports','Settings','Permissions',
  'Categories','DonorTypes','IslamicClasses','NeedTypes','PaymentMethods',
  'AidFrequencies','ProjectStatuses','ProjectCategories','Governorates','NotificationPrefs'
];

/* ============================================================
   SECTION 17 — MISC UTILITIES
   ============================================================ */

/**
 * debounce(fn, delay)
 * Returns a debounced version of fn.
 * @param {Function} fn
 * @param {number} delay - ms
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * escapeHTML(str)
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * isEmpty(value)
 * Returns true if value is null, undefined, or empty string
 * @param {*} value
 * @returns {boolean}
 */
function isEmpty(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

/**
 * sumField(records, field)
 * Sums a numeric field across an array of records.
 * @param {object[]} records
 * @param {string} field
 * @returns {number}
 */
function sumField(records, field) {
  return records.reduce((sum, r) => sum + (parseFloat(r[field]) || 0), 0);
}

/**
 * groupBy(records, field)
 * Groups an array of records by a field value.
 * @param {object[]} records
 * @param {string} field
 * @returns {object} { value: records[] }
 */
function groupBy(records, field) {
  return records.reduce((acc, r) => {
    const key = r[field] || '';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});
}

/* ============================================================
   SECTION 18 — SIDEBAR RENDERER
   ============================================================ */

/**
 * renderSidebar(userEmail, userName, userRole)
 * Injects the shared sidebar HTML into #sidebar element.
 * Navigation items are filtered by permissions.
 * @param {string} userEmail
 * @param {string} userName
 * @param {string} userRole
 */
function renderSidebar(userEmail, userName, userRole) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const initials = (userName || userEmail || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const navItems = [
    { page: 'Dashboard.html',     icon: gridIcon(),   label: 'Dashboard',     labelAR: 'لوحة التحكم' },
    { page: 'Transactions.html',  icon: txIcon(),     label: 'Transactions',  labelAR: 'العمليات' },
    { page: 'Donors.html',        icon: heartIcon(),  label: 'Donors',        labelAR: 'المتبرعون' },
    { page: 'Beneficiaries.html', icon: usersIcon(),  label: 'Beneficiaries', labelAR: 'المستفيدون' },
    { page: 'Receipts.html',      icon: receiptIcon(),label: 'Receipts',      labelAR: 'الإيصالات' },
    { page: 'Inventory.html',     icon: boxIcon(),    label: 'Inventory',     labelAR: 'المخزون' },
    { page: 'Projects.html',      icon: projIcon(),   label: 'Projects',      labelAR: 'المشاريع' },
    { page: 'Installments.html',  icon: calIcon(),    label: 'Installments',  labelAR: 'الأقساط' },
    { page: 'Recurring.html',     icon: repeatIcon(), label: 'Recurring',     labelAR: 'الدوريات' },
    { page: 'Reports.html',       icon: chartIcon(),  label: 'Reports',       labelAR: 'التقارير' }
  ];

  const adminItems = [
    { page: 'Settings.html',    icon: settingsIcon(),   label: 'Settings',    labelAR: 'الإعدادات' },
    { page: 'Permissions.html', icon: lockIcon(),       label: 'Permissions', labelAR: 'الصلاحيات', adminOnly: true }
  ];

  const current = getActivePage();

  const navHTML = (items) => items
    .filter(i => !i.adminOnly || userRole === 'SuperAdmin')
    .map(i => {
      const page = i.page.replace('.html', '');
      const active = page === current ? 'active' : '';
      return `<a href="${i.page}" class="nav-item ${active}">
        <span class="nav-icon">${i.icon}</span>
        <span>${i.labelAR}</span>
      </a>`;
    }).join('');

  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <div class="sidebar-brand-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
      <div class="sidebar-brand-text">
        الجمعية الخيرية
        <div class="sidebar-brand-sub">Charity Management</div>
      </div>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-label">القائمة الرئيسية</div>
      <nav class="sidebar-nav">${navHTML(navItems)}</nav>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-label">النظام</div>
      <nav class="sidebar-nav">${navHTML(adminItems)}</nav>
    </div>

    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="user-avatar">${initials}</div>
        <div class="user-info">
          <div class="user-name">${escapeHTML(userName || userEmail)}</div>
          <div class="user-role">${escapeHTML(userRole || 'Viewer')}</div>
        </div>
      </div>
      <div class="sync-indicator synced" id="syncIndicator" style="padding:6px 10px;margin-top:4px;">
        <div class="sync-dot"></div>
        <span class="sync-text text-xs">All changes saved</span>
      </div>
    </div>
  `;
}

/* Inline SVG icons for sidebar */
const svgIcon = (d) =>
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

const gridIcon    = () => svgIcon('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>');
const txIcon      = () => svgIcon('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>');
const heartIcon   = () => svgIcon('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>');
const usersIcon   = () => svgIcon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>');
const receiptIcon = () => svgIcon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>');
const boxIcon     = () => svgIcon('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>');
const projIcon    = () => svgIcon('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>');
const calIcon     = () => svgIcon('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>');
const repeatIcon  = () => svgIcon('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>');
const chartIcon   = () => svgIcon('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>');
const settingsIcon= () => svgIcon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>');
const lockIcon    = () => svgIcon('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>');
