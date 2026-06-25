/**
 * services/spaceTrack.js
 * ─────────────────────────────────────────────────────────────────────────────
 * NASA Space-Track.org API client
 *
 * Docs: https://www.space-track.org/documentation
 *
 * Key endpoints used:
 *   /basicspacedata/query/class/TLE_LATEST  — latest TLE per object
 *   /basicspacedata/query/class/satcat      — satellite catalog (metadata)
 *   /basicspacedata/query/class/conjunction — conjunction data messages (CDMs)
 */

import fetch from 'node-fetch';

const BASE_URL   = 'https://www.space-track.org';
const LOGIN_URL  = `${BASE_URL}/ajaxauth/login`;
const QUERY_BASE = `${BASE_URL}/basicspacedata/query`;

// In-memory session cookie cache (rotate every 2 hours)
let sessionCookie = null;
let cookieExpiry  = 0;

// ─── Authentication ──────────────────────────────────────────────────────────

async function getSession() {
  if (sessionCookie && Date.now() < cookieExpiry) return sessionCookie;

  const { SPACETRACK_USER: identity, SPACETRACK_PASS: password } = process.env;
  if (!identity || !password) {
    throw new Error('SPACETRACK_USER and SPACETRACK_PASS must be set in .env');
  }

  const res = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ identity, password }),
    redirect: 'manual',
  });

  const cookies = res.headers.raw()['set-cookie'] ?? [];
  const session = cookies.find(c => c.startsWith('chocolatechip='));
  if (!session) throw new Error('Space-Track login failed — check credentials');

  sessionCookie = session.split(';')[0];
  cookieExpiry  = Date.now() + 2 * 3600 * 1000; // 2 hours
  return sessionCookie;
}

// ─── Generic query ───────────────────────────────────────────────────────────



// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * getLatestTLEs
 * Fetches the most recent TLE for each debris/rocket body in the catalog.
 *
 * @param {object} opts
 * @param {number}   opts.limit       – max objects to return (default 500)
 * @param {string[]} opts.objectTypes – ['DEBRIS','ROCKET BODY','PAYLOAD'] etc.
 * @param {number}   opts.altMin      – min perigee altitude in km (default 150)
 * @param {number}   opts.altMax      – max apogee altitude in km (default 40000)
 */
export async function getLatestTLEs({
  limit = 200,
  objectTypes = ['DEBRIS', 'ROCKET BODY'],
  altMin = 150,
  altMax = 40_000,
} = {}) {
  const path = `/class/tle_latest/ORDINAL/1/OBJECT_TYPE/DEBRIS/PERIAPSIS/${altMin}--${altMax}/orderby/PERIAPSIS%20desc/limit/${limit}`;
  const raw = await query(path);

  return raw.map(row => ({
    id:           row.OBJECT_ID ?? `TLE-${row.NORAD_CAT_ID}`,
    name:         row.OBJECT_NAME?.trim() ?? 'Unknown',
    norad:        row.NORAD_CAT_ID,
    type:         normaliseType(row.OBJECT_TYPE),
    epoch:        row.EPOCH,
    altitude:     Math.round((parseFloat(row.PERIAPSIS || 400) + parseFloat(row.APOAPSIS || 400)) / 2),
    periapsis:    Math.round(parseFloat(row.PERIAPSIS || 400)),
    apoapsis:     Math.round(parseFloat(row.APOAPSIS || 400)),
    inclination:  parseFloat(row.INCLINATION || 51),
    period:       parseFloat(row.PERIOD || 95),
    eccentricity: parseFloat(row.ECCENTRICITY || 0),
    rcs:          parseFloat(row.RCS_SIZE) || 1.0,
    country:      row.COUNTRY_CODE ?? 'UNK',
    launch:       row.LAUNCH_DATE,
    tle_line1:    row.TLE_LINE1,
    tle_line2:    row.TLE_LINE2,
  }));
}

/**
 * getConjunctionMessages
 * Fetches CDMs (Conjunction Data Messages) for the next N days.
 * Requires Space-Track subscriber account with CDM access.
 */
export async function getConjunctionMessages({ days = 7, pcMin = 1e-6 } = {}) {
  const start = new Date().toISOString().slice(0, 10);
  const end   = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
  const path  = `/class/cdm_public/TCA/${start}--${end}/PC/%3E${pcMin}/orderby/PC desc/limit/200`;

  const raw = await query(path);
  return raw.map(cdm => ({
    id:           cdm.CDM_ID,
    primary:      { norad: cdm.SAT1_OBJECT_DESIGNATOR, name: cdm.SAT1_OBJECT_NAME },
    secondary:    { norad: cdm.SAT2_OBJECT_DESIGNATOR, name: cdm.SAT2_OBJECT_NAME },
    tca:          cdm.TCA,
    tcaDescription: cdm.TCA_RANGE,
    missDistance: parseFloat(cdm.MISS_DISTANCE),     // metres
    relVelocity:  parseFloat(cdm.RELATIVE_VELOCITY), // m/s
    pc:           parseFloat(cdm.PC),                // probability of collision
    created:      cdm.CREATION_DATE,
  }));
}

/**
 * getSatelliteCatalog
 * Full catalog metadata (name, country, launch date, size class).
 */
export async function getSatelliteCatalog({ limit = 1000 } = {}) {
  const path = `/class/satcat/CURRENT/Y/orderby/LAUNCH desc/limit/${limit}`;
  return query(path);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normaliseType(raw = '') {
  const t = raw.toUpperCase();
  if (t.includes('DEBRIS'))       return 'debris';
  if (t.includes('ROCKET'))       return 'rocket_body';
  if (t.includes('PAYLOAD'))      return 'active_sat';
  return 'unknown';
}

function estimateRCS(type, sizeClass) {
  // If RCS_SIZE is 'SMALL'/'MEDIUM'/'LARGE' string
  if (!sizeClass || isNaN(parseFloat(sizeClass))) {
    const map = { SMALL: 0.1, MEDIUM: 1.0, LARGE: 8.0 };
    return map[String(sizeClass).toUpperCase()] ?? 1.0;
  }
  return 1.0;
}

async function query(path) {
  const cookie = await getSession();
  const url = `${QUERY_BASE}${path}/format/json`;
  console.log('[SpaceTrack] Querying:', url);
  const res = await fetch(url, {
    headers: { Cookie: cookie },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('[SpaceTrack] Error body:', body);
    throw new Error(`Space-Track query failed: HTTP ${res.status}`);
  }
  return res.json();
}
