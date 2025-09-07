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
      
      // Wait 400ms before making the API call (debounce effect)
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Fetching users with filters:', filters);
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

// ==================== NEW: PLATFORM SETTINGS ====================
export const fetchPlatformSettings = createAsyncThunk(
  'admin/fetchPlatformSettings',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await adminAPI.getPlatformSettings(token);
      return adminAPI.handleResponse(response);
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

export const updatePlatformSettings = createAsyncThunk(
  'admin/updatePlatformSettings',
  async (settingsData, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await adminAPI.updatePlatformSettings(settingsData, token);
      return adminAPI.handleResponse(response);
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

// ==================== NEW: FEATURED LISTINGS ====================
export const fetchFeaturedListings = createAsyncThunk(
  'admin/fetchFeaturedListings',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await adminAPI.getFeaturedListings(token);
      return adminAPI.handleResponse(response);
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

export const updateFeaturedListing = createAsyncThunk(
  'admin/updateFeaturedListing',
  async ({ listingId, featuredData }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await adminAPI.updateFeaturedListing(listingId, featuredData, token);
      return adminAPI.handleResponse(response);
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

// ==================== NEW: SYSTEM ANNOUNCEMENTS ====================
export const fetchAnnouncements = createAsyncThunk(
  'admin/fetchAnnouncements',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await adminAPI.getAnnouncements(token);
      return adminAPI.handleResponse(response);
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

export const createAnnouncement = createAsyncThunk(
  'admin/createAnnouncement',
  async (announcementData, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await adminAPI.createAnnouncement(announcementData, token);
      return adminAPI.handleResponse(response);
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

export const updateAnnouncement = createAsyncThunk(
  'admin/updateAnnouncement',
  async ({ announcementId, announcementData }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await adminAPI.updateAnnouncement(announcementId, announcementData, token);
      return adminAPI.handleResponse(response);
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

export const deleteAnnouncement = createAsyncThunk(
  'admin/deleteAnnouncement',
  async (announcementId, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      await adminAPI.deleteAnnouncement(announcementId, token);
      return announcementId;
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

// ==================== NEW: ENHANCED ANALYTICS ====================
export const fetchEnhancedAnalytics = createAsyncThunk(
  'admin/fetchEnhancedAnalytics',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await adminAPI.getEnhancedAnalytics(token);
      return adminAPI.handleResponse(response);
    } catch (error) {
      return rejectWithValue(adminAPI.handleError(error));
    }
  }
);

// ==================== NEW: REVENUE ANALYTICS ====================
export const fetchRevenueAnalytics = createAsyncThunk(
  'admin/fetchRevenueAnalytics',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await adminAPI.getRevenueAnalytics(token);
      return adminAPI.handleResponse(response);
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
  // Analytics
  analytics: {
    users: { total: 0, active: 0, blocked: 0 },
    listings: { total: 0, pending: 0, approved: 0, rejected: 0 },
    reports: { total: 0, pending: 0, resolved: 0 }
  },

  // Users
  users: {
    list: [],
    filters: {
      search: '',
      role: '',
      status: '',
      page: 1,
      limit: 10
    },
    total: 0
  },

  // Listings
  listings: {
    list: [],
    filters: {
      search: '',
      status: '',
      propertyType: '',
      page: 1,
      limit: 10
    },
    total: 0
  },

  // Reports
  reports: {
    list: [],
    filters: {
      search: '',
      status: '',
      type: '',
      priority: '',
      page: 1,
      limit: 10
    },
    total: 0
  },

  // NEW: Platform Settings
  platformSettings: null,

  // NEW: Featured Listings
  featuredListings: {
    list: [],
    total: 0
  },

  // NEW: System Announcements
  announcements: {
    list: [],
    total: 0
  },

  // NEW: Enhanced Analytics
  enhancedAnalytics: null,

  // NEW: Revenue Analytics
  revenueAnalytics: {
    totalRevenue: 0,
    monthlyRevenue: [],
    commissionEarnings: 0,
    featuredListingRevenue: 0
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
      })



      // ==================== PLATFORM SETTINGS ====================
      .addCase(fetchPlatformSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlatformSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.platformSettings = action.payload;
      })
      .addCase(fetchPlatformSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updatePlatformSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePlatformSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.platformSettings = action.payload;
        state.successMessage = 'Platform settings updated successfully';
      })
      .addCase(updatePlatformSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ==================== FEATURED LISTINGS ====================
      .addCase(fetchFeaturedListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedListings.fulfilled, (state, action) => {
        state.loading = false;
        state.featuredListings.list = action.payload.listings;
        state.featuredListings.total = action.payload.total;
      })
      .addCase(fetchFeaturedListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ==================== SYSTEM ANNOUNCEMENTS ====================
      .addCase(fetchAnnouncements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.loading = false;
        state.announcements.list = action.payload.announcements;
        state.announcements.total = action.payload.total;
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createAnnouncement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAnnouncement.fulfilled, (state, action) => {
        state.loading = false;
        state.announcements.list.unshift(action.payload.announcement);
        state.announcements.total += 1;
        state.successMessage = 'Announcement created successfully';
      })
      .addCase(createAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateAnnouncement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAnnouncement.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.announcements.list.findIndex(announcement => announcement._id === action.payload.announcement._id);
        if (index !== -1) {
          state.announcements.list[index] = action.payload.announcement;
        }
        state.successMessage = 'Announcement updated successfully';
      })
      .addCase(updateAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteAnnouncement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAnnouncement.fulfilled, (state, action) => {
        state.loading = false;
        state.announcements.list = state.announcements.list.filter(announcement => announcement._id !== action.payload);
        state.announcements.total -= 1;
        state.successMessage = 'Announcement deleted successfully';
      })
      .addCase(deleteAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateFeaturedListing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFeaturedListing.fulfilled, (state, action) => {
        state.loading = false;
        // Update listing in the featured list
        const index = state.featuredListings.list.findIndex(listing => listing._id === action.payload.listing._id);
        if (index !== -1) {
          state.featuredListings.list[index] = action.payload.listing;
        }
        state.successMessage = 'Featured listing updated successfully';
      })
      .addCase(updateFeaturedListing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ==================== ENHANCED ANALYTICS ====================
      .addCase(fetchEnhancedAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnhancedAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.enhancedAnalytics = action.payload;
      })
      .addCase(fetchEnhancedAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ==================== REVENUE ANALYTICS ====================
      .addCase(fetchRevenueAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRevenueAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.revenueAnalytics = action.payload;
      })
      .addCase(fetchRevenueAnalytics.rejected, (state, action) => {
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
