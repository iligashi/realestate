import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../services/adminAPI';

// ==================== ASYNC THUNKS ====================

// Dashboard Analytics
export const fetchDashboardAnalytics = createAsyncThunk(
  'admin/fetchDashboardAnalytics',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await adminAPI.getDashboardAnalytics(token);
      return adminAPI.handleResponse(response);
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

// User Management
export const fetchAllUsers = createAsyncThunk(
  'admin/fetchAllUsers',
  async (filters = {}, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const params = adminAPI.formatParams(filters);
      const response = await adminAPI.getAllUsers(params, token);
      return adminAPI.handleResponse(response);
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, userData }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await adminAPI.updateUser(userId, userData, token);
      return adminAPI.handleResponse(response);
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      await adminAPI.deleteUser(userId, token);
      return userId;
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

// Listing Management
export const fetchAllListings = createAsyncThunk(
  'admin/fetchAllListings',
  async (filters = {}, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const params = adminAPI.formatParams(filters);
      const response = await adminAPI.getAllListings(params, token);
      return adminAPI.handleResponse(response);
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

export const updateListingStatus = createAsyncThunk(
  'admin/updateListingStatus',
  async ({ listingId, statusData }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await adminAPI.updateListingStatus(listingId, statusData, token);
      return adminAPI.handleResponse(response);
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

export const deleteListing = createAsyncThunk(
  'admin/deleteListing',
  async (listingId, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      await adminAPI.deleteListing(listingId, token);
      return listingId;
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

// Reports & Moderation
export const fetchAllReports = createAsyncThunk(
  'admin/fetchAllReports',
  async (filters = {}, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const params = adminAPI.formatParams(filters);
      const response = await adminAPI.getAllReports(params, token);
      return adminAPI.handleResponse(response);
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

export const resolveReport = createAsyncThunk(
  'admin/resolveReport',
  async ({ reportId, resolutionData }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await adminAPI.resolveReport(reportId, resolutionData, token);
      return adminAPI.handleResponse(response);
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  // Dashboard Analytics
  analytics: {
    users: {},
    listings: {},
    reports: {}
  },
  
  // User Management
  users: {
    list: [],
    total: 0,
    totalPages: 0,
    currentPage: 1,
    filters: {
      search: '',
      role: '',
      status: ''
    }
  },
  
  // Listing Management
  listings: {
    list: [],
    total: 0,
    totalPages: 0,
    currentPage: 1,
    filters: {
      search: '',
      status: '',
      propertyType: ''
    }
  },
  
  // Reports & Moderation
  reports: {
    list: [],
    total: 0,
    totalPages: 0,
    currentPage: 1,
    filters: {
      status: '',
      type: ''
    }
  },
  
  // UI State
  loading: false,
  error: null,
  successMessage: null
};

// ==================== SLICE ====================

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    // Clear messages
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    
    // Update filters
    updateUserFilters: (state, action) => {
      state.users.filters = { ...state.users.filters, ...action.payload };
    },
    updateListingFilters: (state, action) => {
      state.listings.filters = { ...state.listings.filters, ...action.payload };
    },
    updateReportFilters: (state, action) => {
      state.reports.filters = { ...state.reports.filters, ...action.payload };
    },
    
    // Reset filters
    resetUserFilters: (state) => {
      state.users.filters = initialState.users.filters;
    },
    resetListingFilters: (state) => {
      state.listings.filters = initialState.listings.filters;
    },
    resetReportFilters: (state) => {
      state.reports.filters = initialState.reports.filters;
    }
  },
  extraReducers: (builder) => {
    builder
      // ==================== DASHBOARD ANALYTICS ====================
      .addCase(fetchDashboardAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchDashboardAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ==================== USER MANAGEMENT ====================
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users.list = action.payload.users;
        state.users.total = action.payload.total;
        state.users.totalPages = action.payload.totalPages;
        state.users.currentPage = action.payload.currentPage;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        // Update user in the list
        const index = state.users.list.findIndex(user => user._id === action.payload.user._id);
        if (index !== -1) {
          state.users.list[index] = action.payload.user;
        }
        state.successMessage = action.payload.message;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        // Remove user from the list
        state.users.list = state.users.list.filter(user => user._id !== action.payload);
        state.successMessage = 'User deleted successfully';
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ==================== LISTING MANAGEMENT ====================
      .addCase(fetchAllListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllListings.fulfilled, (state, action) => {
        state.loading = false;
        state.listings.list = action.payload.listings;
        state.listings.total = action.payload.total;
        state.listings.totalPages = action.payload.totalPages;
        state.listings.currentPage = action.payload.currentPage;
      })
      .addCase(fetchAllListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(updateListingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateListingStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Update listing in the list
        const index = state.listings.list.findIndex(listing => listing._id === action.payload.listing._id);
        if (index !== -1) {
          state.listings.list[index] = action.payload.listing;
        }
        state.successMessage = action.payload.message;
      })
      .addCase(updateListingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(deleteListing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteListing.fulfilled, (state, action) => {
        state.loading = false;
        // Remove listing from the list
        state.listings.list = state.listings.list.filter(listing => listing._id !== action.payload);
        state.successMessage = 'Listing deleted successfully';
      })
      .addCase(deleteListing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ==================== REPORTS & MODERATION ====================
      .addCase(fetchAllReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports.list = action.payload.reports;
        state.reports.total = action.payload.total;
        state.reports.totalPages = action.payload.totalPages;
        state.reports.currentPage = action.payload.currentPage;
      })
      .addCase(fetchAllReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(resolveReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resolveReport.fulfilled, (state, action) => {
        state.loading = false;
        // Update report in the list
        const index = state.reports.list.findIndex(report => report._id === action.payload.report._id);
        if (index !== -1) {
          state.reports.list[index] = action.payload.report;
        }
        state.successMessage = action.payload.message;
      })
      .addCase(resolveReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// ==================== EXPORTS ====================

export const {
  clearError,
  clearSuccessMessage,
  updateUserFilters,
  updateListingFilters,
  updateReportFilters,
  resetUserFilters,
  resetListingFilters,
  resetReportFilters
} = adminSlice.actions;

export default adminSlice.reducer;
