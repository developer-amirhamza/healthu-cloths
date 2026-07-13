"use client";
import { useEffect, useMemo, useState } from "react";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";

const money = (n: number) => `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;

// Derive the sales channel from the order's number prefix / payment method.
const channelOf = (o: any): string => {
  const n = (o.orderNumber || "").toUpperCase();
  if (n.startsWith("TRD")) return "Trade";
  if (n.startsWith("SUB")) return "Subscription";
  if (o.paymentMethod === "NDIS Quote") return "NDIS";
  return "Consumer";
};

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Axios({ ...SummeryApi.fetchAllOrdersByAdmin })
      .then((res) => {
        const data = res.data?.data ?? [];
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const byChannel: Record<string, { count: number; revenue: number }> = {};
    const byProduct: Record<string, { name: string; qty: number; revenue: number }> = {};
    let totalRevenue = 0;

    for (const o of orders) {
      const ch = channelOf(o);
      byChannel[ch] ??= { count: 0, revenue: 0 };
      byChannel[ch].count += 1;
      byChannel[ch].revenue += o.total ?? 0;
      totalRevenue += o.total ?? 0;

      for (const it of o.items ?? []) {
        byProduct[it.productId] ??= { name: it.productName, qty: 0, revenue: 0 };
        byProduct[it.productId].qty += it.quantity ?? 0;
        byProduct[it.productId].revenue += it.total ?? 0;
      }
    }

    const topProducts = Object.values(byProduct)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    return { byChannel, topProducts, totalRevenue, orderCount: orders.length };
  }, [orders]);

  if (loading) return <div className="p-6 text-gray-400">Loading reports…</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Reports</h1>
      <p className="text-sm text-gray-500 mb-6">Sales by channel, top products and account activity.</p>

      {/* KPI cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Kpi label="Total revenue" value={money(stats.totalRevenue)} />
        <Kpi label="Orders" value={String(stats.orderCount)} />
        <Kpi
          label="Avg. order value"
          value={money(stats.orderCount ? stats.totalRevenue / stats.orderCount : 0)}
        />
      </div>

      {/* Sales by channel */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Sales by channel</h2>
        {Object.keys(stats.byChannel).length === 0 ? (
          <p className="text-sm text-gray-400">No orders yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stats.byChannel).map(([ch, v]) => (
              <div key={ch} className="border border-gray-100 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">{ch}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{money(v.revenue)}</p>
                <p className="text-xs text-gray-500">{v.count} order(s)</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top products */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Top products</h2>
        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-gray-400">No sales yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left py-2">Product</th>
                <th className="text-right py-2">Units sold</th>
                <th className="text-right py-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProducts.map((p, i) => (
                <tr key={i} className="border-t border-gray-50">
                  <td className="py-2 text-gray-700">{p.name}</td>
                  <td className="py-2 text-right text-gray-500">{p.qty}</td>
                  <td className="py-2 text-right text-gray-700">{money(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
