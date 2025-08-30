import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserIcon, 
  HomeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setProfileDropdownOpen(false);
  };

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Properties', href: '/properties', icon: BuildingOfficeIcon },
    ...(isAuthenticated && user?.userType === 'admin' 
      ? [{ name: 'Admin', href: '/admin', icon: UserGroupIcon }] 
      : []
    ),
  ];

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
        {/* Logo and User Info */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="-m-1.5 p-1.5">
            <span className="text-2xl font-bold text-blue-600">RealEstate</span>
          </Link>
          
          {/* User Profile Display (when logged in) */}
          {isAuthenticated && user && (
            <div className="hidden lg:flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
              {/* Profile Picture */}
              <div className="relative">
                {user.profilePicture ? (
                  <img
                    src={getProfilePictureUrl(user.profilePicture)}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="h-8 w-8 rounded-full object-cover border-2 border-blue-200"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                )}
              </div>
              
              {/* User Info */}
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-xs text-gray-500">
                  {getRoleDisplayName(user.userType)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Desktop Auth */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          {isAuthenticated ? (
            <div className="relative">
              {/* Profile Dropdown */}
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors"
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
                    <p className="text-xs text-blue-600 font-medium mt-1">
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
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="btn-primary"
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
              <Link to="/" className="-m-1.5 p-1.5">
                <span className="text-2xl font-bold text-blue-600">RealEstate</span>
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
                      className="h-12 w-12 rounded-full object-cover border-2 border-blue-200"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-semibold">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getRoleDisplayName(user.userType)}
                    </p>
                  </div>
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
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="py-6">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <Link
                        to="/dashboard"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Edit Profile
                      </Link>
                      {user?.userType === 'admin' && (
                        <Link
                          to="/admin"
                          className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
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
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 w-full text-left"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/login"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Log in
                      </Link>
                      <Link
                        to="/register"
                        className="btn-primary block text-center"
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