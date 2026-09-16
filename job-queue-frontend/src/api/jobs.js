// ============================================================
// API LAYER
// ------------------------------------------------------------
// This is the ONLY file that knows the backend's URL and shape.
// Every component talks to the backend through these functions,
// never with fetch() directly. That means:
//   - if the backend URL changes, you edit ONE line
//   - if the response shape changes, you fix it in ONE place
//   - components stay dumb: they just call a function and get
//     back either data or a thrown Error
// ============================================================

// Set this to your deployed NestJS URL when you deploy.
// For local dev, NestJS commonly runs on port 3000.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Small wrapper around fetch that:
 *  - adds JSON headers
 *  - parses JSON safely
 *  - turns non-2xx responses into thrown Errors with a useful message
 * Every function below uses this, so error handling logic lives
 * in exactly one place instead of being copy-pasted everywhere.
 */
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // Try to read a JSON body even on errors, since NestJS's
  // ValidationPipe / exception filters return JSON error bodies
  // like { statusCode, message, error }.
  let body = null;
  try {
    body = await res.json();
  } catch {
    // no body / not JSON - fine, body stays null
  }

  if (!res.ok) {
    const message =
      (body && (Array.isArray(body.message) ? body.message.join(', ') : body.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return body;
}

// GET /jobs -> Job[]
export function fetchJobs() {
  return request('/jobs');
}

// POST /jobs -> Job
// payload: { title: string, type: string }
// (status/id/createdAt are set by the backend, not the client)
export function createJob(payload) {
  return request('/jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// PATCH /jobs/:id/status -> Job
export function updateJobStatus(id, status) {
  return request(`/jobs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// DELETE /jobs/:id -> void
export function deleteJob(id) {
  return request(`/jobs/${id}`, { method: 'DELETE' });
}
