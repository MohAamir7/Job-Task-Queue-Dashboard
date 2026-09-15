import { useState } from 'react';
import { ALLOWED_TRANSITIONS, STATUS_COLORS } from '../constants';

// JobRow renders one job and its action buttons. Like JobForm, it
// does not call the API itself - it calls onStatusChange / onDelete
// props, which App.jsx wired up to the real API functions. This is
// the "lift state up" pattern: every component that can trigger a
// change reports it upward, and only ONE place (App.jsx) actually
// mutates the jobs array, so the list can never end up with two
// different components disagreeing about what the current state is.
export default function JobRow({ job, onStatusChange, onDelete }) {
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState(null);

  const nextOptions = ALLOWED_TRANSITIONS[job.status] || [];

  async function handleTransition(nextStatus) {
    setBusy(true);
    setRowError(null);
    try {
      await onStatusChange(job.id, nextStatus);
    } catch (err) {
      // This is the important edge case from the assignment brief:
      // if another tab already moved this job (e.g. pending -> running)
      // a split second before us, the backend will reject OUR request
      // with a 409/400 even though our screen still shows "pending".
      // We show that failure right on the row and let the row's data
      // get corrected on the next refresh, rather than pretending it
      // worked.
      setRowError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setRowError(null);
    try {
      await onDelete(job.id);
    } catch (err) {
      setRowError(err.message);
      setBusy(false);
    }
    // no finally-setBusy(false) on success path: the row is about
    // to unmount because it's been removed from the list in App.jsx
  }

  return (
    <tr className="job-row">
      <td className="job-row__title">
        <div>{job.title}</div>
        <div className="job-row__type">{job.type}</div>
      </td>
      <td>
        <span
          className="badge"
          style={{ '--badge-color': STATUS_COLORS[job.status] }}
        >
          {job.status}
        </span>
      </td>
      <td className="job-row__created">
        {new Date(job.createdAt).toLocaleString()}
      </td>
      <td className="job-row__actions">
        {nextOptions.length === 0 && (
          <span className="job-row__terminal">no actions</span>
        )}
        {nextOptions.map((next) => (
          <button
            key={next}
            className="btn btn--small"
            disabled={busy}
            onClick={() => handleTransition(next)}
          >
            → {next}
          </button>
        ))}
        <button className="btn btn--small btn--danger" disabled={busy} onClick={handleDelete}>
          delete
        </button>
        {rowError && <div className="job-row__error">{rowError}</div>}
      </td>
    </tr>
  );
}
