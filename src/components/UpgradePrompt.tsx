import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface UpgradePromptProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

export function UpgradePrompt({ open, onClose, feature }: UpgradePromptProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Passez à Pro
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            {feature
              ? `La fonctionnalité "${feature}" est réservée au plan Pro.`
              : 'Vous avez atteint la limite du plan Gratuit.'}
          </p>
          <ul className="text-sm space-y-1.5">
            <li className="flex items-center gap-2"><span className="text-primary">✓</span> Clients illimités</li>
            <li className="flex items-center gap-2"><span className="text-primary">✓</span> Factures & devis illimités</li>
            <li className="flex items-center gap-2"><span className="text-primary">✓</span> Export PDF</li>
            <li className="flex items-center gap-2"><span className="text-primary">✓</span> Dashboard complet</li>
            <li className="flex items-center gap-2"><span className="text-primary">✓</span> Catégories illimitées</li>
          </ul>
        </div>
        <DialogFooter>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors">
            Plus tard
          </button>
          <button
            onClick={() => { onClose(); navigate('/abonnement'); }}
            className="px-4 py-2 text-sm rounded-lg gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Voir les plans
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
