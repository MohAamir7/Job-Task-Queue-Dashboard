import JobRow from './JobRow';

// JobTable is purely presentational: give it a list, it renders a
// list. All the "which jobs" decisions (filtering) already happened
// in App.jsx before this component ever sees the data.
export default function JobTable({ jobs, loading, onStatusChange, onDelete }) {
  if (loading) {
    return <div className="state-message">Loading jobs…</div>;
  }

  if (jobs.length === 0) {
    return <div className="state-message">No jobs match this filter yet.</div>;
  }

  return (
    <table className="job-table">
      <thead>
        <tr>
          <th>Job</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <JobRow
            key={job.id}
            job={job}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))}
      </tbody>
    </table>
  );
}
