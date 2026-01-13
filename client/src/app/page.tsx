'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState<string>('loading...');

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setStatus(JSON.stringify(data)))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-lg font-medium">
        API STATUS: {status}
      </div>
    </main>
  );
}
