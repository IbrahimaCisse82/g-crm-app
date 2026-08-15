# Plan Lot 1 — Finalisation P0/P1 de G-CRM

## Objectif
Corriger les défauts critiques et bloquants identifiés dans l'audit du cahier des charges v2.0, en commençant par la cohérence SaaS, la conformité fiscale et la sécurité des données.

## Périmètre

### 1. Avoirs conformes et liés à une facture source (P1 — §3.8)
- Rendre `avoirs.facture_id` NOT NULL.
- Ajouter un trigger `BEFORE INSERT` qui vérifie que la facture source appartient bien à l'utilisateur et n'est pas déjà payée (sinon erreur explicite).
- Ajouter un trigger `AFTER INSERT` qui met à jour `factures.montant_regle`, `factures.statut` et crée une entrée de journal de type Dépense correspondant au montant de l'avoir.

### 2. Alignement des quotas Free à 10 (P1 — §4 / §13)
- Mettre à jour les limites côté frontend (`useSubscription.ts`) : 10 clients, 10 factures/mois, 10 devis/mois.
- Mettre à jour les triggers SQL correspondants (`trg_limit_clients`, `trg_limit_factures`, `trg_limit_devis`) pour appliquer 10 au lieu de 5.

### 3. Processus d'abonnement Mobile Money professionnalisé (P1 — §4.3)
- Ajouter `admin_deadline` (timestamp) à `subscription_requests`, calculé à `created_at + 24 heures`.
- Rendre `admin_notes` obligatoire lors du rejet dans l'Edge Function `manage-subscription`.
- Afficher les demandes en retard (> 24h) en rouge dans `AdminPage`.
- Préparer les hooks d'envoi d'e-mail (déclenchés quand un domaine d'envoi sera configuré).

### 4. Journal d'audit admin (P1 — §5)
- Étendre la fonction `audit_trigger` ou créer une fonction `audit_admin_action` pour enregistrer les actions `approve`, `reject`, `revoke` de `manage-subscription` dans `audit_log`.

### 5. Tarifs Pro éditables depuis le backoffice (P1 — §16)
- Créer une table `plan_pricing` (plan, billing_period, price_fcfa, updated_at).
- Lire ces tarifs dynamiquement dans `SubscriptionPage.tsx` au lieu de la constante `PRICE_PRO`.
- Ajouter une section "Tarifs" dans `AdminPage` pour les modifier.

### 6. Fallback PDF serveur (P0 — §3.10)
- Créer l'Edge Function `generate-pdf-server` utilisant Puppeteer (ou un rendu HTML→PDF Deno) pour générer le PDF côté serveur.
- Modifier `PdfPreview.tsx` / `generatePdf.ts` pour détecter l'échec ou le timeout > 8s et proposer le bouton "Générer côté serveur".

### 7. Colonne `created_by` sur les tables métier (P1 — règle V1)
- Ajouter `created_by uuid` (nullable pour rétro-compatibilité, rempli automatiquement par `auth.uid()` via trigger) sur `factures`, `devis`, `journal`, `recus`, `avoirs`, `clients`, `produits`, `categories`.

### 8. Première vague de tests (P0 — §7.3)
- Créer des tests Vitest pour :
  - `usePayment` (encaissement total/partiel, mise à jour journal/facture).
  - Calculs facture (HT, TVA, BRS, net à payer).
  - RLS cross-user (simulation de deux sessions distinctes sur `clients` et `factures`).

## Non inclus dans ce lot
- Relances automatiques (cron), import CSV/XLSX, partage WhatsApp, suppression de compte, pagination keyset, React.lazy, notifications e-mail transactionnelles (en attente de domaine).

## Validation
- Build TypeScript sans erreur.
- Suite de tests Vitest passante.
- Test d'isolation RLS entre deux comptes.
