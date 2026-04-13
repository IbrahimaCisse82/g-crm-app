

# Plan : SaaS avec abonnements Mobile Money (Gratuit + Pro)

## Principe
Gestion manuelle des abonnements : l'admin (vous) valide les paiements Mobile Money reçus et active/prolonge les abonnements. Côté utilisateur, le plan Gratuit est limité, le plan Pro débloque toutes les fonctionnalités.

## 1. Base de données

### Table `subscriptions`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | |
| user_id | uuid (unique) | Lien vers l'utilisateur |
| plan | text | `free` ou `pro` |
| status | text | `active`, `expired`, `cancelled` |
| starts_at | timestamptz | Début de l'abonnement |
| expires_at | timestamptz | Fin (null = gratuit permanent) |
| payment_reference | text | Référence du paiement MM |
| payment_mode | text | Wave/OM/Yas |
| amount | numeric | Montant payé |
| created_at / updated_at | timestamptz | |

- RLS : `is_owner(user_id)` pour SELECT, admin gère les mutations via edge function
- Trigger `handle_new_user` modifié pour créer un abonnement `free` par défaut

### Table `subscription_requests`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | |
| user_id | uuid | |
| plan | text | Plan demandé |
| payment_mode | text | Wave/OM/Yas |
| payment_reference | text | Référence transaction |
| amount | numeric | |
| status | text | `pending`, `approved`, `rejected` |
| created_at | timestamptz | |

- L'utilisateur soumet une demande d'abonnement avec sa preuve de paiement
- L'admin valide/rejette (via edge function sécurisée)

## 2. Limites du plan Gratuit

| Fonctionnalité | Gratuit | Pro |
|----------------|---------|-----|
| Clients | 10 max | Illimité |
| Factures/mois | 5 max | Illimité |
| Devis/mois | 5 max | Illimité |
| Export PDF | ❌ | ✅ |
| Dashboard analytics | Basique | Complet |
| Catégories personnalisées | 5 max | Illimité |

## 3. Code

### Hook `useSubscription`
- Récupère l'abonnement actif de l'utilisateur
- Expose `plan`, `isExpired`, `canAccess(feature)`, `daysRemaining`
- Vérifie les limites en temps réel

### Composant `SubscriptionPage` (nouvelle page `/abonnement`)
- Affiche le plan actuel et la date d'expiration
- Comparatif Gratuit vs Pro avec prix
- Formulaire de demande d'upgrade : choix du mode de paiement, référence transaction
- Numéro de compte Mobile Money à payer affiché clairement
- Historique des paiements

### Composant `UpgradePrompt`
- Banner/modal affiché quand l'utilisateur atteint une limite
- "Passez à Pro pour débloquer cette fonctionnalité"

### Edge function `manage-subscription`
- Endpoint sécurisé pour valider/rejeter les demandes (protégé par rôle admin)
- Met à jour `subscriptions` quand une demande est approuvée

### Modifications existantes
- `AppContext` : exposer `subscription` et `canAccess`
- `AppLayout` : badge du plan dans la sidebar
- Pages (Clients, Factures, Devis, Journal) : vérifier les limites avant création
- `AppSidebar` : lien vers la page Abonnement

## 4. Flux utilisateur

```text
Inscription → Plan Gratuit auto
     ↓
Utilise l'app (limites appliquées)
     ↓
Atteint une limite → "Passez à Pro"
     ↓
Va sur /abonnement → Voit le prix + numéro MM
     ↓
Paie via Wave/OM → Note la référence
     ↓
Soumet la demande avec référence
     ↓
Admin valide → Plan Pro activé (30j)
     ↓
Expiration → Retour limites Gratuit
```

## 5. Fichiers impactés
- `supabase/migrations/` — tables `subscriptions` + `subscription_requests`
- `src/hooks/useSubscription.ts` — nouveau hook
- `src/pages/SubscriptionPage.tsx` — nouvelle page
- `src/components/UpgradePrompt.tsx` — nouveau composant
- `supabase/functions/manage-subscription/index.ts` — edge function admin
- `src/context/AppContext.tsx` — exposer subscription
- `src/App.tsx` — route `/abonnement`
- `src/components/layout/AppSidebar.tsx` — lien abonnement
- Pages existantes — guards de limites

