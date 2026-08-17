export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          display_name: string;
          bio: string;
          avatar_url: string | null;
          plan: "free" | "pro";
          theme: string;
          primary_color: string;
          secondary_color: string;
          font: string;
          background_type: string;
          background_value: string;
          button_style: string;
          show_branding: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          display_name?: string;
          bio?: string;
          avatar_url?: string | null;
          plan?: "free" | "pro";
          theme?: string;
          primary_color?: string;
          secondary_color?: string;
          font?: string;
          background_type?: string;
          background_value?: string;
          button_style?: string;
          show_branding?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string;
          display_name?: string;
          bio?: string;
          avatar_url?: string | null;
          plan?: "free" | "pro";
          theme?: string;
          primary_color?: string;
          secondary_color?: string;
          font?: string;
          background_type?: string;
          background_value?: string;
          button_style?: string;
          show_branding?: boolean;
          is_published?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      links: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          url: string;
          icon: string;
          position: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          url: string;
          icon?: string;
          position?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          url?: string;
          icon?: string;
          position?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "links_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      analytics_events: {
        Row: {
          id: string;
          profile_id: string;
          link_id: string | null;
          event_type: "profile_view" | "link_click";
          referrer_host: string | null;
          device_type: "desktop" | "mobile" | "tablet";
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          link_id?: string | null;
          event_type: "profile_view" | "link_click";
          referrer_host?: string | null;
          device_type?: "desktop" | "mobile" | "tablet";
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "analytics_events_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analytics_events_link_id_fkey";
            columns: ["link_id"];
            isOneToOne: false;
            referencedRelation: "links";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_users: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: "free" | "pro";
          status: "active" | "expired" | "cancelled";
          provider: string;
          provider_subscription_id: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: "free" | "pro";
          status?: "active" | "expired" | "cancelled";
          provider?: string;
          provider_subscription_id?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan?: "free" | "pro";
          status?: "active" | "expired" | "cancelled";
          provider?: string;
          provider_subscription_id?: string | null;
          current_period_end?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_requests: {
        Row: {
          id: string;
          user_id: string;
          profile_id: string | null;
          method: "pago_movil";
          payer_phone: string;
          reference: string;
          amount_usd: number;
          amount_ves: number;
          status: "pending" | "approved" | "rejected" | "cancelled";
          reviewer_id: string | null;
          review_note: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          profile_id?: string | null;
          method?: "pago_movil";
          payer_phone: string;
          reference: string;
          amount_usd?: number;
          amount_ves?: number;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          reviewer_id?: string | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          profile_id?: string | null;
          payer_phone?: string;
          reference?: string;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          reviewer_id?: string | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_public_profile: {
        Args: { profile_username: string };
        Returns: Array<{
          id: string;
          username: string;
          display_name: string;
          bio: string;
          avatar_url: string | null;
          plan: string;
          theme: string;
          primary_color: string;
          secondary_color: string;
          font: string;
          background_type: string;
          background_value: string;
          button_style: string;
          show_branding: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        }>;
      };
      track_public_analytics_event: {
        Args: {
          target_profile_id: string;
          target_link_id: string | null;
          target_event_type: "profile_view" | "link_click";
          referrer_input?: string | null;
          device_type_input?: "desktop" | "mobile" | "tablet";
        };
        Returns: boolean;
      };
      get_my_analytics_overview: {
        Args: { target_profile_id: string };
        Returns: Array<{
          total_views: number;
          total_clicks: number;
          period_views: number;
          period_clicks: number;
        }>;
      };
      get_my_analytics_daily: {
        Args: { target_profile_id: string; days_input?: number };
        Returns: Array<{
          event_day: string;
          views: number;
          clicks: number;
        }>;
      };
      get_my_link_analytics: {
        Args: { target_profile_id: string; days_input?: number };
        Returns: Array<{
          analytics_link_id: string;
          analytics_link_title: string;
          click_count: number;
        }>;
      };
      is_profile_published: {
        Args: { target_profile_id: string };
        Returns: boolean;
      };
      is_dilink_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      sync_my_plan: {
        Args: Record<string, never>;
        Returns: "free" | "pro";
      };
      cancel_my_pending_payment: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      submit_pro_payment: {
        Args: {
          payer_phone_input: string;
          payment_reference_input: string;
        };
        Returns: Array<{
          payment_id: string;
          payment_status: "pending";
          submitted_at: string;
        }>;
      };
      review_pro_payment: {
        Args: {
          payment_request_id: string;
          review_decision: "approved" | "rejected";
          review_note_input?: string | null;
        };
        Returns: Array<{
          reviewed_payment_id: string;
          reviewed_status: "approved" | "rejected";
          subscription_period_end: string | null;
        }>;
      };
      save_profile_editor: {
        Args: {
          profile_username: string;
          profile_display_name: string;
          profile_bio: string;
          profile_avatar_url: string | null;
          profile_theme: string;
          profile_primary_color: string;
          profile_secondary_color: string;
          profile_font: string;
          profile_button_style: string;
          profile_background_type: string;
          profile_background_value: string;
          profile_links: Json;
        };
        Returns: Array<{
          saved_profile_id: string;
          saved_username: string;
          saved_is_published: boolean;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileLinkRow = Database["public"]["Tables"]["links"]["Row"];
export type PaymentRequestRow = Database["public"]["Tables"]["payment_requests"]["Row"];
export type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
export type AnalyticsEventRow = Database["public"]["Tables"]["analytics_events"]["Row"];
