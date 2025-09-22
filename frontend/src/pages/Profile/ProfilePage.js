import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../../store/slices/authSlice';
import { 
  UserIcon, 
  CameraIcon, 
  PencilIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    company: '',
    licenseNumber: '',
    specialties: [],
    socialLinks: {
      website: '',
      linkedin: '',
      twitter: '',
      facebook: ''
    }
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Helper function to get profile picture URL
  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return null;
    
    // If it's already a full URL, return as is
    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
      return profilePicture;
    }
    
    // If it's a server path, construct the full URL
    if (profilePicture.startsWith('uploads/')) {
      return `http://localhost:5000/${profilePicture}`;
    }
    
    return profilePicture;
  };

  // Watch for profile picture changes in the user object
  useEffect(() => {
    if (user && user.profilePicture) {
      const profileUrl = getProfilePictureUrl(user.profilePicture);
      console.log('Profile picture changed, updating preview:', user.profilePicture, '->', profileUrl);
      setPreviewUrl(profileUrl);
    }
  }, [user?.profilePicture]);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        company: user.company || '',
        licenseNumber: user.licenseNumber || '',
        specialties: user.specialties || [],
        socialLinks: {
          website: user.socialLinks?.website || '',
          linkedin: user.socialLinks?.linkedin || '',
          twitter: user.socialLinks?.twitter || '',
          facebook: user.socialLinks?.facebook || ''
        }
      });
      
      // Set profile picture URL - handle both local files and server URLs
      if (user.profilePicture) {
        const profileUrl = getProfilePictureUrl(user.profilePicture);
        console.log('Setting profile picture URL from user object:', user.profilePicture, '->', profileUrl);
        setPreviewUrl(profileUrl);
      } else {
        console.log('No profile picture in user object, clearing preview');
        setPreviewUrl('');
      }
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      
      console.log('=== FRONTEND DEBUG ===');
      console.log('Profile data:', profileData);
      console.log('Profile picture:', profilePicture);
      console.log('Profile picture type:', typeof profilePicture);
      console.log('Profile picture instanceof File:', profilePicture instanceof File);
      console.log('========================');
      
      // Add profile data - EXCLUDE profilePicture field completely
      Object.keys(profileData).forEach(key => {
        // Skip profilePicture - we'll handle it separately
        if (key === 'profilePicture') {
          console.log('Skipping profilePicture from profileData');
          return;
        }
        
        if (key === 'socialLinks') {
          formData.append(key, JSON.stringify(profileData[key]));
        } else if (key === 'specialties') {
          formData.append(key, JSON.stringify(profileData[key]));
        } else {
          formData.append(key, profileData[key]);
        }
      });

      // ONLY add profile picture if a new one was selected
      if (profilePicture && profilePicture instanceof File) {
        console.log('Adding NEW profile picture to FormData:', profilePicture.name);
        formData.append('profilePicture', profilePicture);
      } else {
        console.log('No NEW profile picture to add - keeping existing one');
      }

      // Log FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      // Dispatch update action
      const result = await dispatch(updateProfile(formData)).unwrap();
      console.log('Profile update result:', result);
      console.log('Result user object:', result.user);
      console.log('Result user profilePicture:', result.user?.profilePicture);
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      
      // If a new profile picture was uploaded, update the preview immediately
      if (profilePicture && result.user && result.user.profilePicture) {
        console.log('New profile picture uploaded:', result.user.profilePicture);
        const newProfileUrl = getProfilePictureUrl(result.user.profilePicture);
        console.log('Constructed URL:', newProfileUrl);
        // Update preview with the new server path
        setPreviewUrl(newProfileUrl);
        
        // Also update the local profile data to ensure consistency
        setProfileData(prev => ({
          ...prev,
          profilePicture: result.user.profilePicture
        }));
      } else {
        console.log('No profile picture update or missing data');
        console.log('profilePicture:', profilePicture);
        console.log('result.user:', result.user);
        console.log('result.user.profilePicture:', result.user?.profilePicture);
      }
      
      // Reset the local state after successful update
      if (profilePicture) {
        setProfilePicture(null);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const getRoleIcon = (userType) => {
    const icons = {
      admin: ShieldCheckIcon,
      agent: BuildingOfficeIcon,
      buyer: HomeIcon,
      seller: HomeIcon,
      renter: HomeIcon
    };
    return icons[userType] || UserIcon;
  };

  const getRoleColor = (userType) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      agent: 'bg-blue-100 text-blue-800',
      buyer: 'bg-green-100 text-green-800',
      seller: 'bg-purple-100 text-purple-800',
      renter: 'bg-orange-100 text-orange-800'
    };
    return colors[userType] || 'bg-gray-100 text-gray-800';
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title">Profile Settings</h1>
        <p className="text-gray-600">
          Manage your account settings and customize your profile information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture Section */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="text-center">
              {/* Profile Picture */}
              <div className="relative inline-block mb-4">
                <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-blue-200">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', previewUrl);
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="h-full w-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                  )}
                </div>
                
                {/* Change Picture Button */}
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                    <CameraIcon className="h-4 w-4" />
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.gif,.webp"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* User Info */}
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {user.firstName} {user.lastName}
              </h2>
              
              {/* Role Badge */}
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${getRoleColor(user.userType)}`}>
                {React.createElement(getRoleIcon(user.userType), { className: "h-4 w-4 mr-2" })}
                {user.userType === 'admin' ? 'Administrator' : 
                 user.userType === 'agent' ? 'Real Estate Agent' :
                 user.userType === 'buyer' ? 'Property Buyer' :
                 user.userType === 'seller' ? 'Property Seller' :
                 user.userType === 'renter' ? 'Property Renter' : user.userType}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-primary w-full"
                  >
                    <PencilIcon className="h-4 w-4 mr-2 inline" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="btn-primary w-full"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form data
                        setProfileData({
                          firstName: user.firstName || '',
                          lastName: user.lastName || '',
                          email: user.email || '',
                          phone: user.phone || '',
                          bio: user.bio || '',
                          location: user.location || '',
                          company: user.company || '',
                          licenseNumber: user.licenseNumber || '',
                          specialties: user.specialties || [],
                          socialLinks: {
                            website: user.socialLinks?.website || '',
                            linkedin: user.socialLinks?.linkedin || '',
                            twitter: user.socialLinks?.twitter || '',
                            facebook: user.socialLinks?.facebook || ''
                          }
                        });
                        setPreviewUrl(user.profilePicture || '');
                        setProfilePicture(null);
                      }}
                      className="btn-secondary w-full"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form Section */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows={3}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={profileData.location}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                  placeholder="City, State, Country"
                />
              </div>
            </div>

            {/* Role-Specific Fields */}
            {(user.userType === 'agent' || user.userType === 'admin') && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Professional Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={profileData.company}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={profileData.licenseNumber}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Admin-Specific Fields */}
            {user.userType === 'admin' && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 mr-2 text-red-600" />
                  Administrative Settings
                </h3>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <strong>Administrator Access:</strong> You have full system access including user management, 
                    system settings, and administrative functions.
                  </p>
                </div>
              </div>
            )}

            {/* Social Links */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Social Links</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="socialLinks.website"
                    value={profileData.socialLinks.website}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="socialLinks.linkedin"
                    value={profileData.socialLinks.linkedin}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter
                  </label>
                  <input
                    type="url"
                    name="socialLinks.twitter"
                    value={profileData.socialLinks.twitter}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="https://twitter.com/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="socialLinks.facebook"
                    value={profileData.socialLinks.facebook}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                    placeholder="https://facebook.com/username"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
