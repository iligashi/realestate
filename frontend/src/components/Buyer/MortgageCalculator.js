import React, { useState, useEffect } from 'react';
import { 
  CalculatorIcon,
  CurrencyDollarIcon,
  HomeIcon,
  ChartBarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const MortgageCalculator = () => {
  const [formData, setFormData] = useState({
    homePrice: '',
    downPayment: '',
    downPaymentPercent: '',
    loanTerm: 30,
    interestRate: '',
    propertyTax: '',
    homeInsurance: '',
    pmi: '',
    hoa: ''
  });

  const [results, setResults] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Auto-calculate down payment percentage
      if (field === 'homePrice' || field === 'downPayment') {
        const homePrice = field === 'homePrice' ? parseFloat(value) || 0 : parseFloat(prev.homePrice) || 0;
        const downPayment = field === 'downPayment' ? parseFloat(value) || 0 : parseFloat(prev.downPayment) || 0;
        
        if (homePrice > 0) {
          const percent = ((downPayment / homePrice) * 100).toFixed(2);
          newData.downPaymentPercent = percent;
        }
      }

      // Auto-calculate down payment from percentage
      if (field === 'downPaymentPercent') {
        const homePrice = parseFloat(prev.homePrice) || 0;
        const percent = parseFloat(value) || 0;
        const downPayment = (homePrice * percent) / 100;
        newData.downPayment = downPayment.toFixed(0);
      }

      return newData;
    });
  };

  const calculateMortgage = () => {
    const homePrice = parseFloat(formData.homePrice) || 0;
    const downPayment = parseFloat(formData.downPayment) || 0;
    const loanAmount = homePrice - downPayment;
    const annualRate = parseFloat(formData.interestRate) || 0;
    const monthlyRate = annualRate / 100 / 12;
    const loanTermMonths = formData.loanTerm * 12;
    
    const propertyTax = parseFloat(formData.propertyTax) || 0;
    const homeInsurance = parseFloat(formData.homeInsurance) || 0;
    const pmi = parseFloat(formData.pmi) || 0;
    const hoa = parseFloat(formData.hoa) || 0;

    if (loanAmount <= 0 || monthlyRate <= 0) {
      setResults(null);
      return;
    }

    // Calculate monthly mortgage payment
    const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / 
                          (Math.pow(1 + monthlyRate, loanTermMonths) - 1);

    // Calculate additional monthly costs
    const monthlyPropertyTax = propertyTax / 12;
    const monthlyHomeInsurance = homeInsurance / 12;
    const monthlyPMI = pmi / 12;
    const monthlyHOA = hoa;

    const totalMonthlyPayment = monthlyPayment + monthlyPropertyTax + monthlyHomeInsurance + monthlyPMI + monthlyHOA;

    // Calculate total interest paid
    const totalInterest = (monthlyPayment * loanTermMonths) - loanAmount;

    // Calculate total cost
    const totalCost = homePrice + totalInterest + (propertyTax * formData.loanTerm) + 
                     (homeInsurance * formData.loanTerm) + (pmi * formData.loanTerm) + 
                     (hoa * 12 * formData.loanTerm);

    setResults({
      monthlyPayment: monthlyPayment,
      totalMonthlyPayment: totalMonthlyPayment,
      loanAmount: loanAmount,
      totalInterest: totalInterest,
      totalCost: totalCost,
      monthlyPropertyTax: monthlyPropertyTax,
      monthlyHomeInsurance: monthlyHomeInsurance,
      monthlyPMI: monthlyPMI,
      monthlyHOA: monthlyHOA
    });
  };

  useEffect(() => {
    calculateMortgage();
  }, [formData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mortgage Calculator</h2>
        <p className="text-gray-600">
          Calculate your monthly mortgage payment and total cost of homeownership
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Home Price *
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.homePrice}
                    onChange={(e) => handleInputChange('homePrice', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="500000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Down Payment ($)
                  </label>
                  <div className="relative">
                    <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.downPayment}
                      onChange={(e) => handleInputChange('downPayment', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="100000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Down Payment (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.downPaymentPercent}
                      onChange={(e) => handleInputChange('downPaymentPercent', e.target.value)}
                      className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="20"
                      step="0.01"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Term (years)
                  </label>
                  <select
                    value={formData.loanTerm}
                    onChange={(e) => handleInputChange('loanTerm', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={15}>15 years</option>
                    <option value={20}>20 years</option>
                    <option value={25}>25 years</option>
                    <option value={30}>30 years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.interestRate}
                      onChange={(e) => handleInputChange('interestRate', e.target.value)}
                      className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="6.5"
                      step="0.01"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Costs</h3>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </button>
            </div>

            {showAdvanced && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Tax (annual)
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.propertyTax}
                        onChange={(e) => handleInputChange('propertyTax', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="6000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Home Insurance (annual)
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.homeInsurance}
                        onChange={(e) => handleInputChange('homeInsurance', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="1200"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PMI (annual)
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.pmi}
                        onChange={(e) => handleInputChange('pmi', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HOA (monthly)
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.hoa}
                        onChange={(e) => handleInputChange('hoa', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {results && (
            <>
              {/* Monthly Payment Breakdown */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Payment Breakdown</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Principal & Interest</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(results.monthlyPayment)}</span>
                  </div>
                  
                  {results.monthlyPropertyTax > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Property Tax</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(results.monthlyPropertyTax)}</span>
                    </div>
                  )}
                  
                  {results.monthlyHomeInsurance > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Home Insurance</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(results.monthlyHomeInsurance)}</span>
                    </div>
                  )}
                  
                  {results.monthlyPMI > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">PMI</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(results.monthlyPMI)}</span>
                    </div>
                  )}
                  
                  {results.monthlyHOA > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">HOA</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(results.monthlyHOA)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-2 bg-blue-50 rounded-md px-3">
                    <span className="text-lg font-semibold text-gray-900">Total Monthly Payment</span>
                    <span className="text-xl font-bold text-blue-600">{formatCurrency(results.totalMonthlyPayment)}</span>
                  </div>
                </div>
              </div>

              {/* Loan Summary */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Loan Amount</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(results.loanAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Total Interest Paid</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(results.totalInterest)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-t border-gray-200 pt-3">
                    <span className="text-lg font-semibold text-gray-900">Total Cost of Home</span>
                    <span className="text-xl font-bold text-green-600">{formatCurrency(results.totalCost)}</span>
                  </div>
                </div>
              </div>

              {/* Affordability Tips */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Affordability Tips</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Aim for a monthly payment that's no more than 28% of your gross income</li>
                      <li>• Consider a 20% down payment to avoid PMI</li>
                      <li>• Shop around for the best interest rates</li>
                      <li>• Factor in maintenance costs (1-2% of home value annually)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;
