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
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_paths: string[] | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_paths?: string[] | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_paths?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      lesson_pdfs: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          practice_log_id: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          practice_log_id: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          practice_log_id?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_pdfs_practice_log_id_fkey"
            columns: ["practice_log_id"]
            isOneToOne: false
            referencedRelation: "practice_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_logs: {
        Row: {
          additional_tasks: string[] | null
          additional_tasks_completed: boolean[] | null
          created_at: string
          ear_training: string[] | null
          ear_training_completed: boolean[] | null
          goals: string | null
          id: string
          log_date: string
          metronome_used: boolean | null
          music_listening: string[] | null
          music_listening_completed: boolean[] | null
          musicianship: string | null
          notes: string | null
          repertoire: string[] | null
          repertoire_completed: boolean[] | null
          repertoire_recordings: string[] | null
          scales: string[] | null
          start_time: string | null
          stop_time: string | null
          subgoals: string | null
          technique: string | null
          total_time: unknown
          updated_at: string
          user_id: string
          warmups: string[] | null
        }
        Insert: {
          additional_tasks?: string[] | null
          additional_tasks_completed?: boolean[] | null
          created_at?: string
          ear_training?: string[] | null
          ear_training_completed?: boolean[] | null
          goals?: string | null
          id?: string
          log_date: string
          metronome_used?: boolean | null
          music_listening?: string[] | null
          music_listening_completed?: boolean[] | null
          musicianship?: string | null
          notes?: string | null
          repertoire?: string[] | null
          repertoire_completed?: boolean[] | null
          repertoire_recordings?: string[] | null
          scales?: string[] | null
          start_time?: string | null
          stop_time?: string | null
          subgoals?: string | null
          technique?: string | null
          total_time?: unknown
          updated_at?: string
          user_id: string
          warmups?: string[] | null
        }
        Update: {
          additional_tasks?: string[] | null
          additional_tasks_completed?: boolean[] | null
          created_at?: string
          ear_training?: string[] | null
          ear_training_completed?: boolean[] | null
          goals?: string | null
          id?: string
          log_date?: string
          metronome_used?: boolean | null
          music_listening?: string[] | null
          music_listening_completed?: boolean[] | null
          musicianship?: string | null
          notes?: string | null
          repertoire?: string[] | null
          repertoire_completed?: boolean[] | null
          repertoire_recordings?: string[] | null
          scales?: string[] | null
          start_time?: string | null
          stop_time?: string | null
          subgoals?: string | null
          technique?: string | null
          total_time?: unknown
          updated_at?: string
          user_id?: string
          warmups?: string[] | null
        }
        Relationships: []
      }
      practice_media: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          label: string | null
          media_type: string
          practice_log_id: string
          sort_order: number
          user_id: string
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          label?: string | null
          media_type: string
          practice_log_id: string
          sort_order?: number
          user_id: string
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          label?: string | null
          media_type?: string
          practice_log_id?: string
          sort_order?: number
          user_id?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_media_practice_log_id_fkey"
            columns: ["practice_log_id"]
            isOneToOne: false
            referencedRelation: "practice_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_practice_logs: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          practice_log_id: string
          share_token: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          practice_log_id: string
          share_token: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          practice_log_id?: string
          share_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_practice_logs_practice_log_id_fkey"
            columns: ["practice_log_id"]
            isOneToOne: false
            referencedRelation: "practice_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_paper_drawings: {
        Row: {
          created_at: string
          drawing_data: string | null
          drawing_date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          drawing_data?: string | null
          drawing_date: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          drawing_data?: string | null
          drawing_date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_type: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_type: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_type?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_practice_streak: { Args: { p_user_id: string }; Returns: number }
      get_practiced_dates: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_shared_practice_log: {
        Args: { p_share_token: string }
        Returns: {
          practice_log_id: string
          sharer_display_name: string
        }[]
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
