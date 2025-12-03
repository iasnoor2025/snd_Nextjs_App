'use client';

import dynamic from 'next/dynamic';

const DataTable = dynamic(() => import('./data-table').then(mod => ({ default: mod.DataTable })), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export { DataTable };
