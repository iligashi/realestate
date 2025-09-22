import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { 
  XMarkIcon,
  UserIcon,
  HomeIcon,
  DocumentTextIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const RentalApplicationForm = ({ isOpen, onClose, property, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'submitting', 'success', 'error'
  const [submitMessage, setSubmitMessage] = useState('');
  const totalSteps = 3;

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    defaultValues: {
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        currentAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      },
      employment: {
        employer: '',
        jobTitle: '',
        monthlyIncome: '',
        employmentDuration: '',
        workPhone: ''
      },
      rentalInfo: {
        desiredMoveInDate: '',
        leaseDuration: '',
        numberOfOccupants: 1,
        hasPets: false,
        petDetails: '',
        previousLandlord: {
          name: '',
          phone: '',
          email: ''
        },
        previousRentalHistory: ''
      },
      financialInfo: {
        annualIncome: '',
        creditScore: '',
        bankName: '',
        accountType: '',
        hasGuarantor: false,
        guarantorInfo: {
          name: '',
          relationship: '',
          phone: '',
          email: '',
          address: ''
        }
      },
      additionalInfo: {
        reasonForMoving: '',
        specialRequirements: '',
        additionalComments: '',
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
          email: ''
        }
      }
    }
  });

  const handleFormSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setSubmitStatus('submitting');
      setSubmitMessage('Submitting your rental application...');
      
      await onSubmit(data);
      
      setSubmitStatus('success');
      setSubmitMessage('Application submitted successfully! You will receive a confirmation email shortly.');
      
      // Show success feedback for 3 seconds before closing
      setTimeout(() => {
        reset();
        setCurrentStep(1);
        setSubmitStatus(null);
        setSubmitMessage('');
        onClose();
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitStatus('error');
      setSubmitMessage(error.response?.data?.message || 'Failed to submit application. Please try again.');
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setSubmitStatus(null);
        setSubmitMessage('');
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-green-600" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  {...register('personalInfo.firstName', { required: 'First name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your first name"
                />
                {errors.personalInfo?.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.personalInfo.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  {...register('personalInfo.lastName', { required: 'Last name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your last name"
                />
                {errors.personalInfo?.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.personalInfo.lastName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  {...register('personalInfo.email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your email"
                />
                {errors.personalInfo?.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.personalInfo.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  {...register('personalInfo.phone', { required: 'Phone number is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your phone number"
                />
                {errors.personalInfo?.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.personalInfo.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  {...register('personalInfo.dateOfBirth', { required: 'Date of birth is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {errors.personalInfo?.dateOfBirth && (
                  <p className="text-red-500 text-xs mt-1">{errors.personalInfo.dateOfBirth.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Address
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  {...register('personalInfo.currentAddress.street')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Street Address"
                />
                <input
                  {...register('personalInfo.currentAddress.city')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="City"
                />
                <input
                  {...register('personalInfo.currentAddress.state')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="State"
                />
                <input
                  {...register('personalInfo.currentAddress.zipCode')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="ZIP Code"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <HomeIcon className="h-5 w-5 text-purple-600" />
              Rental Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desired Move-in Date *
                </label>
                <input
                  type="date"
                  {...register('rentalInfo.desiredMoveInDate', { required: 'Move-in date is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {errors.rentalInfo?.desiredMoveInDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.rentalInfo.desiredMoveInDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lease Duration (months) *
                </label>
                <input
                  type="number"
                  {...register('rentalInfo.leaseDuration', { 
                    required: 'Lease duration is required',
                    valueAsNumber: true,
                    min: { value: 1, message: 'Lease duration must be at least 1 month' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 12"
                />
                {errors.rentalInfo?.leaseDuration && (
                  <p className="text-red-500 text-xs mt-1">{errors.rentalInfo.leaseDuration.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Occupants
                </label>
                <input
                  type="number"
                  {...register('rentalInfo.numberOfOccupants', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Number of people"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('rentalInfo.hasPets')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  I have pets
                </label>
              </div>
            </div>

            {watch('rentalInfo.hasPets') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pet Details
                </label>
                <textarea
                  {...register('rentalInfo.petDetails')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Describe your pets (type, size, etc.)"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Previous Rental History
              </label>
              <textarea
                {...register('rentalInfo.previousRentalHistory')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="3"
                placeholder="Describe your previous rental experience"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-orange-600" />
              Additional Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Moving
              </label>
              <textarea
                {...register('additionalInfo.reasonForMoving')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="3"
                placeholder="Why are you looking for a new place?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Requirements
              </label>
              <textarea
                {...register('additionalInfo.specialRequirements')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="3"
                placeholder="Any special needs or requirements?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Comments
              </label>
              <textarea
                {...register('additionalInfo.additionalComments')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="3"
                placeholder="Anything else you'd like the landlord to know?"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  {...register('additionalInfo.emergencyContact.name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Emergency contact name"
                />
                <input
                  {...register('additionalInfo.emergencyContact.relationship')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Relationship"
                />
                <input
                  {...register('additionalInfo.emergencyContact.phone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Phone number"
                />
                <input
                  {...register('additionalInfo.emergencyContact.email')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Email address"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Rental Application</h2>
            <p className="text-sm text-gray-600">{property?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
                  <div className="px-6 py-6">
          {/* Feedback Display */}
          {submitStatus && (
            <div className={`mb-6 p-4 rounded-lg border ${
              submitStatus === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : submitStatus === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center">
                {submitStatus === 'success' && (
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                )}
                {submitStatus === 'error' && (
                  <XCircleIcon className="h-5 w-5 mr-2 text-red-600" />
                )}
                {submitStatus === 'submitting' && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                )}
                <span className="font-medium">{submitMessage}</span>
              </div>
            </div>
          )}
          
          {renderStepContent()}
        </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-4 py-2 rounded-md font-medium ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || submitStatus === 'success'}
                  className={`px-6 py-2 rounded-md font-medium flex items-center gap-2 ${
                    isSubmitting || submitStatus === 'success'
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {submitStatus === 'success' ? 'Application Submitted!' : 
                   isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RentalApplicationForm;
