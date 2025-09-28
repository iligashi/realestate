import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  EyeIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import userReportsAPI from '../../services/userReportsAPI';
import { toast } from 'react-hot-toast';

const UserReports = () => {
  const [reportsAgainstMe, setReportsAgainstMe] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [activeTab, setActiveTab] = useState('against-me');
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      if (activeTab === 'against-me') {
        const response = await userReportsAPI.getReportsAgainstMe();
        setReportsAgainstMe(response.reports || []);
      } else {
        const response = await userReportsAPI.getMyReports();
        setMyReports(response.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'under_review':
        return <EyeIcon className="h-5 w-5 text-blue-500" />;
      case 'resolved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'dismissed':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'spam':
        return 'bg-red-100 text-red-800';
      case 'inappropriate':
        return 'bg-orange-100 text-orange-800';
      case 'fraud':
        return 'bg-purple-100 text-purple-800';
      case 'harassment':
        return 'bg-pink-100 text-pink-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewReport = async (reportId) => {
    try {
      const response = await userReportsAPI.getReport(reportId);
      setSelectedReport(response.report);
      setShowReportModal(true);
    } catch (error) {
      console.error('Error fetching report details:', error);
      toast.error('Failed to fetch report details');
    }
  };

  const currentReports = activeTab === 'against-me' ? reportsAgainstMe : myReports;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports</h2>
        <p className="text-gray-600">
          {activeTab === 'against-me' 
            ? 'Reports made against you and their status'
            : 'Reports you have submitted'
          }
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('against-me')}
              className={`${
                activeTab === 'against-me'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              Reports Against Me
            </button>
            <button
              onClick={() => setActiveTab('my-reports')}
              className={`${
                activeTab === 'my-reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <UserIcon className="h-5 w-5 mr-2" />
              My Reports
            </button>
          </nav>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : currentReports.length === 0 ? (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === 'against-me' 
              ? 'No reports have been made against you.'
              : 'You haven\'t submitted any reports yet.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentReports.map((report) => (
            <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                      {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      <span className="ml-1">{report.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-900 mb-2 line-clamp-2">
                    {report.reason}
                  </p>
                  
                  <div className="flex items-center text-xs text-gray-500 space-x-4">
                    <span>Reported on {formatDate(report.createdAt)}</span>
                    {activeTab === 'against-me' && report.reporter && (
                      <span>By {report.reporter.first_name} {report.reporter.last_name}</span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => viewReport(report.id)}
                  className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="View details"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Details Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">Report Details</h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedReport.type)}`}>
                    {selectedReport.type.charAt(0).toUpperCase() + selectedReport.type.slice(1)}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                    {getStatusIcon(selectedReport.status)}
                    <span className="ml-1">{selectedReport.status.replace('_', ' ')}</span>
                  </span>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Reason</h4>
                  <p className="text-sm text-gray-700">{selectedReport.reason}</p>
                </div>
                
                {selectedReport.evidence && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Evidence</h4>
                    <p className="text-sm text-gray-700">{selectedReport.evidence}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Reported On</h4>
                    <p className="text-gray-700">{formatDate(selectedReport.createdAt)}</p>
                  </div>
                  
                  {selectedReport.reporter && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Reported By</h4>
                      <p className="text-gray-700">
                        {selectedReport.reporter.first_name} {selectedReport.reporter.last_name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReports;
