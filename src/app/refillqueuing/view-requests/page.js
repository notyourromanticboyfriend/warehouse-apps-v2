//src/app/refillqueuing/view-requests/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ClipboardDocumentIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon, 
  Cog8ToothIcon,
  ArrowLeftIcon,
  UserCircleIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function ViewRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  
  // New state for search and date filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  const statusGroups = [
    { 
      key: 'ALL', 
      title: 'All', 
      icon: <ClipboardDocumentIcon className="h-5 w-5" />,
      colorClass: 'bg-indigo-100 text-indigo-900 border-indigo-300'
    },
    { 
      key: 'REQUESTED', 
      title: 'Requested', 
      status: 'REQUESTED',
      icon: <ClipboardDocumentIcon className="h-5 w-5" />,
      colorClass: 'bg-blue-100 text-blue-900 border-blue-300'
    },
    { 
      key: 'ON_PROCESS', 
      title: 'Processing', 
      status: 'ON PROCESS',
      icon: <Cog8ToothIcon className="h-5 w-5" />,
      colorClass: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    { 
      key: 'NO_STOCK', 
      title: 'Out of Stock', 
      status: 'NO STOCK',
      icon: <ExclamationTriangleIcon className="h-5 w-5" />,
      colorClass: 'bg-red-100 text-red-900 border-red-300'
    },
    { 
      key: 'REFILLING', 
      title: 'Refilling', 
      status: 'REFILLING',
      icon: <ArrowPathIcon className="h-5 w-5" />,
      colorClass: 'bg-green-100 text-green-900 border-green-300'
    }
  ];

  // Create a reusable loadRequests function
  const loadRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/refillqueuing/requests');
      const result = await response.json();
      
      // Handle Neon response format
      const data = Array.isArray(result) ? result : result.rows || [];
      
      setRequests(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load requests:', error);
      setRequests([]);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests(); // Initial load

    // Set up periodic refresh
    const interval = setInterval(loadRequests, 5000); // Refresh every 2 seconds
    
    // Listen for custom events from the main page
    const handleRefillUpdate = () => loadRequests();
    window.addEventListener('refillRequestsUpdated', handleRefillUpdate);
    
    // Listen for storage events (cross-tab communication)
    const handleStorageChange = (e) => {
      if (e.key === 'refillRequestsUpdated') {
        loadRequests();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refillRequestsUpdated', handleRefillUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadRequests]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'REQUESTED': return 'bg-blue-100 text-blue-800';
      case 'ON PROCESS': return 'bg-amber-100 text-amber-800';
      case 'NO STOCK': return 'bg-red-100 text-red-800';
      case 'REFILLING': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'REQUESTED': return <ClipboardDocumentIcon className="w-4 h-4" />;
      case 'ON PROCESS': return <Cog8ToothIcon className="w-4 h-4" />;
      case 'NO STOCK': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'REFILLING': return <ArrowPathIcon className="w-4 h-4" />;
      default: return <ClipboardDocumentIcon className="w-4 h-4" />;
    }
  };

  // Filter requests based on all criteria
  const filteredRequests = requests.filter(request => {
    // Status filter
    if (filter !== 'ALL' && request.status !== statusGroups.find(g => g.key === filter)?.status) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesItem = request.item?.toLowerCase().includes(term);
      const matchesId = request.id?.toString().includes(term);
      const matchesRequestedBy = request.requestedBy?.toLowerCase().includes(term);
      const matchesProccessedBy = request.processedBy?.toLowerCase().includes(term);
      
      if (!(matchesItem || matchesId || matchesRequestedBy|| matchesProccessedBy)) {
        return false;
      }
    }
    
    // Date filter
    if (startDate || endDate) {
      const requestedDate = request.requestedAt ? new Date(request.requestedAt) : null;
      
      if (startDate && requestedDate < new Date(startDate)) {
        return false;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include entire end day
        
        if (requestedDate > end) {
          return false;
        }
      }
    }
    
    return true;
  });

  // Generate CSV report
  const generateCSVReport = () => {
    setIsGeneratingReport(true);
    setReportMessage('Generating CSV report...');
    
    try {
      const headers = ['ID', 'Item', 'Quantity', 'Status', 'Requested By', 'Requested At', 
                      'Processed By', 'Processed At', 'Refilled By', 'Refilled At', 
                      'No Stock By', 'No Stock At'];
      
      const csvContent = [
        headers.join(','),
        ...filteredRequests.map(item => {
          return [
            `"${item.id}"`,
            `"${item.item}"`,
            item.quantity,
            `"${item.status}"`,
            `"${item.requestedBy || 'N/A'}"`,
            `"${formatDateTime(item.requestedAt)}"`,
            `"${item.processedBy || 'N/A'}"`,
            `"${formatDateTime(item.processedAt)}"`,
            `"${item.refilledBy || 'N/A'}"`,
            `"${formatDateTime(item.refilledAt)}"`,
            `"${item.noStockBy || 'N/A'}"`,
            `"${formatDateTime(item.noStockAt)}"`
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `requests-report-${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setReportMessage('CSV report downloaded successfully!');
    } catch (error) {
      console.error('Error generating CSV:', error);
      setReportMessage('Error generating report. Please try again.');
    } finally {
      setTimeout(() => {
        setIsGeneratingReport(false);
        setReportMessage('');
      }, 3000);
    }
  };

  // Clear date filters
  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
    setShowDateFilter(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => router.push('/refillqueuing')}
            className="flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md mb-6"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Main Queue
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Requests Overview</h1>
              <p className="text-gray-600 mt-2">View all refill requests with complete details</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="bg-white rounded-lg shadow-sm p-1 flex flex-wrap gap-1">
                {statusGroups.map(group => (
                  <button
                    key={group.key}
                    onClick={() => setFilter(group.key)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center ${
                      filter === group.key 
                        ? `${group.colorClass} shadow-inner font-semibold` 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {group.icon}
                    <span className="ml-1.5">{group.title}</span>
                  </button>
                ))}
              </div>
              
              <button
                onClick={generateCSVReport}
                disabled={isGeneratingReport}
                className="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:opacity-50"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-1" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
          
          {/* Search and Date Filter Section */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by item, ID, or requester..."
                className="block w-full p-3 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  {startDate || endDate ? 'Date Filter Applied' : 'Filter by Date'}
                </button>
              </div>
              
              {(startDate || endDate) && (
                <button
                  onClick={clearDateFilters}
                  className="px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  Clear Dates
                </button>
              )}
            </div>
          </div>
          
          {/* Date Filter Dropdown */}
          {showDateFilter && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowDateFilter(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
          
          {/* Status Count Cards */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {statusGroups.slice(1).map(group => {
              const count = requests.filter(r => r.status === group.status).length;
              return (
                <div key={group.key} className={`p-3 rounded-lg border ${group.colorClass} flex items-center`}>
                  <div className="text-2xl font-bold mr-3">{count}</div>
                  <div className="text-sm">{group.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Generating Report Indicator */}
        {isGeneratingReport && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg flex items-center">
            <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
            {reportMessage}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="p-12 flex justify-center bg-white rounded-xl shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Empty State */}
            {requests.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl shadow">
                <ClipboardDocumentIcon className="h-16 w-16 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No requests found</h3>
                <p className="mt-1 text-gray-500">Create requests in the main queue</p>
              </div>
            ) : (
              /* Results */
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Item
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Qty
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Requested By
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Processed By
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRequests.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{item.item}</div>
                            <div className="text-xs text-gray-600 mt-1 font-mono">
                              ID: {item.id}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                <span className="mr-1.5">{getStatusIcon(item.status)}</span>
                                {item.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-lg font-semibold text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <UserCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                              <div>
                                <div className="text-gray-900">{item.requestedBy || 'N/A'}</div>
                                <div className="text-xs text-gray-600">
                                  {formatDateTime(item.requestedAt)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              {item.processedBy && (
                                <div className="flex items-center text-sm">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center mr-2">
                                    <Cog8ToothIcon className="h-3.5 w-3.5 text-amber-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{item.processedBy}</div>
                                    <div className="text-xs text-gray-600">
                                      {formatDateTime(item.processedAt)}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {item.refilledBy && (
                                <div className="flex items-center text-sm">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
                                    <ArrowPathIcon className="h-3.5 w-3.5 text-green-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{item.refilledBy}</div>
                                    <div className="text-xs text-gray-600">
                                      {formatDateTime(item.refilledAt)}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {item.noStockBy && (
                                <div className="flex items-center text-sm">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mr-2">
                                    <ExclamationTriangleIcon className="h-3.5 w-3.5 text-red-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{item.noStockBy}</div>
                                    <div className="text-xs text-gray-600">
                                      {formatDateTime(item.noStockAt)}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* No Results for Filter */}
                {filteredRequests.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="text-gray-600 mb-4">No requests match the selected filters</div>
                    <button 
                      onClick={() => {
                        setFilter('ALL');
                        setSearchTerm('');
                        clearDateFilters();
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          {/* Results Summary */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>Showing <span className="font-semibold">{filteredRequests.length}</span> of <span className="font-semibold">{requests.length}</span> total requests</p>
            <p className="mt-1">Data is stored in the cloud database</p>
          </div>
        </>
      )}
      </div>
    </div>
  );
}