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
      admin_whitelist: {
        Row: {
          added_at: string | null
          email: string
          name: string | null
        }
        Insert: {
          added_at?: string | null
          email: string
          name?: string | null
        }
        Update: {
          added_at?: string | null
          email?: string
          name?: string | null
        }
        Relationships: []
      }
      assessment_links: {
        Row: {
          assessment_url: string
          candidate_id: string
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
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
          {
            foreignKeyName: "assessment_links_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "buddy_assignments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidates_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string
          phone: string | null
          photo_url: string | null
          prescreening_complete: boolean
          referral_source: string | null
          resume_filename: string | null
          resume_uploaded_at: string | null
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
          organization_id: string
          phone?: string | null
          photo_url?: string | null
          prescreening_complete?: boolean
          referral_source?: string | null
          resume_filename?: string | null
          resume_uploaded_at?: string | null
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
          organization_id?: string
          phone?: string | null
          photo_url?: string | null
          prescreening_complete?: boolean
          referral_source?: string | null
          resume_filename?: string | null
          resume_uploaded_at?: string | null
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
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
          {
            foreignKeyName: "checkin_responses_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          {
            foreignKeyName: "dossier_actions_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "public_dossiers"
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
          {
            foreignKeyName: "dossier_views_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "public_dossiers"
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
          include_resume: boolean | null
          last_viewed_at: string | null
          manager_notes: string | null
          organization_id: string | null
          pin_code: string
          resume_filename: string | null
          resume_url: string | null
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
          include_resume?: boolean | null
          last_viewed_at?: string | null
          manager_notes?: string | null
          organization_id?: string | null
          pin_code: string
          resume_filename?: string | null
          resume_url?: string | null
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
          include_resume?: boolean | null
          last_viewed_at?: string | null
          manager_notes?: string | null
          organization_id?: string | null
          pin_code?: string
          resume_filename?: string | null
          resume_url?: string | null
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
            foreignKeyName: "dossiers_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossiers_hiring_manager_id_fkey"
            columns: ["hiring_manager_id"]
            isOneToOne: false
            referencedRelation: "hiring_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossiers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
        }
        Insert: {
          activity_date?: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          candidate_id: string
          details?: Json | null
          id?: string
          organization_id?: string | null
        }
        Update: {
          activity_date?: string
          activity_type?: Database["public"]["Enums"]["activity_type"]
          candidate_id?: string
          details?: Json | null
          id?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_activities_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_activities_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_checkins: {
        Row: {
          candidate_id: string
          concerns: string | null
          confidence: number | null
          created_at: string | null
          day_number: number
          id: string
          journey_event_id: string | null
          journey_id: string
          mood: number
          notes: string | null
          organization_id: string
          phase: string
          recorded_by: string
          team_integration: number | null
          wins: string | null
        }
        Insert: {
          candidate_id: string
          concerns?: string | null
          confidence?: number | null
          created_at?: string | null
          day_number: number
          id?: string
          journey_event_id?: string | null
          journey_id: string
          mood: number
          notes?: string | null
          organization_id: string
          phase: string
          recorded_by?: string
          team_integration?: number | null
          wins?: string | null
        }
        Update: {
          candidate_id?: string
          concerns?: string | null
          confidence?: number | null
          created_at?: string | null
          day_number?: number
          id?: string
          journey_event_id?: string | null
          journey_id?: string
          mood?: number
          notes?: string | null
          organization_id?: string
          phase?: string
          recorded_by?: string
          team_integration?: number | null
          wins?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_checkins_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_checkins_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_checkins_journey_event_id_fkey"
            columns: ["journey_event_id"]
            isOneToOne: false
            referencedRelation: "journey_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_checkins_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journey_blueprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_checkins_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          default_pin_preference?: string | null
          department: string
          email: string
          full_name: string
          id?: string
          organization_id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          default_pin_preference?: string | null
          department?: string
          email?: string
          full_name?: string
          id?: string
          organization_id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hiring_managers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_reports: {
        Row: {
          access_code: string
          created_at: string | null
          first_viewed_at: string | null
          id: string
          manager_email: string | null
          manager_name: string
          organization_id: string | null
          pin: string
          property_name: string
          published_at: string | null
          report_data: Json
          status: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          access_code: string
          created_at?: string | null
          first_viewed_at?: string | null
          id?: string
          manager_email?: string | null
          manager_name: string
          organization_id?: string | null
          pin: string
          property_name: string
          published_at?: string | null
          report_data?: Json
          status?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          access_code?: string
          created_at?: string | null
          first_viewed_at?: string | null
          id?: string
          manager_email?: string | null
          manager_name?: string
          organization_id?: string | null
          pin?: string
          property_name?: string
          published_at?: string | null
          report_data?: Json
          status?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "insight_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          candidate_id: string
          created_at: string
          follow_up_date: string | null
          id: string
          intervention_type: string
          journey_id: string | null
          logged_by: string
          organization_id: string
          outcome: string | null
          summary: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          follow_up_date?: string | null
          id?: string
          intervention_type: string
          journey_id?: string | null
          logged_by: string
          organization_id: string
          outcome?: string | null
          summary: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          follow_up_date?: string | null
          id?: string
          intervention_type?: string
          journey_id?: string | null
          logged_by?: string
          organization_id?: string
          outcome?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journey_blueprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_blueprints: {
        Row: {
          assigned_buddy_id: string | null
          candidate_id: string | null
          churn_prediction: Json | null
          churn_updated_at: string | null
          created_at: string | null
          current_phase: string
          day_90_date: string | null
          id: string
          offer_date: string | null
          organization_id: string | null
          start_date: string | null
          start_work_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_buddy_id?: string | null
          candidate_id?: string | null
          churn_prediction?: Json | null
          churn_updated_at?: string | null
          created_at?: string | null
          current_phase?: string
          day_90_date?: string | null
          id?: string
          offer_date?: string | null
          organization_id?: string | null
          start_date?: string | null
          start_work_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_buddy_id?: string | null
          candidate_id?: string | null
          churn_prediction?: Json | null
          churn_updated_at?: string | null
          created_at?: string | null
          current_phase?: string
          day_90_date?: string | null
          id?: string
          offer_date?: string | null
          organization_id?: string | null
          start_date?: string | null
          start_work_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_blueprints_assigned_buddy_id_fkey"
            columns: ["assigned_buddy_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_blueprints_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_blueprints_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_blueprints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_events: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          day_offset: number | null
          description: string | null
          event_type: string
          id: string
          journey_id: string | null
          metadata: Json | null
          organization_id: string | null
          phase: string
          priority: string | null
          scheduled_for: string | null
          status: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          day_offset?: number | null
          description?: string | null
          event_type: string
          id?: string
          journey_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          phase: string
          priority?: string | null
          scheduled_for?: string | null
          status?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          day_offset?: number | null
          description?: string | null
          event_type?: string
          id?: string
          journey_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          phase?: string
          priority?: string | null
          scheduled_for?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_events_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journey_blueprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "logistics_checklist_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_checklist_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      magic_links: {
        Row: {
          assessment_id: string | null
          candidate_email: string | null
          candidate_name: string | null
          created_at: string
          expire_at: string | null
          id: string
          org_code: string
          token: string
          used: boolean
          used_at: string | null
        }
        Insert: {
          assessment_id?: string | null
          candidate_email?: string | null
          candidate_name?: string | null
          created_at?: string
          expire_at?: string | null
          id?: string
          org_code: string
          token?: string
          used?: boolean
          used_at?: string | null
        }
        Update: {
          assessment_id?: string | null
          candidate_email?: string | null
          candidate_name?: string | null
          created_at?: string
          expire_at?: string | null
          id?: string
          org_code?: string
          token?: string
          used?: boolean
          used_at?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          author: string
          candidate_id: string
          category: Database["public"]["Enums"]["note_category"]
          created_at: string
          id: string
          note_text: string
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          author: string
          candidate_id: string
          category?: Database["public"]["Enums"]["note_category"]
          created_at?: string
          id?: string
          note_text: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author?: string
          candidate_id?: string
          category?: Database["public"]["Enums"]["note_category"]
          created_at?: string
          id?: string
          note_text?: string
          organization_id?: string | null
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
          {
            foreignKeyName: "notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
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
          {
            foreignKeyName: "offers_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidates_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      pin_attempts: {
        Row: {
          attempted_at: string
          id: string
          target_code: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          target_code: string
        }
        Update: {
          attempted_at?: string
          id?: string
          target_code?: string
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
            foreignKeyName: "placement_risks_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates_safe"
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
          department_matches: string[] | null
          dimension_scores: Json | null
          geography_matches: string[] | null
          id: string
          organization_id: string
          retention_risk_windows: Json | null
          sector_matches: string[] | null
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
          department_matches?: string[] | null
          dimension_scores?: Json | null
          geography_matches?: string[] | null
          id?: string
          organization_id: string
          retention_risk_windows?: Json | null
          sector_matches?: string[] | null
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
          department_matches?: string[] | null
          dimension_scores?: Json | null
          geography_matches?: string[] | null
          id?: string
          organization_id?: string
          retention_risk_windows?: Json | null
          sector_matches?: string[] | null
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
          {
            foreignKeyName: "prescreening_data_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidates_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescreening_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
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
      candidates_safe: {
        Row: {
          created_at: string | null
          current_stage: Database["public"]["Enums"]["candidate_stage"] | null
          days_in_stage: number | null
          engagement_score: number | null
          full_name: string | null
          id: string | null
          organization_id: string | null
          prescreening_complete: boolean | null
          referral_source: string | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_stage?: Database["public"]["Enums"]["candidate_stage"] | null
          days_in_stage?: number | null
          engagement_score?: number | null
          full_name?: string | null
          id?: string | null
          organization_id?: string | null
          prescreening_complete?: boolean | null
          referral_source?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_stage?: Database["public"]["Enums"]["candidate_stage"] | null
          days_in_stage?: number | null
          engagement_score?: number | null
          full_name?: string | null
          id?: string | null
          organization_id?: string | null
          prescreening_complete?: boolean | null
          referral_source?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          updated_at?: string | null
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
      public_dossiers: {
        Row: {
          candidate_id: string | null
          created_at: string | null
          department: string | null
          dossier_url: string | null
          expires_at: string | null
          first_viewed_at: string | null
          hiring_manager_id: string | null
          id: string | null
          include_resume: boolean | null
          last_viewed_at: string | null
          manager_notes: string | null
          organization_id: string | null
          resume_filename: string | null
          resume_url: string | null
          role: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["dossier_status"] | null
          unique_code: string | null
          view_count: number | null
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string | null
          department?: string | null
          dossier_url?: string | null
          expires_at?: string | null
          first_viewed_at?: string | null
          hiring_manager_id?: string | null
          id?: string | null
          include_resume?: boolean | null
          last_viewed_at?: string | null
          manager_notes?: string | null
          organization_id?: string | null
          resume_filename?: string | null
          resume_url?: string | null
          role?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["dossier_status"] | null
          unique_code?: string | null
          view_count?: number | null
        }
        Update: {
          candidate_id?: string | null
          created_at?: string | null
          department?: string | null
          dossier_url?: string | null
          expires_at?: string | null
          first_viewed_at?: string | null
          hiring_manager_id?: string | null
          id?: string | null
          include_resume?: boolean | null
          last_viewed_at?: string | null
          manager_notes?: string | null
          organization_id?: string | null
          resume_filename?: string | null
          resume_url?: string | null
          role?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["dossier_status"] | null
          unique_code?: string | null
          view_count?: number | null
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
            foreignKeyName: "dossiers_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossiers_hiring_manager_id_fkey"
            columns: ["hiring_manager_id"]
            isOneToOne: false
            referencedRelation: "hiring_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossiers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      public_insight_reports: {
        Row: {
          access_code: string | null
          created_at: string | null
          id: string | null
          manager_name: string | null
          organization_id: string | null
          property_name: string | null
          status: string | null
          view_count: number | null
        }
        Insert: {
          access_code?: string | null
          created_at?: string | null
          id?: string | null
          manager_name?: string | null
          organization_id?: string | null
          property_name?: string | null
          status?: string | null
          view_count?: number | null
        }
        Update: {
          access_code?: string | null
          created_at?: string | null
          id?: string | null
          manager_name?: string | null
          organization_id?: string | null
          property_name?: string | null
          status?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "insight_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_old_pin_attempts: { Args: never; Returns: undefined }
      get_user_org_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      track_dossier_view: { Args: { p_dossier_id: string }; Returns: undefined }
      track_insight_view: { Args: { p_report_id: string }; Returns: undefined }
      use_magic_link: { Args: { p_token: string }; Returns: boolean }
      validate_assessment_link: { Args: { p_token: string }; Returns: Json }
      validate_magic_link: { Args: { p_token: string }; Returns: Json }
      verify_dossier_pin: {
        Args: { p_pin: string; p_unique_code: string }
        Returns: Json
      }
      verify_insight_pin: {
        Args: { p_access_code: string; p_pin: string }
        Returns: Json
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
