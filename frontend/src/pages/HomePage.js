import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';

const HomePage = () => {
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
            <Link
              to="/register"
              className="btn-secondary text-lg px-8 py-3 text-center"
            >
              Get Started
            </Link>
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
    </div>
  );
};

export default HomePage;
