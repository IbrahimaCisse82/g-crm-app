import { useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { UpgradePrompt } from '@/components/UpgradePrompt';

/**
 * Garde d'accès aux fonctionnalités réservées au plan Pro.
 * Usage:
 *   const { limits, requirePro, proGate } = useProGate();
 *   <button onClick={() => requirePro(limits.canExportPdf, 'Export PDF', () => downloadPdf(x))} />
 *   {proGate}
 */
export function useProGate() {
  const { subscription } = useApp();
  const [feature, setFeature] = useState<string | null>(null);

  const requirePro = useCallback((allowed: boolean, featureName: string, action: () => void) => {
    if (!allowed) {
      setFeature(featureName);
      return;
    }
    action();
  }, []);

  const proGate = (
    <UpgradePrompt open={!!feature} onClose={() => setFeature(null)} feature={feature ?? undefined} />
  );

  return {
    plan: subscription.plan,
    limits: subscription.limits,
    requirePro,
    showUpgrade: (featureName: string) => setFeature(featureName),
    proGate,
  };
}
