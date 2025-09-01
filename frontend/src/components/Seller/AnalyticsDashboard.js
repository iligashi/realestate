import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getListingAnalytics, 
  getAnalyticsDetails,
  clearError 
} from '../../store/slices/sellerSlice';
import { 
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  ShareIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const AnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const { 
    analytics, 
    currentAnalytics,
    loading, 
    error 
  } = useSelector(state => state.seller);
  
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [viewType, setViewType] = useState('overview');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        console.log('AnalyticsDashboard: Dispatching getListingAnalytics with period:', timeRange);
        dispatch(getListingAnalytics({ period: timeRange }));
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [dispatch, timeRange, loading]);

  useEffect(() => {
    console.log('AnalyticsDashboard: State updated:', { analytics, loading, error });
  }, [analytics, loading, error]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handlePropertySelect = (propertyId) => {
    setSelectedProperty(propertyId);
    dispatch(getAnalyticsDetails(propertyId));
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getConversionRate = (views, inquiries) => {
    if (views === 0) return 0;
    return ((inquiries / views) * 100).toFixed(1);
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        
        <div className="flex space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="overview">Overview</option>
            <option value="detailed">Detailed</option>
            <option value="comparison">Comparison</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Properties List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Properties</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.map((analytic) => (
                  <div
                    key={analytic._id}
                    onClick={() => handlePropertySelect(analytic._id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedProperty === analytic._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900 mb-2">
                      {analytic.property?.title}
                    </h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-gray-600">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Views
                        </span>
                        <span className="font-medium">{formatNumber(analytic.views.total)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-gray-600">
                          <HeartIcon className="h-4 w-4 mr-1" />
                          Saves
                        </span>
                        <span className="font-medium">{formatNumber(analytic.saves.total)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-gray-600">
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                          Inquiries
                        </span>
                        <span className="font-medium">{formatNumber(analytic.inquiries.total)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Conversion</span>
                        <span className="font-medium">
                          {getConversionRate(analytic.views.total, analytic.inquiries.total)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Performance</span>
                        <span className={`text-xs font-medium ${getPerformanceColor(analytic.performanceScore?.overall || 0)}`}>
                          {getPerformanceLabel(analytic.performanceScore?.overall || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Analytics */}
          {selectedProperty && currentAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Overview */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overall Score</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-lg font-semibold ${getPerformanceColor(currentAnalytics.performanceScore?.overall || 0)}`}>
                        {currentAnalytics.performanceScore?.overall || 0}/100
                      </span>
                      <span className={`text-sm ${getPerformanceColor(currentAnalytics.performanceScore?.overall || 0)}`}>
                        {getPerformanceLabel(currentAnalytics.performanceScore?.overall || 0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Views</span>
                        <span>{currentAnalytics.performanceScore?.views || 0}/25</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(currentAnalytics.performanceScore?.views || 0) * 4}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Engagement</span>
                        <span>{currentAnalytics.performanceScore?.engagement || 0}/25</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(currentAnalytics.performanceScore?.engagement || 0) * 4}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Response</span>
                        <span>{currentAnalytics.performanceScore?.response || 0}/25</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full" 
                          style={{ width: `${(currentAnalytics.performanceScore?.response || 0) * 4}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Conversion</span>
                        <span>{currentAnalytics.performanceScore?.conversion || 0}/25</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${(currentAnalytics.performanceScore?.conversion || 0) * 4}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <EyeIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(currentAnalytics.views.total)}
                    </div>
                    <div className="text-sm text-gray-600">Total Views</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {currentAnalytics.views.unique} unique
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <HeartIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(currentAnalytics.saves.total)}
                    </div>
                    <div className="text-sm text-gray-600">Total Saves</div>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatNumber(currentAnalytics.inquiries.total)}
                    </div>
                    <div className="text-sm text-gray-600">Total Inquiries</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">
                      {getConversionRate(currentAnalytics.views.total, currentAnalytics.inquiries.total)}%
                    </div>
                    <div className="text-sm text-gray-600">Conversion Rate</div>
                  </div>
                </div>
              </div>

              {/* Traffic Sources */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Traffic Sources</h3>
                
                <div className="space-y-3">
                  {Object.entries(currentAnalytics.trafficSources).map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{source}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${(count / Math.max(...Object.values(currentAnalytics.trafficSources))) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device Analytics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Device Analytics</h3>
                
                <div className="space-y-3">
                  {Object.entries(currentAnalytics.devices).map(([device, count]) => (
                    <div key={device} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{device}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ 
                              width: `${(count / Math.max(...Object.values(currentAnalytics.devices))) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {currentAnalytics.recommendations && currentAnalytics.recommendations.length > 0 && (
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentAnalytics.recommendations.map((rec, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{rec.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                        <p className="text-xs text-gray-500">Impact: {rec.impact}</p>
                        <p className="text-xs text-blue-600 mt-1">Action: {rec.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
