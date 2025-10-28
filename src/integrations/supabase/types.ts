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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_at_time: number
          quantity: number
          ration_item_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_at_time: number
          quantity: number
          ration_item_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_at_time?: number
          quantity?: number
          ration_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_ration_item_id_fkey"
            columns: ["ration_item_id"]
            isOneToOne: false
            referencedRelation: "ration_items"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          delivered_at: string | null
          delivery_address: string
          id: string
          qr_code: string | null
          qr_expires_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          delivered_at?: string | null
          delivery_address: string
          id?: string
          qr_code?: string | null
          qr_expires_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          delivered_at?: string | null
          delivery_address?: string
          id?: string
          qr_code?: string | null
          qr_expires_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aadhaar_number: string | null
          address: string | null
          created_at: string
          full_name: string | null
          id: string
          mobile_number: string | null
          ration_card_number: string | null
          ration_card_type: Database["public"]["Enums"]["ration_card_type"] | null
          household_members: number | null
          verification_status: Database["public"]["Enums"]["verification_status"] | null
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
          aadhaar_document_url: string | null
          ration_card_document_url: string | null
          government_id: string | null
          card_issue_date: string | null
          card_expiry_date: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          aadhaar_number?: string | null
          address?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          mobile_number?: string | null
          ration_card_number?: string | null
          ration_card_type?: Database["public"]["Enums"]["ration_card_type"] | null
          household_members?: number | null
          verification_status?: Database["public"]["Enums"]["verification_status"] | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          aadhaar_document_url?: string | null
          ration_card_document_url?: string | null
          government_id?: string | null
          card_issue_date?: string | null
          card_expiry_date?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          aadhaar_number?: string | null
          address?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          mobile_number?: string | null
          ration_card_number?: string | null
          ration_card_type?: Database["public"]["Enums"]["ration_card_type"] | null
          household_members?: number | null
          verification_status?: Database["public"]["Enums"]["verification_status"] | null
          verified_at?: string | null
          verified_by?: string | null
          aadhaar_document_url?: string | null
          ration_card_document_url?: string | null
          government_id?: string | null
          card_issue_date?: string | null
          card_expiry_date?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ration_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          price_per_kg: number
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          price_per_kg: number
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          price_per_kg?: number
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status:
        | "pending"
        | "approved"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
      user_role: "customer" | "delivery_partner" | "admin"
      ration_card_type: "yellow" | "pink" | "blue" | "white"
      verification_status: "pending" | "verified" | "rejected" | "expired"
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
      order_status: [
        "pending",
        "approved",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      user_role: ["customer", "delivery_partner", "admin"],
      ration_card_type: ["yellow", "pink", "blue", "white"],
      verification_status: ["pending", "verified", "rejected", "expired"],
    },
  },
} as const
