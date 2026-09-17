import React from 'react';
import ReactDOM from 'react-dom/client';
import ParticleDriftDemo from '@/components/ui/demo';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <div style={{ minHeight: '100vh', background: '#030508', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '1200px', height: '800px', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(0, 240, 255, 0.2)', boxShadow: '0 0 40px rgba(0, 240, 255, 0.1)' }}>
          <ParticleDriftDemo />
        </div>
      </div>
    </React.StrictMode>
  );
}
