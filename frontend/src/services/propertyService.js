const API_BASE_URL = '/api/properties';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Get all properties with optional filters
export const getProperties = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const response = await fetch(`${API_BASE_URL}?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch properties');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
};

// Get a single property by ID
export const getProperty = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch property');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching property:', error);
    throw error;
  }
};

// Create a new property
export const createProperty = async (propertyData) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(propertyData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create property');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating property:', error);
    throw error;
  }
};

// Update an existing property
export const updateProperty = async (id, propertyData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(propertyData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update property');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating property:', error);
    throw error;
  }
};

// Delete a property
export const deleteProperty = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete property');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting property:', error);
    throw error;
  }
};

// Get user's properties
export const getUserProperties = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/my-properties`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user properties');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user properties:', error);
    throw error;
  }
};

// Search properties
export const searchProperties = async (searchParams) => {
  try {
    const queryParams = new URLSearchParams();
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const response = await fetch(`${API_BASE_URL}/search?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to search properties');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching properties:', error);
    throw error;
  }
};
