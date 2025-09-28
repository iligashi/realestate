import React, { useState } from 'react';
import { XMarkIcon, FlagIcon } from '@heroicons/react/24/outline';
import reportAPI from '../services/reportAPI';
import { toast } from 'react-hot-toast';

const ReportForm = ({ 
  isOpen, 
  onClose, 
  reportedItem, 
  reportedItemType = 'Property',
  onSuccess 
}) => {
  
  const [formData, setFormData] = useState({
    type: '',
    reason: '',
    evidence: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportTypes = [
    { value: 'spam', label: 'Spam' },
    { value: 'inappropriate', label: 'Inappropriate Content' },
    { value: 'fraud', label: 'Fraud' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.type || !formData.reason.trim()) {
      toast.error('Please select a report type and provide a reason');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const reportData = {
        type: formData.type,
        reason: formData.reason.trim(),
        evidence: formData.evidence.trim() || null,
        metadata: {
          reportedItemTitle: reportedItem?.title || reportedItem?.name || 'Unknown',
          reportedItemId: reportedItem?.id || reportedItem?._id,
          reportedAt: new Date().toISOString()
        }
      };

      let response;
      if (reportedItemType === 'Property') {
        response = await reportAPI.reportProperty(reportedItem.id || reportedItem._id, reportData);
      } else if (reportedItemType === 'User') {
        response = await reportAPI.reportUser(reportedItem.id || reportedItem._id, reportData);
      } else if (reportedItemType === 'Message') {
        response = await reportAPI.reportMessage(reportedItem.id || reportedItem._id, reportData);
      } else {
        response = await reportAPI.createReport({
          reportedItemId: reportedItem.id || reportedItem._id,
          reportedItemModel: reportedItemType.toLowerCase(),
          ...reportData
        });
      }

      toast.success('Report submitted successfully. Thank you for helping keep our platform safe.');
      
      // Reset form
      setFormData({
        type: '',
        reason: '',
        evidence: ''
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response.report);
      }
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error('Error submitting report:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 400) {
        toast.error('You have already reported this item');
      } else {
        toast.error('Failed to submit report. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        type: '',
        reason: '',
        evidence: ''
      });
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FlagIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Report {reportedItemType}</h2>
              <p className="text-sm text-gray-500">
                Help us keep our platform safe by reporting inappropriate content
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Reported Item Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Reporting:</h3>
            <p className="text-sm text-gray-900">
              {reportedItem?.title || reportedItem?.name || `This ${reportedItemType.toLowerCase()}`}
            </p>
            {reportedItem?.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {reportedItem.description}
              </p>
            )}
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's the issue? <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a report type</option>
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Please provide details <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              rows={4}
              placeholder="Please describe what you found inappropriate or concerning..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10 characters. Be as specific as possible.
            </p>
          </div>

          {/* Evidence (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional evidence (optional)
            </label>
            <textarea
              name="evidence"
              value={formData.evidence}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={3}
              placeholder="Any additional information, links, or context that might help us investigate..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.type || !formData.reason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FlagIcon className="h-4 w-4" />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            Reports are reviewed by our moderation team. False reports may result in account restrictions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportForm;
