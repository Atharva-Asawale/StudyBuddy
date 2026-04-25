import Sidebar from '../components/Sidebar';

export default function DashboardLayout({ children, noSidebar = false }) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
    }}>
      {!noSidebar && <Sidebar />}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: noSidebar ? '2rem 10%' : '2rem 2.5rem',
        width: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: 1
      }}>
        {children}
      </main>
    </div>
  );
}