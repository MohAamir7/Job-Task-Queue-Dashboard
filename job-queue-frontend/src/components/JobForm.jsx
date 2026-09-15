import { useState } from 'react';

// JobForm is a "controlled, dumb" component: it owns only the
// text currently typed into its own inputs. It does NOT own the
// job list, does NOT call the API directly, and does NOT know
// what happens after submit. It just calls the onCreate callback
// that App.jsx passed down as a prop.
//
// Why this shape: it keeps the form reusable/testable on its own,
// and keeps "who talks to the backend" answered in exactly one
// place (App.jsx), which is the pattern used for every action in
// this app (see JobRow for the same idea with status/delete).
export default function JobForm({ onCreate, disabled }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !type.trim()) return; // basic client-side guard

    setSubmitting(true);
    try {
      // onCreate is async and throws on failure (see App.jsx).
      // We await it so we only clear the form on success - if the
      // request fails, the user's typed text stays put.
      await onCreate({ title: title.trim(), type: type.trim() });
      setTitle('');
      setType('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="job-form" onSubmit={handleSubmit}>
      <input
        className="job-form__input"
        placeholder="Job title (e.g. Resize product images)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={disabled || submitting}
      />
      <input
        className="job-form__input"
        placeholder="Job type (e.g. image-processing)"
        value={type}
        onChange={(e) => setType(e.target.value)}
        disabled={disabled || submitting}
      />
      <button type="submit" className="btn btn--primary" disabled={disabled || submitting}>
        {submitting ? 'Adding…' : 'Add job'}
      </button>
    </form>
  );
}
