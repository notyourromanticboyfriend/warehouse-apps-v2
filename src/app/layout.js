// src/app/layout.js
import './globals.css';
import Link from 'next/link';
import { FaWarehouse, FaBoxes, FaHistory, FaClipboardList, FaCog, FaSignOutAlt, FaBell, FaUserCircle, FaBars } from 'react-icons/fa';

export const metadata = {
  title: 'Warehouse Apps',
  description: 'Warehouse management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></meta>
      <body className="min-h-screen bg-gray-50">
        <input type="checkbox" id="sidebar-toggle" className="hidden" />
        
        <Header />
        <Sidebar />
        
        <main className="min-h-screen pt-16 lg:pl-64 transition-all duration-300 relative">
          {/* Simplified overlay */}
          <label 
            htmlFor="sidebar-toggle"
            className="sidebar-overlay lg:hidden"
          ></label>
          
          <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm p-4 md:p-6 mt-4 md:mt-6">
            {children}
          </div>
        </main>

      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md z-50 h-16">
      <div className="container mx-auto flex justify-between items-center p-4 h-full">
        <div className="flex items-center space-x-2">
          {/* Mobile hamburger menu */}
          <label htmlFor="sidebar-toggle" className="lg:hidden text-white mr-2 cursor-pointer">
            <FaBars className="text-xl" />
          </label>
          <div className="flex items-center space-x-2">
            <FaWarehouse className="text-2xl" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">WAREHOUSE APPS</h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-blue-700 transition-colors relative">
            <FaBell className="text-xl" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          <div className="flex items-center space-x-2 bg-blue-700/50 rounded-full pl-2 pr-4 py-1">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <FaUserCircle className="text-white text-xl" />
            </div>
            <span className="font-medium">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <FaBoxes /> },
    { name: 'Item Checking Recorder', path: '/itemcheckingrecorder', icon: <FaClipboardList /> },
    { name: 'Refill Queuing', path: '/refillqueuing', icon: <FaHistory /> },
    { name: 'View Requests', path: '/refillqueuing/view-requests', icon: <FaHistory /> },
  ];

  return (
    <>
      {/* Mobile overlay */}
       <label 
          htmlFor="sidebar-toggle" 
          className="hidden fixed top-16 left-0 right-0 bottom-0 bg-black bg-opacity-50 z-30 lg:hidden" 
          aria-hidden="true"
        ></label>
        
        <aside className="sidebar fixed top-0 left-0 bottom-0 w-64 bg-gradient-to-b from-blue-800 to-blue-900 text-white flex flex-col z-40 transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out">
        <div className="p-4 border-b border-blue-700">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <FaWarehouse />
            <span>WAREHOUSE APPS</span>
          </h2>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  href={item.path} 
                  className="flex items-center p-3 rounded-lg hover:bg-blue-700 transition-colors text-blue-100 hover:text-white"
                >
                  <span className="text-lg mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-blue-700">
          <h3 className="font-medium text-sm text-blue-300 uppercase tracking-wider mb-2">SYSTEM</h3>
          <ul className="space-y-1">
            <li>
              <Link 
                href="/settings" 
                className="flex items-center p-3 rounded-lg hover:bg-blue-700 transition-colors text-blue-100 hover:text-white"
              >
                <span className="text-lg mr-3"><FaCog /></span>
                <span>Settings</span>
              </Link>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center p-3 rounded-lg hover:bg-blue-700 transition-colors text-blue-100 hover:text-white"
              >
                <span className="text-lg mr-3"><FaSignOutAlt /></span>
                <span>Logout</span>
              </a>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}