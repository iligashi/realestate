import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import messageAPI from '../../services/messageAPI';

// Async thunks
export const createMessage = createAsyncThunk(
  'messages/createMessage',
  async (messageData, { rejectWithValue }) => {
    try {
      const response = await messageAPI.createMessage(messageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to send message');
    }
  }
);

export const getMessages = createAsyncThunk(
  'messages/getMessages',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await messageAPI.getMessages(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch messages');
    }
  }
);

export const getMessageThread = createAsyncThunk(
  'messages/getMessageThread',
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await messageAPI.getMessageThread(messageId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch message thread');
    }
  }
);

export const replyToMessage = createAsyncThunk(
  'messages/replyToMessage',
  async ({ messageId, message }, { rejectWithValue }) => {
    try {
      const response = await messageAPI.replyToMessage(messageId, message);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to send reply');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'messages/markAsRead',
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await messageAPI.markAsRead(messageId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to mark as read');
    }
  }
);

export const getUnreadCount = createAsyncThunk(
  'messages/getUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await messageAPI.getUnreadCount();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get unread count');
    }
  }
);

export const closeMessage = createAsyncThunk(
  'messages/closeMessage',
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await messageAPI.closeMessage(messageId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to close message');
    }
  }
);

const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    messages: [],
    currentThread: null,
    unreadCount: 0,
    loading: false,
    error: null,
    pagination: {
      current: 1,
      pages: 1,
      total: 0
    }
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentThread: (state) => {
      state.currentThread = null;
    },
    updateUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Message
      .addCase(createMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMessage.fulfilled, (state, action) => {
        state.loading = false;
        // Add new message to the beginning of the list
        state.messages.unshift(action.payload.data);
        state.unreadCount += 1;
      })
      .addCase(createMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Messages
      .addCase(getMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.messages;
        state.pagination = action.payload.pagination;
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Message Thread
      .addCase(getMessageThread.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMessageThread.fulfilled, (state, action) => {
        state.loading = false;
        state.currentThread = action.payload.message;
      })
      .addCase(getMessageThread.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Reply to Message
      .addCase(replyToMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(replyToMessage.fulfilled, (state, action) => {
        state.loading = false;
        // Update current thread
        if (state.currentThread && state.currentThread._id === action.payload.data._id) {
          state.currentThread = action.payload.data;
        }
        // Update message in list
        const index = state.messages.findIndex(msg => msg._id === action.payload.data._id);
        if (index !== -1) {
          state.messages[index] = action.payload.data;
        }
      })
      .addCase(replyToMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark as Read
      .addCase(markAsRead.fulfilled, (state, action) => {
        // Update message in list
        const index = state.messages.findIndex(msg => msg._id === action.meta.arg);
        if (index !== -1) {
          state.messages[index].readBy = action.payload.readBy;
        }
        // Update current thread
        if (state.currentThread && state.currentThread._id === action.meta.arg) {
          state.currentThread.readBy = action.payload.readBy;
        }
      })

      // Get Unread Count
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.unreadCount;
      })

      // Close Message
      .addCase(closeMessage.fulfilled, (state, action) => {
        // Update message in list
        const index = state.messages.findIndex(msg => msg._id === action.meta.arg);
        if (index !== -1) {
          state.messages[index].status = 'closed';
        }
        // Update current thread
        if (state.currentThread && state.currentThread._id === action.meta.arg) {
          state.currentThread.status = 'closed';
        }
      });
  }
});

export const { clearError, clearCurrentThread, updateUnreadCount } = messageSlice.actions;
export default messageSlice.reducer;
