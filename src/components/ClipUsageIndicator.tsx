'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function ClipUsageIndicator() {
  const { user } = useUser();
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchUsage() {
      try {
        const response = await fetch('/api/user/usage');
        if (response.ok) {
          const data = await response.json();
          setUsage({ used: data.clipsUsed, limit: data.clipsLimit });
        }
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      }
    }

    fetchUsage();
  }, [user]);

  if (!usage) return null;

  return (
    <span className="text-sm text-gray-500">
      {usage.used}/{usage.limit} clips
    </span>
  );
}
