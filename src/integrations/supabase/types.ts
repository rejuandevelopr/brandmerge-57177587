export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      brand_connections: {
        Row: {
          created_at: string
          id: string
          intro_message: string | null
          requested_brand_id: string
          requester_brand_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          intro_message?: string | null
          requested_brand_id: string
          requester_brand_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          intro_message?: string | null
          requested_brand_id?: string
          requester_brand_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_connections_requested_brand_id_fkey"
            columns: ["requested_brand_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_connections_requester_brand_id_fkey"
            columns: ["requester_brand_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          audience_age_groups: string[] | null
          audience_regions: string[] | null
          brand_name: string
          collaboration_interests:
            | Database["public"]["Enums"]["collaboration_type"][]
            | null
          created_at: string
          cultural_taste_markers: string[] | null
          gpt_synergy_status: string | null
          id: string
          industry: string | null
          last_gpt_sync: string | null
          last_qloo_sync: string | null
          mission_statement: string | null
          niche_interests: string[] | null
          qloo_analysis_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audience_age_groups?: string[] | null
          audience_regions?: string[] | null
          brand_name: string
          collaboration_interests?:
            | Database["public"]["Enums"]["collaboration_type"][]
            | null
          created_at?: string
          cultural_taste_markers?: string[] | null
          gpt_synergy_status?: string | null
          id?: string
          industry?: string | null
          last_gpt_sync?: string | null
          last_qloo_sync?: string | null
          mission_statement?: string | null
          niche_interests?: string[] | null
          qloo_analysis_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audience_age_groups?: string[] | null
          audience_regions?: string[] | null
          brand_name?: string
          collaboration_interests?:
            | Database["public"]["Enums"]["collaboration_type"][]
            | null
          created_at?: string
          cultural_taste_markers?: string[] | null
          gpt_synergy_status?: string | null
          id?: string
          industry?: string | null
          last_gpt_sync?: string | null
          last_qloo_sync?: string | null
          mission_statement?: string | null
          niche_interests?: string[] | null
          qloo_analysis_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brand_qloo_analyses: {
        Row: {
          analysis_timestamp: string
          brand_profile_id: string
          error_message: string | null
          id: string
          last_updated: string
          overlap_scores: Json | null
          similar_brands: Json | null
          status: string
        }
        Insert: {
          analysis_timestamp?: string
          brand_profile_id: string
          error_message?: string | null
          id?: string
          last_updated?: string
          overlap_scores?: Json | null
          similar_brands?: Json | null
          status?: string
        }
        Update: {
          analysis_timestamp?: string
          brand_profile_id?: string
          error_message?: string | null
          id?: string
          last_updated?: string
          overlap_scores?: Json | null
          similar_brands?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_qloo_analyses_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: true
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_synergy_analyses: {
        Row: {
          brand_profile_id: string
          collab_ideas: Json | null
          compared_brand_category: string | null
          compared_brand_name: string
          created_at: string
          error_message: string | null
          gpt_analysis_status: string
          id: string
          match_score: number | null
          pitch_line: string | null
          qloo_overlap_score: number | null
          synergy_summary: string | null
          updated_at: string
        }
        Insert: {
          brand_profile_id: string
          collab_ideas?: Json | null
          compared_brand_category?: string | null
          compared_brand_name: string
          created_at?: string
          error_message?: string | null
          gpt_analysis_status?: string
          id?: string
          match_score?: number | null
          pitch_line?: string | null
          qloo_overlap_score?: number | null
          synergy_summary?: string | null
          updated_at?: string
        }
        Update: {
          brand_profile_id?: string
          collab_ideas?: Json | null
          compared_brand_category?: string | null
          compared_brand_name?: string
          created_at?: string
          error_message?: string | null
          gpt_analysis_status?: string
          id?: string
          match_score?: number | null
          pitch_line?: string | null
          qloo_overlap_score?: number | null
          synergy_summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      collaboration_campaigns: {
        Row: {
          campaign_data: Json | null
          collaboration_type: string | null
          connection_id: string
          created_at: string
          creator_brand_id: string
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          campaign_data?: Json | null
          collaboration_type?: string | null
          connection_id: string
          created_at?: string
          creator_brand_id: string
          description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          campaign_data?: Json | null
          collaboration_type?: string | null
          connection_id?: string
          created_at?: string
          creator_brand_id?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_campaigns_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "brand_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_campaigns_creator_brand_id_fkey"
            columns: ["creator_brand_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          connection_id: string
          created_at: string
          id: string
          last_message_at: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "brand_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      data_refresh_log: {
        Row: {
          error_message: string | null
          id: string
          last_refresh: string
          results_count: number | null
          search_query: string | null
          source_type: string
          status: string | null
          success_rate: number | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          last_refresh?: string
          results_count?: number | null
          search_query?: string | null
          source_type: string
          status?: string | null
          success_rate?: number | null
        }
        Update: {
          error_message?: string | null
          id?: string
          last_refresh?: string
          results_count?: number | null
          search_query?: string | null
          source_type?: string
          status?: string | null
          success_rate?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          read_at: string | null
          sender_brand_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_brand_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_brand_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_brand_id_fkey"
            columns: ["sender_brand_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_news: {
        Row: {
          announcement_date: string | null
          brand_1: string
          brand_2: string
          collaboration_type: string | null
          created_at: string
          id: string
          industry_tags: string[] | null
          relevance_score: number | null
          source_url: string | null
          success_indicators: Json | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          announcement_date?: string | null
          brand_1: string
          brand_2: string
          collaboration_type?: string | null
          created_at?: string
          id?: string
          industry_tags?: string[] | null
          relevance_score?: number | null
          source_url?: string | null
          success_indicators?: Json | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          announcement_date?: string | null
          brand_1?: string
          brand_2?: string
          collaboration_type?: string | null
          created_at?: string
          id?: string
          industry_tags?: string[] | null
          relevance_score?: number | null
          source_url?: string | null
          success_indicators?: Json | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trending_startups: {
        Row: {
          company_name: string
          cultural_markers: string[] | null
          description: string | null
          discovered_at: string
          funding_status: string | null
          growth_indicators: Json | null
          id: string
          industry: string | null
          is_active: boolean | null
          last_updated: string
          opportunity_score: number | null
          partnership_signals: Json | null
          qloo_alignment_score: number | null
          source_url: string | null
        }
        Insert: {
          company_name: string
          cultural_markers?: string[] | null
          description?: string | null
          discovered_at?: string
          funding_status?: string | null
          growth_indicators?: Json | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          last_updated?: string
          opportunity_score?: number | null
          partnership_signals?: Json | null
          qloo_alignment_score?: number | null
          source_url?: string | null
        }
        Update: {
          company_name?: string
          cultural_markers?: string[] | null
          description?: string | null
          discovered_at?: string
          funding_status?: string | null
          growth_indicators?: Json | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          last_updated?: string
          opportunity_score?: number | null
          partnership_signals?: Json | null
          qloo_alignment_score?: number | null
          source_url?: string | null
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
      collaboration_type:
        | "partnerships"
        | "co_launch"
        | "cross_promo"
        | "community"
        | "sponsorship"
        | "content_collaboration"
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
      collaboration_type: [
        "partnerships",
        "co_launch",
        "cross_promo",
        "community",
        "sponsorship",
        "content_collaboration",
      ],
    },
  },
} as const
