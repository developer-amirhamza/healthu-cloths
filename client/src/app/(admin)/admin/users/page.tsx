
"use client";
import React, { useEffect, useState } from 'react';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface User {
    id: string; name: string; email: string; mobile: string | null;
    avatar: string | null; role: string; status: string;
    verify_email: boolean; last_login_date: string | null; createdAt: string;
}

const AdminUsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [filtered, setFiltered] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await Axios({ ...SummeryApi.getAllUser });
            if (response.data?.success) setUsers(response.data.data || []);
            else toast.error(response.data?.message || 'Failed to fetch users');
        } catch (error) { AxiosToastError(error); } finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, []);

    useEffect(() => {
        let result = users;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
        }
        if (roleFilter !== 'ALL') result = result.filter(u => u.role === roleFilter);
        if (statusFilter !== 'ALL') result = result.filter(u => u.status === statusFilter);
        setFiltered(result);
    }, [users, search, roleFilter, statusFilter]);

    const handleUpdateUser = async (id: string, data: { status?: string; role?: string }) => {
        try {
            setActionLoading(id);
            const response = await Axios({ ...SummeryApi.updateUserByAdmin, data: { id, ...data } });
            if (response.data?.success) {
                toast.success('User updated successfully');
                setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...data } : u)));
            } else toast.error(response.data?.message || 'Update failed');
        } catch (error) { AxiosToastError(error); } finally { setActionLoading(null); }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
        try {
            setActionLoading(id);
            const response = await Axios({ ...SummeryApi.deleteUser, data: { id } });
            if (response.data?.success) { toast.success('User deleted'); setUsers(prev => prev.filter(u => u.id !== id)); }
            else toast.error(response.data?.message || 'Delete failed');
        } catch (error) { AxiosToastError(error); } finally { setActionLoading(null); }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        try { return format(new Date(dateStr), 'dd MMM yyyy'); } catch { return '—'; }
    };

    return (
        <div className="container mx-auto p-4 py-12">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">All Users</h1>
                <span className="text-sm text-gray-500">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
                <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="ALL">All Roles</option><option value="USER">User</option><option value="ADMIN">Admin</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="ALL">All Status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                </select>
            </div>
            {loading ? <div className="text-center py-12 text-gray-500">Loading users...</div> : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr>
                            {['User', 'Email', 'Mobile', 'Role', 'Status', 'Verified', 'Last Login', 'Joined', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No users found.</td></tr>
                            ) : filtered.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            {user.avatar ? <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" /> :
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">{user.name.charAt(0).toUpperCase()}</div>}
                                            <span className="font-medium text-gray-900 text-sm">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{user.mobile || '—'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <select value={user.role} disabled={actionLoading === user.id}
                                            onChange={e => handleUpdateUser(user.id, { role: e.target.value })}
                                            className={`text-xs rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                                            <option value="USER">User</option><option value="ADMIN">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <button disabled={actionLoading === user.id}
                                            onClick={() => handleUpdateUser(user.id, { status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                                            className={`px-2 py-1 rounded text-xs font-medium disabled:opacity-50 ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}>
                                            {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${user.verify_email ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {user.verify_email ? 'Verified' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(user.last_login_date)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <button disabled={actionLoading === user.id} onClick={() => handleDelete(user.id, user.name)}
                                            className="text-red-600 hover:text-red-900 text-sm disabled:opacity-50">
                                            {actionLoading === user.id ? '...' : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;
