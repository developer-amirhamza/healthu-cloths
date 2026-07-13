"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import Image from 'next/image';
import { format } from 'date-fns';
import { home_posts } from '@/config/page';
import Loader from '../../components/UI/Loader';
import PostCard from '../../components/PostCard';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  category: string;
  publishedAt: string;
  author: { name: string };
  views: number;
}

const BlogPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const post = home_posts[0];

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await Axios({ ...SummeryApi.getAllBlogs, params: { page, limit: 9 } });
        if (response.data?.success) {
          setBlogs(response.data.data);
          setTotalPages(response.data.pagination.totalPages);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, [page]);

  if (loading) return <div className="flex justify-center py-20"><Loader /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 mt-8 text-slate-950 text-center">Incontinence Advice & Support</h1>
      <h1 className="text-2xl font-bold mb-8 text-neutral-600 text-center">Help understanding and managing incontinence.</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((blog) => (
          <Link href={`/blog/${blog.slug}`} key={blog.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
            {blog.featuredImage && (
              <img src={blog.featuredImage} alt={blog.title} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              {blog.category && <span className="text-sm text-blue-600">{blog.category}</span>}
              <h2 className="text-xl font-semibold mt-1 line-clamp-2">{blog.title}</h2>
              <p className="text-gray-600 mt-2 line-clamp-3">{blog.excerpt || blog.title}</p>
              <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                <span>{format(new Date(blog.publishedAt), 'MMM dd, yyyy')}</span>
                <span>{blog.views} views</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <span className="px-3 py-1">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      )}
      <div className="grid container">
                <PostCard image={post.image}  title={post.title} subtitle={post.subtitle} paragraph={post.paragraph} buttons={post.buttons} />
            </div>
    </div>
  );
};

export default BlogPage;