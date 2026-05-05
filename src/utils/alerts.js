import { apiFetch } from '../api';

function jsonBody(obj) {
  return JSON.stringify(obj);
}

async function readErrorMessage(res) {
  const data = await res.json().catch(() => ({}));
  const msg = data.message ?? data.error;
  if (typeof msg === 'string' && msg.trim()) return msg.trim();
  return `Request failed (${res.status})`;
}

/**
 * Mark an alert resolved. Tries several URL + verb + body shapes seen in Express/Nest apps.
 * Only advances to the next attempt on 404 or 405 (route / method mismatch).
 */
export async function resolveAlertViaApi(alertId, { solution, notes, resolution }, onUnauthorized) {
  const id = String(alertId ?? '').trim();
  if (!id) throw new Error('Alert ID is required to resolve.');
  if (/^AL-\d+$/i.test(id)) {
    throw new Error('Cannot resolve — this row has a placeholder id. The alerts API must return id or _id.');
  }

  const resolveMsg = String(resolution ?? '').trim() || String(solution ?? '').trim();
  if (!resolveMsg) {
    throw new Error('Resolution text is empty — choose a solution (and optionally add notes).');
  }

  /** Backend validation: resolveMessage required */
  const base = {
    solution,
    ...(notes ? { notes } : {}),
    resolution: resolution ?? resolveMsg,
    resolveMessage: resolveMsg,
  };
  const withIds = { ...base, id, alertId: id };
  const enc = encodeURIComponent(id);

  /** Care Sense backend on Render: only `PATCH /alerts/:id/resolve` exists; POST/PUT that path → 404. */
  /** @type {{ method: string, path: string, body: string }[]} */
  const strategies = [
    { method: 'PATCH', path: `/alerts/${enc}/resolve`, body: jsonBody(base) },
    { method: 'POST', path: `/alerts/${enc}/resolve`, body: jsonBody(base) },
    { method: 'POST', path: `/alerts/${enc}/resolve`, body: jsonBody(withIds) },
    { method: 'PUT', path: `/alerts/${enc}/resolve`, body: jsonBody(base) },
    { method: 'PATCH', path: `/alerts/${enc}/resolve`, body: jsonBody(withIds) },
    { method: 'POST', path: `/alerts/${enc}/resolution`, body: jsonBody(withIds) },
    { method: 'POST', path: `/alerts/${enc}/resolved`, body: jsonBody(withIds) },
    { method: 'POST', path: `/alerts/${enc}/close`, body: jsonBody(withIds) },
    { method: 'PATCH', path: `/alerts/${enc}`, body: jsonBody({ status: 'resolved', ...base }) },
    { method: 'PATCH', path: `/alerts/${enc}`, body: jsonBody({ caseStatus: 'resolved', ...withIds }) },
    { method: 'PUT', path: `/alerts/${enc}`, body: jsonBody({ status: 'resolved', ...withIds }) },
    { method: 'PATCH', path: `/alerts/${enc}/status`, body: jsonBody({ status: 'resolved', ...base }) },
    { method: 'POST', path: `/alert/${enc}/resolve`, body: jsonBody(base) },
    { method: 'POST', path: `/clinical/alerts/${enc}/resolve`, body: jsonBody(base) },
    { method: 'POST', path: '/alerts/resolve', body: jsonBody(withIds) },
    { method: 'POST', path: `/alerts/resolve?alertId=${enc}`, body: jsonBody(base) },
    { method: 'POST', path: `/alerts/resolve?id=${enc}`, body: jsonBody(base) },
    { method: 'POST', path: `/admin/alerts/${enc}/resolve`, body: jsonBody(base) },
  ];

  let lastMessage = 'Could not resolve alert — no matching route responded successfully.';
  for (const s of strategies) {
    const res = await apiFetch(s.path, { method: s.method, body: s.body }, onUnauthorized);
    if (res.ok) {
      return res.json().catch(() => ({}));
    }
    lastMessage = await readErrorMessage(res);
    if (res.status !== 404 && res.status !== 405) {
      throw new Error(lastMessage);
    }
  }

  throw new Error(
    `${lastMessage} If your backend documents a specific resolve URL, align it with the strategies in src/utils/alerts.js.`,
  );
}

/**
 * Persist non-resolved case status (e.g. in-progress) so refresh keeps server state.
 * Tries common PATCH / PUT shapes; retries on 404/405 only.
 */
