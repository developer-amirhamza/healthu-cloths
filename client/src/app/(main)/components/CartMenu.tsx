"use client";
import React, { useEffect } from 'react';
import { IoClose } from "react-icons/io5";
import Link from 'next/link';
import { DisplayPriceInAud } from '@/utils/DisplayPriceInAud';
import { FaAngleDoubleRight } from "react-icons/fa";
import { useDispatch, useSelector } from 'react-redux';
import AddToCartButton from './UI/AddToCartBtn';
import emptyCart from "@/assets/empty-cart.gif";
import Image from 'next/image';
import { AppDispatch, RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
import { fetchCart } from '@/redux/slices/cartSlice';

interface Type {
    close: any;
}

const CartMenu: React.FC<Type> = ({ close }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { cart, status } = useSelector((state: RootState) => state.cartSlice);
    const user = useSelector((state: RootState) => state.userSlice);
    const router = useRouter();

    useEffect(() => {
        if (status === "idle") {
            dispatch(fetchCart());
        }
    }, [status, dispatch]);

    const redirectToCheckoutPage = () => {
        if (user) {
            router.push("/checkout");
            if (close) close();
        }
    };

    // Calculate totals
    let subtotal = 0;
    let totalQty = 0;
    let totalDiscount = 0;
    let grandTotal = 0;

    if (cart?.items?.length) {
        for (const item of cart.items) {
            const price = item.product.price;
            const discount = item?.product?.discount || 0;
            const discountedPrice = price - (price * discount) / 100;
            const itemTotal = discountedPrice * item.quantity;
            const itemOriginalTotal = price * item.quantity;
            subtotal += itemOriginalTotal;
            totalQty += item.quantity;
            totalDiscount += itemOriginalTotal - itemTotal;
            grandTotal += itemTotal;
        }
    }

    return (
        <section className="bg-neutral-900/90 top-0 z-100 fixed bottom-0 left-0 right-0">
            <div className="bg-white w-full max-w-sm max-h-screen min-h-screen ml-auto">
                <div className="px-3 py-2 shadow-md flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-neutral-700">Cart</h2>
                    <Link href="/" className="text-2xl lg:hidden hover:bg-orange-600 border p-0.5 rounded hover:text-white text-neutral-700">
                        <IoClose />
                    </Link>
                    <div
                        onClick={close}
                        className="text-2xl hidden lg:block hover:bg-orange-600 border p-0.5 rounded hover:text-white text-neutral-700"
                    >
                        <IoClose />
                    </div>
                </div>

                <div className="min-h-[75vh] lg:min-h-[80vh] h-full max-h-[calc(100vh-150px)]  flex flex-col px-2">
                    {cart?.items?.[0] ? (
                        <>
                            <div className="flex items-center justify-between px-4 py-2 mt-2 bg-blue-100 rounded-full text-sm text-blue-400 font-semibold">
                                <p>Your total savings</p>
                                <p>{DisplayPriceInAud(totalDiscount)}</p>
                            </div>
                            <div className="grid gap-4 overflow-y-scroll p-4">
                                {cart?.items?.map((item: any) => (
                                    <div key={item.id} className="flex w-full gap-2 justify-between">
                                        <div className="min-w-16 max-w-16 h-16 bg-white rounded border-neutral-400 border-dotted border">
                                            <img
                                                className="object-scale-down rounded-md"
                                                src={item.product?.images?.[0] || "/placeholder.png"}
                                                alt={item.product.title}
                                            />
                                        </div>
                                        <div className="w-full text-xs max-w-sm">
                                            <p className="text-ellipsis line-clamp-2">{item.product.title}</p>
                                            <p className="text-neutral-400">{item.product.unit}</p>
                                            <p className="font-semibold">
                                                {DisplayPriceInAud(
                                                    item.product.price -
                                                    (item.product.price * (item.product.discount || 0)) / 100
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <AddToCartButton data={item.product} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="grid px-4 py-1 bg-slate-200 rounded">
                                <h1 className="font-semibold text-neutral-900">Bill Details</h1>
                                <div className="flex items-center justify-between font-semibold">
                                    <p className="text-neutral-700 text-sm">Sub Total:</p>
                                    <p className="text-neutral-700 text-sm">{DisplayPriceInAud(subtotal)}</p>
                                </div>
                                <div className="flex items-center justify-between font-semibold">
                                    <p className="text-neutral-700 text-sm">Discount:</p>
                                    <p className="text-neutral-500 text-sm line-through">
                                        {DisplayPriceInAud(totalDiscount)}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between font-semibold">
                                    <p className="text-neutral-700 text-sm">Total Quantity:</p>
                                    <p className="text-neutral-600 text-sm">{totalQty} Items</p>
                                </div>
                                <div className="flex items-center justify-between font-semibold">
                                    <p className="text-neutral-900">Grand Total:</p>
                                    <p className="text-neutral-900">{DisplayPriceInAud(grandTotal)}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex w-full flex-col items-center justify-center h-full">
                            <Image src={emptyCart} className="object-scale-down" alt="empty-cart" />
                            <Link
                                href="/"
                                onClick={close}
                                className="bg-green-600 py-1 px-2 rounded text-white cursor-pointer font-semibold text-xl"
                            >
                                Shop Now
                            </Link>
                        </div>
                    )}
                </div>
                {cart?.items?.[0] && (
                    <div className="p-2 mx-auto">
                        <div className="flex items-center rounded px-2 justify-between text-neutral-100 bg-green-700 py-4 static bottom-3">
                            <div>{DisplayPriceInAud(grandTotal)}</div>
                            <div
                                onClick={redirectToCheckoutPage}
                                className="flex items-center cursor-pointer justify-center gap-2"
                            >
                                <button className="cursor-pointer">Proceed</button>
                                <FaAngleDoubleRight />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default CartMenu;