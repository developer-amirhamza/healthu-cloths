"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import { format } from 'date-fns';
import AxiosToastError from '@/utils/AxiosToastError';
import toast from 'react-hot-toast';
import Loader from '@/app/(main)/components/UI/Loader';

const BlogDetailPage = () => {
  const params = useParams();
  const slug = params.slug as string;
  const [blog, setBlog] = useState<any>();   // 👈 store single object, not array
  const [loading, setLoading] = useState(true);
  console.log(blog,"blo")

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await Axios({
          ...SummeryApi.getBlogBySlug,
          data: { slug :slug}
        });
        if (response.data?.success) {
          setBlog(response.data.data);   // 👈 store the single blog object
        }
      } catch (error) {
        AxiosToastError(error)
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchBlog();
  }, [slug]);

  if (loading) return <div className="flex justify-center py-20"><Loader /></div>;
  if (!blog) return <div className="text-center py-20">Blog not found</div>;

  return (
    <article className="container mx-auto px-4 py-8 max-w-3xl">
      {blog.featuredImage && (
        <img src={blog.featuredImage} alt={blog.title} className="w-full h-64 object-cover rounded-lg mb-6" />
      )}
      <h1 className="text-3xl md:text-4xl font-bold mb-4">{blog.title}</h1>
      <div className="flex items-center gap-4 text-gray-500 mb-6">
        <span>{format(new Date(blog.publishedAt), 'MMMM dd, yyyy')}</span>
        <span>{blog.views} views</span>
      </div>
      {blog.category && (
        <div className="mb-4">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Category: {blog.category}</span>
        </div>
      )}
      {blog.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {blog.tags.map((tag: string) => (
            <span key={tag} className="bg-gray-100 px-2 py-1 rounded text-sm">#{tag}</span>
          ))}
        </div>
      )}
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: blog.content }} />
    </article>
  );
};

export default BlogDetailPage;