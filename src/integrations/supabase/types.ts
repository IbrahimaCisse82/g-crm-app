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
      categories: {
        Row: {
          created_at: string
          id: string
          nom: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nom: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
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
          email: string | null
          entreprise: string | null
          id: string
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
          email?: string | null
          entreprise?: string | null
          id?: string
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
          email?: string | null
          entreprise?: string | null
          id?: string
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
      entreprises: {
        Row: {
          adresse: string | null
          created_at: string
          devise: string
          email: string | null
          id: string
          logo_url: string | null
          ninea: string | null
          nom: string
          rccm: string | null
          slogan: string | null
          telephone: string | null
          tva: number
          updated_at: string
          user_id: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          devise?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          ninea?: string | null
          nom?: string
          rccm?: string | null
          slogan?: string | null
          telephone?: string | null
          tva?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          devise?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          ninea?: string | null
          nom?: string
          rccm?: string | null
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
          created_at: string
          date_echeance: string | null
          date_facture: string
          id: string
          mode_paiement: string | null
          montant_ht: number
          montant_regle: number
          montant_ttc: number
          montant_tva: number
          notes: string | null
          numero: string
          statut: string
          updated_at: string
          user_id: string
        }
        Insert: {
          articles?: Json
          client_id?: string | null
          compte_mm?: string | null
          created_at?: string
          date_echeance?: string | null
          date_facture?: string
          id?: string
          mode_paiement?: string | null
          montant_ht?: number
          montant_regle?: number
          montant_ttc?: number
          montant_tva?: number
          notes?: string | null
          numero: string
          statut?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          articles?: Json
          client_id?: string | null
          compte_mm?: string | null
          created_at?: string
          date_echeance?: string | null
          date_facture?: string
          id?: string
          mode_paiement?: string | null
          montant_ht?: number
          montant_regle?: number
          montant_ttc?: number
          montant_tva?: number
          notes?: string | null
          numero?: string
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
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner: { Args: { row_user_id: string }; Returns: boolean }
      next_devis_numero: { Args: never; Returns: string }
      next_facture_numero: { Args: never; Returns: string }
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