export async function updateAlertStatusViaApi(
  alertId,
  { caseStatus: nextStatus, solution, notes, actionNote },
  onUnauthorized,
) {
  const id = String(alertId ?? '').trim();
  if (!id) throw new Error('Alert ID is required.');
  if (/^AL-\d+$/i.test(id)) {
    throw new Error('Cannot update status — this row has a placeholder id. The alerts API must return id or _id.');
  }

  const enc = encodeURIComponent(id);
  const st = String(nextStatus ?? '').toLowerCase().trim();
  const noteFields = {
    ...(solution ? { solution } : {}),
    ...(notes ? { notes } : {}),
    ...(actionNote
      ? {
          action: actionNote,
          message: actionNote,
          updateMessage: actionNote,
        }
      : {}),
  };

  /** @type {Record<string, unknown>[]} — a few backend spellings; keeps request count sane */
  const statusBodies = [];
  if (st === 'in-progress') {
    statusBodies.push(
      { status: 'in-progress', caseStatus: 'in-progress' },
      { status: 'in_progress', caseStatus: 'in_progress' },
      { status: 'IN_PROGRESS', caseStatus: 'IN_PROGRESS' },
      { alertStatus: 'in_progress', status: 'in_progress' },
    );
  } else {
    statusBodies.push({ status: st, caseStatus: st });
  }

  /** @type {{ method: string, path: string, body: string }[]} */
  const rawStrategies = [];

  /** Same stack as resolve: mutations go to `PATCH /alerts/:id/resolve` (POST on that URL is not registered there). */
  if (st === 'in-progress') {
    const anchorMsg = String(actionNote ?? solution ?? notes ?? 'Case marked in progress').trim() || 'Case marked in progress';
    const viaResolve = [
      { status: 'in_progress', caseStatus: 'in_progress', ...noteFields },
      { status: 'in-progress', caseStatus: 'in-progress', ...noteFields },
      { status: 'IN_PROGRESS', caseStatus: 'IN_PROGRESS', ...noteFields },
      { caseStatus: 'in_progress', ...noteFields },
      { status: 'in_progress', ...noteFields, resolveMessage: anchorMsg, resolution: anchorMsg },
      { status: 'in_progress', ...noteFields, updateMessage: anchorMsg },
    ];
    for (const b of viaResolve) {
      rawStrategies.push({ method: 'PATCH', path: `/alerts/${enc}/resolve`, body: jsonBody(b) });
    }
  }

  for (const sb of statusBodies) {
    const withIds = { ...sb, ...noteFields, id, alertId: id };
    const full = { ...sb, ...noteFields };
    const minimal = { ...sb };

    const bodyFull = jsonBody(full);
    const bodyMinimal = jsonBody(minimal);
    const bodyWithIdsFull = jsonBody(withIds);
    const bodyWithIdsMinimal = jsonBody({ ...sb, id, alertId: id });

    const patchPut = [
      { method: 'PATCH', path: `/alerts/${enc}`, body: bodyFull },
      { method: 'PATCH', path: `/alerts/${enc}/status`, body: bodyFull },
      { method: 'PUT', path: `/alerts/${enc}`, body: bodyFull },
      { method: 'PUT', path: `/alerts/${enc}/status`, body: bodyFull },
      { method: 'PATCH', path: `/alerts/${enc}`, body: jsonBody({ ...sb, ...noteFields, _id: id }) },
      { method: 'PATCH', path: `/alerts/${enc}`, body: bodyMinimal },
      { method: 'PATCH', path: `/alerts/${enc}/status`, body: bodyMinimal },
      { method: 'PUT', path: `/alerts/${enc}`, body: bodyMinimal },
    ];

    /** Collection-style (same pattern as `/alerts/resolve` in resolveAlertViaApi). */
    const collection = [
      { method: 'POST', path: '/alerts/status', body: bodyWithIdsFull },
      { method: 'POST', path: '/alerts/update', body: bodyWithIdsFull },
      { method: 'PATCH', path: '/alerts/status', body: bodyWithIdsFull },
      { method: 'POST', path: '/alerts/status', body: bodyWithIdsMinimal },
      { method: 'POST', path: `/alerts/status?alertId=${enc}`, body: bodyMinimal },
      { method: 'POST', path: `/alerts/status?id=${enc}`, body: bodyMinimal },
      { method: 'POST', path: `/alerts/update?alertId=${enc}`, body: bodyMinimal },
      { method: 'POST', path: '/alerts/update-status', body: bodyWithIdsFull },
    ];

    if (st === 'in-progress') {
      /** Prefer POST subroutes first — many stacks pair them with POST `/alerts/:id/resolve`. */
      const resourcePosts = [
        { method: 'POST', path: `/alerts/${enc}/in_progress`, body: bodyFull },
        { method: 'POST', path: `/alerts/${enc}/in-progress`, body: bodyFull },
        { method: 'POST', path: `/alerts/${enc}/in_progress`, body: bodyMinimal },
        { method: 'POST', path: `/alerts/${enc}/in-progress`, body: bodyMinimal },
        { method: 'POST', path: `/alerts/${enc}/progress`, body: bodyFull },
        { method: 'POST', path: `/alerts/${enc}/status`, body: bodyFull },
        { method: 'POST', path: `/alerts/${enc}/start`, body: bodyFull },
        { method: 'POST', path: `/alerts/${enc}/investigate`, body: bodyFull },
        { method: 'POST', path: `/alerts/${enc}/update`, body: bodyFull },
        { method: 'PATCH', path: `/alerts/${enc}/progress`, body: bodyFull },
        { method: 'PATCH', path: `/alerts/${enc}/progress`, body: bodyMinimal },
        /** Mirror singular + prefixed routes from resolveAlertViaApi. */
        { method: 'POST', path: `/clinical/alerts/${enc}/in-progress`, body: bodyFull },
        { method: 'POST', path: `/clinical/alerts/${enc}/in_progress`, body: bodyFull },
        { method: 'PATCH', path: `/clinical/alerts/${enc}`, body: bodyFull },
        { method: 'POST', path: `/alert/${enc}/status`, body: bodyFull },
        { method: 'PATCH', path: `/alert/${enc}`, body: bodyFull },
        { method: 'PATCH', path: `/admin/alerts/${enc}`, body: bodyFull },
        { method: 'PATCH', path: `/admin/alerts/${enc}/status`, body: bodyFull },
      ];
      rawStrategies.push(...resourcePosts, ...patchPut, ...collection);
    } else {
      rawStrategies.push(
        ...patchPut,
        ...collection,
        { method: 'POST', path: `/clinical/alerts/${enc}/status`, body: bodyFull },
        { method: 'PATCH', path: `/clinical/alerts/${enc}`, body: bodyFull },
      );
    }
  }

  const seen = new Set();
  const strategies = [];
  for (const s of rawStrategies) {
    const key = `${s.method}\0${s.path}\0${s.body}`;
    if (seen.has(key)) continue;
    seen.add(key);
    strategies.push(s);
  }

  let lastMessage = 'Could not update alert status — no matching route responded successfully.';
  for (const s of strategies) {
    const res = await apiFetch(s.path, { method: s.method, body: s.body }, onUnauthorized);
    if (res.ok) {
      return res.json().catch(() => ({}));
    }
    lastMessage = await readErrorMessage(res);
    if (res.status !== 404 && res.status !== 405) {
      throw new Error(lastMessage);
    }
  }

  throw new Error(
    `${lastMessage} Add the correct endpoint to updateAlertStatusViaApi in src/utils/alerts.js if needed.`,
  );
}

