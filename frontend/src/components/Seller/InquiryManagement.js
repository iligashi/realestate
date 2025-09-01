import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getInquiries, 
  getInquiryDetails, 
  respondToInquiry,
  clearError 
} from '../../store/slices/sellerSlice';
import { 
  ChatBubbleLeftRightIcon,
  EyeIcon,
  ClockIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const InquiryManagement = () => {
  const dispatch = useDispatch();
  const { 
    inquiries, 
    currentInquiry, 
    inquiryPagination,
    loading, 
    error 
  } = useSelector(state => state.seller);
  
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [scheduleViewing, setScheduleViewing] = useState({
    date: '',
    time: '',
    duration: 60,
    notes: ''
  });
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    type: ''
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        console.log('InquiryManagement: Dispatching getInquiries with filters:', filters);
        dispatch(getInquiries(filters));
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [dispatch, filters.status, filters.priority, filters.type, loading]);

  useEffect(() => {
    console.log('InquiryManagement: State updated:', { inquiries, loading, error });
  }, [inquiries, loading, error]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleInquiryClick = (inquiry) => {
    setSelectedInquiry(inquiry);
    dispatch(getInquiryDetails(inquiry._id));
  };

  const handleRespond = async () => {
    if (!currentInquiry || !responseText.trim()) return;

    const responseData = {
      message: responseText,
      scheduleViewing: scheduleViewing.date ? scheduleViewing : null
    };

    try {
      await dispatch(respondToInquiry({
        id: currentInquiry._id,
        responseData
      })).unwrap();
      
      setResponseText('');
      setScheduleViewing({ date: '', time: '', duration: 60, notes: '' });
      
      // Refresh inquiries list
      dispatch(getInquiries(filters));
    } catch (error) {
      console.error('Failed to respond to inquiry:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-800';
      case 'read': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'viewing': return <EyeIcon className="h-4 w-4" />;
      case 'offer': return <CheckCircleIcon className="h-4 w-4" />;
      case 'negotiation': return <ChatBubbleLeftRightIcon className="h-4 w-4" />;
      default: return <ChatBubbleLeftRightIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-full flex">
      {/* Inquiries List */}
      <div className="w-1/2 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Inquiries</h2>
          
          {/* Filters */}
          <div className="mt-4 flex space-x-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="responded">Responded</option>
              <option value="scheduled">Scheduled</option>
            </select>
            
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            >
              <option value="">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            >
              <option value="">All Types</option>
              <option value="general">General</option>
              <option value="viewing">Viewing</option>
              <option value="offer">Offer</option>
              <option value="negotiation">Negotiation</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Inquiries List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <ChatBubbleLeftRightIcon className="h-8 w-8 mb-2" />
              <p className="text-sm">No inquiries found</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {inquiries.map((inquiry) => (
                <div
                  key={inquiry._id}
                  onClick={() => handleInquiryClick(inquiry)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedInquiry?._id === inquiry._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getTypeIcon(inquiry.type)}
                        <h3 className="text-sm font-medium text-gray-900">
                          {inquiry.buyer?.firstName} {inquiry.buyer?.lastName}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                          {inquiry.status}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(inquiry.priority)}`}>
                          {inquiry.priority}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{inquiry.subject}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </span>
                        <span>{inquiry.property?.title}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inquiry Details */}
      <div className="w-1/2 flex flex-col">
        {currentInquiry ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentInquiry.buyer?.firstName} {currentInquiry.buyer?.lastName}
                </h3>
                <div className="flex space-x-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(currentInquiry.status)}`}>
                    {currentInquiry.status}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(currentInquiry.priority)}`}>
                    {currentInquiry.priority}
                  </span>
                </div>
              </div>
              
              <div className="mt-2 text-sm text-gray-600">
                <p>Property: {currentInquiry.property?.title}</p>
                <p>Type: {currentInquiry.type}</p>
                <p>Received: {new Date(currentInquiry.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Message */}
            <div className="p-4 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Message</h4>
              <p className="text-sm text-gray-700">{currentInquiry.message}</p>
            </div>

            {/* Contact Information */}
            <div className="p-4 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{currentInquiry.buyer?.email}</span>
                </div>
                {currentInquiry.buyer?.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{currentInquiry.buyer.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Response Form */}
            <div className="flex-1 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Response</h4>
              
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Type your response here..."
              />

              {/* Schedule Viewing */}
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={scheduleViewing.date !== ''}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        setScheduleViewing({ date: '', time: '', duration: 60, notes: '' });
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Schedule a viewing</span>
                </label>
                
                {scheduleViewing.date !== '' && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Date</label>
                      <input
                        type="date"
                        value={scheduleViewing.date}
                        onChange={(e) => setScheduleViewing(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Time</label>
                      <input
                        type="time"
                        value={scheduleViewing.time}
                        onChange={(e) => setScheduleViewing(prev => ({ ...prev, time: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        value={scheduleViewing.duration}
                        onChange={(e) => setScheduleViewing(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Notes</label>
                      <input
                        type="text"
                        value={scheduleViewing.notes}
                        onChange={(e) => setScheduleViewing(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Optional notes"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={handleRespond}
                  disabled={!responseText.trim() || loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4" />
              <p>Select an inquiry to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InquiryManagement;
