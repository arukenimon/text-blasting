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
          contact_ids: string[] | null
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
          workspace_id: string
        }
        Insert: {
          campaign_name?: string | null
          contact_ids?: string[] | null
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
          workspace_id: string
        }
        Update: {
          campaign_name?: string | null
          contact_ids?: string[] | null
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
          workspace_id?: string
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
          workspace_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone_no?: number | null
          segment_id?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone_no?: number | null
          segment_id?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
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
          contact_id: string | null
          created_at: string
          body: string
          delivered_at: string | null
          direction: string
          error_reason: string | null
          failed_at: string | null
          gateway_message_id: string | null
          id: string
          media_url: string[] | null
          metadata: Json
          parts_count: number | null
          phone_no: string
          received_at: string | null
          sent_at: string | null
          sim_slot: number | null
          status: string
          subject: string | null
          updated_at: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          campaign_id?: number | null
          contact_id?: string | null
          created_at?: string
          body?: string
          delivered_at?: string | null
          direction: string
          error_reason?: string | null
          failed_at?: string | null
          gateway_message_id?: string | null
          id?: string
          media_url?: string[] | null
          metadata?: Json
          parts_count?: number | null
          phone_no: string
          received_at?: string | null
          sent_at?: string | null
          sim_slot?: number | null
          status: string
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          campaign_id?: number | null
          contact_id?: string | null
          created_at?: string
          body?: string
          delivered_at?: string | null
          direction?: string
          error_reason?: string | null
          failed_at?: string | null
          gateway_message_id?: string | null
          id?: string
          media_url?: string[] | null
          metadata?: Json
          parts_count?: number | null
          phone_no?: string
          received_at?: string | null
          sent_at?: string | null
          sim_slot?: number | null
          status?: string
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string
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
          active_workspace_id: string | null
          created_at: string
          id: string
          updated_at: string | null
        }
        Insert: {
          active_workspace_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          active_workspace_id?: string | null
          created_at?: string
          id?: string
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
          workspace_id: string
        }
        Insert: {
          color_hex?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          color_hex?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
          workspace_id?: string
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
          workspace_id: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          id?: string
          template_name: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          template_name?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          created_by: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_by?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          workspace_id: string
          user_id: string
          user_email: string | null
          role: string
          joined_at: string
        }
        Insert: {
          workspace_id: string
          user_id: string
          user_email?: string | null
          role: string
          joined_at?: string
        }
        Update: {
          workspace_id?: string
          user_id?: string
          user_email?: string | null
          role?: string
          joined_at?: string
        }
        Relationships: []
      }
      workspace_invitations: {
        Row: {
          id: string
          workspace_id: string
          email: string
          role: string
          token: string
          status: string
          expires_at: string
          invited_by: string | null
          accepted_by: string | null
          accepted_at: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          email: string
          role: string
          token?: string
          status?: string
          expires_at?: string
          invited_by?: string | null
          accepted_by?: string | null
          accepted_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          email?: string
          role?: string
          token?: string
          status?: string
          expires_at?: string
          invited_by?: string | null
          accepted_by?: string | null
          accepted_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      workspace_sms_gateway: {
        Row: {
          workspace_id: string
          mode: string
          sim_slot: number | null
          local_server: Json | null
          cloud_server: Json | null
          webhook_token: string
          webhook_secret: string
          webhook_registrations: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          workspace_id: string
          mode?: string
          sim_slot?: number | null
          local_server?: Json | null
          cloud_server?: Json | null
          webhook_token?: string
          webhook_secret?: string
          webhook_registrations?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          workspace_id?: string
          mode?: string
          sim_slot?: number | null
          local_server?: Json | null
          cloud_server?: Json | null
          webhook_token?: string
          webhook_secret?: string
          webhook_registrations?: Json
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      workspace_settings: {
        Row: {
          workspace_id: string
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          workspace_id: string
          key: string
          value?: Json
          updated_at?: string
        }
        Update: {
          workspace_id?: string
          key?: string
          value?: Json
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
