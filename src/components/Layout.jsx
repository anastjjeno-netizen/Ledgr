import { NavLink, Outlet } from 'react-router-dom';
import { Home, List, PieChart, Settings, Target, Wallet } from 'lucide-react';

const NavItems = () => (
  <>
    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <Home size={24} />
      <span>Home</span>
    </NavLink>
    <NavLink to="/transactions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <List size={24} />
      <span>History</span>
    </NavLink>
    <NavLink to="/budget" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <Target size={24} />
      <span>Budget</span>
    </NavLink>
    <NavLink to="/insights" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <PieChart size={24} />
      <span>Insights</span>
    </NavLink>
    <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <Settings size={24} />
      <span>Settings</span>
    </NavLink>
  </>
);

export default function Layout() {

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-title flex items-center gap-2">
          <Wallet className="text-brand" size={28} />
          Ledgr
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <NavItems />
        </nav>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavItems />
      </nav>
    </>
  );
}
