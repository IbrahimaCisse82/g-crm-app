export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      avoirs: {
        Row: {
          articles: Json
          client_id: string | null
          created_at: string
          date_avoir: string
          facture_id: string | null
          id: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          motif: string | null
          notes: string | null
          numero: string
          updated_at: string
          user_id: string
        }
        Insert: {
          articles?: Json
          client_id?: string | null
          created_at?: string
          date_avoir?: string
          facture_id?: string | null
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          motif?: string | null
          notes?: string | null
          numero: string
          updated_at?: string
          user_id: string
        }
        Update: {
          articles?: Json
          client_id?: string | null
          created_at?: string
          date_avoir?: string
          facture_id?: string | null
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          motif?: string | null
          notes?: string | null
          numero?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avoirs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avoirs_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          nom: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          nom: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          nom?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          adresse: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          entreprise: string | null
          id: string
          ninea: string | null
          nom: string
          notes: string | null
          prenom: string
          statut: string
          telephone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          entreprise?: string | null
          id?: string
          ninea?: string | null
          nom?: string
          notes?: string | null
          prenom?: string
          statut?: string
          telephone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          entreprise?: string | null
          id?: string
          ninea?: string | null
          nom?: string
          notes?: string | null
          prenom?: string
          statut?: string
          telephone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comptes_tresorerie: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          numero: string
          operateur: string
          solde: number
          titulaire: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          numero?: string
          operateur: string
          solde?: number
          titulaire?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          numero?: string
          operateur?: string
          solde?: number
          titulaire?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      devis: {
        Row: {
          articles: Json
          client_id: string | null
          created_at: string
          date_devis: string
          deleted_at: string | null
          id: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          notes: string | null
          numero: string
          statut: string
          updated_at: string
          user_id: string
          validite_jours: number
        }
        Insert: {
          articles?: Json
          client_id?: string | null
          created_at?: string
          date_devis?: string
          deleted_at?: string | null
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          notes?: string | null
          numero: string
          statut?: string
          updated_at?: string
          user_id: string
          validite_jours?: number
        }
        Update: {
          articles?: Json
          client_id?: string | null
          created_at?: string
          date_devis?: string
          deleted_at?: string | null
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          notes?: string | null
          numero?: string
          statut?: string
          updated_at?: string
          user_id?: string
          validite_jours?: number
        }
        Relationships: [
          {
            foreignKeyName: "devis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      document_counters: {
        Row: {
          doc_type: string
          last_value: number
          user_id: string
          year: number
        }
        Insert: {
          doc_type: string
          last_value?: number
          user_id: string
          year: number
        }
        Update: {
          doc_type?: string
          last_value?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      entreprises: {
        Row: {
          adresse: string | null
          conditions_paiement_defaut: string | null
          created_at: string
          devise: string
          email: string | null
          id: string
          logo_url: string | null
          ninea: string | null
          nom: string
          penalites_retard_defaut: string | null
          rccm: string | null
          regime_fiscal: string | null
          slogan: string | null
          telephone: string | null
          tva: number
          updated_at: string
          user_id: string
        }
        Insert: {
          adresse?: string | null
          conditions_paiement_defaut?: string | null
          created_at?: string
          devise?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          ninea?: string | null
          nom?: string
          penalites_retard_defaut?: string | null
          rccm?: string | null
          regime_fiscal?: string | null
          slogan?: string | null
          telephone?: string | null
          tva?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          adresse?: string | null
          conditions_paiement_defaut?: string | null
          created_at?: string
          devise?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          ninea?: string | null
          nom?: string
          penalites_retard_defaut?: string | null
          rccm?: string | null
          regime_fiscal?: string | null
          slogan?: string | null
          telephone?: string | null
          tva?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      factures: {
        Row: {
          articles: Json
          client_id: string | null
          compte_mm: string | null
          conditions_paiement: string | null
          created_at: string
          date_echeance: string | null
          date_facture: string
          date_livraison: string | null
          deleted_at: string | null
          id: string
          mode_paiement: string | null
          montant_ht: number
          montant_regle: number
          montant_retenue: number
          montant_ttc: number
          montant_tva: number
          net_a_payer: number | null
          notes: string | null
          numero: string
          penalites_retard: string | null
          retenue_source_pct: number
          statut: string
          updated_at: string
          user_id: string
        }
        Insert: {
          articles?: Json
          client_id?: string | null
          compte_mm?: string | null
          conditions_paiement?: string | null
          created_at?: string
          date_echeance?: string | null
          date_facture?: string
          date_livraison?: string | null
          deleted_at?: string | null
          id?: string
          mode_paiement?: string | null
          montant_ht?: number
          montant_regle?: number
          montant_retenue?: number
          montant_ttc?: number
          montant_tva?: number
          net_a_payer?: number | null
          notes?: string | null
          numero: string
          penalites_retard?: string | null
          retenue_source_pct?: number
          statut?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          articles?: Json
          client_id?: string | null
          compte_mm?: string | null
          conditions_paiement?: string | null
          created_at?: string
          date_echeance?: string | null
          date_facture?: string
          date_livraison?: string | null
          deleted_at?: string | null
          id?: string
          mode_paiement?: string | null
          montant_ht?: number
          montant_regle?: number
          montant_retenue?: number
          montant_ttc?: number
          montant_tva?: number
          net_a_payer?: number | null
          notes?: string | null
          numero?: string
          penalites_retard?: string | null
          retenue_source_pct?: number
          statut?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "factures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      journal: {
        Row: {
          categorie: string | null
          compte: string | null
          created_at: string
          date_operation: string
          deleted_at: string | null
          facture_id: string | null
          id: string
          libelle: string
          mode_paiement: string | null
          montant: number
          type: string
          user_id: string
        }
        Insert: {
          categorie?: string | null
          compte?: string | null
          created_at?: string
          date_operation?: string
          deleted_at?: string | null
          facture_id?: string | null
          id?: string
          libelle: string
          mode_paiement?: string | null
          montant?: number
          type: string
          user_id: string
        }
        Update: {
          categorie?: string | null
          compte?: string | null
          created_at?: string
          date_operation?: string
          deleted_at?: string | null
          facture_id?: string | null
          id?: string
          libelle?: string
          mode_paiement?: string | null
          montant?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      produits: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          nom: string
          prix: number
          type: string | null
          unite: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          nom: string
          prix?: number
          type?: string | null
          unite?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          nom?: string
          prix?: number
          type?: string | null
          unite?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string
          full_name: string
          id: string
          onboarding_completed: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recus: {
        Row: {
          client_id: string | null
          created_at: string
          date_recu: string
          description: string | null
          facture_id: string | null
          id: string
          mode_paiement: string
          montant: number
          notes: string | null
          numero: string
          reference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date_recu?: string
          description?: string | null
          facture_id?: string | null
          id?: string
          mode_paiement?: string
          montant?: number
          notes?: string | null
          numero: string
          reference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date_recu?: string
          description?: string | null
          facture_id?: string | null
          id?: string
          mode_paiement?: string
          montant?: number
          notes?: string | null
          numero?: string
          reference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recus_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recus_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          payment_mode: string
          payment_reference: string
          plan: string
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_mode: string
          payment_reference: string
          plan?: string
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_mode?: string
          payment_reference?: string
          plan?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number | null
          created_at: string
          expires_at: string | null
          id: string
          payment_mode: string | null
          payment_reference: string | null
          plan: string
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_mode?: string | null
          payment_reference?: string | null
          plan?: string
          starts_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_mode?: string | null
          payment_reference?: string | null
          plan?: string
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          expires_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          challenge: string
          created_at?: string
          expires_at?: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_label: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string | null
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string | null
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          banned_until: string
          created_at: string
          email: string
          full_name: string
          is_admin: boolean
          phone: string
          user_id: string
        }[]
      }
      get_user_plan: { Args: { _user: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner: { Args: { row_user_id: string }; Returns: boolean }
      list_archived: {
        Args: never
        Returns: {
          deleted_at: string
          id: string
          label: string
          sublabel: string
          table_name: string
        }[]
      }
      next_avoir_numero: { Args: never; Returns: string }
      next_devis_numero: { Args: never; Returns: string }
      next_doc_numero: {
        Args: { _doc_type: string; _prefix: string }
        Returns: string
      }
      next_facture_numero: { Args: never; Returns: string }
      next_recu_numero: { Args: never; Returns: string }
      purge_archived: {
        Args: { _id: string; _table: string }
        Returns: undefined
      }
      restore_archived: {
        Args: { _id: string; _table: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
