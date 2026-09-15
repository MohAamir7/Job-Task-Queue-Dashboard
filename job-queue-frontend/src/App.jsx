import { useEffect, useMemo, useState } from 'react';
import { fetchJobs, createJob, updateJobStatus, deleteJob } from './api/jobs';
import JobForm from './components/JobForm';
import StatusSummary from './components/StatusSummary';
import StatusFilterTabs from './components/StatusFilterTabs';
import JobTable from './components/JobTable';

// ============================================================
// DATA FLOW OVERVIEW (read this before the code below)
// ------------------------------------------------------------
// App.jsx is the ONLY component that holds the real job list in
// state. Everything else (JobForm, JobTable, JobRow, StatusSummary,
// StatusFilterTabs) is "dumb": they receive data and callback props,
// and report user actions upward by calling those callbacks. This
// is the standard React pattern of lifting state up to the nearest
// common ancestor, applied here because almost every piece of UI
// (the summary counts, the table, the filter) needs to react to the
// same list of jobs.
//
// The four things a user can do map 1:1 onto four functions here:
//
//   create a job      -> handleCreate      -> POST /jobs
//   change its status -> handleStatusChange -> PATCH /jobs/:id/status
//   delete it         -> handleDelete      -> DELETE /jobs/:id
//   filter the view    -> setFilter (just local UI state, no API call)
//
// After every write (create/update/delete) we re-fetch the full
// list from the server with loadJobs() instead of hand-editing our
// local array. That's a deliberate, simple choice for this size of
// app: it guarantees what's on screen matches what the database
// actually has - which matters a lot for the concurrency scenario
// in the assignment (two tabs racing to change the same job). See
// the README for the fuller discussion of that trade-off.
// ============================================================

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  // ---- READ ------------------------------------------------
  async function loadJobs() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobs();
      setJobs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Fetch once when the component first mounts. Empty dependency
  // array [] means "run this effect only after the first render."
  useEffect(() => {
    loadJobs();
  }, []);

  // ---- CREATE ------------------------------------------------
  async function handleCreate(payload) {
    // Deliberately NOT wrapped in try/catch here: JobForm's own
    // handleSubmit awaits this call and catches the error itself
    // (so it knows not to clear its inputs on failure). If we
    // swallowed the error here, JobForm would think it succeeded.
    await createJob(payload);
    await loadJobs(); // refresh so the new job (with server-assigned id/createdAt) shows up
  }

  // ---- UPDATE STATUS ------------------------------------------------
  async function handleStatusChange(id, nextStatus) {
    // Same idea: let JobRow catch the error so it can show it
    // inline on that specific row.
    await updateJobStatus(id, nextStatus);
    await loadJobs();
  }

  // ---- DELETE ------------------------------------------------
  async function handleDelete(id) {
    await deleteJob(id);
    await loadJobs();
  }

  // ---- DERIVED DATA ------------------------------------------------
  // "Derived" means: not stored in its own useState, always computed
  // fresh from `jobs` + `filter`. useMemo just avoids recomputing this
  // filter on every unrelated re-render (e.g. while a row is `busy`).
  const filteredJobs = useMemo(() => {
    if (filter === 'all') return jobs;
    return jobs.filter((j) => j.status === filter);
  }, [jobs, filter]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Job Queue</h1>
        <p className="app__subtitle">Create, track, and move jobs through their lifecycle.</p>
      </header>

      <StatusSummary jobs={jobs} />

      <JobForm onCreate={handleCreate} disabled={loading} />

      {error && (
        <div className="banner banner--error">
          Couldn't reach the server: {error}
          <button className="btn btn--small" onClick={loadJobs}>Retry</button>
        </div>
      )}

      <StatusFilterTabs active={filter} onChange={setFilter} />

      <JobTable
        jobs={filteredJobs}
        loading={loading}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  );
}
