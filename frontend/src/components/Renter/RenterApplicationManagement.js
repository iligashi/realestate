import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import rentalApplicationAPI from '../../services/rentalApplicationAPI';
import useWebSocket from '../../hooks/useWebSocket';

const RenterApplicationManagement = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth || {});
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
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // WebSocket integration for real-time updates
  const { isConnected } = useWebSocket();

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
      
      const response = await rentalApplicationAPI.getApplicantApplications(params);
      setApplications(response.applications);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    try {
      setActionStatus('processing');
      setActionMessage('Withdrawing application...');
      
      await rentalApplicationAPI.withdrawApplication(applicationId);
      
      setActionStatus('success');
      setActionMessage('Application withdrawn successfully!');
      
      // Refresh applications list
      await fetchApplications(pagination.current);
      
      // Show success feedback for 3 seconds
      setTimeout(() => {
        setActionStatus(null);
        setActionMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Error withdrawing application:', error);
      setActionStatus('error');
      setActionMessage(error.response?.data?.message || 'Failed to withdraw application. Please try again.');
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setActionStatus(null);
        setActionMessage('');
      }, 5000);
    }
  };

  const handleSendMessage = async (applicationId) => {
    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setSendingMessage(true);
      await rentalApplicationAPI.addApplicationMessage(applicationId, newMessage.trim());
      
      toast.success('Message sent successfully!');
      setNewMessage('');
      
      // Refresh the application to get updated messages
      const updatedApplication = await rentalApplicationAPI.getApplication(applicationId);
      setSelectedApplication(updatedApplication.application);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'approved':
        return <CheckBadgeIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      case 'withdrawn':
        return <XMarkIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'pending':
        return 'Your application is under review';
      case 'approved':
        return 'Congratulations! Your application has been approved';
      case 'rejected':
        return 'Unfortunately, your application was not approved';
      case 'withdrawn':
        return 'You have withdrawn this application';
      default:
        return 'Status unknown';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewApplication = async (application) => {
    try {
      // Fetch full application details including messages
      const response = await rentalApplicationAPI.getApplication(application._id);
      setSelectedApplication(response.application);
      setShowApplicationModal(true);
    } catch (error) {
      console.error('Error fetching application details:', error);
      toast.error('Failed to load application details');
    }
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
          <h2 className="text-2xl font-bold text-gray-900">My Rental Applications</h2>
          <p className="text-gray-600">Track and manage your rental applications</p>
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
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600" />
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
              ? "You haven't submitted any rental applications yet."
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
                      <HomeIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {application.property?.title || 'Unknown Property'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Landlord: {application.landlord?.name || 'Unknown'}
                      </p>
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
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                      {getStatusIcon(application.status)}
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </div>
                    <span className="text-sm text-gray-600">
                      {getStatusDescription(application.status)}
                    </span>
                  </div>

                  {/* Decision Information */}
                  {application.decision && application.decision.status !== 'pending' && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DocumentTextIcon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Decision Details</span>
                      </div>
                      {application.decision.decisionReason && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Reason:</strong> {application.decision.decisionReason}
                        </p>
                      )}
                      {application.decision.decisionNotes && (
                        <p className="text-sm text-gray-600">
                          <strong>Notes:</strong> {application.decision.decisionNotes}
                        </p>
                      )}
                    </div>
                  )}
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
                    <button
                      onClick={() => handleWithdrawApplication(application._id)}
                      disabled={actionStatus === 'processing'}
                      className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        actionStatus === 'processing'
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'text-white bg-orange-600 hover:bg-orange-700'
                      }`}
                    >
                      {actionStatus === 'processing' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <XMarkIcon className="h-4 w-4" />
                      )}
                      Withdraw
                    </button>
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
            setNewMessage('');
          }}
          onSendMessage={handleSendMessage}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendingMessage={sendingMessage}
          isConnected={isConnected}
        />
      )}
    </div>
  );
};

// Application Detail Modal Component
const ApplicationDetailModal = ({ 
  application, 
  onClose, 
  onSendMessage, 
  newMessage, 
  setNewMessage, 
  sendingMessage,
  isConnected 
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Application Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{application.property?.title}</h3>
                <p className="text-sm text-gray-600">Applied on {formatDate(application.applicationDate)}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                application.status === 'approved' ? 'bg-green-100 text-green-800' :
                application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </div>
            </div>
          </div>

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

          {/* Decision Information */}
          {application.decision && application.decision.status !== 'pending' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Decision Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Decision Date</label>
                    <p className="text-gray-900">
                      {application.decision.decisionDate 
                        ? new Date(application.decision.decisionDate).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Decided By</label>
                    <p className="text-gray-900">{application.decision.decidedBy?.name || 'N/A'}</p>
                  </div>
                </div>
                {application.decision.decisionReason && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                    <p className="text-gray-900">{application.decision.decisionReason}</p>
                  </div>
                )}
                {application.decision.decisionNotes && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-gray-900">{application.decision.decisionNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          {application.messages && application.messages.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {application.messages.map((message, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    message.isFromLandlord 
                      ? 'bg-blue-50 border-l-4 border-blue-400' 
                      : 'bg-green-50 border-l-4 border-green-400'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{message.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {message.isFromLandlord ? 'From landlord' : 'From you'} • {formatDate(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Send Message */}
          {application.status === 'pending' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Message to Landlord</h3>
              <div className="space-y-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message to the landlord..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Connected
                      </span>
                    ) : (
                      <span className="text-red-600 text-sm flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Disconnected
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onSendMessage(application._id)}
                    disabled={!newMessage.trim() || sendingMessage || !isConnected}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <PaperAirplaneIcon className="h-4 w-4" />
                    )}
                    Send Message
                  </button>
                </div>
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

export default RenterApplicationManagement;
