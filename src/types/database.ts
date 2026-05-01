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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      apollo_email_accounts: {
        Row: {
          active: boolean
          created_at: string
          created_at_apollo: string | null
          email: string
          id: string
          is_default: boolean
          last_synced_at_apollo: string | null
          provider: string
          synced_at: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_at_apollo?: string | null
          email: string
          id: string
          is_default?: boolean
          last_synced_at_apollo?: string | null
          provider: string
          synced_at?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_at_apollo?: string | null
          email?: string
          id?: string
          is_default?: boolean
          last_synced_at_apollo?: string | null
          provider?: string
          synced_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      apollo_sequences: {
        Row: {
          active: boolean
          archived: boolean
          bounce_rate: number
          click_rate: number
          created_at: string
          created_at_apollo: string | null
          creation_type: string | null
          id: string
          is_performing_poorly: boolean
          last_used_at: string | null
          name: string
          num_steps: number
          open_rate: number
          reply_rate: number
          spam_block_rate: number
          synced_at: string
          unique_bounced: number
          unique_clicked: number
          unique_delivered: number
          unique_hard_bounced: number
          unique_opened: number
          unique_replied: number
          unique_scheduled: number
          unique_spam_blocked: number
          unique_unsubscribed: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          archived?: boolean
          bounce_rate?: number
          click_rate?: number
          created_at?: string
          created_at_apollo?: string | null
          creation_type?: string | null
          id: string
          is_performing_poorly?: boolean
          last_used_at?: string | null
          name: string
          num_steps?: number
          open_rate?: number
          reply_rate?: number
          spam_block_rate?: number
          synced_at?: string
          unique_bounced?: number
          unique_clicked?: number
          unique_delivered?: number
          unique_hard_bounced?: number
          unique_opened?: number
          unique_replied?: number
          unique_scheduled?: number
          unique_spam_blocked?: number
          unique_unsubscribed?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          archived?: boolean
          bounce_rate?: number
          click_rate?: number
          created_at?: string
          created_at_apollo?: string | null
          creation_type?: string | null
          id?: string
          is_performing_poorly?: boolean
          last_used_at?: string | null
          name?: string
          num_steps?: number
          open_rate?: number
          reply_rate?: number
          spam_block_rate?: number
          synced_at?: string
          unique_bounced?: number
          unique_clicked?: number
          unique_delivered?: number
          unique_hard_bounced?: number
          unique_opened?: number
          unique_replied?: number
          unique_scheduled?: number
          unique_spam_blocked?: number
          unique_unsubscribed?: number
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          ashish_split_pct: number
          created_at: string
          id: string
          max_bounce_rate: number
          min_cash_alarm_aed: number
          min_raj_completion_pct: number
          morty_commission_pct: number
          mrr_target_aed: number
          mrr_target_month: string
          owner_draw_pct: number
          updated_at: string
        }
        Insert: {
          ashish_split_pct?: number
          created_at?: string
          id?: string
          max_bounce_rate?: number
          min_cash_alarm_aed?: number
          min_raj_completion_pct?: number
          morty_commission_pct?: number
          mrr_target_aed?: number
          mrr_target_month?: string
          owner_draw_pct?: number
          updated_at?: string
        }
        Update: {
          ashish_split_pct?: number
          created_at?: string
          id?: string
          max_bounce_rate?: number
          min_cash_alarm_aed?: number
          min_raj_completion_pct?: number
          morty_commission_pct?: number
          mrr_target_aed?: number
          mrr_target_month?: string
          owner_draw_pct?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json | null
          id: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          id?: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_balance: {
        Row: {
          created_at: string
          current_aed: number
          id: string
          last_updated_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_aed: number
          id?: string
          last_updated_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_aed?: number
          id?: string
          last_updated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_balance_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_entries: {
        Row: {
          amount_aed: number
          category: string
          created_at: string
          description: string | null
          direction: string
          entry_date: string
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          amount_aed: number
          category: string
          created_at?: string
          description?: string | null
          direction: string
          entry_date: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          amount_aed?: number
          category?: string
          created_at?: string
          description?: string | null
          direction?: string
          entry_date?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          client_type: string
          created_at: string
          health: string
          id: string
          monthly_aed: number
          name: string
          notes: string | null
          start_date: string | null
          status: string
          updated_at: string
          upsell_ideas: string | null
        }
        Insert: {
          client_type: string
          created_at?: string
          health?: string
          id?: string
          monthly_aed?: number
          name: string
          notes?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          upsell_ideas?: string | null
        }
        Update: {
          client_type?: string
          created_at?: string
          health?: string
          id?: string
          monthly_aed?: number
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          upsell_ideas?: string | null
        }
        Relationships: []
      }
      cold_email_entries: {
        Row: {
          booked_call: boolean
          bounced: boolean
          company: string | null
          created_at: string
          email: string
          id: string
          notes: string | null
          opened: boolean
          pipeline_deal_id: string | null
          prospect_name: string
          replied: boolean
          sent: boolean
          sent_date: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          booked_call?: boolean
          bounced?: boolean
          company?: string | null
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          opened?: boolean
          pipeline_deal_id?: string | null
          prospect_name: string
          replied?: boolean
          sent?: boolean
          sent_date?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          booked_call?: boolean
          bounced?: boolean
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          opened?: boolean
          pipeline_deal_id?: string | null
          prospect_name?: string
          replied?: boolean
          sent?: boolean
          sent_date?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cold_email_entries_pipeline_deal_id_fkey"
            columns: ["pipeline_deal_id"]
            isOneToOne: false
            referencedRelation: "pipeline_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_runs: {
        Row: {
          created_at: string
          current_stage_id: string | null
          ended_at: string | null
          funnel_id: string
          id: string
          outcome: string
          pipeline_deal_id: string | null
          started_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_stage_id?: string | null
          ended_at?: string | null
          funnel_id: string
          id?: string
          outcome?: string
          pipeline_deal_id?: string | null
          started_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_stage_id?: string | null
          ended_at?: string | null
          funnel_id?: string
          id?: string
          outcome?: string
          pipeline_deal_id?: string | null
          started_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_runs_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_runs_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_runs_pipeline_deal_id_fkey"
            columns: ["pipeline_deal_id"]
            isOneToOne: false
            referencedRelation: "pipeline_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_stage_transitions: {
        Row: {
          actor_id: string | null
          from_stage_id: string | null
          funnel_run_id: string
          id: string
          to_stage_id: string | null
          transitioned_at: string
        }
        Insert: {
          actor_id?: string | null
          from_stage_id?: string | null
          funnel_run_id: string
          id?: string
          to_stage_id?: string | null
          transitioned_at?: string
        }
        Update: {
          actor_id?: string | null
          from_stage_id?: string | null
          funnel_run_id?: string
          id?: string
          to_stage_id?: string | null
          transitioned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_stage_transitions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_stage_transitions_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_stage_transitions_funnel_run_id_fkey"
            columns: ["funnel_run_id"]
            isOneToOne: false
            referencedRelation: "funnel_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_stage_transitions_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_stages: {
        Row: {
          created_at: string
          funnel_id: string
          id: string
          is_terminal_lost: boolean
          is_terminal_won: boolean
          name: string
          sort_order: number
          target_conversion_pct: number
          target_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          funnel_id: string
          id?: string
          is_terminal_lost?: boolean
          is_terminal_won?: boolean
          name: string
          sort_order: number
          target_conversion_pct?: number
          target_days?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          funnel_id?: string
          id?: string
          is_terminal_lost?: boolean
          is_terminal_won?: boolean
          name?: string
          sort_order?: number
          target_conversion_pct?: number
          target_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_stages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          archived: boolean
          channel: string
          created_at: string
          description: string | null
          id: string
          is_template: boolean
          name: string
          owner_id: string | null
          template_slug: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          channel: string
          created_at?: string
          description?: string | null
          id?: string
          is_template?: boolean
          name: string
          owner_id?: string | null
          template_slug?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          channel?: string
          created_at?: string
          description?: string | null
          id?: string
          is_template?: boolean
          name?: string
          owner_id?: string | null
          template_slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          attendees: string | null
          client_id: string | null
          created_at: string
          description: string | null
          ends_at: string
          external_calendar_id: string | null
          external_event_id: string | null
          id: string
          location: string | null
          notes: string | null
          owner_id: string
          pipeline_deal_id: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          attendees?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          ends_at: string
          external_calendar_id?: string | null
          external_event_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          owner_id: string
          pipeline_deal_id?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          attendees?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string
          external_calendar_id?: string | null
          external_event_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          owner_id?: string
          pipeline_deal_id?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_pipeline_deal_id_fkey"
            columns: ["pipeline_deal_id"]
            isOneToOne: false
            referencedRelation: "pipeline_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_deals: {
        Row: {
          company: string | null
          confidence: string
          created_at: string
          expected_aed_monthly: number
          expected_aed_one_time: number
          expected_close_month: string | null
          id: string
          last_touch: string | null
          next_action: string | null
          notes: string | null
          owner_id: string | null
          prospect_name: string
          source: string
          stage: string
          updated_at: string
          won_lost_reason: string | null
        }
        Insert: {
          company?: string | null
          confidence?: string
          created_at?: string
          expected_aed_monthly?: number
          expected_aed_one_time?: number
          expected_close_month?: string | null
          id?: string
          last_touch?: string | null
          next_action?: string | null
          notes?: string | null
          owner_id?: string | null
          prospect_name: string
          source: string
          stage?: string
          updated_at?: string
          won_lost_reason?: string | null
        }
        Update: {
          company?: string | null
          confidence?: string
          created_at?: string
          expected_aed_monthly?: number
          expected_aed_one_time?: number
          expected_close_month?: string | null
          id?: string
          last_touch?: string | null
          next_action?: string | null
          notes?: string | null
          owner_id?: string | null
          prospect_name?: string
          source?: string
          stage?: string
          updated_at?: string
          won_lost_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          fixed_monthly_cost_aed: number
          full_name: string
          id: string
          monthly_capacity_hours: number
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          fixed_monthly_cost_aed?: number
          full_name: string
          id: string
          monthly_capacity_hours?: number
          role: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          fixed_monthly_cost_aed?: number
          full_name?: string
          id?: string
          monthly_capacity_hours?: number
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      revenue_entries: {
        Row: {
          amount_aed: number
          client_id: string | null
          created_at: string
          entry_type: string
          id: string
          invoice_number: string | null
          notes: string | null
          received_date: string
          updated_at: string
        }
        Insert: {
          amount_aed: number
          client_id?: string | null
          created_at?: string
          entry_type?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          received_date: string
          updated_at?: string
        }
        Update: {
          amount_aed?: number
          client_id?: string | null
          created_at?: string
          entry_type?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          received_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number
          category: string | null
          client_id: string | null
          created_at: string
          due_date: string | null
          estimated_hours: number
          id: string
          notes: string | null
          owner_id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number
          category?: string | null
          client_id?: string | null
          created_at?: string
          due_date?: string | null
          estimated_hours?: number
          id?: string
          notes?: string | null
          owner_id: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number
          category?: string | null
          client_id?: string | null
          created_at?: string
          due_date?: string | null
          estimated_hours?: number
          id?: string
          notes?: string | null
          owner_id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
  public: {
    Enums: {},
  },
} as const
