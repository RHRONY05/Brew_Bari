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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name_bn: string | null
          name_en: string
          restaurant_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name_bn?: string | null
          name_en: string
          restaurant_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name_bn?: string | null
          name_en?: string
          restaurant_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          restaurant_id: string
          session_id: string | null
          table_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          restaurant_id: string
          session_id?: string | null
          table_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          restaurant_id?: string
          session_id?: string | null
          table_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string
          compare_at_price: number | null
          created_at: string
          description_bn: string | null
          description_en: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_available: boolean
          name_bn: string | null
          name_en: string
          options: Json
          prep_minutes: number | null
          price: number
          restaurant_id: string
          sort_order: number
          tags: string[]
          updated_at: string
        }
        Insert: {
          category_id: string
          compare_at_price?: number | null
          created_at?: string
          description_bn?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available?: boolean
          name_bn?: string | null
          name_en: string
          options?: Json
          prep_minutes?: number | null
          price: number
          restaurant_id: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Update: {
          category_id?: string
          compare_at_price?: number | null
          created_at?: string
          description_bn?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available?: boolean
          name_bn?: string | null
          name_en?: string
          options?: Json
          prep_minutes?: number | null
          price?: number
          restaurant_id?: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          badge_bn: string | null
          badge_en: string | null
          category_id: string | null
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          menu_item_id: string | null
          restaurant_id: string
          sort_order: number
          starts_at: string | null
          subtitle_bn: string | null
          subtitle_en: string | null
          title_bn: string | null
          title_en: string
          updated_at: string
        }
        Insert: {
          badge_bn?: string | null
          badge_en?: string | null
          category_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          menu_item_id?: string | null
          restaurant_id: string
          sort_order?: number
          starts_at?: string | null
          subtitle_bn?: string | null
          subtitle_en?: string | null
          title_bn?: string | null
          title_en: string
          updated_at?: string
        }
        Update: {
          badge_bn?: string | null
          badge_en?: string | null
          category_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          menu_item_id?: string | null
          restaurant_id?: string
          sort_order?: number
          starts_at?: string | null
          subtitle_bn?: string | null
          subtitle_en?: string | null
          title_bn?: string | null
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      request_items: {
        Row: {
          id: string
          line_total: number
          menu_item_id: string | null
          name_bn: string | null
          name_en: string
          note: string | null
          options: Json
          quantity: number
          request_id: string
          unit_price: number
        }
        Insert: {
          id?: string
          line_total: number
          menu_item_id?: string | null
          name_bn?: string | null
          name_en: string
          note?: string | null
          options?: Json
          quantity: number
          request_id: string
          unit_price: number
        }
        Update: {
          id?: string
          line_total?: number
          menu_item_id?: string | null
          name_bn?: string | null
          name_en?: string
          note?: string | null
          options?: Json
          quantity?: number
          request_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "request_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          cover_url: string | null
          created_at: string
          facebook_url: string | null
          google_maps_url: string | null
          google_review_url: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          name_bn: string | null
          name_en: string
          opening_hours_bn: string | null
          opening_hours_en: string | null
          package: number
          phone: string | null
          require_session_approval: boolean
          service_charge_percent: number
          slug: string
          tagline_bn: string | null
          tagline_en: string | null
          updated_at: string
          vat_percent: number
          wifi_name: string | null
          wifi_password: string | null
        }
        Insert: {
          address?: string | null
          cover_url?: string | null
          created_at?: string
          facebook_url?: string | null
          google_maps_url?: string | null
          google_review_url?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          name_bn?: string | null
          name_en: string
          opening_hours_bn?: string | null
          opening_hours_en?: string | null
          package?: number
          phone?: string | null
          require_session_approval?: boolean
          service_charge_percent?: number
          slug: string
          tagline_bn?: string | null
          tagline_en?: string | null
          updated_at?: string
          vat_percent?: number
          wifi_name?: string | null
          wifi_password?: string | null
        }
        Update: {
          address?: string | null
          cover_url?: string | null
          created_at?: string
          facebook_url?: string | null
          google_maps_url?: string | null
          google_review_url?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          name_bn?: string | null
          name_en?: string
          opening_hours_bn?: string | null
          opening_hours_en?: string | null
          package?: number
          phone?: string | null
          require_session_approval?: boolean
          service_charge_percent?: number
          slug?: string
          tagline_bn?: string | null
          tagline_en?: string | null
          updated_at?: string
          vat_percent?: number
          wifi_name?: string | null
          wifi_password?: string | null
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          device_id: string | null
          done_at: string | null
          handled_by: string | null
          id: string
          note: string | null
          nudge_count: number
          restaurant_id: string
          session_id: string
          status: Database["public"]["Enums"]["request_status"]
          subtotal: number
          table_id: string
          type: Database["public"]["Enums"]["request_type"]
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          device_id?: string | null
          done_at?: string | null
          handled_by?: string | null
          id?: string
          note?: string | null
          nudge_count?: number
          restaurant_id: string
          session_id: string
          status?: Database["public"]["Enums"]["request_status"]
          subtotal?: number
          table_id: string
          type: Database["public"]["Enums"]["request_type"]
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          device_id?: string | null
          done_at?: string | null
          handled_by?: string | null
          id?: string
          note?: string | null
          nudge_count?: number
          restaurant_id?: string
          session_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          subtotal?: number
          table_id?: string
          type?: Database["public"]["Enums"]["request_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          display_name: string | null
          restaurant_id: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          restaurant_id: string
          role?: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          restaurant_id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      table_sessions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          closed_at: string | null
          closed_by: string | null
          id: string
          opened_at: string
          restaurant_id: string
          status: Database["public"]["Enums"]["session_status"]
          table_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          id?: string
          opened_at?: string
          restaurant_id: string
          status?: Database["public"]["Enums"]["session_status"]
          table_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          id?: string
          opened_at?: string
          restaurant_id?: string
          status?: Database["public"]["Enums"]["session_status"]
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string | null
          number: number
          qr_token: string
          restaurant_id: string
          seats: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          number: number
          qr_token?: string
          restaurant_id: string
          seats?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          number?: number
          qr_token?: string
          restaurant_id?: string
          seats?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _check_rate: { Args: { p_session_id: string }; Returns: undefined }
      _create_request: {
        Args: {
          p_ctx_restaurant: string
          p_device: string
          p_items: Json
          p_note: string
          p_session: string
          p_table: string
          p_type: Database["public"]["Enums"]["request_type"]
        }
        Returns: string
      }
      _ensure_session: {
        Args: { p_table_id: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          closed_at: string | null
          closed_by: string | null
          id: string
          opened_at: string
          restaurant_id: string
          status: Database["public"]["Enums"]["session_status"]
          table_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "table_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      _session_json: { Args: { p_session_id: string }; Returns: Json }
      _table_ctx: {
        Args: { p_token: string }
        Returns: {
          package: number
          restaurant_id: string
          session_id: string
          session_status: Database["public"]["Enums"]["session_status"]
          table_id: string
          table_number: number
        }[]
      }
      call_waiter: {
        Args: {
          p_device_id: string
          p_items?: Json
          p_note?: string
          p_token: string
        }
        Returns: Json
      }
      get_bill: { Args: { p_token: string }; Returns: Json }
      get_session_status: {
        Args: { p_session_id: string; p_token: string }
        Returns: Json
      }
      get_table_context: { Args: { p_token: string }; Returns: Json }
      is_admin: { Args: { rid: string }; Returns: boolean }
      is_staff: { Args: { rid: string }; Returns: boolean }
      my_restaurant_id: { Args: never; Returns: string }
      place_order: {
        Args: {
          p_device_id: string
          p_items: Json
          p_note?: string
          p_token: string
        }
        Returns: Json
      }
      price_cart: {
        Args: { p_items: Json; p_restaurant_id: string }
        Returns: {
          line_total: number
          menu_item_id: string
          name_bn: string
          name_en: string
          note: string
          options: Json
          quantity: number
          unit_price: number
        }[]
      }
      request_bill: {
        Args: { p_device_id: string; p_token: string }
        Returns: Json
      }
      submit_feedback: {
        Args: { p_comment?: string; p_rating: number; p_token: string }
        Returns: Json
      }
    }
    Enums: {
      request_status:
        | "new"
        | "acknowledged"
        | "preparing"
        | "ready"
        | "done"
        | "cancelled"
      request_type: "call_waiter" | "order" | "bill"
      session_status: "pending" | "open" | "closed"
      staff_role: "admin" | "counter"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      request_status: [
        "new",
        "acknowledged",
        "preparing",
        "ready",
        "done",
        "cancelled",
      ],
      request_type: ["call_waiter", "order", "bill"],
      session_status: ["pending", "open", "closed"],
      staff_role: ["admin", "counter"],
    },
  },
} as const
