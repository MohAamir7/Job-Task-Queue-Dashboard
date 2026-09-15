import { STATUSES, STATUS_COLORS } from '../constants';

// StatusSummary shows a count per status. Notice it takes the
// full `jobs` array as a prop and derives counts with .filter()
// on every render - it does NOT keep its own copy of counts in
// state. Counts are "derived data": they can always be recomputed
// from `jobs`, so storing them separately would just create a
// second source of truth that could drift out of sync (e.g. if
// you forgot to update the count when a job's status changes).
export default function StatusSummary({ jobs }) {
  console.log(jobs);
  return (
    <div className="summary">
      {STATUSES.map((status) => {
        const count = jobs.filter((j) => j.status === status).length;
        return (
          <div key={status} className="summary__card">
            <span className="summary__dot" style={{ background: STATUS_COLORS[status] }} />
            <span className="summary__count">{count}</span>
            <span className="summary__label">{status}</span>
          </div>
        );
      })}
      <div className="summary__card summary__card--total">
        <span className="summary__count">{jobs.length}</span>
        <span className="summary__label">total</span>
      </div>
    </div>
  );
}
