

# Plan: Catégories personnalisables + Améliorations globales

## Contexte
Les catégories de dépenses sont actuellement codées en dur dans `src/types/index.ts` (`JOURNAL_CATEGORIES`). L'utilisateur veut pouvoir les gérer dynamiquement comme les produits/services.

## 1. Catégories personnalisables (priorité principale)

### Base de données
- Créer une table `categories` avec : `id`, `user_id`, `nom`, `type` (Dépense/Recette), `created_at`
- RLS avec `is_owner(user_id)`
- Migration pour insérer les catégories par défaut existantes via un trigger `handle_new_user`

### Code
- Ajouter `useCategories()` dans `useSupabaseData.ts` (CRUD standard)
- Exposer dans `AppContext`
- Modifier `JournalPage.tsx` : remplacer le select hardcodé par les catégories dynamiques de la DB + bouton "+" pour en ajouter une nouvelle à la volée
- Conserver les catégories par défaut comme seed pour les nouveaux utilisateurs

## 2. Améliorations techniques identifiées

### A. Produits : ajouter filtre par type (Service/Produit)
- Ajouter des onglets de filtre dans `ProductsPage.tsx` pour filtrer par type
- Le champ "Type" n'est pas visible dans le formulaire de création → l'ajouter

### B. Dashboard : top catégories de dépenses
- Ajouter un graphique pie des dépenses par catégorie dans le Dashboard

### C. Robustesse du formulaire Journal
- Validation Zod sur le formulaire de transaction (montant > 0, libellé requis)
- Empêcher double-submit avec état `saving`

### D. UX : bouton loading state
- Ajouter un état `saving` avec spinner sur les boutons d'enregistrement dans JournalPage (déjà fait dans InvoicesPage mais pas dans Journal)

## Fichiers impactés
- `supabase/migrations/` — nouvelle migration pour table `categories`
- `src/hooks/useSupabaseData.ts` — ajouter `useCategories()`
- `src/context/AppContext.tsx` — exposer `categories`
- `src/pages/JournalPage.tsx` — catégories dynamiques + état saving
- `src/pages/ProductsPage.tsx` — filtre par type + champ type dans formulaire
- `src/pages/Dashboard.tsx` — graphique dépenses par catégorie
- `src/types/index.ts` — garder `JOURNAL_CATEGORIES` comme fallback/seed

