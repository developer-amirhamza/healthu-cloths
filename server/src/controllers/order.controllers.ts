import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { errorHandler } from "../utils/errorHandler";
import { getCartToken, getOrCreateCart } from "./cart.controllers";
import { sendEmail } from "../config/sendEmail";
import { generateInvoicePdf } from "../utils/generateInvoicePdf";
import { orderConfirmationTemplate } from "../utils/orderConfirmationTemplate";

interface AuthRequest extends Request {
    userId?: string;
}

const generateOrderNumber = async () => {
    const date = new Date();
    const prefix = `ORD-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`;
    let orderNumber = `${prefix}-001`;
    let counter = 1;
    while (await prisma.order.findUnique({ where: { orderNumber } })) {
        orderNumber = `${prefix}-${counter.toString().padStart(3, "0")}`;
        counter++;
    }
    return orderNumber;
};

export const placeOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { name, phone, shippingAddress, paymentMethod = "COD" } = req.body;
        const token = await getCartToken(req, res);
        const userId = req.userId;

        const cart = await getOrCreateCart(token, userId);
        if (!cart || cart.items.length === 0) {
            errorHandler(res, 404, "The cart is empty!");
        }

        let email = req.body.email;
        if (!userId) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                errorHandler(res, 404, "The user not found!");
            }
            email = user?.email;
        } else {
            if (!email) {
                errorHandler(req, 404, "The email field is required!");
            }
        }

        if (!phone || !shippingAddress) {
            errorHandler(res, 404, "Phone and Shipping address are required!");
        }

        let subtotal = 0;
        const orderItemsData = [];
        for (const item of cart.items) {
            const product = item.product;
            const itemsTotal = product.price * item.quantity;
            subtotal += itemsTotal;
            orderItemsData.push({
                productName: product.title,
                productId: product.id,
                productImage: product.images[0] || null,
                price: product.price,
                quantity: item.quantity,
                total: itemsTotal,
            });
        }

        const total = subtotal;
        const orderNumber = await generateOrderNumber();
        const order = await prisma.order.create({
            data: {
                orderNumber,
                shippingAddress,
                name,
                phone,
                email,
                subtotal,
                total,
                paymentMethod,
                userId: userId || null,
                items: { create: orderItemsData },
            },
            include: { items: true },
        });

        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

        // Send order confirmation email with PDF invoice (non-blocking)
        if (email) {
            const invoiceData = {
                orderNumber: order.orderNumber,
                createdAt: order.createdAt,
                name: order.name || name,
                email,
                phone: order.phone,
                shippingAddress: order.shippingAddress,
                paymentMethod: order.paymentMethod,
                items: order.items.map((i) => ({
                    productName: i.productName,
                    quantity: i.quantity,
                    price: i.price,
                    total: i.total,
                    productImage: i.productImage,
                })),
                subtotal: order.subtotal,
                shippingCost: order.shippingCost,
                tax: order.tax,
                total: order.total,
            };

            generateInvoicePdf(invoiceData)
                .then((pdfBuffer) =>
                    sendEmail({
                        sendTo:'amirhamza27940@gmail.com', // your Resend account email
                        subject: `Order Confirmed – ${order.orderNumber}`,
                        html: orderConfirmationTemplate(invoiceData),
                        attachments: [{ filename: `invoice-${order.orderNumber}.pdf`, content: pdfBuffer }],
                    })
                )
                .catch((err) => console.error("Order email error:", err));
        }

        return errorHandler(res, 200, "Your order placed successfully!", false, order);
    } catch (error: any) {
        errorHandler(res, 500, error || "Internal server error!");
    }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            errorHandler(res, 404, "Unauthorized, Please login again");
        }
        const order = await prisma.order.findMany({ where: { userId }, include: { items: true } });
        if (!order || order.length === 0) {
            errorHandler(res, 404, "The order not found!");
        }
        return errorHandler(res, 200, "Your order gotten successfully!", false, order);
    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error!");
    }
};

export const getOrdersByOrderNumber = async (req: Request, res: Response) => {
    try {
        const { orderNumber, email } = req.query;
        if (!orderNumber || !email) {
            errorHandler(res, 404, "Order Number and email are required");
        }
        const order = await prisma.order.findFirst({
            where: { orderNumber: orderNumber as string, email: email as string },
            include: { items: true },
        });
        if (!order) {
            errorHandler(res, 404, "The order not found!");
        }
        return errorHandler(res, 200, "The order found successfully!", false, order);
    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error!");
    }
};

export const getAllOrdersByAdmin = async (req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: { items: true, user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "desc" },
        });
        if (!orders || orders.length === 0) {
            errorHandler(res, 404, "The orders not found!");
        }
        return errorHandler(res, 200, "All Orders", false, orders);
    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error!");
    }
};

export const updateOrderByAdmin = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.query;
        const { orderStatus, paymentStatus } = req.body;
        if (!orderStatus || !paymentStatus) {
            errorHandler(res, 404, "Order status or payment status is required!");
        }
        const updatedOrder = await prisma.order.update({
            where: { id: orderId as string },
            data: { orderStatus, paymentStatus },
            include: { items: true },
        });
        return errorHandler(res, 200, "The order updated successfully!", false, updatedOrder);
    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error!");
    }
};