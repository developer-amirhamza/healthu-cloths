"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import AxiosToastError from "@/utils/AxiosToastError";
import toast from "react-hot-toast";
import OrderDetailModal from "./components/OrderDetailModal";
import { FaEye, FaFilter } from "react-icons/fa";

interface OrderItem {
    id: string;
    productName: string;
    productImage?: string;
    price: number;
    quantity: number;
    total: number;
}

interface Order {
    id: string;
    orderNumber: string;
    name: string;
    email: string;
    phone: string;
    shippingAddress: string;
    subtotal: number;
    shippingCost: number;
    tax: number;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string;
    createdAt: string;
    updatedAt: string;
    items: OrderItem[];
    user?: {
        id: string;
        name: string;
        email: string;
    };
}

type FilterType = "all" | "pending" | "processing" | "shipped" | "delivered" | "cancelled";
type PaymentFilterType = "all" | "Pending" | "Completed" | "Failed" | "Cancelled";

const AdminOrdersPage = () => {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState<FilterType>("all");
    const [paymentFilter, setPaymentFilter] = useState<PaymentFilterType>("all");
    const [searchTerm, setSearchTerm] = useState("");

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await Axios({ ...SummeryApi.fetchAllOrdersByAdmin });
            if (response.data?.success) {
                setOrders(response.data?.data || []);
                setFilteredOrders(response.data?.data || []);
            } else {
                toast.error(response.data?.message || "Failed to fetch orders");
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Apply filters
    useEffect(() => {
        let filtered = orders;

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((order) => order.orderStatus.toLowerCase() === statusFilter.toLowerCase());
        }

        // Payment filter
        if (paymentFilter !== "all") {
            filtered = filtered.filter((order) => order.paymentStatus === paymentFilter);
        }

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter((order) =>
                order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredOrders(filtered);
    }, [orders, statusFilter, paymentFilter, searchTerm]);

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setShowDetailModal(true);
    };

    const handleCloseModal = () => {
        setShowDetailModal(false);
        setSelectedOrder(null);
    };

    const handleOrderUpdated = (updatedOrder: Order) => {
        setOrders((prev) =>
            prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
        );
        setFilteredOrders((prev) =>
            prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
        );
        handleCloseModal();
    };

    const getStatusBadgeColor = (status: string) => {
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "processing":
                return "bg-blue-100 text-blue-800";
            case "shipped":
                return "bg-indigo-100 text-indigo-800";
            case "delivered":
                return "bg-green-100 text-green-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getPaymentBadgeColor = (status: string) => {
        switch (status) {
            case "Pending":
                return "bg-yellow-100 text-yellow-800";
            case "Completed":
                return "bg-green-100 text-green-800";
            case "Failed":
                return "bg-red-100 text-red-800";
            case "Cancelled":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff8800]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Orders Management</h1>
                <p className="text-gray-600">Manage and track all customer orders</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-600 text-sm font-medium">Total Orders</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{orders.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-600 text-sm font-medium">Pending Orders</h3>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">
                        {orders.filter((o) => o.orderStatus.toLowerCase() === "pending").length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-600 text-sm font-medium">Shipped Orders</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                        {orders.filter((o) => o.orderStatus.toLowerCase() === "shipped").length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-600 text-sm font-medium">Total Revenue</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                        ${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <FaFilter className="text-blue-600" />
                    <h3 className="font-semibold text-gray-800">Filters</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search
                        </label>
                        <input
                            type="text"
                            placeholder="Order #, Email, Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Order Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Order Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as FilterType)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Payment Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Status
                        </label>
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value as PaymentFilterType)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Payments</option>
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="Failed">Failed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setStatusFilter("all");
                                setPaymentFilter("all");
                                setSearchTerm("");
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                <div className="mt-3 text-sm text-gray-600">
                    Showing {filteredOrders.length} of {orders.length} orders
                </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Items
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Payment Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                    <p className="text-lg">No orders found</p>
                                    <p className="text-sm">Try adjusting your filters</p>
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-semibold text-gray-900">
                                            {order.orderNumber}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm">
                                            <p className="font-medium text-gray-900">{order.name}</p>
                                            <p className="text-gray-500 text-xs">{order.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-700">
                                            {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-semibold text-gray-900">
                                            ${order.total.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(order.orderStatus)}`}>
                                            {order.orderStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPaymentBadgeColor(order.paymentStatus)}`}>
                                            {order.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => handleViewDetails(order)}
                                            className="text-blue-600 hover:text-blue-900 font-semibold transition flex items-center gap-1"
                                        >
                                            <FaEye size={14} />
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Order Detail Modal */}
            {showDetailModal && selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={handleCloseModal}
                    onUpdate={handleOrderUpdated}
                />
            )}
        </div>
    );
};

export default AdminOrdersPage;
