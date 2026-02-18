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
      assessment_links: {
        Row: {
          assessment_url: string
          candidate_id: string
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          sent_at: string
          sent_via: string
          token: string
        }
        Insert: {
          assessment_url: string
          candidate_id: string
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          sent_at?: string
          sent_via?: string
          token: string
        }
        Update: {
          assessment_url?: string
          candidate_id?: string
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          sent_at?: string
          sent_via?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_links_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
        }
        Relationships: []
      }
      buddy_assignments: {
        Row: {
          assigned_at: string
          buddy_id: string
          candidate_id: string
          id: string
          match_reason: string | null
          match_score: number | null
          notified_at: string | null
          status: Database["public"]["Enums"]["buddy_status"]
        }
        Insert: {
          assigned_at?: string
          buddy_id: string
          candidate_id: string
          id?: string
          match_reason?: string | null
          match_score?: number | null
          notified_at?: string | null
          status?: Database["public"]["Enums"]["buddy_status"]
        }
        Update: {
          assigned_at?: string
          buddy_id?: string
          candidate_id?: string
          id?: string
          match_reason?: string | null
          match_score?: number | null
          notified_at?: string | null
          status?: Database["public"]["Enums"]["buddy_status"]
        }
        Relationships: [
          {
            foreignKeyName: "buddy_assignments_buddy_id_fkey"
            columns: ["buddy_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_assignments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          created_at: string
          current_location: string | null
          current_stage: Database["public"]["Enums"]["candidate_stage"]
          days_in_stage: number
          desired_location: string | null
          email: string
          engagement_score: number
          full_name: string
          id: string
          last_contact_date: string | null
          next_checkin_date: string | null
          organization_id: string | null
          phone: string | null
          photo_url: string | null
          prescreening_complete: boolean
          referral_source: string | null
          resume_url: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          updated_at: string
          video_clips: Json | null
        }
        Insert: {
          created_at?: string
          current_location?: string | null
          current_stage?: Database["public"]["Enums"]["candidate_stage"]
          days_in_stage?: number
          desired_location?: string | null
          email: string
          engagement_score?: number
          full_name: string
          id?: string
          last_contact_date?: string | null
          next_checkin_date?: string | null
          organization_id?: string | null
          phone?: string | null
          photo_url?: string | null
          prescreening_complete?: boolean
          referral_source?: string | null
          resume_url?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          updated_at?: string
          video_clips?: Json | null
        }
        Update: {
          created_at?: string
          current_location?: string | null
          current_stage?: Database["public"]["Enums"]["candidate_stage"]
          days_in_stage?: number
          desired_location?: string | null
          email?: string
          engagement_score?: number
          full_name?: string
          id?: string
          last_contact_date?: string | null
          next_checkin_date?: string | null
          organization_id?: string | null
          phone?: string | null
          photo_url?: string | null
          prescreening_complete?: boolean
          referral_source?: string | null
          resume_url?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          updated_at?: string
          video_clips?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_responses: {
        Row: {
          candidate_id: string
          checkin_date: string
          concerns: string | null
          id: string
          needs_help: string | null
          responded_at: string | null
          response_received: boolean
          still_excited: boolean | null
        }
        Insert: {
          candidate_id: string
          checkin_date?: string
          concerns?: string | null
          id?: string
          needs_help?: string | null
          responded_at?: string | null
          response_received?: boolean
          still_excited?: boolean | null
        }
        Update: {
          candidate_id?: string
          checkin_date?: string
          concerns?: string | null
          id?: string
          needs_help?: string | null
          responded_at?: string | null
          response_received?: boolean
          still_excited?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "checkin_responses_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          created_at: string
          id: string
          items: Json
          template_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          template_name: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          template_name?: string
        }
        Relationships: []
      }
      dossier_actions: {
        Row: {
          action_at: string
          action_type: Database["public"]["Enums"]["dossier_action_type"]
          dossier_id: string
          feedback_text: string | null
          id: string
        }
        Insert: {
          action_at?: string
          action_type: Database["public"]["Enums"]["dossier_action_type"]
          dossier_id: string
          feedback_text?: string | null
          id?: string
        }
        Update: {
          action_at?: string
          action_type?: Database["public"]["Enums"]["dossier_action_type"]
          dossier_id?: string
          feedback_text?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_actions_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_views: {
        Row: {
          dossier_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          dossier_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          dossier_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_views_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      dossiers: {
        Row: {
          candidate_id: string
          created_at: string
          department: string | null
          dossier_url: string | null
          expires_at: string | null
          first_viewed_at: string | null
          hiring_manager_id: string | null
          id: string
          last_viewed_at: string | null
          manager_notes: string | null
          pin_code: string
          role: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["dossier_status"]
          unique_code: string
          view_count: number
        }
        Insert: {
          candidate_id: string
          created_at?: string
          department?: string | null
          dossier_url?: string | null
          expires_at?: string | null
          first_viewed_at?: string | null
          hiring_manager_id?: string | null
          id?: string
          last_viewed_at?: string | null
          manager_notes?: string | null
          pin_code: string
          role?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["dossier_status"]
          unique_code: string
          view_count?: number
        }
        Update: {
          candidate_id?: string
          created_at?: string
          department?: string | null
          dossier_url?: string | null
          expires_at?: string | null
          first_viewed_at?: string | null
          hiring_manager_id?: string | null
          id?: string
          last_viewed_at?: string | null
          manager_notes?: string | null
          pin_code?: string
          role?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["dossier_status"]
          unique_code?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "dossiers_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossiers_hiring_manager_id_fkey"
            columns: ["hiring_manager_id"]
            isOneToOne: false
            referencedRelation: "hiring_managers"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_activities: {
        Row: {
          activity_date: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          candidate_id: string
          details: Json | null
          id: string
        }
        Insert: {
          activity_date?: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          candidate_id: string
          details?: Json | null
          id?: string
        }
        Update: {
          activity_date?: string
          activity_type?: Database["public"]["Enums"]["activity_type"]
          candidate_id?: string
          details?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_activities_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_managers: {
        Row: {
          created_at: string
          default_pin_preference: string | null
          department: string
          email: string
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          default_pin_preference?: string | null
          department: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          default_pin_preference?: string | null
          department?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      interviews: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          interview_type: Database["public"]["Enums"]["interview_type"]
          interviewer_name: string
          location_or_link: string | null
          notes: string | null
          outcome: Database["public"]["Enums"]["interview_outcome"] | null
          round_number: number
          scheduled_date: string
          status: Database["public"]["Enums"]["interview_status"]
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          interview_type?: Database["public"]["Enums"]["interview_type"]
          interviewer_name: string
          location_or_link?: string | null
          notes?: string | null
          outcome?: Database["public"]["Enums"]["interview_outcome"] | null
          round_number?: number
          scheduled_date: string
          status?: Database["public"]["Enums"]["interview_status"]
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          interview_type?: Database["public"]["Enums"]["interview_type"]
          interviewer_name?: string
          location_or_link?: string | null
          notes?: string | null
          outcome?: Database["public"]["Enums"]["interview_outcome"] | null
          round_number?: number
          scheduled_date?: string
          status?: Database["public"]["Enums"]["interview_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_checklist: {
        Row: {
          assigned_to: string | null
          candidate_id: string
          completed_at: string | null
          due_date: string | null
          id: string
          is_enabled: boolean
          item_name: string
          notes: string | null
          order_position: number
          status: Database["public"]["Enums"]["checklist_status"]
        }
        Insert: {
          assigned_to?: string | null
          candidate_id: string
          completed_at?: string | null
          due_date?: string | null
          id?: string
          is_enabled?: boolean
          item_name: string
          notes?: string | null
          order_position?: number
          status?: Database["public"]["Enums"]["checklist_status"]
        }
        Update: {
          assigned_to?: string | null
          candidate_id?: string
          completed_at?: string | null
          due_date?: string | null
          id?: string
          is_enabled?: boolean
          item_name?: string
          notes?: string | null
          order_position?: number
          status?: Database["public"]["Enums"]["checklist_status"]
        }
        Relationships: [
          {
            foreignKeyName: "logistics_checklist_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author: string
          candidate_id: string
          category: Database["public"]["Enums"]["note_category"]
          created_at: string
          id: string
          note_text: string
          updated_at: string | null
        }
        Insert: {
          author: string
          candidate_id: string
          category?: Database["public"]["Enums"]["note_category"]
          created_at?: string
          id?: string
          note_text: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          candidate_id?: string
          category?: Database["public"]["Enums"]["note_category"]
          created_at?: string
          id?: string
          note_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          benefits_summary: string | null
          candidate_id: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          department: string | null
          id: string
          job_title: string
          negotiation_log: Json | null
          offer_letter_url: string | null
          salary: number | null
          signature_data: string | null
          signature_date: string | null
          special_terms: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          benefits_summary?: string | null
          candidate_id: string
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          department?: string | null
          id?: string
          job_title: string
          negotiation_log?: Json | null
          offer_letter_url?: string | null
          salary?: number | null
          signature_data?: string | null
          signature_date?: string | null
          special_terms?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          benefits_summary?: string | null
          candidate_id?: string
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          department?: string | null
          id?: string
          job_title?: string
          negotiation_log?: Json | null
          offer_letter_url?: string | null
          salary?: number | null
          signature_data?: string | null
          signature_date?: string | null
          special_terms?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      org_health_scores: {
        Row: {
          autonomy_score: number | null
          calculated_at: string
          collaboration_score: number | null
          communication_score: number | null
          health_score: number | null
          id: string
          key_friction_points: Json | null
          leadership_score: number | null
          organization_id: string
          pace_score: number | null
        }
        Insert: {
          autonomy_score?: number | null
          calculated_at?: string
          collaboration_score?: number | null
          communication_score?: number | null
          health_score?: number | null
          id?: string
          key_friction_points?: Json | null
          leadership_score?: number | null
          organization_id: string
          pace_score?: number | null
        }
        Update: {
          autonomy_score?: number | null
          calculated_at?: string
          collaboration_score?: number | null
          communication_score?: number | null
          health_score?: number | null
          id?: string
          key_friction_points?: Json | null
          leadership_score?: number | null
          organization_id?: string
          pace_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "org_health_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          annual_contract_value: number | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          id: string
          notes: string | null
          org_code: string
          organization_name: string
          status: Database["public"]["Enums"]["org_status"]
        }
        Insert: {
          annual_contract_value?: number | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          org_code: string
          organization_name: string
          status?: Database["public"]["Enums"]["org_status"]
        }
        Update: {
          annual_contract_value?: number | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          org_code?: string
          organization_name?: string
          status?: Database["public"]["Enums"]["org_status"]
        }
        Relationships: []
      }
      placement_risks: {
        Row: {
          alternative_placements: Json
          calculated_at: string
          candidate_id: string
          id: string
          overridden_by: string | null
          override_reason: string | null
          recommendations: Json
          risk_factors: Json
          risk_level: string
          risk_score: number
          target_department: string | null
          target_organization_id: string | null
        }
        Insert: {
          alternative_placements?: Json
          calculated_at?: string
          candidate_id: string
          id?: string
          overridden_by?: string | null
          override_reason?: string | null
          recommendations?: Json
          risk_factors?: Json
          risk_level?: string
          risk_score?: number
          target_department?: string | null
          target_organization_id?: string | null
        }
        Update: {
          alternative_placements?: Json
          calculated_at?: string
          candidate_id?: string
          id?: string
          overridden_by?: string | null
          override_reason?: string | null
          recommendations?: Json
          risk_factors?: Json
          risk_level?: string
          risk_score?: number
          target_department?: string | null
          target_organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "placement_risks_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_risks_target_organization_id_fkey"
            columns: ["target_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prescreening_data: {
        Row: {
          candidate_id: string
          career_compass_milestones: Json | null
          career_compass_motivators: Json | null
          career_compass_url: string | null
          completed_at: string | null
          id: string
          retention_risk_windows: Json | null
          six_month_checkin_date: string | null
          tribe_viral_archetype: Database["public"]["Enums"]["archetype"] | null
          tribe_viral_scores: Json | null
          tribe_viral_url: string | null
        }
        Insert: {
          candidate_id: string
          career_compass_milestones?: Json | null
          career_compass_motivators?: Json | null
          career_compass_url?: string | null
          completed_at?: string | null
          id?: string
          retention_risk_windows?: Json | null
          six_month_checkin_date?: string | null
          tribe_viral_archetype?:
            | Database["public"]["Enums"]["archetype"]
            | null
          tribe_viral_scores?: Json | null
          tribe_viral_url?: string | null
        }
        Update: {
          candidate_id?: string
          career_compass_milestones?: Json | null
          career_compass_motivators?: Json | null
          career_compass_url?: string | null
          completed_at?: string | null
          id?: string
          retention_risk_windows?: Json | null
          six_month_checkin_date?: string | null
          tribe_viral_archetype?:
            | Database["public"]["Enums"]["archetype"]
            | null
          tribe_viral_scores?: Json | null
          tribe_viral_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescreening_data_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidates"
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
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pulse_responses: {
        Row: {
          answer: Json
          department: string | null
          id: string
          organization_id: string
          question_id: number
          respondent_name: string | null
          submitted_at: string
        }
        Insert: {
          answer: Json
          department?: string | null
          id?: string
          organization_id: string
          question_id: number
          respondent_name?: string | null
          submitted_at?: string
        }
        Update: {
          answer?: Json
          department?: string | null
          id?: string
          organization_id?: string
          question_id?: number
          respondent_name?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          department: string
          email: string
          full_name: string
          id: string
          is_available_as_buddy: boolean
          organization_id: string | null
          photo_url: string | null
          role: string
          tribe_viral_archetype: Database["public"]["Enums"]["archetype"] | null
        }
        Insert: {
          created_at?: string
          department: string
          email: string
          full_name: string
          id?: string
          is_available_as_buddy?: boolean
          organization_id?: string | null
          photo_url?: string | null
          role: string
          tribe_viral_archetype?:
            | Database["public"]["Enums"]["archetype"]
            | null
        }
        Update: {
          created_at?: string
          department?: string
          email?: string
          full_name?: string
          id?: string
          is_available_as_buddy?: boolean
          organization_id?: string | null
          photo_url?: string | null
          role?: string
          tribe_viral_archetype?:
            | Database["public"]["Enums"]["archetype"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_type:
        | "email_sent"
        | "email_opened"
        | "form_submitted"
        | "call_scheduled"
        | "checkin_completed"
        | "checkin_missed"
        | "interview_attended"
        | "interview_missed"
        | "offer_viewed"
        | "offer_signed"
      app_role: "admin" | "concierge" | "read_only"
      archetype: "lion" | "whale" | "falcon"
      buddy_status:
        | "suggested"
        | "approved"
        | "notified"
        | "acknowledged"
        | "active"
      candidate_stage:
        | "pre_screening"
        | "submitted"
        | "in_review"
        | "interview"
        | "offer_pending"
        | "offer_accepted"
        | "pre_arrival"
        | "active"
      checklist_status: "pending" | "in_progress" | "complete"
      contract_type: "full_time" | "part_time" | "contract" | "seasonal"
      dossier_action_type: "interested" | "passed" | "need_more_info"
      dossier_status:
        | "not_sent"
        | "sent"
        | "viewed"
        | "interested"
        | "passed"
        | "need_more_info"
      interview_outcome: "pass" | "conditional" | "no_hire" | "pending"
      interview_status: "scheduled" | "completed" | "cancelled"
      interview_type: "phone" | "video" | "in_person"
      note_category:
        | "follow_up"
        | "concern"
        | "celebration"
        | "general"
        | "legal"
        | "hr"
      offer_status: "pending" | "signed" | "declined" | "expired"
      org_status: "prospect" | "client" | "churned"
      risk_level: "low" | "medium" | "high"
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
      activity_type: [
        "email_sent",
        "email_opened",
        "form_submitted",
        "call_scheduled",
        "checkin_completed",
        "checkin_missed",
        "interview_attended",
        "interview_missed",
        "offer_viewed",
        "offer_signed",
      ],
      app_role: ["admin", "concierge", "read_only"],
      archetype: ["lion", "whale", "falcon"],
      buddy_status: [
        "suggested",
        "approved",
        "notified",
        "acknowledged",
        "active",
      ],
      candidate_stage: [
        "pre_screening",
        "submitted",
        "in_review",
        "interview",
        "offer_pending",
        "offer_accepted",
        "pre_arrival",
        "active",
      ],
      checklist_status: ["pending", "in_progress", "complete"],
      contract_type: ["full_time", "part_time", "contract", "seasonal"],
      dossier_action_type: ["interested", "passed", "need_more_info"],
      dossier_status: [
        "not_sent",
        "sent",
        "viewed",
        "interested",
        "passed",
        "need_more_info",
      ],
      interview_outcome: ["pass", "conditional", "no_hire", "pending"],
      interview_status: ["scheduled", "completed", "cancelled"],
      interview_type: ["phone", "video", "in_person"],
      note_category: [
        "follow_up",
        "concern",
        "celebration",
        "general",
        "legal",
        "hr",
      ],
      offer_status: ["pending", "signed", "declined", "expired"],
      org_status: ["prospect", "client", "churned"],
      risk_level: ["low", "medium", "high"],
    },
  },
} as const
