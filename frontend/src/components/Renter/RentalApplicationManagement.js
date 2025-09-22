import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  EyeIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  UserIcon,
  HomeIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import rentalApplicationAPI from '../../services/rentalApplicationAPI';

const RentalApplicationManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionStatus, setActionStatus] = useState(null); // 'processing', 'success', 'error'
  const [actionMessage, setActionMessage] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter })
      };
      
      const response = await rentalApplicationAPI.getLandlordApplications(params);
      setApplications(response.applications);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, status, reason = '', notes = '') => {
    try {
      setActionStatus('processing');
      setActionMessage(`${status === 'approved' ? 'Approving' : 'Rejecting'} application...`);
      
      await rentalApplicationAPI.updateApplicationStatus(applicationId, status, reason, notes);
      
      setActionStatus('success');
      setActionMessage(`Application ${status} successfully! The applicant has been notified.`);
      
      // Refresh applications list
      await fetchApplications(pagination.current);
      
      // Show success feedback for 3 seconds
      setTimeout(() => {
        setActionStatus(null);
        setActionMessage('');
        setShowApplicationModal(false);
        setSelectedApplication(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error updating application status:', error);
      setActionStatus('error');
      setActionMessage(error.response?.data?.message || 'Failed to update application status. Please try again.');
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setActionStatus(null);
        setActionMessage('');
      }, 5000);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rental Applications</h2>
          <p className="text-gray-600">Manage rental applications for your properties</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Action Feedback Display */}
      {actionStatus && (
        <div className={`p-4 rounded-lg border ${
          actionStatus === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : actionStatus === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center">
            {actionStatus === 'success' && (
              <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
            )}
            {actionStatus === 'error' && (
              <XCircleIcon className="h-5 w-5 mr-2 text-red-600" />
            )}
            {actionStatus === 'processing' && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
            )}
            <span className="font-medium">{actionMessage}</span>
          </div>
        </div>
      )}

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="text-center py-12">
          <HomeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-600">
            {statusFilter === 'all' 
              ? "You don't have any rental applications yet."
              : `No ${statusFilter} applications found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div key={application._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {application.personalInfo?.firstName} {application.personalInfo?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{application.property?.title}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Applied: {formatDate(application.applicationDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <HomeIcon className="h-4 w-4" />
                      <span>Move-in: {formatDate(application.rentalInfo?.desiredMoveInDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4" />
                      <span>Duration: {application.rentalInfo?.leaseDuration} months</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {getStatusIcon(application.status)}
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </div>
                    {application.employment?.monthlyIncome && (
                      <span className="text-sm text-gray-600">
                        Income: ${application.employment.monthlyIncome.toLocaleString()}/month
                      </span>
                    )}
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
                  
                  {application.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(application._id, 'approved')}
                        disabled={actionStatus === 'processing'}
                        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          actionStatus === 'processing'
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'text-white bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {actionStatus === 'processing' ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <CheckCircleIcon className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(application._id, 'rejected')}
                        disabled={actionStatus === 'processing'}
                        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          actionStatus === 'processing'
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'text-white bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {actionStatus === 'processing' ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <XCircleIcon className="h-4 w-4" />
                        )}
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchApplications(pagination.current - 1)}
            disabled={pagination.current === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-gray-700">
            Page {pagination.current} of {pagination.pages}
          </span>
          <button
            onClick={() => fetchApplications(pagination.current + 1)}
            disabled={pagination.current === pagination.pages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
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
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};

// Application Detail Modal Component
const ApplicationDetailModal = ({ application, onClose, onStatusUpdate }) => {
  const [status, setStatus] = useState(application.status);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleStatusUpdate = () => {
    if (status !== application.status) {
      onStatusUpdate(application._id, status, reason, notes);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">
                  {application.personalInfo?.firstName} {application.personalInfo?.lastName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{application.personalInfo?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-900">{application.personalInfo?.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <p className="text-gray-900">
                  {application.personalInfo?.dateOfBirth 
                    ? new Date(application.personalInfo.dateOfBirth).toLocaleDateString()
                    : 'N/A'
                  }
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
                  {application.rentalInfo?.desiredMoveInDate 
                    ? new Date(application.rentalInfo.desiredMoveInDate).toLocaleDateString()
                    : 'N/A'
                  }
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
            {application.rentalInfo?.petDetails && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Pet Details</label>
                <p className="text-gray-900">{application.rentalInfo.petDetails}</p>
              </div>
            )}
          </div>

          {/* Employment Information */}
          {application.employment && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employer</label>
                  <p className="text-gray-900">{application.employment.employer || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Job Title</label>
                  <p className="text-gray-900">{application.employment.jobTitle || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monthly Income</label>
                  <p className="text-gray-900">
                    {application.employment.monthlyIncome 
                      ? `$${application.employment.monthlyIncome.toLocaleString()}`
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employment Duration</label>
                  <p className="text-gray-900">{application.employment.employmentDuration || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Information */}
          {application.additionalInfo && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-4">
                {application.additionalInfo.reasonForMoving && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason for Moving</label>
                    <p className="text-gray-900">{application.additionalInfo.reasonForMoving}</p>
                  </div>
                )}
                {application.additionalInfo.specialRequirements && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Special Requirements</label>
                    <p className="text-gray-900">{application.additionalInfo.specialRequirements}</p>
                  </div>
                )}
                {application.additionalInfo.additionalComments && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Additional Comments</label>
                    <p className="text-gray-900">{application.additionalInfo.additionalComments}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Update Section */}
          {application.status === 'pending' && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Application Status</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Reason for decision"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Additional notes"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          {application.status === 'pending' && status !== application.status && (
            <button
              onClick={handleStatusUpdate}
              className={`px-4 py-2 text-white rounded-md transition-colors ${
                status === 'approved' 
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {status === 'approved' ? 'Approve Application' : 'Reject Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RentalApplicationManagement;
