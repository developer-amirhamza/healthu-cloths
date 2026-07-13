"use client";
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';

import { fetchMyOrders } from '@/redux/slices/orderSlice';
import { DisplayPriceInAud } from '@/utils/DisplayPriceInAud';
import Link from 'next/link';
import Image from 'next/image';
import Loader from '@/app/(main)/components/UI/Loader';

interface UserProfile {
  id: any;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

const ProfilePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, status: authStatus } = useSelector((state: RootState) => state.userSlice);
  const { orders, status: ordersStatus } = useSelector((state: RootState) => state.orderSlice);

  // Profile form state
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    avatar: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (authStatus === 'succeeded' && !user) {
      router.push('/signin?redirect=/profile');
    }
  }, [authStatus, user, router]);

  // Load user data
  useEffect(() => {
    if (user) {
      setProfile({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.mobile || '',
        avatar: user.avatar || '',
      });
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.mobile || '',
      });
    }
  }, [user]);

  // Fetch orders
  useEffect(() => {
    if (user && ordersStatus === 'idle') {
      dispatch(fetchMyOrders());
    }
  }, [user, ordersStatus, dispatch]);

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const response = await Axios({
        ...SummeryApi.updateUserDetails,
        data: {
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
        },
      });
      if (response.data?.success) {
        toast.success('Profile updated successfully');
        setProfile({
          ...profile,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
        });
        setIsEditing(false);
      } else {
        toast.error(response.data?.message || 'Update failed');
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      setPasswordLoading(true);
      const response = await Axios({
        ...SummeryApi.resetPassword,
        data: {
          email: profile.email,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        },
      });
      if (response.data?.success) {
        toast.success('Password changed successfully');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(response.data?.message || 'Password change failed');
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (authStatus === 'loading' || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Sidebar */}
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="relative  mx-auto w-32 h-32 mb-4">

            {profile.avatar ? <Image
              src={profile.avatar || '/default-avatar.png'}
              alt={profile.name}
              className="w-full h-full rounded-full object-cover border-4 border-gray-200"
            />:
            <h1 className="text-6xl w-full h-full flex items-center justify-center rounded-full font-semibold object-cover text-white border-4 bg-gray-700 border-gray-200 text-center ">{profile.name[0]} </h1>
            }
          </div>
          <h2 className="text-xl font-semibold">{profile.name}</h2>
          <p className="text-gray-500">{profile.email}</p>
          {profile.phone && <p className="text-gray-500 mt-1">{profile.phone}</p>}
          <button
            onClick={() => setIsEditing(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm"
          >
            Edit Profile
          </button>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="mt-2 ml-2 bg-gray-600 text-white px-4 py-1 rounded hover:bg-gray-700 text-sm"
          >
            Change Password
          </button>
        </div>

        {/* Orders Section */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">My Orders</h2>
          {ordersStatus === 'loading' ? (
            <div className="flex justify-center py-8"><Loader /></div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:shadow transition">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{DisplayPriceInAud(order.total)}</p>
                      <p className="text-sm capitalize">
                        Status: <span className="font-medium">{order.orderStatus}</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <p>{order.items.length} item(s)</p>
                  </div>
                  <Link
                    href={`/order/${order.id}`}
                    // href={`/order/my-orders`}
                    className="text-blue-600 text-sm hover:underline mt-2 inline-block"
                  >
                    View Details →
                  </Link>
                </div>
              ))}
              {orders.length > 5 && (
                <Link
                  href="/orders"
                  className="text-blue-600 hover:underline text-sm block text-center mt-2"
                >
                  View all orders →
                </Link>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No orders yet.</p>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Change Password</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handlePasswordChange}
                  disabled={passwordLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;