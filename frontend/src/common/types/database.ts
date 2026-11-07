export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      objects: {
        Row: {
          address: string | null;
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "objects_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Relationships: [];
      };
      task_status_history: {
        Row: {
          changed_by: string;
          comment: string | null;
          created_at: string;
          from_status: Database["public"]["Enums"]["task_status"] | null;
          id: number;
          task_id: string;
          to_status: Database["public"]["Enums"]["task_status"];
        };
        ComputedFields: never;
        Insert: {
          changed_by: string;
          comment?: string | null;
          created_at?: string;
          from_status?: Database["public"]["Enums"]["task_status"] | null;
          id?: never;
          task_id: string;
          to_status: Database["public"]["Enums"]["task_status"];
        };
        Update: {
          changed_by?: string;
          comment?: string | null;
          created_at?: string;
          from_status?: Database["public"]["Enums"]["task_status"] | null;
          id?: never;
          task_id?: string;
          to_status?: Database["public"]["Enums"]["task_status"];
        };
        Relationships: [
          {
            foreignKeyName: "task_status_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_status_history_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          assignee_id: string;
          author_id: string;
          created_at: string;
          description: string | null;
          id: string;
          object_id: string;
          status: Database["public"]["Enums"]["task_status"];
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          assignee_id: string;
          author_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          object_id: string;
          status?: Database["public"]["Enums"]["task_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          assignee_id?: string;
          author_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          object_id?: string;
          status?: Database["public"]["Enums"]["task_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey";
            columns: ["assignee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_object_id_fkey";
            columns: ["object_id"];
            isOneToOne: false;
            referencedRelation: "objects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_access_object: { Args: { p_object_id: string }; Returns: boolean };
      can_access_task: { Args: { p_task_id: string }; Returns: boolean };
      can_set_task_status: {
        Args: {
          p_task: Omit<
            Database["public"]["Tables"]["tasks"]["Row"],
            Database["public"]["Tables"]["tasks"]["ComputedFields"]
          >;
          p_to: Database["public"]["Enums"]["task_status"];
        };
        Returns: boolean;
      };
      change_task_status: {
        Args: {
          p_comment?: string;
          p_from_status: Database["public"]["Enums"]["task_status"];
          p_object_id: string;
          p_task_id: string;
          p_to_status: Database["public"]["Enums"]["task_status"];
        };
        Returns: undefined;
      };
      current_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      get_task_available_transitions: {
        Args: {
          p_from_status: Database["public"]["Enums"]["task_status"];
          p_object_id: string;
          p_task_id: string;
        };
        Returns: Json;
      };
      is_manager: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_status_transition_allowed: {
        Args: {
          p_from: Database["public"]["Enums"]["task_status"];
          p_to: Database["public"]["Enums"]["task_status"];
        };
        Returns: boolean;
      };
      is_task_transition_allowed: {
        Args: {
          p_task: Omit<
            Database["public"]["Tables"]["tasks"]["Row"],
            Database["public"]["Tables"]["tasks"]["ComputedFields"]
          >;
          p_to: Database["public"]["Enums"]["task_status"];
        };
        Returns: boolean;
      };
    };
    Enums: {
      task_status:
        "new" | "in_progress" | "on_review" | "accepted" | "needs_rework";
      user_role: "manager" | "executor";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      task_status: [
        "new",
        "in_progress",
        "on_review",
        "accepted",
        "needs_rework",
      ],
      user_role: ["manager", "executor"],
    },
  },
} as const;
