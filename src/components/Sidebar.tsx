import { useState } from 'react';
import { NavLink } from 'react-router';
import './Sidebar.css';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  return (
    <aside className={`sidebar${isCollapsed ? ' sidebar--collapsed' : ''}`}>
      <button
        className="sidebar__toggle"
        onClick={() => setIsCollapsed((prev) => !prev)}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg className="sidebar__toggle-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          {isCollapsed ? (
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
      </button>
      <nav aria-label="Main navigation" className="sidebar__nav">
        <ul className="sidebar__list">
          <li className="sidebar__item">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
            >
              <svg className="sidebar__link-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="sidebar__link-label">Home</span>
            </NavLink>
          </li>
          <li className="sidebar__item">
            <NavLink
              to="/pda"
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
            >
              <svg className="sidebar__link-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zm4-8h2m-2 4h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="sidebar__link-label">5-tuple PDA</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
