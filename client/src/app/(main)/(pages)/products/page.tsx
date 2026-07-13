"use client";
import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { fetchCategories } from '@/redux/slices/categorySlice';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import InfiniteScroll from 'react-infinite-scroll-component';
import nothingImage from "@/assets/empty-box.gif";
import Image from 'next/image';
import ProductCard from '../../components/ProductCard';
import Loader from '../../components/UI/Loader';

interface Product {
    id: string;
    title: string;
    price: number;
    images: string[];
    discount: number;
    stock: number;
    category?: { title: string; slug: string };
}

const ProductsContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { categories } = useSelector((state: RootState) => state.categorySlice);

    // Get filter values from URL
    const textSearch = searchParams.get('q') || '';
    const categoryId = searchParams.get('category') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const sort = searchParams.get('sort') || 'newest';
    const [selectedCategoryId,setSelectedCategoryId] = useState("")

    // State
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPage, setTotalPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
    const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 5000]);

    const loadingArrayCard = new Array(10).fill(null);

    // Fetch categories
    useEffect(() => {
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    // Fetch products with all filters
    const fetchProducts = useCallback(async () => {
        if (!textSearch  && !minPrice && !maxPrice && page === 1 && products.length === 0) {
            setLoading(true);
        } else if (page !== 1) {
            setLoading(true);
        }

        try {
            const params: any = { page, limit: 20 };
            if (textSearch) params.q = textSearch;
            if (minPrice) params.minPrice = minPrice;
            if (maxPrice) params.maxPrice = maxPrice;
            if (sort) params.sort = sort;

            const response = await Axios({
                ...SummeryApi.searchProduct,
                params,
            });

            const newProducts = response.data?.data || [];
            const totalPages = response.data?.totalNoPage || 1;

            if (page === 1) {
                setProducts(newProducts);
            } else {
                setProducts((prev) => [...prev, ...newProducts]);
            }
            setTotalPage(totalPages);
            setHasMore(page < totalPages);
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    }, [textSearch, categoryId, minPrice, maxPrice, sort, page]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
        setProducts([]);
        setHasMore(true);
    }, [textSearch, categoryId, minPrice, maxPrice, sort]);

    // Fetch when page changes or filters change
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts, page]);

    // Update URL with new filter values
    const updateFilters = (updates: Record<string, string | undefined>) => {
        const newParams = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value && value !== '') {
                newParams.set(key, value);
            } else {
                newParams.delete(key);
            }
        });
        router.push(`/products?${newParams.toString()}`);
    };

    const handleCategoryChange = async (id: string) => {
        const response = await Axios({
            ...SummeryApi.getProductByCategory,
            data:{id}
        })
    const newProducts = response.data?.data || [];
            if (page === 1) {
            setProducts(newProducts);
            } else {
            setProducts(prev => {
                const existing = new Set(prev.map(p => p.id));
                const toAdd = newProducts.filter((p:any) => !existing.has(p.id));
                return [...prev, ...toAdd];
            });
            }
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateFilters({ sort: e.target.value });
    };



    const handlePriceFilter = () => {
        updateFilters({
            minPrice: tempPriceRange[0] > 0 ? tempPriceRange[0].toString() : '',
            maxPrice: tempPriceRange[1] < 5000 ? tempPriceRange[1].toString() : '',
        });
    };

    const clearFilters = () => {
        router.push('/products');
    };

    const handleFetchMore = () => {
        if (hasMore && !loading) {
            setPage((prev) => prev + 1);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">


            <div className="flex flex-col lg:flex-row gap-8">
                {/* Filters Sidebar */}
                <aside className="lg:w-64 space-y-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="font-semibold text-lg mb-3">Categories</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => handleCategoryChange('')}
                                className={`block w-full text-left px-2 py-1 rounded
                                    ////${!categoryId ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
                                    `}
                            >
                                All Categories
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryChange(cat.id)}
                                    className={`block w-full text-left px-2 py-1 rounded
                                        ////${selectedCategoryId === cat.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
                                        `}
                                >
                                    {cat.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="font-semibold text-lg mb-3">Price Range</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span>${tempPriceRange[0]}</span>
                                <span>${tempPriceRange[1]}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="5000"
                                step="10"
                                value={tempPriceRange[1]}
                                onChange={(e) => setTempPriceRange([tempPriceRange[0], parseInt(e.target.value)])}
                                className="w-full"
                            />
                            <input
                                type="range"
                                min="0"
                                max="5000"
                                step="10"
                                value={tempPriceRange[0]}
                                onChange={(e) => setTempPriceRange([parseInt(e.target.value), tempPriceRange[1]])}
                                className="w-full"
                            />
                            <button
                                onClick={handlePriceFilter}
                                className="w-full bg-gray-800 text-white py-1 rounded hover:bg-gray-900"
                            >
                                Apply Price
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="font-semibold text-lg mb-3">Sort By</h3>
                        <select
                            value={sort}
                            onChange={handleSortChange}
                            className="w-full border rounded px-2 py-1 text-sm"
                        >
                            <option value="newest">Newest</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="oldest">Oldest</option>
                           //// <option value="popular">Popularity</option>
                        </select>
                    </div>

                    <button
                        onClick={clearFilters}
                        className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
                    >
                        Clear All Filters
                    </button>
                </aside>

                {/* Products Grid with Infinite Scroll */}
                <div className="flex-1">
                    <p className="font-semibold text-neutral-600 mb-4">
                        {textSearch ? `Search results for "${textSearch}": ` : ''}{products.length} products found
                    </p>

                    <InfiniteScroll
                        dataLength={products.length}
                        next={handleFetchMore}
                        hasMore={hasMore}
                        loader={<div className="text-center py-4">Loading more products...</div>}
                        endMessage={<div className="text-center py-4 text-neutral-500">No more products</div>}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {loading && page === 1
                                ? loadingArrayCard.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className="border border-blue-200 p-2 grid gap-3 max-w-52 rounded animate-pulse"
                                    >
                                        <div className="min-h-20 bg-blue-100/80 rounded"></div>
                                        <div className="p-3 bg-blue-100/80 rounded w-20"></div>
                                        <div className="p-3 bg-blue-100/80 rounded"></div>
                                        <div className="p-3 bg-blue-100/80 rounded w-14"></div>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="p-3 bg-blue-100/80 rounded w-20"></div>
                                            <div className="p-3 bg-blue-100/80 rounded w-20"></div>
                                        </div>
                                    </div>
                                ))
                                : products.map((product,idx) => (
                                    <ProductCard key={idx} data={product} />
                                ))}
                        </div>
                    </InfiniteScroll>

                    {!products.length && !loading && (
                        <div className="flex flex-col w-full items-center justify-center mx-auto">
                            <Image
                                src={nothingImage}
                                alt="no data"
                                className="w-full h-full max-h-xs max-w-xs rounded-md object-scale-down"
                            />
                            <p className="font-semibold my-4 text-2xl text-neutral-500">No Products Found!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ProductsPage = () => {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader /></div>}>
            <ProductsContent />
        </Suspense>
    );
};

export default ProductsPage;