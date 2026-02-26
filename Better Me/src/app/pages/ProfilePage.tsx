import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, Building2, Calendar, Shield, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setIsEditing(false);
    setSuccessMessage('Profile updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.company || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          {successMessage}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            {/* Avatar */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#E8312A] to-[#d12922] rounded-full mb-4">
              <span className="text-3xl font-bold text-white">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* User Info */}
            <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.name}</h2>
            <p className="text-gray-600 text-sm mb-4">{user?.email}</p>

            {/* Role Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F0E8]">
              <Shield className={`w-4 h-4 ${isAdmin ? 'text-[#E8312A]' : 'text-gray-600'}`} />
              <span className="text-sm font-medium capitalize">{user?.role}</span>
            </div>

            {/* Member Since */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
                <Calendar className="w-4 h-4" />
                <span>
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Account Details</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-[#E8312A] text-white rounded-xl text-sm font-medium hover:bg-[#d12922] transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </div>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8312A] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </div>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8312A] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </div>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="(555) 000-0000"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8312A] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company
                  </div>
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Your company name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8312A] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#E8312A] text-white rounded-xl font-medium hover:bg-[#d12922] transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Admin Badge (if admin) */}
          {isAdmin && (
            <div className="mt-6 bg-gradient-to-r from-[#E8312A] to-[#d12922] rounded-2xl p-6 text-white">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-2">Administrator Access</h4>
                  <p className="text-white/90 text-sm">
                    You have full access to all features including user management, system settings, and advanced analytics.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
