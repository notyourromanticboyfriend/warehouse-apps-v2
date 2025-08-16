// src/app/refillqueuing/page.js
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ClipboardDocumentIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  PencilIcon,
  UserCircleIcon,
  XCircleIcon,
  PlusCircleIcon,
  ArrowRightCircleIcon,
  Cog8ToothIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Custom hook for managing lists
const useListManager = (storageKey) => {
  const [items, setItems] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  const [isOpen, setIsOpen] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [bulkItems, setBulkItems] = useState('');

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const addItem = () => {
    if (newItem.trim()) {
      setItems([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const importItems = () => {
    const newItems = bulkItems
      .split('\n')
      .map(item => item.trim())
      .filter(item => item && !items.includes(item));
    
    if (newItems.length > 0) {
      setItems([...items, ...newItems]);
      setBulkItems('');
    }
  };

  const deleteItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  return {
    items,
    isOpen,
    setIsOpen,
    newItem,
    setNewItem,
    bulkItems,
    setBulkItems,
    addItem,
    importItems,
    deleteItem
  };
};

// List Manager Modal Component
function ListManagerModal({ 
  title, 
  items, 
  newItem, 
  setNewItem, 
  bulkItems, 
  setBulkItems, 
  onAdd, 
  onImport, 
  onDelete, 
  onClose 
}) {
  return (
    <div className="fixed inset-0 bg-neutral bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Single Item */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Add Single Item</h3>
            <div className="flex">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Enter new item..."
                className="text-black flex-1 p-3 border-2 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500"
              />
              <button
                onClick={onAdd}
                className="px-4 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            
            {/* Bulk Import */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mt-6">Bulk Import</h3>
              <textarea
                value={bulkItems}
                onChange={(e) => setBulkItems(e.target.value)}
                placeholder={`Enter multiple items, one per line...`}
                className=" text-black w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 min-h-[150px]"
              />
              <button
                onClick={onImport}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 w-full"
              >
                Import Items
              </button>
            </div>
          </div>
          
          {/* Current Items List */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Items</h3>
            <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-[300px] overflow-auto">
              {items.length === 0 ? (
                <p className="p-4 text-gray-500 text-center">No items added yet</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <li key={index} className="p-3 flex justify-between items-center">
                      <span className="text-black font-medium">{item}</span>
                      <button
                        onClick={() => onDelete(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StockRefillSystem() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [createActiveDropdown, setCreateActiveDropdown] = useState(null);
  const [editActiveDropdown, setEditActiveDropdown] = useState(null);
  const [editForm, setEditForm] = useState({ item: '', quantity: 0, requestedBy: '' });
  const [newRequest, setNewRequest] = useState({ item: '', quantity: 0, requestedBy: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteOption, setDeleteOption] = useState('all');
  const [deleteStartDate, setDeleteStartDate] = useState('');
  const [deleteEndDate, setDeleteEndDate] = useState('');
  const itemsManager = useListManager('refillItemsList');
  const requestersManager = useListManager('refillRequestersList');
  const refillersManager = useListManager('refillRefillersList');
  const [showImportForm, setShowImportForm] = useState(false);
  const [importRequests, setImportRequests] = useState([
    { item: '', quantity: '', requestedBy: '' }
  ]);
  const [importResult, setImportResult] = useState({ success: 0, error: 0 });
  const [showImportResult, setShowImportResult] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [stats, setStats] = useState({
    requested: 0,
    processing: 0,
    noStock: 0,
    refilling: 0
  });
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Authentication
  const validUsers = [
    'HAROLD', 'ERICCA', 'LENI', 'CARLO', 'RACHEL', 'ANJELIN'
  ];
  const PASSWORD = 'TEMP123*';

  const handleLogin = () => {
    if (validUsers.includes(loginData.username.toUpperCase()) && 
        loginData.password === PASSWORD) {
      setCurrentUser(loginData.username.toUpperCase());
      setShowLogin(false);
      localStorage.setItem('currentUser', loginData.username.toUpperCase());
    } else {
      alert('Invalid credentials. Please try again.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowLogin(true);
    localStorage.removeItem('currentUser');
  };

  // Create a reusable loadRequests function
  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/refillqueuing/requests');
      const result = await response.json();
      
      // Handle Neon response format
      const requests = Array.isArray(result) ? result : result.rows || [];
      
      setRequests(requests);
      calculateStats(requests);
    } catch (error) {
      console.error('Failed to load requests:', error);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array since it doesn't depend on state

  // Load data from API on initial render
  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 600000); // Refresh every 600 seconds
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(savedUser);
      setShowLogin(false);
    }
    return () => {
      clearInterval(interval);
    };
  }, [loadRequests]); // Add loadRequests to dependency array

  useEffect(() => {
    // Set up periodic refresh
    const refreshInterval = setInterval(loadRequests, 600000); // Refresh every 600 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [loadRequests]);

  const calculateStats = (reqs) => {
    const stats = {
      requested: reqs.filter(r => r.status === 'REQUESTED').length,
      processing: reqs.filter(r => r.status === 'ON PROCESS').length,
      noStock: reqs.filter(r => r.status === 'NO STOCK').length,
      refilling: reqs.filter(r => r.status === 'REFILLING').length
    };
    setStats(stats);
  };

  const notifyUpdate = () => {
    // Notify same tab
    window.dispatchEvent(new Event('refillRequestsUpdated'));
    
    // Notify other tabs
    localStorage.setItem('refillRequestsUpdated', Date.now());
    localStorage.removeItem('refillRequestsUpdated');
  };

  const createRequest = async () => {
    // Validate input
    if (!newRequest.item || newRequest.quantity <= 0 || !newRequest.requestedBy) {
      alert('Please fill all fields correctly. Quantity must be greater than 0.');
      return;
    }
    
    try {
      const response = await fetch('/api/refillqueuing/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: newRequest.item,
          quantity: parseInt(newRequest.quantity, 10),
          requestedBy: newRequest.requestedBy
        })
      });
      if (response.ok) {
        await loadRequests(); // Refresh requests after creating a new one
        const newReq = await response.json();
        setRequests([newReq, ...requests]);
        setNewRequest({ item: '', quantity: 0, requestedBy: '' });
        setShowAddForm(false);
        notifyUpdate();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create request');
      }
    } catch (error) {
      console.error('Failed to create request:', error);
      alert(`Failed to create request: ${error.message}`);
    }
  };

  const isItemValid = newRequest.item.trim() !== '' && 
                   itemsManager.items.some(item => 
                     item.toLowerCase() === newRequest.item.trim().toLowerCase()
                   );

  const isEditItemValid = editForm.item.trim() !== '' && 
                       itemsManager.items.some(item => 
                         item.toLowerCase() === editForm.item.trim().toLowerCase()
                       );
                   
  // Bulk import requests
  const addImportGroup = () => {
    setImportRequests([...importRequests, { item: '', quantity: '', requestedBy: '' }]);
  };

  const removeImportGroup = (index) => {
    if (importRequests.length <= 1) return;
    const newRequests = [...importRequests];
    newRequests.splice(index, 1);
    setImportRequests(newRequests);
  };

  const updateImportGroup = (index, field, value) => {
    const newRequests = [...importRequests];
    newRequests[index][field] = value;
    setImportRequests(newRequests);
  };

  // Validate import requests
  const validateImportRequests = () => {
    // Check if there is at least one non-empty group
    const hasAtLeastOneNonEmpty = importRequests.some(group => 
      group.item.trim() !== '' && group.quantity !== '' && group.requestedBy.trim() !== ''
    );
  
    // Check every group is valid: either empty or fully filled and valid
    const allGroupsValid = importRequests.every(group => {
      // Completely empty group is valid
      if (group.item.trim() === '' && group.quantity === '' && group.requestedBy.trim() === '') {
        return true;
      }
  
      // Partially filled group is invalid
      if (group.item.trim() === '' || group.quantity === '' || group.requestedBy.trim() === '') {
        return false;
      }
  
      // Check item is in the items list
      const itemValid = itemsManager.items.some(item => 
        item.toLowerCase() === group.item.trim().toLowerCase()
      );
  
      // Check quantity is a positive integer
      const quantityNum = parseInt(group.quantity, 10);
      const quantityValid = !isNaN(quantityNum) && quantityNum > 0;
  
      // Check requester is in the requesters list
      const requesterValid = requestersManager.items.some(requester => 
        requester.toLowerCase() === group.requestedBy.trim().toLowerCase()
      );
  
      return itemValid && quantityValid && requesterValid;
    });
  
    return hasAtLeastOneNonEmpty && allGroupsValid;
  };

  // Bulk import requests
  const handleBulkImport = async () => {
    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    // Filter out empty groups
    const validRequests = importRequests.filter(group => 
      group.item.trim() && group.quantity && group.requestedBy.trim()
    );

    for (const group of validRequests) {
      const { item, quantity, requestedBy } = group;
      const quantityNum = parseInt(quantity, 10);

      if (!item || isNaN(quantityNum) || quantityNum <= 0 || !requestedBy) {
        errorCount++;
        continue;
      }

      try {
        const response = await fetch('/api/refillqueuing/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item, quantity: quantityNum, requestedBy })
        });
        
        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    setIsImporting(false);
    setImportRequests([{ item: '', quantity: '', requestedBy: '' }]);
    setShowImportForm(false);
    loadRequests();
    
    // Set result and show modal instead of alert(`Bulk import completed!\nSuccess: ${successCount}\nFailed: ${errorCount}`);
    setImportResult({ success: successCount, error: errorCount });
    setShowImportResult(true);
    
  };

  //Reset the result when import request modal closes
  useEffect(() => {
    if (!showImportResult) {
      setImportResult({ success: 0, error: 0 });
    }
  }, [showImportResult]);

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/refillqueuing/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        await loadRequests();
        notifyUpdate();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const confirmProcessor = async (id, processorName) => {
    try {
      const response = await fetch(`/api/refillqueuing/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          processedBy: processorName,
          processedAt: new Date().toISOString(),
          processorInput: ''  // Clear the input field
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm processor');
      }
      
      await loadRequests();
      notifyUpdate();
    } catch (error) {
      console.error('Failed to confirm processor:', error);
      alert(`Failed to confirm processor: ${error.message}`);
    }
  };

  const updateRefiller = async (id, refillerName) => {
    try {
      const response = await fetch(`/api/refillqueuing/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          refilledBy: refillerName,
          refilledAt: new Date().toISOString(),
          refillerInput: ''
        })
      });
      
      if (response.ok) {
        await loadRequests();
        notifyUpdate();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update refiller');
      }
    } catch (error) {
      console.error('Failed to update refiller:', error);
      alert(`Failed to update refiller: ${error.message}`);
    }
  };

  const confirmNoStock = async (id, confirmerName) => {
    try {
      const response = await fetch(`/api/refillqueuing/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          noStockBy: confirmerName,
          noStockAt: new Date().toISOString(),
          noStockInput: ''
        })
      });
      
      if (response.ok) {
        await loadRequests();
        notifyUpdate();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm no stock');
      }
    } catch (error) {
      console.error('Failed to confirm no stock:', error);
      alert(`Failed to confirm no stock: ${error.message}`);
    }
  };

  const startEditing = (request) => {
    setEditingId(request.id);
    setEditForm({ 
      item: request.item, 
      quantity: request.quantity,
      requestedBy: request.requestedBy
    });
  };

  const saveEdit = async () => {
    try {
      const response = await fetch(`/api/refillqueuing/requests/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        await loadRequests();
        notifyUpdate();
        setEditingId(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save edit');
      }
    } catch (error) {
      console.error('Failed to save edit:', error);
      alert(`Failed to save edit: ${error.message}`);
    }
  };

  const handleDeleteRequest = async (id) => {
    try {
      const response = await fetch(`/api/refillqueuing/requests/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadRequests();
        notifyUpdate();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete request');
      }
    } catch (error) {
      console.error('Failed to delete request:', error);
      alert(`Failed to delete request: ${error.message}`);
    }
  };

  const handleDeleteAllRequests = async () => {
    if (deletePassword === PASSWORD) {
      try {
        let url = '/api/refillqueuing/requests';
        
        if (deleteOption === 'range' && deleteStartDate && deleteEndDate) {
          // Format dates to ISO and add time to cover entire day
          const start = new Date(deleteStartDate);
          start.setHours(0, 0, 0, 0);
          
          const end = new Date(deleteEndDate);
          end.setHours(23, 59, 59, 999);
          
          url += `?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
        }

        const response = await fetch(url, { method: 'DELETE' });
        
        if (response.ok) {
          await loadRequests();
          setShowDeleteModal(false);
          setDeletePassword('');
          setDeleteOption('all');
          setDeleteStartDate('');
          setDeleteEndDate('');
          notifyUpdate();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete requests');
        }
      } catch (error) {
        console.error('Failed to delete requests:', error);
        alert(`Failed to delete requests: ${error.message}`);
      }
    } else {
      alert('Incorrect password. Please try again.');
    }
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
      case 'REQUESTED': return <ClipboardDocumentIcon className="w-5 h-5" />;
      case 'ON PROCESS': return <Cog8ToothIcon className="w-5 h-5" />;
      case 'NO STOCK': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'REFILLING': return <ArrowPathIcon className="w-5 h-5" />;
      default: return <ClipboardDocumentIcon className="w-5 h-5" />;
    }
  };

  // Login form
  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <UserCircleIcon className="h-16 w-16 mx-auto text-indigo-600" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Stock Refill System</h2>
            <p className="mt-2 text-gray-600">Please sign in to continue</p>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                placeholder="Enter your username"
                className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 bg-white text-gray-900 font-medium shadow-sm"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                placeholder="Enter your password"
                className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 bg-white text-gray-900 font-medium shadow-sm"
              />
            </div>

            <div>
              <button
                onClick={handleLogin}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center text-lg font-medium shadow-md"
              >
                Sign In
              </button>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              <p>Use one of: HAROLD, ERICCA, LENI, CARLO, RACHEL, ANJELIN</p>
              <p className="mt-1">Password: TEMP123*</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Refill Queue</h1>
            <p className="text-gray-600 mt-2">Manage inventory requests and refill processes</p>
            <div className="mt-1 text-sm text-indigo-600 flex items-center">
              <UserCircleIcon className="h-4 w-4 mr-1" />
              Logged in as: {currentUser}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <button
              onClick={loadRequests}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh
            </button>
            
            <button
              onClick={() => router.push('refillqueuing/view-requests')}
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 flex items-center"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              View Requests
            </button>

            {/* New list management buttons */}
            <button
              onClick={() => itemsManager.setIsOpen(true)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center"
            >
              <PlusCircleIcon className="h-5 w-5 mr-1" />
              Add Item
            </button>
            
            <button
              onClick={() => requestersManager.setIsOpen(true)}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center"
            >
              <PlusCircleIcon className="h-5 w-5 mr-1" />
              Add Requester
            </button>
            
            <button
              onClick={() => refillersManager.setIsOpen(true)}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center"
            >
              <PlusCircleIcon className="h-5 w-5 mr-1" />
              Add Refiller
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center"
            >
              <TrashIcon className="h-5 w-5 mr-1" />
              Delete All
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              Logout
            </button>
          </div>
        </div>


        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4 flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <ClipboardDocumentIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Requested</p>
              <p className="text-2xl font-bold text-gray-900">{stats.requested}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-4 flex items-center">
            <div className="rounded-full bg-amber-100 p-3 mr-4">
              <Cog8ToothIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Processing</p>
              <p className="text-2xl font-bold text-gray-900">{stats.processing}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-4 flex items-center">
            <div className="rounded-full bg-red-100 p-3 mr-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">No Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.noStock}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-4 flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <ArrowPathIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Refilling</p>
              <p className="text-2xl font-bold text-gray-900">{stats.refilling}</p>
            </div>
          </div>
        </div>

        {/* Create New Request */}
        <div className="bg-white rounded-xl shadow mb-8 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">Create New Request</h2>
          </div>
          
          {/*Import Form Create New Request*/}
          {showImportForm ? (
            <div className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Bulk Import Requests</h3>
                <p className="text-sm text-gray-600">
                  Add multiple requests using the form below. Each group represents one request.
                </p>
                
                {importRequests.map((group, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-visible">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                      {/* Item Name with dropdown */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={group.item}
                            onChange={(e) => updateImportGroup(index, 'item', e.target.value)}
                            placeholder="Item name"
                            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 bg-white text-gray-900 font-medium shadow-sm"
                            onFocus={() => setActiveDropdown({ groupIndex: index, field: 'item' })}
                            onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                          />
                          {/* Add error message */}
                          {group.item.trim() !== '' && 
                          !itemsManager.items.some(item => 
                            item.toLowerCase() === group.item.trim().toLowerCase()
                          ) && (
                            <p className="mt-1 text-sm text-red-600">
                              Item must be in the list. Add it via Add Item button.
                            </p>
                          )}
                          {group.item && activeDropdown?.groupIndex === index && activeDropdown?.field === 'item' && (
                            <div className="absolute z-20 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                              {itemsManager.items
                                .filter(item => item.toLowerCase().includes(group.item.toLowerCase()))
                                .map((item, idx) => (
                                  <div 
                                    key={idx}
                                    className="text-black px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                      updateImportGroup(index, 'item', item);
                                      setActiveDropdown(null);
                                    }}
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    {item}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Quantity - no dropdown */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={group.quantity}
                          onChange={(e) => updateImportGroup(index, 'quantity', e.target.value)}
                          placeholder="Quantity"
                          min="1"
                          className="w-full p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 bg-white text-gray-900 font-medium shadow-sm"
                        />
                      </div>
                      
                      {/* Requested By with dropdown */}
                      <div className="flex items-end">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Requested By
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={group.requestedBy}
                              onChange={(e) => updateImportGroup(index, 'requestedBy', e.target.value)}
                              placeholder="Requested by"
                              className="w-full p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 bg-white text-gray-900 font-medium shadow-sm"
                              onFocus={() => setActiveDropdown({ groupIndex: index, field: 'requestedBy' })}
                              onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                            />
                            {group.requestedBy && activeDropdown?.groupIndex === index && activeDropdown?.field === 'requestedBy' && (
                              <div className="absolute z-20 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                                {requestersManager.items
                                  .filter(name => name.toLowerCase().includes(group.requestedBy.toLowerCase()))
                                  .map((name, idx) => (
                                    <div 
                                      key={idx}
                                      className="text-black px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                      onClick={() => {
                                        updateImportGroup(index, 'requestedBy', name);
                                        setActiveDropdown(null);
                                      }}
                                      onMouseDown={(e) => e.preventDefault()}
                                    >
                                      {name}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImportGroup(index)}
                          disabled={importRequests.length <= 1}
                          className="ml-2 p-2 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    {index === importRequests.length - 1 && (
                      <button
                        type="button"
                        onClick={addImportGroup}
                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 flex items-center text-sm"
                      >
                        <PlusCircleIcon className="h-4 w-4 mr-1" />
                        Add Another Request
                      </button>
                    )}
                  </div>
                ))}
                
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => {
                      setShowImportForm(false);
                      setImportRequests([{ item: '', quantity: '', requestedBy: '' }]);
                    }}
                    className="px-4 py-2 border border-gray-400 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkImport}
                    disabled={!validateImportRequests() || isImporting}
                    className={`px-4 py-2 text-white rounded-lg flex items-center font-medium shadow-md ${
                      !validateImportRequests() || isImporting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isImporting ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                        Import Requests
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/*Single Form Create New Request*/}
          {showAddForm ? (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Item Name with dropdown */}
                <div>
                  <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="item"
                      value={newRequest.item}
                      onChange={(e) => setNewRequest({...newRequest, item: e.target.value})}
                      placeholder="Enter item name"
                      className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 bg-white text-gray-900 font-medium shadow-sm"
                      onFocus={() => setCreateActiveDropdown('item')}
                      onBlur={() => setTimeout(() => setCreateActiveDropdown(null), 200)}
                    />
                    {/* Add error message */}
                    {newRequest.item.trim() !== '' && !isItemValid && (
                      <p className="mt-1 text-sm text-red-600">
                        Item must be in the list. Add it via Add Item button.
                      </p>
                    )}
                    {newRequest.item && createActiveDropdown === 'item' && (
                      <div className="absolute z-10 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                        {itemsManager.items
                          .filter(item => item.toLowerCase().includes(newRequest.item.toLowerCase()))
                          .map((item, index) => (
                            <div 
                              key={index}
                              className="text-black px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setNewRequest({...newRequest, item});
                                setCreateActiveDropdown(null);
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {item}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    value={newRequest.quantity || ''}
                    onChange={(e) => setNewRequest({...newRequest, quantity: parseInt(e.target.value) || 0})}
                    placeholder="Enter quantity"
                    min="1"
                    className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 bg-white text-gray-900 font-medium shadow-sm"
                  />
                </div>
                
                {/* Requested By with dropdown */}
                <div>
                  <label htmlFor="requestedBy" className="block text-sm font-medium text-gray-700 mb-1">
                    Requested By
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="requestedBy"
                      value={newRequest.requestedBy}
                      onChange={(e) => setNewRequest({...newRequest, requestedBy: e.target.value})}
                      placeholder="Enter your name"
                      className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 bg-white text-gray-900 font-medium shadow-sm"
                      onFocus={() => setCreateActiveDropdown('requestedBy')}
                      onBlur={() => setTimeout(() => setCreateActiveDropdown(null), 200)}
                    />
                    {newRequest.requestedBy && createActiveDropdown === 'requestedBy' && (
                      <div className="absolute z-10 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                        {requestersManager.items
                          .filter(name => name.toLowerCase().includes(newRequest.requestedBy.toLowerCase()))
                          .map((name, index) => (
                            <div 
                              key={index}
                              className="text-black px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setNewRequest({...newRequest, requestedBy: name});
                                setCreateActiveDropdown(null);
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {name}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-400 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createRequest}
                  className={`px-4 py-2 text-white rounded-lg flex items-center font-medium shadow-md ${
                    !isItemValid || newRequest.quantity <= 0 || !newRequest.requestedBy
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                  disabled={!isItemValid || newRequest.quantity <= 0 || !newRequest.requestedBy}
                >
                  <PlusCircleIcon className="h-5 w-5 mr-2" />
                  Add Request
                </button>
              </div>
            </div>
          ) : null}
            {!showAddForm && !showImportForm && (
              <div className="p-6 flex flex-col md:flex-row justify-center gap-4">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center text-lg font-medium shadow-md"
                >
                  <PlusCircleIcon className="h-6 w-6 mr-2" />
                  Create Single Request
                </button>
                
                <button
                  onClick={() => setShowImportForm(true)}
                  className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center justify-center text-lg font-medium shadow-md"
                >
                  <ClipboardDocumentIcon className="h-6 w-6 mr-2" />
                  Import Multiple Requests
                </button>
              </div>
            )}
        </div>
        
        {/* Requests Queue */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">Refill Queue</h2>
            <p className="text-gray-600 text-sm mt-1">
              {requests.length} request{requests.length !== 1 ? 's' : ''} in queue
            </p>
          </div>
          
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : requests.filter(r => r.status !== "NO STOCK" && r.status !== "REFILLING").length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardDocumentIcon className="h-16 w-16 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No active requests</h3>
              <p className="mt-1 text-gray-500">All requests are processed or out of stock</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Create Request
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {requests
                .filter(request => request.status !== "NO STOCK" && request.status !== "REFILLING")
                .map(request => (
                <div 
                  key={request.id} 
                  className="p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  {editingId === request.id ? (
                    // Edit Form
                    <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                        <PencilIcon className="h-5 w-5 mr-2" />
                        Editing Request
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Item Name with dropdown */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item Name
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={editForm.item}
                              onChange={(e) => setEditForm({...editForm, item: e.target.value})}
                              className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 bg-white text-gray-900 font-medium shadow-sm"
                              onFocus={() => setEditActiveDropdown('item')}
                              onBlur={() => setTimeout(() => setEditActiveDropdown(null), 200)}
                            />
                            {/* Add error message */}
                            {editForm.item.trim() !== '' && 
                              !itemsManager.items.some(item => 
                                item.toLowerCase() === editForm.item.trim().toLowerCase()
                              ) && (
                                <p className="mt-1 text-sm text-red-600">
                                  Item must be in the list. Add it via Add Item button.
                                </p>
                            )}
                            {editForm.item && editActiveDropdown === 'item' && (
                              <div className="absolute z-10 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                                {itemsManager.items
                                  .filter(item => item.toLowerCase().includes(editForm.item.toLowerCase()))
                                  .map((item, index) => (
                                    <div 
                                      key={index}
                                      className="text-black px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                      onClick={() => {
                                        setEditForm({...editForm, item});
                                        setEditActiveDropdown(null);
                                      }}
                                      onMouseDown={(e) => e.preventDefault()}
                                    >
                                      {item}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                                                
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value)})}
                            min="1"
                            className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 bg-white text-gray-900 font-medium shadow-sm"
                          />
                        </div>
                        
                        {/* Requested By with dropdown */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Requested By
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={editForm.requestedBy}
                              onChange={(e) => setEditForm({...editForm, requestedBy: e.target.value})}
                              className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 bg-white text-gray-900 font-medium shadow-sm"
                              onFocus={() => setEditActiveDropdown('requestedBy')}
                              onBlur={() => setTimeout(() => setEditActiveDropdown(null), 200)}
                            />
                            {editForm.requestedBy && editActiveDropdown === 'requestedBy' && (
                              <div className="absolute z-10 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                                {requestersManager.items
                                  .filter(name => name.toLowerCase().includes(editForm.requestedBy.toLowerCase()))
                                  .map((name, index) => (
                                    <div 
                                      key={index}
                                      className="text-black px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                      onClick={() => {
                                        setEditForm({...editForm, requestedBy: name});
                                        setEditActiveDropdown(null);
                                      }}
                                      onMouseDown={(e) => e.preventDefault()}
                                    >
                                      {name}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 mt-6">
                        <button 
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 border border-gray-400 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={saveEdit}
                          className={`px-4 py-2 text-white rounded-lg hover:bg-indigo-700 flex items-center font-medium shadow-md ${
                            !isEditItemValid || editForm.quantity <= 0 || !editForm.requestedBy.trim()
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-indigo-600'
                          }`}
                          disabled={!isEditItemValid || editForm.quantity <= 0 || !editForm.requestedBy.trim()}
                        >
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Request Display
                    <div>
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(request.status)}`}>
                                {getStatusIcon(request.status)}
                              </div>
                            </div>
                            <div className="ml-4">
                              <h3 className="text-lg font-medium text-gray-900">{request.item}</h3>
                              <p className="text-gray-600">Quantity: {request.quantity}</p>
                              
                              {/* Added user tracking */}
                              {request.requestedBy && (
                                <p className="text-xs text-blue-600 mt-1">
                                  <span className="font-medium">Requested by:</span> {request.requestedBy}
                                </p>
                              )}
                              {request.processedBy && (
                                <p className="text-xs text-amber-600 mt-1">
                                  <span className="font-medium">Processed by:</span> {request.processedBy}
                                </p>
                              )}
                              {request.refilledBy && (
                                <p className="text-xs text-green-600 mt-1">
                                  <span className="font-medium">Refilled by:</span> {request.refilledBy}
                                </p>
                              )}
                              {request.noStockBy && (
                                <p className="text-xs text-red-600 mt-1">
                                  <span className="font-medium">Confirmed by:</span> {request.noStockBy}
                                </p>
                              )}
                              
                              {/* Timestamps for each status */}
                              {request.requestedAt && (
                                <p className="text-xs text-blue-600 mt-1">
                                  <span className="font-medium">Requested:</span> {new Date(request.requestedAt).toLocaleString()}
                                </p>
                              )}
                              {request.processedAt && (
                                <p className="text-xs text-amber-600 mt-1">
                                  <span className="font-medium">Processing started:</span> {new Date(request.processedAt).toLocaleString()}
                                </p>
                              )}
                              {request.refilledAt && (
                                <p className="text-xs text-green-600 mt-1">
                                  <span className="font-medium">Refilled at:</span> {new Date(request.refilledAt).toLocaleString()}
                                </p>
                              )}
                              {request.noStockAt && (
                                <p className="text-xs text-red-600 mt-1">
                                  <span className="font-medium">Marked no stock:</span> {new Date(request.noStockAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <div className="flex items-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => startEditing(request)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm flex items-center"
                        >
                          <PencilIcon className="h-4 w-4 mr-1.5" />
                          Edit
                        </button>
                        
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 text-sm flex items-center"
                        >
                          <TrashIcon className="h-4 w-4 mr-1.5" />
                          Delete
                        </button>
                        
                        {request.status === 'REQUESTED' && (
                          <button
                            onClick={() => updateStatus(request.id, 'ON PROCESS')}
                            className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 text-sm flex items-center transition-colors"
                          >
                            <ArrowRightCircleIcon className="h-4 w-4 mr-1.5" />
                            Start Processing
                          </button>
                        )}

                        {request.status === 'ON PROCESS' && !request.processedBy && (
                          <div className="w-full mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Refiller/Processor Information
                                </label>
                                <div className="flex flex-col sm:flex-row gap-2">
                              
                                    <div className="relative">
                                      <input
                                        type="text"
                                        placeholder="Who will process this?"
                                        value={request.processorInput || ''}
                                        onChange={(e) => {
                                          const updatedRequests = requests.map(r => 
                                            r.id === request.id 
                                              ? {...r, processorInput: e.target.value} 
                                              : r
                                          );
                                          setRequests(updatedRequests);
                                        }}
                                        className="flex-1 p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 bg-white text-gray-900 font-medium shadow-sm"
                                      />
                                      {request.processorInput && (
                                        <div className="absolute z-10 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                                          {refillersManager.items
                                            .filter(name => name.toLowerCase().includes(request.processorInput.toLowerCase()))
                                            .map((name, index) => (
                                              <div 
                                                key={index}
                                                className="text-black px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => {
                                                  const updatedRequests = requests.map(r => 
                                                    r.id === request.id 
                                                      ? {...r, processorInput: name} 
                                                      : r
                                                  );
                                                  setRequests(updatedRequests);
                                                }}
                                              >
                                                {name}
                                              </div>
                                            ))}
                                        </div>
                                      )}
                                    </div>
                                  <button
                                    onClick={() => confirmProcessor(request.id, request.processorInput)}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center justify-center text-sm font-medium shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    disabled={!request.processorInput}
                                  >
                                    <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                                    Confirm
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {request.status === 'ON PROCESS' && request.processedBy && (
                          <div className="flex flex-wrap gap-2 mt-3 w-full">
                            <button
                              onClick={() => updateStatus(request.id, 'REFILLING')}
                              className="flex-1 min-w-[150px] px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm flex items-center justify-center transition-colors"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                              In Stock
                            </button>
                            <button
                              onClick={() => updateStatus(request.id, 'NO STOCK')}
                              className="flex-1 min-w-[150px] px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm flex items-center justify-center transition-colors"
                            >
                              <ExclamationTriangleIcon className="h-4 w-4 mr-1.5" />
                              Out of Stock
                            </button>
                          </div>
                        )}

                        {request.status === 'REFILLING' && !request.refilledBy && (
                          <div className="w-full mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Refiller Information
                                </label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <div className="relative">
                                      <input
                                        type="text"
                                        placeholder="Refiller name"
                                        value={request.refillerInput || ''}
                                        onChange={(e) => {
                                          const updatedRequests = requests.map(r => 
                                            r.id === request.id 
                                              ? {...r, refillerInput: e.target.value} 
                                              : r
                                          );
                                          setRequests(updatedRequests);
                                        }}
                                        className="flex-1 p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 bg-white text-gray-900 font-medium shadow-sm"
                                      />
                                      {request.refillerInput && (
                                        <div className="absolute z-10 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                                          {refillersManager.items
                                            .filter(name => name.toLowerCase().includes(request.refillerInput.toLowerCase()))
                                            .map((name, idx) => (
                                              <div 
                                                key={idx}
                                                className="text-black not-even:px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => {
                                                  const updatedRequests = requests.map(r => 
                                                    r.id === request.id 
                                                      ? {...r, refillerInput: name} 
                                                      : r
                                                  );
                                                  setRequests(updatedRequests);
                                                }}
                                              >
                                                {name}
                                              </div>
                                            ))}
                                        </div>
                                      )}
                                    </div>
                                  <button
                                    onClick={() => updateRefiller(request.id, request.refillerInput)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center text-sm font-medium shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    disabled={!request.refillerInput}
                                  >
                                    <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                                    Mark Refilled
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {request.status === 'NO STOCK' && !request.noStockBy && (
                          <div className="w-full mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Confirmer Information
                                </label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="text"
                                    placeholder="Enter confirmer name"
                                    value={request.noStockInput || ''}
                                    onChange={(e) => {
                                      const updatedRequests = requests.map(r => 
                                        r.id === request.id 
                                          ? {...r, noStockInput: e.target.value} 
                                          : r
                                      );
                                      setRequests(updatedRequests);
                                    }}
                                    className="flex-1 p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 bg-white text-gray-900 font-medium shadow-sm"
                                  />
                                  <button
                                    onClick={() => confirmNoStock(request.id, request.noStockInput)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center text-sm font-medium shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    disabled={!request.noStockInput}
                                  >
                                    <ExclamationTriangleIcon className="h-4 w-4 mr-1.5" />
                                    Confirm
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-neutral bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <div className="text-center">
                <ExclamationTriangleIcon className="h-16 w-16 mx-auto text-red-500" />
                <h3 className="text-2xl font-bold text-gray-900 mt-4">Delete Requests</h3>
                <p className="text-gray-600 mt-2">This action cannot be undone.</p>
              </div>

              <div className="mt-4">
                <div className="flex items-center mb-3">
                  <input
                    type="radio"
                    id="deleteAll"
                    name="deleteOption"
                    value="all"
                    checked={deleteOption === 'all'}
                    onChange={() => setDeleteOption('all')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="deleteAll" className="ml-2 block text-sm font-medium text-gray-700">
                    Delete all requests
                  </label>
                </div>
                
                <div className="flex items-center mb-3">
                  <input
                    type="radio"
                    id="deleteRange"
                    name="deleteOption"
                    value="range"
                    checked={deleteOption === 'range'}
                    onChange={() => setDeleteOption('range')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="deleteRange" className="ml-2 block text-sm font-medium text-gray-700">
                    Delete requests by date range
                  </label>
                </div>
                
                {deleteOption === 'range' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={deleteStartDate}
                          onChange={(e) => setDeleteStartDate(e.target.value)}
                          className="w-full p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 bg-white text-gray-900 font-medium shadow-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={deleteEndDate}
                          onChange={(e) => setDeleteEndDate(e.target.value)}
                          className="w-full p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 bg-white text-gray-900 font-medium shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-500 bg-white text-gray-900 font-medium shadow-sm"
                />
              </div>

              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteOption('all');
                    setDeleteStartDate('');
                    setDeleteEndDate('');
                    setDeletePassword('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllRequests}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-md transition-colors"
                >
                  {deleteOption === 'range' ? 'Delete Selected' : 'Delete All'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Result Modal */}
        {showImportResult && (
          <div className="fixed inset-0 bg-neutral bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <div className="text-center">
                {importResult.error === 0 ? (
                  <CheckCircleIcon className="h-16 w-16 mx-auto text-green-500" />
                ) : importResult.success === 0 ? (
                  <XCircleIcon className="h-16 w-16 mx-auto text-red-500" />
                ) : (
                  <div className="relative">
                    <CheckCircleIcon className="h-16 w-16 mx-auto text-green-500" />
                    <XCircleIcon className="h-8 w-8 absolute -bottom-2 -right-2 text-red-500 bg-white rounded-full" />
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-gray-900 mt-4">
                  Import {importResult.error === 0 ? 'Successful' : 'Completed'}
                </h3>
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-green-700">{importResult.success}</div>
                    <div className="text-sm text-green-600">Successful</div>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-red-700">{importResult.error}</div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="flex justify-center">
                    {importResult.error > 0 && (
                      <div className="text-sm text-gray-600 max-w-xs">
                        Failed requests were skipped due to invalid format or missing information
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setShowImportResult(false)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          
        )}

        {itemsManager.isOpen && (
          <ListManagerModal 
            title="Manage Items"
            items={itemsManager.items}
            newItem={itemsManager.newItem}
            setNewItem={itemsManager.setNewItem}
            bulkItems={itemsManager.bulkItems}
            setBulkItems={itemsManager.setBulkItems}
            onAdd={itemsManager.addItem}
            onImport={itemsManager.importItems}
            onDelete={itemsManager.deleteItem}
            onClose={() => itemsManager.setIsOpen(false)}
          />
        )}
        
        {requestersManager.isOpen && (
          <ListManagerModal 
            title="Manage Requesters"
            items={requestersManager.items}
            newItem={requestersManager.newItem}
            setNewItem={requestersManager.setNewItem}
            bulkItems={requestersManager.bulkItems}
            setBulkItems={requestersManager.setBulkItems}
            onAdd={requestersManager.addItem}
            onImport={requestersManager.importItems}
            onDelete={requestersManager.deleteItem}
            onClose={() => requestersManager.setIsOpen(false)}
          />
        )}
        
        {refillersManager.isOpen && (
          <ListManagerModal 
            title="Manage Refillers"
            items={refillersManager.items}
            newItem={refillersManager.newItem}
            setNewItem={refillersManager.setNewItem}
            bulkItems={refillersManager.bulkItems}
            setBulkItems={refillersManager.setBulkItems}
            onAdd={refillersManager.addItem}
            onImport={refillersManager.importItems}
            onDelete={refillersManager.deleteItem}
            onClose={() => refillersManager.setIsOpen(false)}
          />
        )}
        

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Stock Refill Queueing System • Built with Next.js</p>
          <p className="mt-1">All requests are saved locally in your browser</p>
        </div>
      </div>
    </div>
    
  );
}