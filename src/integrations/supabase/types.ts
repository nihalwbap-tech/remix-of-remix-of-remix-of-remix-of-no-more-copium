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
      access_codes: {
        Row: {
          code: string
          code_prefix: string
          created_at: string
          expires_at: string | null
          id: string
          is_used: boolean
          note: string | null
          revoked_at: string | null
          used_at: string | null
          used_by_username: string | null
        }
        Insert: {
          code: string
          code_prefix: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          note?: string | null
          revoked_at?: string | null
          used_at?: string | null
          used_by_username?: string | null
        }
        Update: {
          code?: string
          code_prefix?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          note?: string | null
          revoked_at?: string | null
          used_at?: string | null
          used_by_username?: string | null
        }
        Relationships: []
      }
      app_accounts: {
        Row: {
          approved_at: string | null
          assigned_program_id: string | null
          created_at: string
          id: string
          is_preview: boolean
          name: string
          onboarding_completed_at: string | null
          onboarding_step: number
          password: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          approved_at?: string | null
          assigned_program_id?: string | null
          created_at?: string
          id?: string
          is_preview?: boolean
          name: string
          onboarding_completed_at?: string | null
          onboarding_step?: number
          password: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          approved_at?: string | null
          assigned_program_id?: string | null
          created_at?: string
          id?: string
          is_preview?: boolean
          name?: string
          onboarding_completed_at?: string | null
          onboarding_step?: number
          password?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      app_state: {
        Row: {
          exercises: Json
          guides: Json
          id: string
          programs: Json
          updated_at: string
          weight_units: Json
          workouts: Json
        }
        Insert: {
          exercises?: Json
          guides?: Json
          id: string
          programs?: Json
          updated_at?: string
          weight_units?: Json
          workouts?: Json
        }
        Update: {
          exercises?: Json
          guides?: Json
          id?: string
          programs?: Json
          updated_at?: string
          weight_units?: Json
          workouts?: Json
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          body: string
          created_at: string
          id: string
          sender_account_id: string
          thread_id: string
        }
        Insert: {
          attachments?: Json | null
          body: string
          created_at?: string
          id: string
          sender_account_id: string
          thread_id: string
        }
        Update: {
          attachments?: Json | null
          body?: string
          created_at?: string
          id?: string
          sender_account_id?: string
          thread_id?: string
        }
        Relationships: []
      }
      chat_threads: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          id: string
          last_message_at: string | null
          last_message_body: string | null
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          id: string
          last_message_at?: string | null
          last_message_body?: string | null
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_body?: string | null
        }
        Relationships: []
      }
      client_guides_progress: {
        Row: {
          client_id: string
          completed_module_ids: Json
          guide_id: string
          id: string
          last_read_module_id: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_module_ids?: Json
          guide_id: string
          id?: string
          last_read_module_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_module_ids?: Json
          guide_id?: string
          id?: string
          last_read_module_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      progress_picture_batches: {
        Row: {
          client_id: string
          created_at: string
          id: string
          notes: string | null
          streak_count: number
          taken_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          streak_count?: number
          taken_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          streak_count?: number
          taken_at?: string
        }
        Relationships: []
      }
      progress_pictures: {
        Row: {
          batch_id: string
          created_at: string
          id: string
          image_url: string
          pose: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          id?: string
          image_url: string
          pose: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          id?: string
          image_url?: string
          pose?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          client_id: string
          completed_at: string
          created_at: string
          duration_seconds: number
          exercise_logs: Json
          id: string
          notes: string | null
          program_id: string
          workout_id: string
          workout_name: string
        }
        Insert: {
          client_id: string
          completed_at?: string
          created_at?: string
          duration_seconds?: number
          exercise_logs?: Json
          id?: string
          notes?: string | null
          program_id: string
          workout_id: string
          workout_name: string
        }
        Update: {
          client_id?: string
          completed_at?: string
          created_at?: string
          duration_seconds?: number
          exercise_logs?: Json
          id?: string
          notes?: string | null
          program_id?: string
          workout_id?: string
          workout_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_all_client_accounts_v2: { Args: never; Returns: Json }
      register_client_account_v2: {
        Args: {
          p_access_code: string
          p_id: string
          p_name: string
          p_password: string
          p_username: string
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
