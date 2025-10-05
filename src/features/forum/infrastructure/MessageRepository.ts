/**
 * Message Repository
 * Data access layer for private messaging
 */

import { supabase } from '@/core/infrastructure/supabase/client';
import { Result } from '@/core/domain/base/Result';
import { ForumMapper } from './ForumMapper';
import { Message, CreateMessageData } from '../domain/Forum.types';

export class MessageRepository {
  async getConversations(userId: string): Promise<Result<Message[], Error>> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:app_users!messages_sender_id_fkey(username, avatar_url),
          receiver:app_users!messages_receiver_id_fkey(username, avatar_url)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const messages = (data || []).map((msg) => ({
        ...ForumMapper.toMessage(msg),
        senderUsername: msg.sender?.username,
        senderAvatar: msg.sender?.avatar_url,
        receiverUsername: msg.receiver?.username,
        receiverAvatar: msg.receiver?.avatar_url,
      }));

      return Result.ok(messages);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async getConversationWith(
    userId: string,
    otherUserId: string
  ): Promise<Result<Message[], Error>> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:app_users!messages_sender_id_fkey(username, avatar_url),
          receiver:app_users!messages_receiver_id_fkey(username, avatar_url)
        `)
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
        )
        .order('created_at');

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const messages = (data || []).map((msg) => ({
        ...ForumMapper.toMessage(msg),
        senderUsername: msg.sender?.username,
        senderAvatar: msg.sender?.avatar_url,
        receiverUsername: msg.receiver?.username,
        receiverAvatar: msg.receiver?.avatar_url,
      }));

      return Result.ok(messages);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async sendMessage(
    senderId: string,
    data: CreateMessageData
  ): Promise<Result<Message, Error>> {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: data.receiverId,
          content: data.content,
          media_urls: data.mediaUrls || [],
        })
        .select()
        .single();

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(ForumMapper.toMessage(message));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async markAsRead(
    messageIds: string[]
  ): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', messageIds);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<Result<boolean, Error>> {
    try {
      const { data: message } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .eq('id', messageId)
        .single();

      if (!message) {
        return Result.fail(new Error('Message not found'));
      }

      const updateData: Record<string, boolean> = {};
      if (message.sender_id === userId) {
        updateData.is_deleted_by_sender = true;
      }
      if (message.receiver_id === userId) {
        updateData.is_deleted_by_receiver = true;
      }

      const { error } = await supabase
        .from('messages')
        .update(updateData)
        .eq('id', messageId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }
}
