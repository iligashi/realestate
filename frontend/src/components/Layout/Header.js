import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import useSessionManager from '../../hooks/useSessionManager';
import NotificationBadge from '../NotificationBadge';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserIcon, 
  HomeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChevronDownIcon,
  BuildingOffice2Icon,
  HomeModernIcon,
  CurrencyDollarIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [propertyTypeDropdownOpen, setPropertyTypeDropdownOpen] = useState(false);
  
  const profileDropdownRef = useRef(null);
  const propertyTypeDropdownRef = useRef(null);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Initialize session management
  useSessionManager();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (propertyTypeDropdownRef.current && !propertyTypeDropdownRef.current.contains(event.target)) {
        setPropertyTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setProfileDropdownOpen(false);
  };

  const navigation = [
    { name: 'All Properties', href: '/properties', icon: HomeIcon },
    { name: 'Apartments', href: '/properties?type=apartment', icon: BuildingOfficeIcon },
    { name: 'Houses', href: '/properties?type=house', icon: HomeModernIcon },
    { name: 'Offices', href: '/properties?type=office', icon: BuildingOffice2Icon },
  ];

  const propertyTypeOptions = [
    { 
      name: 'Buy Properties', 
      href: '/properties?listingType=sale', 
      icon: CurrencyDollarIcon, 
      description: 'Properties for sale',
      color: 'blue'
    },
    { 
      name: 'Rent Properties', 
      href: '/properties?listingType=rental', 
      icon: KeyIcon, 
      description: 'Properties for rent',
      color: 'green'
    }
  ];

  const handlePropertyTypeClick = (href) => {
    navigate(href);
    setPropertyTypeDropdownOpen(false);
  };

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

  // Helper function to get user initials
  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return '?';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleDisplayName = (userType) => {
    const roleNames = {
      admin: 'Administrator',
      agent: 'Real Estate Agent',
      buyer: 'Property Buyer',
      seller: 'Property Seller',
      renter: 'Property Renter'
    };
    return roleNames[userType] || userType;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="-m-1.5 p-1.5 flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-green-600">RealEstate</span>
          </Link>
        </div>

        {/* Desktop Navigation - Center */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
          
          {/* Property Type Dropdown */}
          <div className="relative" ref={propertyTypeDropdownRef}>
            <button
              onClick={() => setPropertyTypeDropdownOpen(!propertyTypeDropdownOpen)}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
            >
              <span>Browse</span>
              <ChevronDownIcon className="h-4 w-4" />
            </button>

            {/* Property Type Dropdown Menu */}
            {propertyTypeDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {propertyTypeOptions.map((option) => {
                  const Icon = option.icon;
                  const colorClasses = option.color === 'blue' 
                    ? 'text-blue-600' 
                    : 'text-green-600';
                  
                  return (
                    <button
                      key={option.name}
                      onClick={() => handlePropertyTypeClick(option.href)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        option.color === 'blue' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        <Icon className={`h-4 w-4 ${colorClasses}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{option.name}</p>
                        <p className="text-xs text-gray-500">{option.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Auth - Right End */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-4">
          {isAuthenticated ? (
            <>
              {/* Notification Badge - Only for buyers and sellers */}
              {(user?.userType === 'buyer' || user?.userType === 'seller') && (
                <NotificationBadge />
              )}
              
              <div className="relative" ref={profileDropdownRef}>
                {/* Profile Dropdown */}
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
                >
                  <span>Account</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {user?.email}
                    </p>
                    <p className="text-xs text-green-600 font-medium mt-1">
                      {getRoleDisplayName(user?.userType)}
                    </p>
                  </div>
                  
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    Dashboard
                  </Link>
                  
                  {user?.userType === 'seller' && (
                    <Link
                      to="/seller"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Seller Dashboard
                    </Link>
                  )}
                  
                  {user?.userType === 'buyer' && (
                    <Link
                      to="/buyer"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Buyer Dashboard
                    </Link>
                  )}
                  
                  {user?.userType === 'renter' && (
                    <Link
                      to="/renter"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Renter Dashboard
                    </Link>
                  )}
                  
                  {user?.userType === 'seller' && (
                    <Link
                      to="/seller?tab=inbox"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <div className="flex items-center justify-between">
                        <span>Messages</span>
                        <NotificationBadge className="scale-75" />
                      </div>
                    </Link>
                  )}
                  
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    Edit Profile
                  </Link>
                  
                  {user?.userType === 'admin' && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 border-t border-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50" />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Link to="/" className="-m-1.5 p-1.5 flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-green-600">RealEstate</span>
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            {/* Mobile User Profile */}
            {isAuthenticated && user && (
              <div className="mt-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {user.profilePicture ? (
                    <img
                      src={getProfilePictureUrl(user.profilePicture)}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="h-12 w-12 rounded-full object-cover border-2 border-green-200"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center text-white text-lg font-semibold">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getRoleDisplayName(user.userType)}
                    </p>
                  </div>
                  {/* Mobile Notification Badge - Only for buyers and sellers */}
                  {(user.userType === 'buyer' || user.userType === 'seller') && (
                    <NotificationBadge />
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="-mx-3 flex items-center space-x-2 rounded-lg px-3 py-2 text-base font-medium leading-7 text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                  
                  {/* Mobile Property Type Options */}
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Browse by Type
                    </h3>
                    {propertyTypeOptions.map((option) => {
                      const Icon = option.icon;
                      const colorClasses = option.color === 'blue' 
                        ? 'text-blue-600' 
                        : 'text-green-600';
                      
                      return (
                        <button
                          key={option.name}
                          onClick={() => {
                            handlePropertyTypeClick(option.href);
                            setMobileMenuOpen(false);
                          }}
                          className="-mx-3 flex items-center space-x-3 rounded-lg px-3 py-3 text-base font-medium leading-7 text-gray-700 hover:bg-gray-50 w-full text-left"
                        >
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                            option.color === 'blue' ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                            <Icon className={`h-4 w-4 ${colorClasses}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{option.name}</p>
                            <p className="text-xs text-gray-500">{option.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="py-6">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <Link
                        to="/dashboard"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-medium leading-7 text-gray-700 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      
                      {user?.userType === 'seller' && (
                        <Link
                          to="/seller"
                          className="-mx-3 block rounded-lg px-3 py-2 text-base font-medium leading-7 text-gray-700 hover:bg-gray-50"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Seller Dashboard
                        </Link>
                      )}
                      
                      {user?.userType === 'buyer' && (
                        <Link
                          to="/buyer"
                          className="-mx-3 block rounded-lg px-3 py-2 text-base font-medium leading-7 text-gray-700 hover:bg-gray-50"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Buyer Dashboard
                        </Link>
                      )}
                      
                      {user?.userType === 'renter' && (
                        <Link
                          to="/renter"
                          className="-mx-3 block rounded-lg px-3 py-2 text-base font-medium leading-7 text-gray-700 hover:bg-gray-50"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Renter Dashboard
                        </Link>
                      )}
                      
                      <Link
                        to="/profile"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-medium leading-7 text-gray-700 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Edit Profile
                      </Link>
                      {user?.userType === 'admin' && (
                        <Link
                          to="/admin"
                          className="-mx-3 block rounded-lg px-3 py-2 text-base font-medium leading-7 text-gray-700 hover:bg-gray-50"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-medium leading-7 text-gray-700 hover:bg-gray-50 w-full text-left"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/login"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-medium leading-7 text-gray-700 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Log in
                      </Link>
                      <Link
                        to="/register"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-base font-medium hover:bg-green-700 transition-colors block text-center"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;