/**
 * GET resolved alerts for a patient.
 * `/alerts/patient/:patientId/resolved?page=1&limit=100`
 */
export async function fetchPatientResolvedAlerts(patientId, params = {}, onUnauthorized) {
  const pid = String(patientId ?? '').trim();
  if (!pid) throw new Error('Patient ID is required.');
  const page = params.page != null ? Number(params.page) : 1;
  const limit = params.limit != null ? Number(params.limit) : 100;
  const path = `/alerts/patient/${encodeURIComponent(pid)}/resolved?page=${page}&limit=${limit}`;
  const res = await apiFetch(path, { method: 'GET' }, onUnauthorized);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.message ?? json.error;
    throw new Error(typeof msg === 'string' ? msg : `Could not load resolved alerts (${res.status})`);
  }
  return json;
}

/**
 * GET all resolved alerts (paginated).
 * `/alerts/resolved?page=1&limit=100`
 */
export async function fetchAllResolvedAlerts(params = {}, onUnauthorized) {
  const page = params.page != null ? Number(params.page) : 1;
  const limit = params.limit != null ? Number(params.limit) : 100;
  const path = `/alerts/resolved?page=${page}&limit=${limit}`;
  const res = await apiFetch(path, { method: 'GET' }, onUnauthorized);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.message ?? json.error;
    throw new Error(typeof msg === 'string' ? msg : `Could not load resolved alerts (${res.status})`);
  }
  return json;
}

/**
 * GET when the route might not exist — returns JSON only if ok. Otherwise null (e.g. missing list route).
 */
export async function fetchAlertsOptionalPath(path, onUnauthorized) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const res = await apiFetch(normalized, { method: 'GET' }, onUnauthorized);
  if (!res.ok) return null;
  return res.json().catch(() => ({}));
}
