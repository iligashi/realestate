import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  EyeIcon,
  HomeIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import rentalApplicationAPI from '../services/rentalApplicationAPI';

const ApplicantApplicationStatus = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await rentalApplicationAPI.getApplicantApplications();
      setApplications(response.applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending':
        return 'Your application is under review. The landlord will notify you of their decision soon.';
      case 'approved':
        return 'Congratulations! Your application has been approved. Please contact the landlord to proceed with the rental agreement.';
      case 'rejected':
        return 'Unfortunately, your application was not approved. You can apply for other properties or contact the landlord for more information.';
      case 'withdrawn':
        return 'You have withdrawn this application.';
      default:
        return 'Status unknown.';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Rental Applications</h2>
        <p className="text-gray-600">Track the status of your rental applications</p>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="text-center py-12">
          <HomeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-600">You haven't submitted any rental applications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div key={application._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <HomeIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {application.property?.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {application.property?.address?.city}, {application.property?.address?.state}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Applied: {formatDate(application.applicationDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <UserIcon className="h-4 w-4" />
                      <span>Landlord: {application.landlord?.firstName} {application.landlord?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4" />
                      <span>Move-in: {formatDate(application.rentalInfo?.desiredMoveInDate)}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {getStatusIcon(application.status)}
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {getStatusMessage(application.status)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewApplication(application)}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Detail Modal */}
      {showApplicationModal && selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedApplication(null);
          }}
        />
      )}
    </div>
  );
};

// Application Detail Modal Component
const ApplicationDetailModal = ({ application, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Application Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Property Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Property</label>
                <p className="text-gray-900">{application.property?.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="text-gray-900">
                  {application.property?.address?.city}, {application.property?.address?.state}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Landlord</label>
                <p className="text-gray-900">
                  {application.landlord?.firstName} {application.landlord?.lastName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Application Date</label>
                <p className="text-gray-900">
                  {new Date(application.applicationDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Rental Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rental Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Desired Move-in Date</label>
                <p className="text-gray-900">
                  {new Date(application.rentalInfo?.desiredMoveInDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Lease Duration</label>
                <p className="text-gray-900">{application.rentalInfo?.leaseDuration} months</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Number of Occupants</label>
                <p className="text-gray-900">{application.rentalInfo?.numberOfOccupants || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Has Pets</label>
                <p className="text-gray-900">{application.rentalInfo?.hasPets ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Decision Information */}
          {application.decision && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Decision Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-gray-900">
                    {application.decision.status.charAt(0).toUpperCase() + application.decision.status.slice(1)}
                  </p>
                </div>
                {application.decision.decisionDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Decision Date</label>
                    <p className="text-gray-900">
                      {new Date(application.decision.decisionDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {application.decision.decisionReason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                    <p className="text-gray-900">{application.decision.decisionReason}</p>
                  </div>
                )}
                {application.decision.decisionNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-gray-900">{application.decision.decisionNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicantApplicationStatus;
