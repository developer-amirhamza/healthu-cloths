
export const PriceWithDiscount = (
    price: number | string | undefined,
    discount: number | string | undefined
) => {
    const productPrice = Number(price ?? 0);
    const productDiscount = Number(discount ?? 0);

    if (productDiscount > 0) {
        const discountAmount = Math.ceil((productPrice * productDiscount) / 100);
        return productPrice - discountAmount;
    }

    return productPrice;
}
