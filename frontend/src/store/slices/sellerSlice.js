import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sellerAPI } from '../../services/sellerAPI';

// Async thunks
export const getSellerDashboard = createAsyncThunk(
  'seller/getDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await sellerAPI.getDashboard();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch dashboard');
    }
  }
);

export const createPropertyListing = createAsyncThunk(
  'seller/createPropertyListing',
  async (propertyData, { rejectWithValue }) => {
    try {
      const response = await sellerAPI.createPropertyListing(propertyData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create property listing');
    }
  }
);

export const updatePropertyListing = createAsyncThunk(
  'seller/updatePropertyListing',
  async ({ id, propertyData }, { rejectWithValue }) => {
    try {
      const response = await sellerAPI.updatePropertyListing(id, propertyData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update property listing');
    }
  }
);

export const getInquiries = createAsyncThunk(
  'seller/getInquiries',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await sellerAPI.getInquiries(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch inquiries');
    }
  }
);

export const getInquiryDetails = createAsyncThunk(
  'seller/getInquiryDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await sellerAPI.getInquiryDetails(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch inquiry details');
    }
  }
);

export const respondToInquiry = createAsyncThunk(
  'seller/respondToInquiry',
  async ({ id, responseData }, { rejectWithValue }) => {
    try {
      const response = await sellerAPI.respondToInquiry(id, responseData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to respond to inquiry');
    }
  }
);

export const getListingAnalytics = createAsyncThunk(
  'seller/getListingAnalytics',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await sellerAPI.getListingAnalytics(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch analytics');
    }
  }
);

export const updatePropertyPrice = createAsyncThunk(
  'seller/updatePropertyPrice',
  async ({ id, priceData }, { rejectWithValue }) => {
    try {
      const response = await sellerAPI.updatePropertyPrice(id, priceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update property price');
    }
  }
);

export const getPriceHistory = createAsyncThunk(
  'seller/getPriceHistory',
  async (id, { rejectWithValue }) => {
    try {
      const response = await sellerAPI.getPriceHistory(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch price history');
    }
  }
);

export const createOpenHouse = createAsyncThunk(
  'seller/createOpenHouse',
  async (openHouseData, { rejectWithValue }) => {
    try {
      const response = await sellerAPI.createOpenHouse(openHouseData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create open house');
    }
  }
);

export const getOpenHouses = createAsyncThunk(
  'seller/getOpenHouses',
  async (status = 'upcoming', { rejectWithValue }) => {
    try {
      const response = await sellerAPI.getOpenHouses(status);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch open houses');
    }
  }
);

export const getOpenHouseDetails = createAsyncThunk(
  'seller/getOpenHouseDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await sellerAPI.getOpenHouseDetails(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch open house details');
    }
  }
);

export const updateOpenHouse = createAsyncThunk(
  'seller/updateOpenHouse',
  async ({ id, openHouseData }, { rejectWithValue }) => {
    try {
      const response = await sellerAPI.updateOpenHouse(id, openHouseData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update open house');
    }
  }
);

export const cancelOpenHouse = createAsyncThunk(
  'seller/cancelOpenHouse',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await sellerAPI.cancelOpenHouse(id, reason);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to cancel open house');
    }
  }
);

export const getAnalyticsDetails = createAsyncThunk(
  'seller/getAnalyticsDetails',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await sellerAPI.getAnalyticsDetails(propertyId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch analytics details');
    }
  }
);

export const updatePropertyWorkflow = createAsyncThunk(
  'seller/updatePropertyWorkflow',
  async ({ id, workflowData }, { rejectWithValue }) => {
    try {
      const response = await sellerAPI.updatePropertyWorkflow(id, workflowData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update workflow');
    }
  }
);

const initialState = {
  // Dashboard data
  dashboard: {
    properties: [],
    stats: {
      totalProperties: 0,
      activeProperties: 0,
      totalViews: 0,
      totalInquiries: 0,
      totalSaves: 0,
      avgResponseTime: 0,
      upcomingOpenHouses: 0
    },
    inquiryStats: {},
    recentActivity: []
  },
  
  // Properties
  properties: [],
  currentProperty: null,
  
  // Inquiries
  inquiries: [],
  currentInquiry: null,
  inquiryPagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  },
  
  // Analytics
  analytics: [],
  currentAnalytics: null,
  
  // Open Houses
  openHouses: [],
  currentOpenHouse: null,
  
  // Price History
  priceHistory: [],
  
  // UI State
  loading: false,
  error: null,
  activeTab: 'dashboard'
};

