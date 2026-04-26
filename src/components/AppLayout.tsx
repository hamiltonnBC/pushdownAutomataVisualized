import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import './AppLayout.css';

export function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
