import { useState } from 'react';
import { Shield, Users, Settings, Activity, Database, Lock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  lastActive: string;
}

// Mock users data
const MOCK_USERS: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@betterme.com', role: 'admin', status: 'active', lastActive: '2 minutes ago' },
  { id: '2', name: 'Regular User', email: 'user@example.com', role: 'user', status: 'active', lastActive: '1 hour ago' },
  { id: '3', name: 'John Smith', email: 'john@example.com', role: 'user', status: 'active', lastActive: '3 hours ago' },
  { id: '4', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'user', status: 'active', lastActive: '1 day ago' },
  { id: '5', name: 'Michael Chen', email: 'michael@example.com', role: 'user', status: 'inactive', lastActive: '5 days ago' },
];

export default function AdminOnlyPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleToggleRole = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, role: user.role === 'admin' ? 'user' : 'admin' }
        : user
    ));
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Active Users', value: users.filter(u => u.status === 'active').length, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Administrators', value: users.filter(u => u.role === 'admin').length, icon: Shield, color: 'bg-purple-500' },
    { label: 'Inactive Users', value: users.filter(u => u.status === 'inactive').length, icon: XCircle, color: 'bg-gray-500' },
  ];

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 bg-[#E8312A] rounded-xl">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users and system settings</p>
          </div>
        </div>
      </div>

      {/* Admin-only warning banner */}
      <div className="mb-6 bg-gradient-to-r from-[#E8312A] to-[#d12922] rounded-xl p-4 text-white">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5" />
          <div>
            <p className="font-medium">Administrator Access Required</p>
            <p className="text-sm text-white/90">This page is only accessible to users with administrator privileges</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`flex items-center justify-center w-12 h-12 ${stat.color} rounded-xl`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-gray-600 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">User Management</h2>
              <p className="text-gray-600 text-sm">Manage user roles and permissions</p>
            </div>
            <button className="px-4 py-2 bg-[#E8312A] text-white rounded-xl text-sm font-medium hover:bg-[#d12922] transition-colors">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Add User
              </div>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#E8312A] to-[#d12922] rounded-full">
                        <span className="text-sm font-medium text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleRole(user.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {user.role === 'admin' ? <Shield className="w-3 h-3" /> : null}
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.status === 'active' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.lastActive}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Settings Section */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* System Settings */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">System Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-600">Require 2FA for all users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#E8312A]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E8312A]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Send system alerts via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#E8312A]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E8312A]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">User role updated</p>
                <p className="text-xs text-gray-600">John Smith promoted to admin • 5 min ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">New user registered</p>
                <p className="text-xs text-gray-600">Sarah Johnson joined • 1 hour ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-red-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">User deactivated</p>
                <p className="text-xs text-gray-600">Michael Chen account disabled • 2 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
