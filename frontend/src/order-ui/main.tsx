import React from 'react';
import { createRoot } from 'react-dom/client';
import { OrderExperience } from './order-experience';

const mountEl = document.getElementById('order-ui-root');

if (mountEl) {
  createRoot(mountEl).render(
    <React.StrictMode>
      <OrderExperience />
    </React.StrictMode>,
  );
}


