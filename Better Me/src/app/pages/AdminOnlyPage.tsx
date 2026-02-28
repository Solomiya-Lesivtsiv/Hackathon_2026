import { useState, useEffect } from 'react';
import { Shield, Users, Activity, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiGetUsers, apiGetActivityLog, apiUpdateUser, apiDeleteUser, type UserWithStats, type ActivityLog } from '../services/api';
import { toast } from 'sonner';

export default function AdminOnlyPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([apiGetUsers(), apiGetActivityLog(10)])
      .then(([u, a]) => { setUsers(u); setActivity(a); })
      .catch(() => toast.error("Failed to load admin data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleToggleRole = async (user: UserWithStats) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await apiUpdateUser(user.id, { role: newRole });
      toast.success(`${user.name} is now ${newRole}`);
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleToggleStatus = async (user: UserWithStats) => {
    const newStatus = !user.is_active;
    try {
      await apiUpdateUser(user.id, { is_active: newStatus });
      toast.success(`${user.name} ${newStatus ? 'activated' : 'deactivated'}`);
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteUser = async (user: UserWithStats) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    try {
      await apiDeleteUser(user.id);
      toast.success(`${user.name} deleted`);
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Active Users', value: users.filter(u => u.is_active).length, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Administrators', value: users.filter(u => u.role === 'admin').length, icon: Shield, color: 'bg-purple-500' },
    { label: 'Inactive Users', value: users.filter(u => !u.is_active).length, icon: XCircle, color: 'bg-gray-500' },
  ];

  const formatTimeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const actionColor = (action: string) => {
    if (action.includes('login') || action.includes('register')) return 'bg-blue-500';
    if (action.includes('order') || action.includes('csv')) return 'bg-green-500';
    if (action.includes('delete')) return 'bg-red-500';
    if (action.includes('update')) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

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

      {/* Warning banner */}
      <div className="mb-6 bg-gradient-to-r from-[#E8312A] to-[#d12922] rounded-xl p-4 text-white">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5" />
          <div>
            <p className="font-medium">Administrator Access Required</p>
            <p className="text-sm text-white/90">This page is only accessible to users with administrator privileges</p>
          </div>
        </div>
      </div>

      {/* Stats */}
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

      {/* User Management */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-1">User Management</h2>
          <p className="text-gray-600 text-sm">Manage user roles and permissions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#E8312A] to-[#d12922] rounded-full">
                        <span className="text-sm font-medium text-white">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleToggleRole(user)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                      {user.role === 'admin' && <Shield className="w-3 h-3" />}
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleToggleStatus(user)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {user.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {user.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.totalOrders} orders · ${user.totalSpent.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.lastActive ? formatTimeAgo(user.lastActive) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => handleDeleteUser(user)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={user.role === 'admin'}>
                      {user.role === 'admin' ? '' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Log */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl">
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
        </div>
        {activity.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No activity yet</p>
        ) : (
          <div className="space-y-4">
            {activity.map((log) => (
              <div key={log.id} className="flex gap-3">
                <div className={`flex-shrink-0 w-2 h-2 mt-2 ${actionColor(log.action)} rounded-full`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.details}</p>
                  <p className="text-xs text-gray-600">by {log.userName} · {formatTimeAgo(log.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
