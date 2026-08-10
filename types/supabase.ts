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
    PostgrestVersion: "14.4"
  }
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
      campaigns: {
        Row: {
          campaign_name: string | null
          created_at: string
          completed_at: string | null
          id: number
          message_body: string | null
          scheduled_date: string | null
          segment_id: string | null
          started_at: string | null
          status: string
          template_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          campaign_name?: string | null
          created_at?: string
          completed_at?: string | null
          id?: number
          message_body?: string | null
          scheduled_date?: string | null
          segment_id?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_name?: string | null
          created_at?: string
          completed_at?: string | null
          id?: number
          message_body?: string | null
          scheduled_date?: string | null
          segment_id?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone_no: number | null
          segment_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone_no?: number | null
          segment_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone_no?: number | null
          segment_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          campaign_id: number | null
          created_at: string
          id: string
          message: string | null
          message_id: string | null
          received_at: string | null
          sim_number: number | null
          status: Database["public"]["Enums"]["message_status"] | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: number | null
          created_at?: string
          id?: string
          message?: string | null
          message_id?: string | null
          received_at?: string | null
          sim_number?: number | null
          status?: Database["public"]["Enums"]["message_status"] | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: number | null
          created_at?: string
          id?: string
          message?: string | null
          message_id?: string | null
          received_at?: string | null
          sim_number?: number | null
          status?: Database["public"]["Enums"]["message_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profile: {
        Row: {
          cloud_server: Json | null
          created_at: string
          id: string
          local_server: Json | null
          sim_slot: number | null
          updated_at: string | null
        }
        Insert: {
          cloud_server?: Json | null
          created_at?: string
          id?: string
          local_server?: Json | null
          sim_slot?: number | null
          updated_at?: string | null
        }
        Update: {
          cloud_server?: Json | null
          created_at?: string
          id?: string
          local_server?: Json | null
          sim_slot?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      segments: {
        Row: {
          color_hex: string | null
          created_at: string
          description: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          color_hex?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          color_hex?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          template_name: string
          updated_at: string | null
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          id?: string
          template_name: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          template_name?: string
          updated_at?: string | null
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
      message_status:
        | "received"
        | "data-received"
        | "mms:received"
        | "sms:sent"
        | "sms:delivered"
        | "sms:failed"
        | "system:ping"
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
    Enums: {
      message_status: [
        "received",
        "data-received",
        "mms:received",
        "sms:sent",
        "sms:delivered",
        "sms:failed",
        "system:ping",
      ],
    },
  },
} as const
