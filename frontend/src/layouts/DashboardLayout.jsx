import Sidebar from '../components/Sidebar';

export default function DashboardLayout({ children, noSidebar = false }) {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'transparent',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Background Vignette — adds depth to the content area */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.4) 100%)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      {!noSidebar && <Sidebar />}
      
      <main style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: noSidebar ? '1rem 2%' : '0.5rem 2rem',
        width: '100%',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: 1,
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--neon-cyan) transparent'
      }}>

        {children}

        {/* Bottom padding for better scroll feel */}
        <div style={{ height: '5rem' }}></div>
      </main>
    </div>
  );
}