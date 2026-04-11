
Plan: Analyse critique de la logique métier G-CRM

## 1. Architecture technique (excellente)
- Pattern React moderne avec hooks personnalisés bien structurés
- Separation of concerns: useSupabaseData pour la data layer, useApp pour le contexte métier
- React Query (TanStack Query) pour la cache intelligente et la synchronisation
- PWA avec inactivity lock (5min) → bonne prise en compte de la sécurité mobile

## 2. Logique métier (cohérente et africaine)

### Points forts:
- **Journal comptable simplifié** : Recette liée automatiquement à facture (brilliant), Dépense catégorisée
- **Calcul trésorerie en temps réel** : Caisse (Espèce) + Mobile Money (Wave/OM/Yas) + Banque
- **Statuts factures dynamiques** : "En retard" calculé automatiquement (date échéance < today)
- **Numérotation auto** : RPC next_facture_numero/next_devis_numero
- **Gestion multi-mode paiement** : Adapté à l'Afrique (Wave, Orange Money, Yas Money, Espèce)

### Faiblesses à corriger:

**A. Incohérence paiement**
- Dans InvoicesPage: paiement partiel créé via `journal.add()` + update facture
- Dans JournalPage: recette créée via `journal.add()` qui update aussi la facture
- Code dupliqué → risque de désynchronisation

**B. Suppression facture payée**
- Bloquée côté UI mais pas de protection RLS côté DB
- Journal reste orphelin si facture supprimée

**C. Vue comptable incohérente**
- Solde Mobile Money calculé: solde initial + entrées - sorties
- Mais pas de vérification cohérence avec journal
- Si écart entre journal et solde compte → pas d'alerte

**D. Pas de clôture période**
- Peut modifier transactions passées librement
- Pas d'archivage comptable (obligatoire légalement au Sénégal)

## 3. Sécurité & Data (correct mais perfectible)
- RLS policies sur toutes tables (bien)
- mais pas de soft delete (hard delete everywhere)
- Pas d'historisation des modifications

## 4. UX/UI mobile (très bon)
- Double vue mobile/desktop (cards vs table)
- Responsive charts Recharts
- Share natif mobile avec PDF A4
- Lock screen après 5min inactivité

## 5. Recommandations prioritaires

**Critique (à faire immédiatement):**
1. **Singleton workflow paiement** : Centraliser dans un edge function ou hook unique
2. **Soft delete** : Ajouter `deleted_at` sur toutes tables + filtre automatique
3. **Clôture mensuelle** : Bloquer modifications sur mois clôturé

**Important:**
4. **Reconciliation trésorerie** : Alertes si écart journal vs comptes
5. **Historisation** : Table `audit_logs` pour traçabilité

**Nice-to-have:**
6. **Pipeline ventes** : Kanban devis → facture
7. **Rappels automatiques** : Relances factures en retard
