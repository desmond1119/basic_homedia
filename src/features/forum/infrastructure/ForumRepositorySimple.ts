import { supabase } from '@/core/infrastructure/supabase/client';
import { ForumMapper } from './ForumMapper';
import { Category, Post, CreatePostData } from '../domain/Forum.types';

export class ForumRepositorySimple {
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => ForumMapper.toCategory(row));
  }

  async getPosts(categoryId?: string, limit = 20, offset = 0): Promise<Post[]> {
    let query = supabase
      .from('posts_with_user')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    
    return (data || []).map((row: any) => ForumMapper.toPost(row));
  }

  async getPostById(postId: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts_with_user')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    return ForumMapper.toPost(data);
  }

  async createPost(userId: string, data: CreatePostData): Promise<Post> {
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        category_id: data.categoryId,
        title: data.title,
        content: data.content,
        tags: data.tags || [],
        media_urls: data.mediaUrls || [],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const fullPost = await this.getPostById(post.id);
    if (!fullPost) throw new Error('Failed to fetch created post');

    return fullPost;
  }

  async uploadMedia(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('forum-media')
      .upload(fileName, file);

    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage
      .from('forum-media')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  subscribeToNewPosts(categoryId: string | null, callback: (post: Post) => void): () => void {
    const channel = supabase
      .channel(`posts${categoryId ? `:${categoryId}` : ''}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: categoryId ? `category_id=eq.${categoryId}` : undefined,
        },
        async (payload) => {
          const post = await this.getPostById(payload.new.id as string);
          if (post) callback(post);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }
}
