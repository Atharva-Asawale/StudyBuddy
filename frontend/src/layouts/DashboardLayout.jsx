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
        padding: noSidebar ? '4rem 10%' : '3rem 4rem',
        width: '100%',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: 1,
        /* Custom scrollbar styling for the main content area */
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--neon-cyan) transparent'
      }}>
        {/* Subtle top scanline glow for headers */}
        <div style={{
          position: 'sticky',
          top: -100,
          left: 0,
          right: 0,
          height: '100px',
          background: 'linear-gradient(to bottom, rgba(0, 240, 255, 0.05), transparent)',
          pointerEvents: 'none',
          zIndex: 10
        }}></div>

        {children}

        {/* Bottom padding for better scroll feel */}
        <div style={{ height: '5rem' }}></div>
      </main>
    </div>
  );
}