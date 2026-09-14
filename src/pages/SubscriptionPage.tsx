import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Crown, Check, Clock, Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatDate';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';



const PAYMENT_ACCOUNTS = [
  { mode: 'Wave', number: '77 000 00 00' },
  { mode: 'Orange Money', number: '78 000 00 00' },
  { mode: 'Yas Money', number: '76 000 00 00' },
];

export default function SubscriptionPage() {
  const { subscription, fmt } = useApp();
  const { plan, limits, daysRemaining, isExpired, requests, submitRequest, requestsLoading, isPromo, promoEnd, proMonthlyPrice } = subscription;
  const PRICE_PRO = proMonthlyPrice;

  const [showPayment, setShowPayment] = useState(false);
  const [payForm, setPayForm] = useState({ payment_mode: 'Wave', payment_reference: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!payForm.payment_reference.trim()) {
      toast.error('Veuillez entrer la référence de transaction');
      return;
    }
    setSaving(true);
    try {
      await submitRequest({
        payment_mode: payForm.payment_mode,
        payment_reference: payForm.payment_reference.trim(),
        amount: PRICE_PRO,
      });
      toast.success('Demande envoyée ! Nous la validerons sous 24h.');
      setShowPayment(false);
      setPayForm({ payment_mode: 'Wave', payment_reference: '' });
    } catch {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSaving(false);
    }
  };

  const pendingRequest = requests.find(r => r.status === 'pending');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {isPromo && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Offre de lancement : tout est gratuit</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Toutes les fonctionnalités Pro (documents illimités, export PDF, tableau de bord complet)
              sont offertes à tous les comptes jusqu'au <strong className="text-foreground">{formatDate(promoEnd.toISOString())}</strong>.
              Aucun paiement n'est requis pendant cette période.
            </p>
          </div>
        </div>
      )}

      {/* Current plan banner */}
      <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${plan === 'pro' ? 'gradient-primary' : 'bg-muted'}`}>
          <Crown className={`w-6 h-6 ${plan === 'pro' ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1">
          <div className="font-bold text-foreground">
            Plan {plan === 'pro' ? 'Pro' : 'Gratuit'}
            {plan === 'pro' && !isExpired && (
              <span className="ml-2 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Actif</span>
            )}
            {isExpired && (
              <span className="ml-2 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">Expiré</span>
            )}
          </div>
          {plan === 'pro' && daysRemaining > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">{daysRemaining} jours restants</p>
          )}
          {plan === 'free' && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {isPromo ? 'Accès complet offert pendant l\'offre de lancement' : 'Fonctionnalités limitées'}
            </p>
          )}
        </div>
      </div>

      {/* Plan comparison */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Free */}
        <div className={`rounded-2xl border p-5 space-y-4 ${plan === 'free' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
          <div>
            <h3 className="font-bold text-lg text-foreground">Gratuit</h3>
            <p className="text-2xl font-black text-foreground mt-1">0 <span className="text-sm font-normal text-muted-foreground">FCFA/mois</span></p>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 10 clients max</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 10 factures/mois</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 10 devis/mois</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 5 catégories</li>
            <li className="flex items-center gap-2 text-muted-foreground"><AlertCircle className="w-4 h-4" /> Pas d'export PDF</li>
            <li className="flex items-center gap-2 text-muted-foreground"><AlertCircle className="w-4 h-4" /> Dashboard basique</li>
          </ul>
          {plan === 'free' && (
            <div className="pt-2">
              <span className="text-xs font-semibold text-primary">Plan actuel</span>
            </div>
          )}
        </div>

        {/* Pro */}
        <div className={`rounded-2xl border p-5 space-y-4 ${plan === 'pro' && !isExpired ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
          <div>
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              Pro <Crown className="w-4 h-4 text-primary" />
            </h3>
            <p className="text-2xl font-black text-foreground mt-1">
              {new Intl.NumberFormat('fr-FR').format(PRICE_PRO)} <span className="text-sm font-normal text-muted-foreground">FCFA/mois</span>
            </p>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Clients illimités</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Factures illimitées</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Devis illimités</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Catégories illimitées</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Export PDF</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Dashboard complet</li>
          </ul>
          {isPromo ? (
            <div className="pt-2 rounded-xl bg-primary/10 p-3 text-xs font-semibold text-primary">
              Offert à tous jusqu'au {formatDate(promoEnd.toISOString())} — rien à payer pour l'instant.
            </div>
          ) : plan === 'pro' && !isExpired ? (
            <div className="pt-2">
              <span className="text-xs font-semibold text-primary">Plan actuel</span>
            </div>
          ) : (
            <div className="pt-2">
              {pendingRequest ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" /> Demande en cours de validation…
                </div>
              ) : (
                <button
                  onClick={() => setShowPayment(true)}
                  className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Passer à Pro
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment instructions */}
      {!isPromo && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" /> Comment payer
          </h3>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Envoyez <strong>{new Intl.NumberFormat('fr-FR').format(PRICE_PRO)} FCFA</strong> via Mobile Money à l'un des numéros ci-dessous</li>
            <li>Notez la <strong>référence de transaction</strong> reçue par SMS</li>
            <li>Cliquez sur « Passer à Pro » et entrez votre référence</li>
            <li>Votre abonnement sera activé sous <strong>24h</strong> après vérification</li>
          </ol>
          <div className="grid sm:grid-cols-3 gap-3 pt-2">
            {PAYMENT_ACCOUNTS.map(acc => (
              <div key={acc.mode} className="rounded-xl bg-muted/50 p-3 text-center">
                <div className="text-xs font-bold text-foreground">{acc.mode}</div>
                <div className="text-sm font-mono text-primary mt-1">{acc.number}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request history */}
      {requests.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h3 className="font-bold text-foreground">Historique des demandes</h3>
          <div className="space-y-2">
            {requests.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 text-sm">
                <div>
                  <span className="font-medium text-foreground">{r.payment_mode}</span>
                  <span className="text-muted-foreground ml-2">Réf: {r.payment_reference}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    r.status === 'approved' ? 'bg-primary/10 text-primary' :
                    r.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {r.status === 'approved' ? 'Approuvé' : r.status === 'rejected' ? 'Rejeté' : 'En attente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Soumettre votre paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Mode de paiement</label>
              <select
                value={payForm.payment_mode}
                onChange={e => setPayForm(f => ({ ...f, payment_mode: e.target.value }))}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
              >
                {PAYMENT_ACCOUNTS.map(a => (
                  <option key={a.mode} value={a.mode}>{a.mode} — {a.number}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Référence de transaction</label>
              <input
                value={payForm.payment_reference}
                onChange={e => setPayForm(f => ({ ...f, payment_reference: e.target.value }))}
                placeholder="Ex: TXN-123456789"
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Montant : <strong className="text-foreground">{new Intl.NumberFormat('fr-FR').format(PRICE_PRO)} FCFA</strong> (1 mois)
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowPayment(false)} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground">
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg gradient-primary text-primary-foreground font-semibold disabled:opacity-50"
            >
              {saving ? 'Envoi…' : 'Envoyer la demande'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
