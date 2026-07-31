export type ProfileRole = "user" | "interpreter" | "admin";
export type ThemePreference = "light" | "dark";
export type ApplicationStatus = "pending" | "approved" | "rejected";
export type AppointmentStatus =
  | "open"
  | "accepted"
  | "cancel_requested"
  | "cancelled"
  | "completed"
  | "expired";
export type CancellationStatus = "pending" | "approved" | "rejected";
export type CancellationRequesterRole = "user" | "interpreter";
export type AppointmentReasonCode =
  | "saude"
  | "educacao"
  | "trabalho"
  | "servicos_publicos"
  | "comercio"
  | "outro";
export type CancellationReasonCode =
  | "imprevisto"
  | "doenca"
  | "conflito_horario"
  | "problema_tecnico"
  | "outro";

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
          role: ProfileRole;
          full_name: string;
          theme_preference: ThemePreference;
          average_rating: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: ProfileRole;
          full_name?: string;
          theme_preference?: ThemePreference;
          average_rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: ProfileRole;
          full_name?: string;
          theme_preference?: ThemePreference;
          average_rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      interpreter_applications: {
        Row: {
          id: string;
          profile_id: string;
          status: ApplicationStatus;
          certificate_path: string;
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          status?: ApplicationStatus;
          certificate_path: string;
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          status?: ApplicationStatus;
          certificate_path?: string;
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          requester_id: string;
          interpreter_id: string | null;
          status: AppointmentStatus;
          scheduled_at: string;
          duration_minutes: 15 | 30 | 60;
          reason_code: AppointmentReasonCode;
          reason_text: string | null;
          jitsi_room_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          interpreter_id?: string | null;
          status?: AppointmentStatus;
          scheduled_at: string;
          duration_minutes: 15 | 30 | 60;
          reason_code: AppointmentReasonCode;
          reason_text?: string | null;
          jitsi_room_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          interpreter_id?: string | null;
          status?: AppointmentStatus;
          scheduled_at?: string;
          duration_minutes?: 15 | 30 | 60;
          reason_code?: AppointmentReasonCode;
          reason_text?: string | null;
          jitsi_room_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cancellation_requests: {
        Row: {
          id: string;
          appointment_id: string;
          requested_by: string;
          requested_by_role: CancellationRequesterRole;
          reason_code: CancellationReasonCode;
          reason_text: string | null;
          status: CancellationStatus;
          admin_decision_note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          requested_by: string;
          requested_by_role: CancellationRequesterRole;
          reason_code: CancellationReasonCode;
          reason_text?: string | null;
          status?: CancellationStatus;
          admin_decision_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          requested_by?: string;
          requested_by_role?: CancellationRequesterRole;
          reason_code?: CancellationReasonCode;
          reason_text?: string | null;
          status?: CancellationStatus;
          admin_decision_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          appointment_id: string;
          from_profile_id: string;
          to_profile_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          from_profile_id: string;
          to_profile_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          from_profile_id?: string;
          to_profile_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          type: string;
          title: string;
          body: string;
          related_appointment_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          type: string;
          title: string;
          body: string;
          related_appointment_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          type?: string;
          title?: string;
          body?: string;
          related_appointment_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      public_profiles: {
        Row: {
          id: string | null;
          full_name: string | null;
          role: ProfileRole | null;
          average_rating: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      accept_appointment: {
        Args: { p_appointment_id: string };
        Returns: Database["public"]["Tables"]["appointments"]["Row"];
      };
      request_or_cancel_appointment: {
        Args: {
          p_appointment_id: string;
          p_reason_code: Database["public"]["Enums"]["cancellation_reason_code"];
          p_reason_text?: string | null;
        };
        Returns: Database["public"]["Tables"]["appointments"]["Row"];
      };
      list_public_profiles: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Views"]["public_profiles"]["Row"][];
      };
    };
    Enums: {
      profile_role: ProfileRole;
      theme_preference: ThemePreference;
      application_status: ApplicationStatus;
      appointment_status: AppointmentStatus;
      cancellation_status: CancellationStatus;
      cancellation_requester_role: CancellationRequesterRole;
      appointment_reason_code: AppointmentReasonCode;
      cancellation_reason_code: CancellationReasonCode;
    };
    CompositeTypes: Record<string, never>;
  };
};
