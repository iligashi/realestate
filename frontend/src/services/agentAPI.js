const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AgentAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/agent`;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Dashboard
  async getDashboard() {
    return this.request('/dashboard');
  }

  // Client Management
  async getClients(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/clients${queryString ? `?${queryString}` : ''}`);
  }

  async getClient(clientId) {
    return this.request(`/clients/${clientId}`);
  }

  async createClient(clientData) {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  async updateClient(clientId, clientData) {
    return this.request(`/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
  }

  async addClientInteraction(clientId, interactionData) {
    return this.request(`/clients/${clientId}/interactions`, {
      method: 'POST',
      body: JSON.stringify(interactionData),
    });
  }

  // Lead Management
  async getLeads(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/leads${queryString ? `?${queryString}` : ''}`);
  }

  async getLead(leadId) {
    return this.request(`/leads/${leadId}`);
  }

  async createLead(leadData) {
    return this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  async updateLead(leadId, leadData) {
    return this.request(`/leads/${leadId}`, {
      method: 'PUT',
      body: JSON.stringify(leadData),
    });
  }

  async addLeadInteraction(leadId, interactionData) {
    return this.request(`/leads/${leadId}/interactions`, {
      method: 'POST',
      body: JSON.stringify(interactionData),
    });
  }

  async convertLeadToClient(leadId, clientData) {
    return this.request(`/leads/${leadId}/convert`, {
      method: 'POST',
      body: JSON.stringify({ clientData }),
    });
  }

  // Commission Management
  async getCommissions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/commissions${queryString ? `?${queryString}` : ''}`);
  }

  async createCommission(commissionData) {
    return this.request('/commissions', {
      method: 'POST',
      body: JSON.stringify(commissionData),
    });
  }

  async updateCommission(commissionId, commissionData) {
    return this.request(`/commissions/${commissionId}`, {
      method: 'PUT',
      body: JSON.stringify(commissionData),
    });
  }

  // Market Analysis
  async getMarketAnalyses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/market-analyses${queryString ? `?${queryString}` : ''}`);
  }

  async createMarketAnalysis(analysisData) {
    return this.request('/market-analyses', {
      method: 'POST',
      body: JSON.stringify(analysisData),
    });
  }

  // Professional Profile
  async getAgentProfile(agentId) {
    return this.request(`/profile/${agentId}`);
  }

  async updateAgentProfile(profileData) {
    const formData = new FormData();
    
    // Handle file uploads
    if (profileData.profilePicture && profileData.profilePicture instanceof File) {
      formData.append('profilePicture', profileData.profilePicture);
    }
    
    // Add other fields
    Object.keys(profileData).forEach(key => {
      if (key !== 'profilePicture' && profileData[key] !== undefined) {
        if (typeof profileData[key] === 'object') {
          formData.append(key, JSON.stringify(profileData[key]));
        } else {
          formData.append(key, profileData[key]);
        }
      }
    });

    return this.request('/profile', {
      method: 'PUT',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // Utility methods
  async uploadFile(file, type = 'document') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request('/upload', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // Analytics and Reports
  async getCommissionReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/commissions${queryString ? `?${queryString}` : ''}`);
  }

  async getClientReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/clients${queryString ? `?${queryString}` : ''}`);
  }

  async getLeadReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/leads${queryString ? `?${queryString}` : ''}`);
  }

  // Market Analysis Reports
  async getMarketTrends(location, months = 12) {
    return this.request(`/market-trends?location=${encodeURIComponent(JSON.stringify(location))}&months=${months}`);
  }

  async getComparativeMarketAnalysis(propertyData) {
    return this.request('/cma', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  }

  // Lead Generation Tools
  async getLeadSources() {
    return this.request('/lead-sources');
  }

  async createLeadCampaign(campaignData) {
    return this.request('/lead-campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignData),
    });
  }

  // Property Marketing
  async getMarketingTemplates() {
    return this.request('/marketing-templates');
  }

  async createMarketingCampaign(campaignData) {
    return this.request('/marketing-campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignData),
    });
  }

  // Open House Management
  async getOpenHouses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/open-houses${queryString ? `?${queryString}` : ''}`);
  }

  async createOpenHouse(openHouseData) {
    return this.request('/open-houses', {
      method: 'POST',
      body: JSON.stringify(openHouseData),
    });
  }

  async updateOpenHouse(openHouseId, openHouseData) {
    return this.request(`/open-houses/${openHouseId}`, {
      method: 'PUT',
      body: JSON.stringify(openHouseData),
    });
  }

  // Property Photography
  async getPhotoGalleries(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/photo-galleries${queryString ? `?${queryString}` : ''}`);
  }

  async uploadPropertyPhotos(propertyId, photos) {
    const formData = new FormData();
    photos.forEach((photo, index) => {
      formData.append(`photos`, photo);
    });
    formData.append('propertyId', propertyId);

    return this.request('/property-photos', {
      method: 'POST',
      headers: {},
      body: formData,
    });
  }

  async createPhotoGallery(galleryData) {
    return this.request('/photo-galleries', {
      method: 'POST',
      body: JSON.stringify(galleryData),
    });
  }
}

export default new AgentAPI();
