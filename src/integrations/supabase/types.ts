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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      master: {
        Row: {
          channel: Database["public"]["Enums"]["channel_enum"] | null
          company: string | null
          created_at: string
          dedupe_key: string
          email: string | null
          emp_count: Database["public"]["Enums"]["emp_count_enum"] | null
          first_outreach_channel:
            | Database["public"]["Enums"]["channel_enum"]
            | null
          id: string
          industry: Database["public"]["Enums"]["industry_enum"] | null
          last_action_date: string | null
          lead_stage: Database["public"]["Enums"]["lead_stage_enum"] | null
          linkedin_url: string | null
          location: string | null
          msg: string | null
          name: string
          next_action_date: string | null
          outreach_status:
            | Database["public"]["Enums"]["outreach_status_enum"]
            | null
          phone: string | null
          title: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          channel?: Database["public"]["Enums"]["channel_enum"] | null
          company?: string | null
          created_at?: string
          dedupe_key: string
          email?: string | null
          emp_count?: Database["public"]["Enums"]["emp_count_enum"] | null
          first_outreach_channel?:
            | Database["public"]["Enums"]["channel_enum"]
            | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_enum"] | null
          last_action_date?: string | null
          lead_stage?: Database["public"]["Enums"]["lead_stage_enum"] | null
          linkedin_url?: string | null
          location?: string | null
          msg?: string | null
          name: string
          next_action_date?: string | null
          outreach_status?:
            | Database["public"]["Enums"]["outreach_status_enum"]
            | null
          phone?: string | null
          title?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel_enum"] | null
          company?: string | null
          created_at?: string
          dedupe_key?: string
          email?: string | null
          emp_count?: Database["public"]["Enums"]["emp_count_enum"] | null
          first_outreach_channel?:
            | Database["public"]["Enums"]["channel_enum"]
            | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_enum"] | null
          last_action_date?: string | null
          lead_stage?: Database["public"]["Enums"]["lead_stage_enum"] | null
          linkedin_url?: string | null
          location?: string | null
          msg?: string | null
          name?: string
          next_action_date?: string | null
          outreach_status?:
            | Database["public"]["Enums"]["outreach_status_enum"]
            | null
          phone?: string | null
          title?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          channel: string
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          status: Database["public"]["Enums"]["template_status_enum"]
          subject: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          channel?: string
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          status?: Database["public"]["Enums"]["template_status_enum"]
          subject?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          status?: Database["public"]["Enums"]["template_status_enum"]
          subject?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          channel: string
          contact_id: string | null
          content: string
          created_at: string | null
          id: string
          opened_at: string | null
          replied_at: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          template_id: string | null
        }
        Insert: {
          channel: string
          contact_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          opened_at?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
        }
        Update: {
          channel?: string
          contact_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          opened_at?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_upload: {
        Row: {
          channel: string | null
          company: string | null
          created_at: string
          email: string | null
          emp_count: string | null
          id: string
          industry: string | null
          linkedin_url: string | null
          location: string | null
          name: string | null
          phone: string | null
          processed: boolean | null
          title: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          channel?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          emp_count?: string | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          location?: string | null
          name?: string | null
          phone?: string | null
          processed?: boolean | null
          title?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          channel?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          emp_count?: string | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          location?: string | null
          name?: string | null
          phone?: string | null
          processed?: boolean | null
          title?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "master"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          id: string
          contact_id: string | null
          type: string
          description: string | null
          from_status: string | null
          to_status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          contact_id?: string | null
          type?: string
          description?: string | null
          from_status?: string | null
          to_status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          contact_id?: string | null
          type?: string
          description?: string | null
          from_status?: string | null
          to_status?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "master"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      process_raw_upload_to_master: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      channel_enum:
        | "email"
        | "linkedin"
        | "phone"
        | "in_person"
        | "other"
        | "clay"
        | "whatsapp"
        | "sms"
      channel_enum_34862722: "email" | "linkedin" | "phone" | "other"
      emp_count_enum:
        | "1-10"
        | "11-50"
        | "51-200"
        | "201-500"
        | "501-1000"
        | "1000+"
        | "unknown"
      emp_count_enum_ab56032c:
        | "1-10"
        | "11-50"
        | "51-200"
        | "201-500"
        | "501-1000"
        | "1001-5000"
        | "5000+"
      industry_enum:
        | "technology"
        | "finance"
        | "healthcare"
        | "education"
        | "retail"
        | "manufacturing"
        | "consulting"
        | "media"
        | "real_estate"
        | "other"
      industry_enum_ed1be861:
        | "technology"
        | "healthcare"
        | "finance"
        | "retail"
        | "manufacturing"
        | "education"
        | "consulting"
        | "real_estate"
        | "other"
      lead_stage_enum:
        | "new"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      lead_stage_enum_fa639866:
        | "new"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      outreach_status_enum:
        | "not_contacted"
        | "contacted"
        | "replied"
        | "interested"
        | "not_interested"
        | "closed"
        | "follow_up"
      outreach_status_enum_225ddc03:
        | "not_started"
        | "in_progress"
        | "reached_out"
        | "responded"
        | "closed"
      template_status_enum:
        | "contacted"
        | "not_yet"
        | "replied"
        | "interested"
        | "not_interested"
        | "closed"
        | "follow_up"
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
      channel_enum: [
        "email",
        "linkedin",
        "phone",
        "in_person",
        "other",
        "clay",
        "whatsapp",
        "sms",
      ],
      channel_enum_34862722: ["email", "linkedin", "phone", "other"],
      emp_count_enum: [
        "1-10",
        "11-50",
        "51-200",
        "201-500",
        "501-1000",
        "1000+",
        "unknown",
      ],
      emp_count_enum_ab56032c: [
        "1-10",
        "11-50",
        "51-200",
        "201-500",
        "501-1000",
        "1001-5000",
        "5000+",
      ],
      industry_enum: [
        "technology",
        "finance",
        "healthcare",
        "education",
        "retail",
        "manufacturing",
        "consulting",
        "media",
        "real_estate",
        "other",
      ],
      industry_enum_ed1be861: [
        "technology",
        "healthcare",
        "finance",
        "retail",
        "manufacturing",
        "education",
        "consulting",
        "real_estate",
        "other",
      ],
      lead_stage_enum: [
        "new",
        "qualified",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      lead_stage_enum_fa639866: [
        "new",
        "qualified",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      outreach_status_enum: [
        "not_contacted",
        "contacted",
        "replied",
        "interested",
        "not_interested",
        "closed",
        "follow_up",
      ],
      outreach_status_enum_225ddc03: [
        "not_started",
        "in_progress",
        "reached_out",
        "responded",
        "closed",
      ],
      template_status_enum: [
        "contacted",
        "not_yet",
        "replied",
        "interested",
        "not_interested",
        "closed",
        "follow_up",
      ],
    },
  },
} as const
