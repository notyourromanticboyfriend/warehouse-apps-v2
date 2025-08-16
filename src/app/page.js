// src/app/page.js
import { FaBox, FaTruckLoading, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function Home() {
  // Dashboard statistics data
  const stats = [
    { 
      title: 'Total Items', 
      value: '1,248', 
      icon: <FaBox className="text-3xl" />,
      change: '+12% from last month',
      color: 'from-blue-500 to-blue-700'
    },
    { 
      title: 'Pending Shipments', 
      value: '24', 
      icon: <FaTruckLoading className="text-3xl" />,
      change: '3 urgent',
      color: 'from-amber-500 to-amber-700'
    },
    { 
      title: 'Completed Today', 
      value: '86', 
      icon: <FaCheckCircle className="text-3xl" />,
      change: '12% above target',
      color: 'from-green-500 to-green-700'
    },
    { 
      title: 'Low Stock Items', 
      value: '17', 
      icon: <FaExclamationTriangle className="text-3xl" />,
      change: '5 critical',
      color: 'from-red-500 to-red-700'
    }
  ];

  // Recent activity data
  const activities = [
    { item: 'Plastic Containers', action: 'Restocked', time: '2 min ago', user: 'James Wilson' },
    { item: 'Cardboard Boxes', action: 'Inventory Check', time: '15 min ago', user: 'Sarah Chen' },
    { item: 'Shipping Labels', action: 'Low Stock Alert', time: '1 hour ago', user: 'System' },
    { item: 'Forklift #3', action: 'Maintenance Completed', time: '2 hours ago', user: 'Mike Rodriguez' },
    { item: 'Thermal Printers', action: 'Moved to Section B', time: '3 hours ago', user: 'Emma Davis' }
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Animated Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className={`bg-gradient-to-r ${stat.color} text-white rounded-xl p-6 shadow-lg transform transition duration-500 hover:scale-105 animate-fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold mb-2">{stat.title}</h3>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                {stat.icon}
              </div>
            </div>
            <p className="mt-4 text-sm opacity-90">{stat.change}</p>
          </div>
        ))}
      </div>
      
      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Recent Activity</h2>
          <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            View All Activity →
          </button>
        </div>
        
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div 
              key={index}
              className="flex items-start py-3 border-b border-gray-100 animate-fade-in"
              style={{ animationDelay: `${0.4 + index * 0.05}s` }}
            >
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                {stats[index % stats.length].icon}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-semibold">{activity.item}</h3>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </div>
                <p className="text-gray-600">{activity.action} • By {activity.user}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}