import { includes } from 'zod';
import crypto from "crypto";
import { errorHandler } from "../utils/errorHandler";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

interface AuthRequest extends Request {
    userId?: string
}

export const getCartToken = async (req: Request, res: Response) => {
    try {
        let token = req.cookies.cartToken;
        if (!token) {
            token = crypto.randomUUID();
            res.cookie("cartToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000
            })
        };
        return token
    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error!",)
    }
};



// Helper: find or create cart for the current user/token
export const getOrCreateCart = async (token: string, userId?: string) => {
    let cart = await prisma.cart.findFirst({
        where: userId ? { userId } : { token },
        include: { items: { include: { product: true } } },
    });
    if (!cart) {
        cart = await prisma.cart.create({
            data: userId ? { userId } : { token },
            include: { items: { include: { product: true } } }
        });
    }
    return cart;
};

export const addToCart = async (req: AuthRequest, res: Response) => {
    try {
        const { productId, quantity = "1" } = req.body;
        if (!productId) return errorHandler(res, 404, "Product id is required!");
        const product = await prisma.product.findFirst({
            where: { id: productId, isActive: true }
        });

        if (!product) return errorHandler(res, 404, "The product not found!");

        const token = await getCartToken(req, res)
        const userId = req.userId as string | undefined;

        let cart: any = await getOrCreateCart(token, userId);

        const existingItem = await prisma.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
        });
        // if (!existingItem) errorHandler(res, 404, "The cart item not found")

        if (existingItem) {
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: parseInt(quantity) }   // parse quantity
            });
        } else {
            await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity } });
        }

        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: { items: { include: { product: true } } }
        })

        return errorHandler(res, 200, "The cart added successfully", false, updatedCart);
    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error!")
    }
};



// get cart
export const getCart = async (req: AuthRequest, res: Response) => {
    try {
        const token = await getCartToken(req, res);
        const userId = req.userId as string | undefined;
        const cart = await getOrCreateCart(token, userId)
        return errorHandler(res, 200, "The cart got successfully", false, cart)
    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error!")
    }
};






export const updateCartItem = async (req: AuthRequest, res: Response) => {
    try {
        // const {itemId} = req.params;
        const { quantity, itemId } = req.body;
        if (quantity < 1) errorHandler(res, 400, "the cart quantity must be 1");


        const item = await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity },
            include: { cart: true }
        });

        const token = await getCartToken(req, res);
        const userId = req.userId;
        if (userId && item.cart.userId !== userId || (!userId && item.cart.token !== token)) {
            errorHandler(res, 400, "Unauthorized!",)
        }

        const updatedItem = await prisma.cart.findUnique({
            where: { id: item.cartId },
            include: { items: { include: { product: true } } }
        })

        errorHandler(res, 200, "The cart item updated successfully!", false, updatedItem);
    } catch (error: any) {
        errorHandler(res, 500, error.message || "internal server error!")
    }
};


export const deleteCartItem = async (req: AuthRequest, res: Response) => {
    try {
        const { itemId } = req.body;

        const item = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true }
        })

        if (!item) errorHandler(res, 404, "The cart not found!");

        const token = await getCartToken(req, res);
        const userId = req.userId;

        if (userId && item?.cart.userId !== userId || (!userId && item?.cart.token !== token)) {
            errorHandler(res, 400, "Unauthorized")
        };

        await prisma.cartItem.delete({ where: { id: itemId } });
        const updatedCartItem = await prisma.cart.findUnique({
            where: { id: itemId },
            include: { items: { include: { product: true } } }
        })
        return errorHandler(res, 200, "The Cart Item has been deleted successfully!", false, updatedCartItem);
    } catch (error: any) {
        errorHandler(res, 500, error.message || "internal server error!")
    }
};





// POST /api/cart/merge - When user logs in, merge guest cart into user's cart
export const mergeCartAfterLogin = async (req: AuthRequest, res: Response) => {
    try {
        const userid = req.userId;
        if (!userid) errorHandler(res, 400, "Unauthorized");
        const token = req.cookies.cartToken;
        if (!token) errorHandler(res, 404, "No guest cart to merge")

        const guestCart: any = await prisma.cart.findUnique({
            where: { id: userid },
            include: { items: true }
        })
        if (!guestCart) errorHandler(res, 404, "The guest cart not found!")

        let userCart: any = await prisma.cart.findUnique({ where: { userId: userid } });
        if (!userCart) {
            await prisma.cart.create({ data: { userId: userid } })
        }

        for (const guestItem of guestCart.items) {
            const existingUserItems = await prisma.cartItem.findUnique({
                where: { cartId_productId: { cartId: userCart.id, productId: guestItem.productId } }
            });

            if (existingUserItems) {
                // Combine quantities
                await prisma.cartItem.update({
                    where: { id: existingUserItems.id },
                    data: { quantity: existingUserItems.quantity + guestItem.quantity }
                })
            } else {
                await prisma.cartItem.create({
                    data: {
                        cartId: userCart.id,
                        productId: guestItem.id,
                        quantity: guestItem.quantity,
                    }
                })
            }
        }

        // Delete guest cart (optional, you can keep it but disconnect)

        await prisma.cart.delete({ where: { id: guestCart.id } });

        // Clear the cart token cookie
        res.clearCookie("cartToken")

        const mergedCart = await prisma.cart.findUnique({
            where: { id: userCart.id },
            include: { items: { include: { product: true } } }
        });

        return errorHandler(res, 200, "Guest Cart merged successfully!", false, mergedCart);
    } catch (error: any) {
        errorHandler(res, 500, error.message || "Internal server error")
    }
};