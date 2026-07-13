"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { createCheckoutSession, clearStripeUrl } from "@/redux/slices/orderSlice";
import { fetchCart } from "@/redux/slices/cartSlice";
import { DisplayPriceInAud } from "@/utils/DisplayPriceInAud";
import { normaliseRole, portalPath, ROLES } from "@/utils/roles";
import Link from "next/link";
import toast from "react-hot-toast";

interface FormData {
  name: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

const CheckoutPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { cart, status: cartStatus } = useSelector((state: RootState) => state.cartSlice);
  const { stripeUrl, status: orderStatus, error } = useSelector((state: RootState) => state.orderSlice);
  const user = useSelector((state: RootState) => state.userSlice.user);


  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Auto-fill user data if logged in
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.mobile || "",
      }));
    }
  }, [user]);

  // Fetch cart if idle
  useEffect(() => {
    if (cartStatus === "idle") {
      dispatch(fetchCart());
    }
  }, [cartStatus, dispatch]);

  // Redirect to Stripe when URL is ready
  useEffect(() => {
    if (stripeUrl) {
      window.location.href = stripeUrl;
      dispatch(clearStripeUrl());
    }
  }, [stripeUrl, dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, phone, addressLine, city, state, pincode, country } = form;
    if (!name || !email || !phone || !addressLine || !city || !state || !pincode || !country) {
      toast.error("Please fill all fields");
      return;
    }
    // Build full shipping address string
    const shippingAddress = `${addressLine}, ${city}, ${state}, ${pincode}, ${country}`;
    setIsSubmitting(true);
    try {
      await dispatch(createCheckoutSession({
        name,
        email,
        phone,
        shippingAddress,
      })).unwrap();
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Your cart is empty.</p>
        <a href="/products" className="text-blue-600 underline mt-2 inline-block">Continue Shopping</a>
      </div>
    );
  }

  // Calculate totals
  let subtotal = 0;
  let totalQty = 0;
  let grandTotal = 0;
  let totalDiscount = 0;

  for (const item of cart.items) {
    const price = item.product.price;
    const discount = item.product.discount || 0;
    const discountedPrice = price - (price * discount) / 100;
    const itemTotal = discountedPrice * item.quantity;
    const itemOriginalTotal = price * item.quantity;
    subtotal += itemOriginalTotal;
    totalQty += item.quantity;
    totalDiscount += itemOriginalTotal - itemTotal;
    grandTotal += itemTotal;
  }

  const role = normaliseRole(user?.role);
  const hasPortal = role === ROLES.TRADE || role === ROLES.NDIS_COORDINATOR;

  return (
    <section className="bg-blue-50 min-h-screen py-8">
      <div className="container mx-auto p-4">
        {hasPortal && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">
              You're checking out at <b>retail price</b>. Your{" "}
              {role === ROLES.TRADE ? "trade wholesale pricing" : "NDIS quote pricing"} is
              only available in your portal.
            </p>
            <Link
              href={portalPath(role)}
              className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Go to my portal →
            </Link>
          </div>
        )}
      </div>
      <div className="container mx-auto gap-6 flex flex-col lg:flex-row items-start justify-between p-4">
        {/* Checkout Form */}
        <div className="w-full bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">Billing Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                required
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                required
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleInputChange}
                required
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="border-t pt-4 mt-2">
              <h3 className="font-medium text-neutral-800 mb-3">Shipping Address</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Address Line</label>
                  <input
                    type="text"
                    name="addressLine"
                    placeholder="Street, House No., Apartment"
                    value={form.addressLine}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="Enter Your City Name"
                      value={form.city}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      placeholder="Enter Your State Name"
                      value={form.state}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Pincode / ZIP</label>
                    <input
                      type="text"
                      name="pincode"
                      placeholder="Enter Your Pincode"
                      value={form.pincode}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      placeholder="Enter Your Country Name"
                      value={form.country}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:max-w-md bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">Order Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Subtotal</span>
              <span className="font-medium">{DisplayPriceInAud(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Discount</span>
              <span className="text-green-600">- {DisplayPriceInAud(totalDiscount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Total Quantity</span>
              <span className="font-medium">{totalQty} items</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>Grand Total</span>
                <span>{DisplayPriceInAud(grandTotal)}</span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || orderStatus === "loading"}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition disabled:bg-gray-400"
            >
              {isSubmitting || orderStatus === "loading" ? "Processing..." : "Proceed to Payment"}
            </button>
            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CheckoutPage;