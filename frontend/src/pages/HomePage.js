import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

// Enhanced Announcements Component
const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fetch active announcements
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/announcements');
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data.announcements || []);
        }
      } catch (error) {
        console.log('No announcements to display');
      }
    };

    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (announcements.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
      }, 6000); // Change announcement every 6 seconds

      return () => clearInterval(timer);
    }
  }, [announcements.length]);

  if (announcements.length === 0 || !isVisible) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  // Get announcement type styling
  const getTypeStyle = (type) => {
    switch (type) {
      case 'general':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'update':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'promotion':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'maintenance':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'alert':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'general':
        return '📢';
      case 'update':
        return '✨';
      case 'promotion':
        return '🎉';
      case 'maintenance':
        return '🔧';
      case 'alert':
        return '⚠️';
      default:
        return '📢';
    }
  };

  return (
    <div className={`${getTypeStyle(currentAnnouncement.type)} border-b transition-all duration-500 ease-in-out`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getTypeIcon(currentAnnouncement.type)}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold uppercase tracking-wide">
                  {currentAnnouncement.type === 'general' ? 'News' : 
                   currentAnnouncement.type === 'update' ? 'Update' : 
                   currentAnnouncement.type === 'promotion' ? 'Special Offer' : 
                   currentAnnouncement.type === 'maintenance' ? 'Maintenance' :
                   currentAnnouncement.type === 'alert' ? 'Alert' : 'Announcement'}
                </span>
                {announcements.length > 1 && (
                  <span className="text-xs bg-white/50 px-2 py-1 rounded-full">
                    {currentIndex + 1} of {announcements.length}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-bold">{currentAnnouncement.title}</h3>
              {currentAnnouncement.priority === 'high' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Important
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {announcements.length > 1 && (
              <div className="flex space-x-1">
                {announcements.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-current' : 'bg-current/30'
                    }`}
                  />
                ))}
              </div>
            )}
            <button
              onClick={() => setIsVisible(false)}
              className="hover:scale-110 transition-transform duration-200"
              title="Dismiss announcement"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        {currentAnnouncement.content && (
          <p className="mt-2 text-sm opacity-90 max-w-4xl">
            {currentAnnouncement.content}
          </p>
        )}
      </div>
    </div>
  );
};

const HomePage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  // Determine what type of property the user can create
  const getPropertyCreationOptions = () => {
    if (!isAuthenticated || !user) return null;
    
    const options = [];
    
    // Sellers and agents can create properties for sale
    if (['seller', 'agent', 'admin'].includes(user.userType)) {
      options.push({
        label: 'List Property for Sale',
        href: '/properties/create',
        description: 'Sell your property',
        icon: HomeIcon,
        color: 'blue'
      });
    }
    
    // Renters, sellers, agents, and admins can create rental properties
    if (['renter', 'seller', 'agent', 'admin'].includes(user.userType)) {
      options.push({
        label: 'List Property for Rent',
        href: '/properties/create-rental',
        description: 'Rent out your property',
        icon: BuildingOfficeIcon,
        color: 'green'
      });
    }
    
    return options;
  };
  
  const propertyCreationOptions = getPropertyCreationOptions();
  
  const features = [
    {
      name: 'Find Your Dream Home',
      description: 'Browse thousands of properties with detailed information and high-quality images.',
      icon: HomeIcon,
    },
    {
      name: 'Professional Agents',
      description: 'Connect with verified real estate agents who can help you find the perfect property.',
      icon: UserGroupIcon,
    },
    {
      name: 'Smart Search',
      description: 'Use advanced filters to find properties that match your exact requirements.',
      icon: MagnifyingGlassIcon,
    },
    {
      name: 'Secure Transactions',
      description: 'Safe and secure platform for all your real estate transactions.',
      icon: BuildingOfficeIcon,
    },
  ];

  return (
    <div className="bg-white">
      {/* Announcements Banner */}
      <Announcements />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gray-900 mix-blend-multiply" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-6 sm:py-32 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find Your Dream Property
          </h1>
          <p className="mt-6 text-xl text-blue-100 max-w-3xl">
            Discover the perfect home, apartment, or commercial property in our modern real estate marketplace. 
            Connect with trusted agents and make informed decisions.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              to="/properties"
              className="btn-primary text-lg px-8 py-3 text-center"
            >
              Browse Properties
            </Link>
            {isAuthenticated ? (
              propertyCreationOptions && propertyCreationOptions.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  {propertyCreationOptions.map((option, index) => {
                    const colorClasses = option.color === 'blue' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-green-600 hover:bg-green-700';
                    
                    return (
                      <Link
                        key={index}
                        to={option.href}
                        className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-lg font-medium rounded-md text-white ${colorClasses} transition-colors duration-200`}
                      >
                        <option.icon className="h-5 w-5 mr-2" />
                        {option.label}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <Link
                  to="/dashboard"
                  className="btn-secondary text-lg px-8 py-3 text-center"
                >
                  Go to Dashboard
                </Link>
              )
            ) : (
              <Link
                to="/register"
                className="btn-secondary text-lg px-8 py-3 text-center"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <h2 className="section-title">Why Choose RealEstate?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We provide a comprehensive platform that makes buying, selling, and renting properties 
              simple, secure, and efficient.
            </p>
          </div>
          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.name} className="text-center">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
                  <feature.icon className="h-8 w-8 text-blue-600" aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900">{feature.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
          
          {/* Property Creation Section for Authenticated Users */}
          {isAuthenticated && propertyCreationOptions && propertyCreationOptions.length > 0 && (
            <div className="mt-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900">Ready to List Your Property?</h2>
                <p className="mt-4 text-lg text-gray-600">
                  Join thousands of property owners who trust our platform to showcase their properties.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {propertyCreationOptions.map((option, index) => {
                  const colorClasses = option.color === 'blue' 
                    ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                    : 'bg-green-50 border-green-200 hover:bg-green-100';
                  
                  const iconColorClasses = option.color === 'blue' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-green-600 text-white';
                  
                  return (
                    <Link
                      key={index}
                      to={option.href}
                      className={`group relative rounded-lg border-2 p-6 transition-all duration-200 hover:shadow-lg ${colorClasses}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${iconColorClasses}`}>
                          <option.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700">
                            {option.label}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {option.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <PlusIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-16 px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Find Your Perfect Property?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Join thousands of satisfied users who found their dream homes through our platform.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn-primary text-lg px-8 py-3"
              >
                Sign Up Now
              </Link>
              <Link
                to="/properties"
                className="btn-secondary text-lg px-8 py-3"
              >
                View Properties
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Action Button for Mobile - Only for authenticated users with property creation rights */}
      {isAuthenticated && propertyCreationOptions && propertyCreationOptions.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 lg:hidden">
          <div className="relative group">
            <button className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center">
              <PlusIcon className="h-6 w-6" />
            </button>
            {/* Dropdown menu */}
            <div className="absolute bottom-16 right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-48">
                {propertyCreationOptions.map((option, index) => (
                  <Link
                    key={index}
                    to={option.href}
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <option.icon className="h-4 w-4 mr-3" />
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
