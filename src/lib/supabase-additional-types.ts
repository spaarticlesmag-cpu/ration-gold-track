// Module augmentation for Supabase database types
// Extends the existing Database interface with our custom tables and functions

import '@supabase/supabase-js'

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

declare module '@supabase/supabase-js' {
  interface Database {
    Tables: {
      // Voice navigation tables
      offline_packages: {
        Row: {
          id: string
          package_name: string
          package_type: 'voice_pack' | 'map_region' | 'language_data'
          language_code: string | null
          region_name: string | null
          file_path: string
          file_size_bytes: number
          version: string
          checksum: string
          is_active: boolean
          download_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          package_name: string
          package_type: 'voice_pack' | 'map_region' | 'language_data'
          language_code?: string | null
          region_name?: string | null
          file_path: string
          file_size_bytes: number
          version?: string
          checksum: string
          is_active?: boolean
          download_count?: number
        }
        Update: {
          id?: string
          package_name?: string
          package_type?: 'voice_pack' | 'map_region' | 'language_data'
          language_code?: string | null
          region_name?: string | null
          file_path?: string
          file_size_bytes?: number
          version?: string
          checksum?: string
          is_active?: boolean
          download_count?: number
        }
      }
      traffic_data: {
        Row: {
          id: string
          location_lat: number
          location_lng: number
          road_segment_id: string | null
          traffic_level: 'free_flow' | 'light' | 'moderate' | 'heavy' | 'congestion'
          average_speed_kmh: number | null
          congestion_factor: number | null
          incident_type: 'accident' | 'construction' | 'road_closure' | 'weather' | 'special_event' | null
          incident_description: string | null
          data_source: string
          confidence_score: number
          timestamp: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          location_lat: number
          location_lng: number
          road_segment_id?: string | null
          traffic_level: 'free_flow' | 'light' | 'moderate' | 'heavy' | 'congestion'
          average_speed_kmh?: number | null
          congestion_factor?: number | null
          incident_type?: 'accident' | 'construction' | 'road_closure' | 'weather' | 'special_event' | null
          incident_description?: string | null
          data_source?: string
          confidence_score: number
          timestamp?: string
          expires_at: string
        }
        Update: {
          id?: string
          location_lat?: number
          location_lng?: number
          road_segment_id?: string | null
          traffic_level?: 'free_flow' | 'light' | 'moderate' | 'heavy' | 'congestion'
          average_speed_kmh?: number | null
          congestion_factor?: number | null
          incident_type?: 'accident' | 'construction' | 'road_closure' | 'weather' | 'special_event' | null
          incident_description?: string | null
          data_source?: string
          confidence_score?: number
          timestamp?: string
          expires_at?: string
        }
      }
      device_offline_packages: {
        Row: {
          id: string
          device_id: string
          user_id: string
          package_id: string
          downloaded_at: string
          last_accessed_at: string | null
          storage_path: string | null
          is_corrupted: boolean
        }
        Insert: {
          id?: string
          device_id: string
          user_id: string
          package_id: string
          downloaded_at?: string
          last_accessed_at?: string | null
          storage_path?: string | null
          is_corrupted?: boolean
        }
        Update: {
          id?: string
          device_id?: string
          user_id?: string
          package_id?: string
          downloaded_at?: string
          last_accessed_at?: string | null
          storage_path?: string | null
          is_corrupted?: boolean
        }
      }
      navigation_session_logs: {
        Row: {
          id: string
          session_id: string
          user_id: string
          order_id: string | null
          start_time: string
          end_time: string | null
          total_distance_meters: number | null
          total_duration_seconds: number | null
          average_speed_kmh: number | null
          navigation_mode: 'online' | 'offline' | 'hybrid' | null
          reroute_count: number
          traffic_delay_minutes: number
          language_used: string | null
          voice_instructions_count: number
          audio_files_used: number
          speech_synthesis_used: number
          offline_packages_used: string[] | null
          feedback_score: number | null
          user_feedback: string | null
          error_count: number
          battery_drain_percentage: number | null
          network_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          order_id?: string | null
          start_time: string
          end_time?: string | null
          total_distance_meters?: number | null
          total_duration_seconds?: number | null
          average_speed_kmh?: number | null
          navigation_mode?: 'online' | 'offline' | 'hybrid' | null
          reroute_count?: number
          traffic_delay_minutes?: number
          language_used?: string | null
          voice_instructions_count?: number
          audio_files_used?: number
          speech_synthesis_used?: number
          offline_packages_used?: string[] | null
          feedback_score?: number | null
          user_feedback?: string | null
          error_count?: number
          battery_drain_percentage?: number | null
          network_type?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          order_id?: string | null
          start_time?: string
          end_time?: string | null
          total_distance_meters?: number | null
          total_duration_seconds?: number | null
          average_speed_kmh?: number | null
          navigation_mode?: 'online' | 'offline' | 'hybrid' | null
          reroute_count?: number
          traffic_delay_minutes?: number
          language_used?: string | null
          voice_instructions_count?: number
          audio_files_used?: number
          speech_synthesis_used?: number
          offline_packages_used?: string[] | null
          feedback_score?: number | null
          user_feedback?: string | null
          error_count?: number
          battery_drain_percentage?: number | null
          network_type?: string | null
        }
      }
      // Chat system tables
      chat_rooms: {
        Row: {
          id: string
          room_type: 'order_delivery' | 'customer_support' | 'admin_broadcast' | 'emergency'
          room_name: string | null
          order_id: string | null
          created_by: string
          is_active: boolean
          participant_count: number
          last_message_at: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_type: 'order_delivery' | 'customer_support' | 'admin_broadcast' | 'emergency'
          room_name?: string | null
          order_id?: string | null
          created_by: string
          is_active?: boolean
          participant_count?: number
          last_message_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          room_type?: 'order_delivery' | 'customer_support' | 'admin_broadcast' | 'emergency'
          room_name?: string | null
          order_id?: string | null
          created_by?: string
          is_active?: boolean
          participant_count?: number
          last_message_at?: string | null
          metadata?: Json | null
        }
      }
      chat_participants: {
        Row: {
          id: string
          room_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          joined_at: string
          last_seen_at: string | null
          is_active: boolean
          notifications_enabled: boolean
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          last_seen_at?: string | null
          is_active?: boolean
          notifications_enabled?: boolean
        }
      }
      chat_messages: {
        Row: {
          id: string
          room_id: string
          sender_id: string
          message_type: 'text' | 'image' | 'file' | 'location' | 'system' | 'typing_indicator'
          content: string | null
          metadata: Json | null
          reply_to_message_id: string | null
          is_edited: boolean
          edited_at: string | null
          is_deleted: boolean
          deleted_at: string | null
          read_by: string[]
          delivered_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          sender_id: string
          message_type?: 'text' | 'image' | 'file' | 'location' | 'system' | 'typing_indicator'
          content?: string | null
          metadata?: Json | null
          reply_to_message_id?: string | null
        }
        Update: {
          id?: string
          room_id?: string
          sender_id?: string
          message_type?: 'text' | 'image' | 'file' | 'location' | 'system' | 'typing_indicator'
          content?: string | null
          metadata?: Json | null
          reply_to_message_id?: string | null
          is_edited?: boolean
          edited_at?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
          read_by?: string[]
          delivered_at?: string | null
        }
      }
      chat_typing_indicators: {
        Row: {
          id: string
          room_id: string
          user_id: string
          started_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
        }
      }
      push_notification_tokens: {
        Row: {
          id: string
          user_id: string
          device_id: string
          platform: 'ios' | 'android' | 'web' | 'desktop'
          token: string
          is_active: boolean
          last_used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_id: string
          platform: 'ios' | 'android' | 'web' | 'desktop'
          token: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string
          platform?: 'ios' | 'android' | 'web' | 'desktop'
          token?: string
          is_active?: boolean
          last_used_at?: string | null
        }
      }
      chat_file_attachments: {
        Row: {
          id: string
          message_id: string
          file_name: string
          file_path: string
          file_size_bytes: number
          mime_type: string
          checksum: string | null
          uploaded_by: string
          is_image: boolean
          image_width: number | null
          image_height: number | null
          thumbnail_path: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          file_name: string
          file_path: string
          file_size_bytes: number
          mime_type: string
          checksum?: string | null
          uploaded_by: string
          is_image?: boolean
        }
        Update: {
          id?: string
          message_id?: string
          file_name?: string
          file_path?: string
          file_size_bytes?: number
          mime_type?: string
          checksum?: string | null
          uploaded_by?: string
          image_width?: number | null
          image_height?: number | null
          thumbnail_path?: string | null
          expires_at?: string | null
        }
      }
      // Document verification tables
      document_scans: {
        Row: {
          id: string
          user_id: string
          profile_id: string
          document_type: 'aadhaar_card' | 'ration_card' | 'driving_license' | 'passport' | 'voter_id'
          file_name: string
          file_path: string
          file_size_bytes: number
          mime_type: string
          checksum: string
          ocr_extracted_text: string | null
          confidence_score: number | null
          extracted_data: Json | null
          face_detection: Json | null
          fraud_score: number | null
          authenticity_verdict: 'authentic' | 'suspicious' | 'fraudulent' | 'pending' | 'error' | null
          image_quality_score: number | null
          brightness_score: number | null
          contrast_score: number | null
          sharpness_score: number | null
          glare_detected: boolean | null
          blur_detected: boolean | null
          ai_model_version: string | null
          processing_time_ms: number | null
          error_message: string | null
          verified_by: string | null
          verified_at: string | null
          manual_override: boolean | null
          override_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_id: string
          document_type: 'aadhaar_card' | 'ration_card' | 'driving_license' | 'passport' | 'voter_id'
          file_name: string
          file_path: string
          file_size_bytes: number
          mime_type: string
          checksum: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string
          document_type?: 'aadhaar_card' | 'ration_card' | 'driving_license' | 'passport' | 'voter_id'
          file_name?: string
          file_path?: string
          file_size_bytes?: number
          mime_type?: string
          checksum?: string
          ocr_extracted_text?: string | null
          confidence_score?: number | null
          extracted_data?: Json | null
          face_detection?: Json | null
          fraud_score?: number | null
          authenticity_verdict?: 'authentic' | 'suspicious' | 'fraudulent' | 'pending' | 'error' | null
          image_quality_score?: number | null
          brightness_score?: number | null
          contrast_score?: number | null
          sharpness_score?: number | null
          glare_detected?: boolean | null
          blur_detected?: boolean | null
          ai_model_version?: string | null
          processing_time_ms?: number | null
          error_message?: string | null
          verified_by?: string | null
          verified_at?: string | null
          manual_override?: boolean | null
          override_reason?: string | null
        }
      }
      document_verification_rules: {
        Row: {
          id: string
          rule_name: string
          document_type: string
          rule_type: 'format_validation' | 'data_consistency' | 'image_quality' | 'face_detection' | 'content_analysis'
          rule_config: Json
          severity_level: 'low' | 'medium' | 'high' | 'critical'
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rule_name: string
          document_type: string
          rule_type: 'format_validation' | 'data_consistency' | 'image_quality' | 'face_detection' | 'content_analysis'
          rule_config: Json
          severity_level?: 'low' | 'medium' | 'high' | 'critical'
          is_active?: boolean
          created_by: string
        }
        Update: {
          id?: string
          rule_name?: string
          document_type?: string
          rule_type?: 'format_validation' | 'data_consistency' | 'image_quality' | 'face_detection' | 'content_analysis'
          rule_config?: Json
          severity_level?: 'low' | 'medium' | 'high' | 'critical'
          is_active?: boolean
          created_by?: string
        }
      }
      document_scan_logs: {
        Row: {
          id: string
          scan_id: string
          action: string
          old_status: string | null
          new_status: string | null
          details: Json | null
          performed_by: string | null
          ip_address: string | null
          performed_at: string
        }
        Insert: {
          id?: string
          scan_id: string
          action: string
          old_status?: string | null
          new_status?: string | null
          details?: Json | null
          performed_by?: string | null
          ip_address?: string | null
        }
        Update: {
          id?: string
          scan_id?: string
          action?: string
          old_status?: string | null
          new_status?: string | null
          details?: Json | null
          performed_by?: string | null
          ip_address?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never;
    }
    Functions: {
      // Chat functions
      create_order_delivery_room: {
        Args: { p_order_id: string; p_delivery_partner_id: string; p_customer_id: string }
        Returns: string
      }
      send_chat_message: {
        Args: {
          p_room_id: string
          p_content: string
          p_message_type?: 'text' | 'image' | 'file' | 'location' | 'system' | 'typing_indicator'
          p_metadata?: Json
          p_reply_to?: string | null
        }
        Returns: string
      }
      mark_messages_read: {
        Args: { p_room_id: string; p_message_ids: string[] }
        Returns: void
      }
      get_unread_message_count: {
        Args: { p_user_id?: string }
        Returns: number
      }
      update_typing_indicator: {
        Args: { p_room_id: string; p_is_typing: boolean }
        Returns: void
      }

      // Voice navigation functions
      download_offline_package: {
        Args: { p_device_id: string; p_package_id: string }
        Returns: boolean
      }
      get_traffic_aware_route: {
        Args: {
          start_lat: number
          start_lng: number
          end_lat: number
          end_lng: number
          route_points?: Json[]
        }
        Returns: Json
      }
      log_navigation_session: {
        Args: {
          p_session_id: string
          p_order_id?: string | null
          p_start_time: string
          p_end_time?: string | null
          p_stats?: Json
        }
        Returns: string
      }

      // Document verification functions
      verify_document_scan: {
        Args: {
          p_scan_id: string
          p_extracted_data: Json
          p_face_detection: Json
          p_fraud_score: number
          p_authenticity_verdict: string
          p_quality_scores: Json
          p_model_version?: string
        }
        Returns: boolean
      }
      check_document_quality: {
        Args: { p_file_path: string; p_document_type: string }
        Returns: Json
      }
      detect_document_fraud: {
        Args: {
          p_document_type: string
          p_extracted_data: Json
          p_face_detection: Json
          p_quality_score: number
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never;
    }
    CompositeTypes: {
      [_ in never]: never;
    }
  }
}
