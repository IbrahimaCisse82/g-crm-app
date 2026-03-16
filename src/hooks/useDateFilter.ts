import { useState, useMemo } from 'react';

export function useDateFilter<T>(items: T[], dateField: keyof T) {
  const [month, setMonth] = useState(''); // '' = all, '2026-03' format
  
  const filtered = useMemo(() => {
    if (!month) return items;
    return items.filter(item => {
      const val = String(item[dateField] ?? '');
      return val.startsWith(month);
    });
  }, [items, month, dateField]);

  // Generate available months from data
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    items.forEach(item => {
      const val = String(item[dateField] ?? '');
      if (val.length >= 7) months.add(val.slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [items, dateField]);

  return { filtered, month, setMonth, availableMonths };
}
