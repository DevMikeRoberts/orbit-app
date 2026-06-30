'use client';

import { useEffect, useState } from 'react';

export function GlobeCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCount() {
      try {
        const response = await fetch('/api/globes/count');
        const data = await response.json();
        setCount(data.count);
      } catch (error) {
        console.error('Failed to fetch globe count:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCount();
  }, []);

  if (loading) {
    return (
      <div className="landing-counter">
        <span className="landing-counter-label">Globes created</span>
        <span className="landing-counter-value">—</span>
      </div>
    );
  }

  return (
    <div className="landing-counter">
      <span className="landing-counter-label">Globes created</span>
      <span className="landing-counter-value">
        {count?.toLocaleString() ?? '—'}
      </span>
    </div>
  );
}