const sellerSlice = createSlice({
  name: 'seller',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setCurrentProperty: (state, action) => {
      state.currentProperty = action.payload;
    },
    setCurrentInquiry: (state, action) => {
      state.currentInquiry = action.payload;
    },
    setCurrentAnalytics: (state, action) => {
      state.currentAnalytics = action.payload;
    },
    setCurrentOpenHouse: (state, action) => {
      state.currentOpenHouse = action.payload;
    },
    updatePropertyInList: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.properties.findIndex(prop => prop._id === id);
      if (index !== -1) {
        state.properties[index] = { ...state.properties[index], ...updates };
      }
    },
    updateInquiryInList: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.inquiries.findIndex(inquiry => inquiry._id === id);
      if (index !== -1) {
        state.inquiries[index] = { ...state.inquiries[index], ...updates };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(getSellerDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSellerDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload.dashboard;
        state.properties = action.payload.dashboard.properties;
      })
      .addCase(getSellerDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create Property Listing
      .addCase(createPropertyListing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPropertyListing.fulfilled, (state, action) => {
        state.loading = false;
        state.properties.unshift(action.payload.property);
        state.dashboard.stats.totalProperties += 1;
      })
      .addCase(createPropertyListing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Property Listing
      .addCase(updatePropertyListing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePropertyListing.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.properties.findIndex(prop => prop._id === action.payload.property._id);
        if (index !== -1) {
          state.properties[index] = action.payload.property;
        }
      })
      .addCase(updatePropertyListing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Inquiries
      .addCase(getInquiries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getInquiries.fulfilled, (state, action) => {
        state.loading = false;
        state.inquiries = action.payload.inquiries;
        state.inquiryPagination = action.payload.pagination;
      })
      .addCase(getInquiries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Inquiry Details
      .addCase(getInquiryDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getInquiryDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInquiry = action.payload.inquiry;
      })
      .addCase(getInquiryDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Respond to Inquiry
      .addCase(respondToInquiry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(respondToInquiry.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.inquiries.findIndex(inquiry => inquiry._id === action.payload.inquiry._id);
        if (index !== -1) {
          state.inquiries[index] = action.payload.inquiry;
        }
        if (state.currentInquiry && state.currentInquiry._id === action.payload.inquiry._id) {
          state.currentInquiry = action.payload.inquiry;
        }
      })
      .addCase(respondToInquiry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Listing Analytics
      .addCase(getListingAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getListingAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload.analytics;
      })
      .addCase(getListingAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Property Price
      .addCase(updatePropertyPrice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePropertyPrice.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.properties.findIndex(prop => prop._id === action.payload.property._id);
        if (index !== -1) {
          state.properties[index] = action.payload.property;
        }
      })
      .addCase(updatePropertyPrice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Price History
      .addCase(getPriceHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPriceHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.priceHistory = action.payload.priceHistory;
      })
      .addCase(getPriceHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create Open House
      .addCase(createOpenHouse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOpenHouse.fulfilled, (state, action) => {
        state.loading = false;
        state.openHouses.unshift(action.payload.openHouse);
        state.dashboard.stats.upcomingOpenHouses += 1;
      })
      .addCase(createOpenHouse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Open Houses
      .addCase(getOpenHouses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOpenHouses.fulfilled, (state, action) => {
        state.loading = false;
        state.openHouses = action.payload.openHouses;
      })
      .addCase(getOpenHouses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Open House Details
      .addCase(getOpenHouseDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOpenHouseDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOpenHouse = action.payload.openHouse;
      })
      .addCase(getOpenHouseDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Open House
      .addCase(updateOpenHouse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOpenHouse.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.openHouses.findIndex(house => house._id === action.payload.openHouse._id);
        if (index !== -1) {
          state.openHouses[index] = action.payload.openHouse;
        }
        if (state.currentOpenHouse && state.currentOpenHouse._id === action.payload.openHouse._id) {
          state.currentOpenHouse = action.payload.openHouse;
        }
      })
      .addCase(updateOpenHouse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Cancel Open House
      .addCase(cancelOpenHouse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOpenHouse.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.openHouses.findIndex(house => house._id === action.payload.openHouse._id);
        if (index !== -1) {
          state.openHouses[index] = action.payload.openHouse;
        }
        if (state.currentOpenHouse && state.currentOpenHouse._id === action.payload.openHouse._id) {
          state.currentOpenHouse = action.payload.openHouse;
        }
      })
      .addCase(cancelOpenHouse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Analytics Details
      .addCase(getAnalyticsDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAnalyticsDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAnalytics = action.payload.analytics;
      })
      .addCase(getAnalyticsDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Property Workflow
      .addCase(updatePropertyWorkflow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePropertyWorkflow.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.properties.findIndex(prop => prop._id === action.payload.property._id);
        if (index !== -1) {
          state.properties[index] = action.payload.property;
          state.properties[index].workflowStage = action.payload.workflowStage;
        }
      })
      .addCase(updatePropertyWorkflow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  clearError,
  setActiveTab,
  setCurrentProperty,
  setCurrentInquiry,
  setCurrentAnalytics,
  setCurrentOpenHouse,
  updatePropertyInList,
  updateInquiryInList
} = sellerSlice.actions;

export default sellerSlice.reducer;
