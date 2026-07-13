"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Axios from '@/utils/Axios'
import { SummeryApi } from '@/app/common/SummeryApi'
import { motion } from 'framer-motion'
import Button from './UI/Button'

interface Blog {
    id: string
    title: string
    slug: string
    excerpt: string
    featuredImage: string
    category: string
    publishedAt: string
    readTime?: number
}

const CareGuidesSection = () => {
    const [blogs, setBlogs] = useState<Blog[]>([])

    useEffect(() => {
        Axios({ ...SummeryApi.getAllBlogs, params: { page: 1, limit: 3 } })
            .then((res) => {
                if (res.data?.success) setBlogs(res.data.data.slice(0, 3))
            })
            .catch(() => {})
    }, [])

    if (blogs.length === 0) return null

    return (
        <section className="bg-primary py-14">
            <div className="container mx-auto px-6">
                <div className="flex items-end justify-between mb-8">
                    <div className='mx-auto text-center'>
                        <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">Care Guides</p>
                        <h2 className="text-3xl font-extrabold text-secondary font-secondary leading-tight max-w-sm">
                            Practical advice from Australian clinicians
                        </h2>
                        <p className="text-gray-500 text-sm mt-2">
                            Honest, evidence-based articles to support you and your loved ones.
                        </p>
                    </div>

                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {blogs.map((blog, index) => (
                        <motion.div   key={index}
                                initial={{
                            opacity:0,
                            x:0,
                            y:20,
                        }}
                        whileInView={{
                            opacity:1,
                            x:0,
                            y:0,
                            transition:{
                                type:"tween",
                                delay:index * 0.2,
                                duration:0.3,
                                ease:[0.25,0.25,0.25,0.75]
                            }
                        }}
                        viewport={{once:false,amount:0.2}} custom={index} className="bg-background rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 ">
                        <Link href={`/blog/${blog.slug}`}
                            className="group bg-background  rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-52 overflow-hidden">
                                {blog.featuredImage ? (
                                    <img src={blog.featuredImage} alt={blog.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform rounded-t-xl duration-300" />
                                ) : (
                                    <div className="w-full h-full bg-blue-50 flex items-center justify-center text-secondary text-4xl font-bold">
                                        {blog.title[0]}
                                    </div>
                                )}
                            </div>
                            <div className="p-5 flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    {blog.category && (
                                        <span className="text-xs font-semibold bg-blue-50 text-secondary px-2.5 py-1 rounded-full">
                                            {blog.category}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400">· {blog.readTime ?? 5} min read</span>
                                </div>
                                <h3 className="text-base font-bold text-text font-secondary leading-snug group-hover:text-secondary transition-colors line-clamp-2">
                                    {blog.title}
                                </h3>
                                {blog.excerpt && (
                                    <p className="text-sm text-text line-clamp-2 leading-relaxed">{blog.excerpt}</p>
                                )}
                                <span className="text-sm font-semibold text-secondary mt-1 inline-flex items-center gap-1">
                                    Read article →
                                </span>
                            </div>
                        </Link>
                        </motion.div>
                    ))}
                </div>
                <div className="mt-6 text-center max-w-fit mx-auto px-4">
                    <Button path="/blog" label='All Articles'   />
                </div>
            </div>
        </section>
    )
}

export default CareGuidesSection