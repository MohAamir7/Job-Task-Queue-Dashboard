import { STATUSES } from '../constants';

// Controlled component: `active` and `onChange` are owned by App.jsx.
// This component has no state of its own at all - it just renders
// buttons and reports clicks upward. This matters for the filter
// specifically because App.jsx needs `activeFilter` to decide what
// to pass to JobTable, so the value has to live above both of them.
const TABS = ['all', ...STATUSES];

export default function StatusFilterTabs({ active, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={active === tab}
          className={`tabs__tab ${active === tab ? 'tabs__tab--active' : ''}`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
