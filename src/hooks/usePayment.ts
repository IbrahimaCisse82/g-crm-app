import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

interface PaymentParams {
  factureId: string;
  amount: number;
  mode_paiement: string;
  date_operation?: string;
}

export function usePayment() {
  const { factures, journal } = useApp();

  const submitPayment = async ({ factureId, amount, mode_paiement, date_operation }: PaymentParams) => {
    const inv = factures.data.find(f => f.id === factureId);
    if (!inv) throw new Error('Facture introuvable');

    const reste = inv.montant_ttc - (inv.montant_regle || 0);
    if (!amount || amount <= 0) throw new Error('Montant invalide');
    if (amount > reste) throw new Error(`Le montant ne peut pas dépasser le reste dû`);

    const newRegle = (inv.montant_regle || 0) + amount;
    const isFullyPaid = newRegle >= inv.montant_ttc;

    // 1. Update invoice
    await factures.update(inv.id, {
      montant_regle: newRegle,
      statut: isFullyPaid ? 'Payée' : 'Partielle',
      mode_paiement,
    });

    // 2. Create journal entry
    await journal.add({
      libelle: `Paiement ${isFullyPaid ? 'total' : 'partiel'} facture ${inv.numero}`,
      type: 'Recette',
      montant: amount,
      mode_paiement,
      categorie: 'Vente',
      date_operation: date_operation || new Date().toISOString().slice(0, 10),
      facture_id: inv.id,
    });

    return { isFullyPaid, newRegle, numero: inv.numero };
  };

  return { submitPayment };
}
