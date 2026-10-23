export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      area_counters: {
        Row: {
          area_id: string
          last_seq: number
        }
        Insert: {
          area_id: string
          last_seq?: number
        }
        Update: {
          area_id?: string
          last_seq?: number
        }
        Relationships: [
          {
            foreignKeyName: "area_counters_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: true
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          color: string
          created_at: string
          id: string
          is_private: boolean
          name: string
          owner_id: string
          prefix: string
          slug: string
          well_being: string | null
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          is_private?: boolean
          name: string
          owner_id?: string
          prefix: string
          slug: string
          well_being?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_private?: boolean
          name?: string
          owner_id?: string
          prefix?: string
          slug?: string
          well_being?: string | null
        }
        Relationships: []
      }
      item_events: {
        Row: {
          actor: string
          after: Json | null
          at: string
          before: Json | null
          field: string
          id: number
          item_id: string
          note: string | null
          owner_id: string
          session_ref: string | null
        }
        Insert: {
          actor: string
          after?: Json | null
          at?: string
          before?: Json | null
          field: string
          id?: number
          item_id: string
          note?: string | null
          owner_id?: string
          session_ref?: string | null
        }
        Update: {
          actor?: string
          after?: Json | null
          at?: string
          before?: Json | null
          field?: string
          id?: number
          item_id?: string
          note?: string | null
          owner_id?: string
          session_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_events_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_events_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v_items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_links: {
        Row: {
          context: string | null
          created_at: string
          created_by: string
          from_id: string
          id: string
          kind: string
          owner_id: string
          to_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          created_by?: string
          from_id: string
          id?: string
          kind: string
          owner_id?: string
          to_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          created_by?: string
          from_id?: string
          id?: string
          kind?: string
          owner_id?: string
          to_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_links_from_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_links_from_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "v_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_links_to_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_links_to_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "v_items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          area_id: string | null
          body: string | null
          created_at: string
          created_by: string
          done_at: string | null
          due_at: string | null
          duration_min: number | null
          evening: boolean
          external_ref: string | null
          focus_on: string | null
          id: string
          importance: number | null
          kind: string
          origin_item_id: string | null
          origin_source_id: string | null
          owner_id: string
          parent_id: string | null
          repeat_rule: string | null
          seq: number | null
          short_id: string | null
          start_at: string | null
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          area_id?: string | null
          body?: string | null
          created_at?: string
          created_by?: string
          done_at?: string | null
          due_at?: string | null
          duration_min?: number | null
          evening?: boolean
          external_ref?: string | null
          focus_on?: string | null
          id?: string
          importance?: number | null
          kind?: string
          origin_item_id?: string | null
          origin_source_id?: string | null
          owner_id?: string
          parent_id?: string | null
          repeat_rule?: string | null
          seq?: number | null
          short_id?: string | null
          start_at?: string | null
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          area_id?: string | null
          body?: string | null
          created_at?: string
          created_by?: string
          done_at?: string | null
          due_at?: string | null
          duration_min?: number | null
          evening?: boolean
          external_ref?: string | null
          focus_on?: string | null
          id?: string
          importance?: number | null
          kind?: string
          origin_item_id?: string | null
          origin_source_id?: string | null
          owner_id?: string
          parent_id?: string | null
          repeat_rule?: string | null
          seq?: number | null
          short_id?: string | null
          start_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "items_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_origin_item_id_fkey"
            columns: ["origin_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_origin_item_id_fkey"
            columns: ["origin_item_id"]
            isOneToOne: false
            referencedRelation: "v_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_origin_source_id_fkey"
            columns: ["origin_source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          created_at: string
          happened_at: string | null
          id: string
          kind: string
          label: string | null
          owner_id: string
          ref: string | null
        }
        Insert: {
          created_at?: string
          happened_at?: string | null
          id?: string
          kind: string
          label?: string | null
          owner_id?: string
          ref?: string | null
        }
        Update: {
          created_at?: string
          happened_at?: string | null
          id?: string
          kind?: string
          label?: string | null
          owner_id?: string
          ref?: string | null
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          created_at: string
          created_by: string
          decided_at: string | null
          decision_note: string | null
          evidence: string | null
          id: string
          item_id: string | null
          kind: string
          owner_id: string
          payload: Json | null
          reason: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          decided_at?: string | null
          decision_note?: string | null
          evidence?: string | null
          id?: string
          item_id?: string | null
          kind: string
          owner_id?: string
          payload?: Json | null
          reason?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          decided_at?: string | null
          decision_note?: string | null
          evidence?: string | null
          id?: string
          item_id?: string | null
          kind?: string
          owner_id?: string
          payload?: Json | null
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_items: {
        Row: {
          area_color: string | null
          area_id: string | null
          area_slug: string | null
          body: string | null
          created_at: string | null
          created_by: string | null
          done_at: string | null
          due_at: string | null
          duration_min: number | null
          effective_area_id: string | null
          effective_importance: number | null
          evening: boolean | null
          external_ref: string | null
          focus_on: string | null
          id: string | null
          importance: number | null
          kind: string | null
          origin_item_id: string | null
          origin_source_id: string | null
          owner_id: string | null
          parent_id: string | null
          path: string | null
          repeat_rule: string | null
          seq: number | null
          short_id: string | null
          start_at: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "items_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_origin_item_id_fkey"
            columns: ["origin_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_origin_item_id_fkey"
            columns: ["origin_item_id"]
            isOneToOne: false
            referencedRelation: "v_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_origin_source_id_fkey"
            columns: ["origin_source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      effective_area: { Args: { p_item: string }; Returns: string }
      effective_importance: { Args: { p_item: string }; Returns: number }
      item_ancestors: {
        Args: { p_item: string }
        Returns: {
          depth: number
          id: string
        }[]
      }
      item_path: { Args: { p_item: string }; Returns: string }
      project_progress: {
        Args: { p_item: string }
        Returns: {
          done: number
          total: number
        }[]
      }
      today_items: {
        Args: { p_day: string }
        Returns: {
          bucket: string
          item_id: string
          sort_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

