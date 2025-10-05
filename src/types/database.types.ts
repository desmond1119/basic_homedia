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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          completed_projects: number | null
          created_at: string | null
          email: string
          email_verified: boolean | null
          experience_years: number | null
          founded_year: number | null
          full_name: string | null
          id: string
          is_active: boolean | null
          location: string | null
          logo_url: string | null
          overall_rating: number | null
          phone: string | null
          price_range: Json | null
          provider_type_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          social_links: Json | null
          team_size: number | null
          total_reviews: number | null
          updated_at: string | null
          username: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          completed_projects?: number | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          experience_years?: number | null
          founded_year?: number | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          location?: string | null
          logo_url?: string | null
          overall_rating?: number | null
          phone?: string | null
          price_range?: Json | null
          provider_type_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          social_links?: Json | null
          team_size?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          username: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          completed_projects?: number | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          experience_years?: number | null
          founded_year?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          logo_url?: string | null
          overall_rating?: number | null
          phone?: string | null
          price_range?: Json | null
          provider_type_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          social_links?: Json | null
          team_size?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          username?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_users_provider_type_id_fkey"
            columns: ["provider_type_id"]
            isOneToOne: false
            referencedRelation: "provider_types"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "provider_full_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "provider_full_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          like_count: number | null
          media_urls: string[] | null
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments_with_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "provider_full_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          followed_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          followed_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          followed_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "provider_full_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "provider_full_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "provider_full_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_deleted_by_receiver: boolean | null
          is_deleted_by_sender: boolean | null
          is_read: boolean | null
          media_urls: string[] | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_deleted_by_receiver?: boolean | null
          is_deleted_by_sender?: boolean | null
          is_read?: boolean | null
          media_urls?: string[] | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_deleted_by_receiver?: boolean | null
          is_deleted_by_sender?: boolean | null
          is_read?: boolean | null
          media_urls?: string[] | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "provider_full_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "provider_full_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          bookmark_count: number | null
          category_id: string
          comment_count: number | null
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_pinned: boolean | null
          like_count: number | null
          media_urls: string[] | null
          repost_count: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          bookmark_count?: number | null
          category_id: string
          comment_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          repost_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          bookmark_count?: number | null
          category_id?: string
          comment_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          repost_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "provider_full_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_portfolios: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_featured: boolean | null
          project_type: string | null
          project_year: number | null
          provider_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_featured?: boolean | null
          project_type?: string | null
          project_year?: number | null
          provider_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_featured?: boolean | null
          project_type?: string | null
          project_year?: number | null
          provider_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_portfolios_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_portfolios_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_full_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_portfolios_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_reviews: {
        Row: {
          created_at: string | null
          id: string
          is_verified: boolean | null
          overall_rating: number
          project_type: string | null
          provider_id: string
          ratings_breakdown: Json
          review_text: string | null
          reviewer_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          overall_rating: number
          project_type?: string | null
          provider_id: string
          ratings_breakdown?: Json
          review_text?: string | null
          reviewer_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          overall_rating?: number
          project_type?: string | null
          provider_id?: string
          ratings_breakdown?: Json
          review_text?: string | null
          reviewer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_full_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "provider_full_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_services: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          provider_id: string
          service_key: string
          service_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          provider_id: string
          service_key: string
          service_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          provider_id?: string
          service_key?: string
          service_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_full_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_types: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          type_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          type_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          type_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reposts: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          original_post_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          original_post_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          original_post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reposts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reposts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reposts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reposts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "provider_full_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reposts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      comments_with_user: {
        Row: {
          content: string | null
          created_at: string | null
          id: string | null
          is_deleted: boolean | null
          like_count: number | null
          media_urls: string[] | null
          parent_id: string | null
          post_id: string | null
          updated_at: string | null
          user_avatar: string | null
          user_full_name: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments_with_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "provider_full_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_with_user: {
        Row: {
          bookmark_count: number | null
          category_id: string | null
          category_name: string | null
          category_slug: string | null
          comment_count: number | null
          content: string | null
          created_at: string | null
          id: string | null
          is_deleted: boolean | null
          is_pinned: boolean | null
          like_count: number | null
          media_urls: string[] | null
          repost_count: number | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_avatar: string | null
          user_full_name: string | null
          user_id: string | null
          username: string | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "provider_full_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_full_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          completed_projects: number | null
          created_at: string | null
          email: string | null
          experience_years: number | null
          founded_year: number | null
          full_name: string | null
          id: string | null
          logo_url: string | null
          overall_rating: number | null
          portfolios: Json | null
          price_range: Json | null
          role: Database["public"]["Enums"]["user_role"] | null
          services: Json | null
          social_links: Json | null
          team_size: number | null
          total_reviews: number | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          completed_projects?: number | null
          created_at?: string | null
          email?: string | null
          experience_years?: number | null
          founded_year?: number | null
          full_name?: string | null
          id?: string | null
          logo_url?: string | null
          overall_rating?: number | null
          portfolios?: never
          price_range?: Json | null
          role?: Database["public"]["Enums"]["user_role"] | null
          services?: never
          social_links?: Json | null
          team_size?: number | null
          total_reviews?: number | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          completed_projects?: number | null
          created_at?: string | null
          email?: string | null
          experience_years?: number | null
          founded_year?: number | null
          full_name?: string | null
          id?: string | null
          logo_url?: string | null
          overall_rating?: number | null
          portfolios?: never
          price_range?: Json | null
          role?: Database["public"]["Enums"]["user_role"] | null
          services?: never
          social_links?: Json | null
          team_size?: number | null
          total_reviews?: number | null
          username?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          phone: string | null
          provider_type: string | null
          provider_type_display: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_provider_ratings: {
        Args: { provider_uuid: string }
        Returns: {
          overall_avg: number
          ratings_avg: Json
          total_count: number
        }[]
      }
      get_provider_full_profile: {
        Args: { provider_uuid: string }
        Returns: {
          avatar_url: string
          bio: string
          company_name: string
          completed_projects: number
          experience_years: number
          founded_year: number
          id: string
          logo_url: string
          overall_rating: number
          portfolios: Json
          price_range: Json
          ratings_breakdown: Json
          services: Json
          social_links: Json
          team_size: number
          total_reviews: number
          username: string
        }[]
      }
      get_user_bookmarks: {
        Args: { user_uuid: string }
        Returns: {
          author_avatar: string
          author_username: string
          bookmark_id: string
          comment_count: number
          content: string
          created_at: string
          like_count: number
          post_id: string
          title: string
        }[]
      }
      get_user_profile_with_stats: {
        Args: { user_uuid: string }
        Returns: {
          avatar_url: string
          bio: string
          bookmark_count: number
          company_name: string
          created_at: string
          email: string
          follower_count: number
          following_count: number
          full_name: string
          id: string
          is_active: boolean
          location: string
          post_count: number
          provider_type_id: string
          role: string
          updated_at: string
          username: string
          website: string
        }[]
      }
      get_user_stats: {
        Args: { user_uuid: string }
        Returns: {
          follower_count: number
          following_count: number
          post_count: number
        }[]
      }
      is_username_available: {
        Args: { check_username: string }
        Returns: boolean
      }
      user_follows: {
        Args: { followed_uuid: string; follower_uuid: string }
        Returns: boolean
      }
      user_liked_target: {
        Args: {
          target_type_str: string
          target_uuid: string
          user_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "homeowner" | "provider" | "admin"
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
      user_role: ["homeowner", "provider", "admin"],
    },
  },
} as const
