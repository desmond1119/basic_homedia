/**
 * Message Slice
 * Redux state management for private messaging
 */

import { createSlice } from '@reduxjs/toolkit';
import { MessageRepository } from '../infrastructure/MessageRepository';
import { createAsyncThunkWithError } from '@/core/store/base/createAsyncThunkWithError';
import { AsyncState, initialAsyncState } from '@/core/store/base/LoadingState';
import { Message, CreateMessageData } from '../domain/Forum.types';

interface MessageState {
  conversations: Message[];
  currentConversation: Message[];
  selectedUserId: string | null;
  fetchConversations: AsyncState;
  fetchConversation: AsyncState;
  sendMessage: AsyncState;
}

const initialState: MessageState = {
  conversations: [],
  currentConversation: [],
  selectedUserId: null,
  fetchConversations: initialAsyncState,
  fetchConversation: initialAsyncState,
  sendMessage: initialAsyncState,
};

const messageRepository = new MessageRepository();

export const fetchConversations = createAsyncThunkWithError<Message[], string>(
  'messages/fetchConversations',
  async (userId) => {
    return await messageRepository.getConversations(userId);
  }
);

export const fetchConversationWith = createAsyncThunkWithError<
  Message[],
  { userId: string; otherUserId: string }
>(
  'messages/fetchConversationWith',
  async ({ userId, otherUserId }) => {
    return await messageRepository.getConversationWith(userId, otherUserId);
  }
);

export const sendMessage = createAsyncThunkWithError<
  Message,
  { senderId: string; data: CreateMessageData }
>(
  'messages/sendMessage',
  async ({ senderId, data }) => {
    return await messageRepository.sendMessage(senderId, data);
  }
);

export const markMessagesAsRead = createAsyncThunkWithError<boolean, string[]>(
  'messages/markAsRead',
  async (messageIds) => {
    return await messageRepository.markAsRead(messageIds);
  }
);

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    selectConversation: (state, action) => {
      state.selectedUserId = action.payload;
    },
    clearCurrentConversation: (state) => {
      state.currentConversation = [];
      state.selectedUserId = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Conversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.fetchConversations.status = 'pending';
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.fetchConversations.status = 'succeeded';
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.fetchConversations.status = 'failed';
        state.fetchConversations.error = action.payload?.message ?? 'Failed to fetch conversations';
      });

    // Fetch Conversation With User
    builder
      .addCase(fetchConversationWith.pending, (state) => {
        state.fetchConversation.status = 'pending';
      })
      .addCase(fetchConversationWith.fulfilled, (state, action) => {
        state.fetchConversation.status = 'succeeded';
        state.currentConversation = action.payload;
      })
      .addCase(fetchConversationWith.rejected, (state, action) => {
        state.fetchConversation.status = 'failed';
        state.fetchConversation.error = action.payload?.message ?? 'Failed to fetch conversation';
      });

    // Send Message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.sendMessage.status = 'pending';
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendMessage.status = 'succeeded';
        state.currentConversation.push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendMessage.status = 'failed';
        state.sendMessage.error = action.payload?.message ?? 'Failed to send message';
      });
  },
});

export const { selectConversation, clearCurrentConversation } = messageSlice.actions;
export const messageReducer = messageSlice.reducer;
