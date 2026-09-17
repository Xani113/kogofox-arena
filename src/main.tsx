import React from 'react';
import ReactDOM from 'react-dom/client';
import PixelStarsDemo from '@/components/ui/demo';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <div style={{ minHeight: '100vh', width: '100vw', margin: 0, padding: 0, overflow: 'hidden' }}>
        <PixelStarsDemo />
      </div>
    </React.StrictMode>
  );
}
