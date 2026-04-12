import Sidebar from '../components/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
    }}>
      <Sidebar />
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: '2rem 2.5rem',
        width: '100%',
      }}>
        {children}
      </main>
    </div>
  );
}