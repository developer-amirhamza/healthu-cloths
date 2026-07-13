"use client";
import Link from "next/link";

// The three public entry points from the brief's diagram:
// Shop (consumer) · Apply for a trade account (B2B) · NDIS — get a quote.
const ENTRIES = [
  {
    eyebrow: "For individuals & families",
    title: "Shop",
    desc: "Browse our full range and check out securely. Discreet, private delivery.",
    href: "/products",
    cta: "Start shopping",
  },
  {
    eyebrow: "For pharmacies, aged care & distributors",
    title: "Trade account",
    desc: "Apply for wholesale pricing, bulk carton ordering and 30-day invoicing.",
    href: "/apply/trade",
    cta: "Apply for a trade account",
  },
  {
    eyebrow: "For support coordinators & plan managers",
    title: "NDIS — get a quote",
    desc: "Build branded NDIS quotes with annual discounts and funding support.",
    href: "/apply/ndis",
    cta: "Get a quote",
  },
];

export default function EntryPoints() {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-10 gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            One platform, three ways to buy
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-gray-900 tracking-tight">
            How would you like to shop?
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {ENTRIES.map((e) => (
            <Link
              key={e.title}
              href={e.href}
              className="group flex flex-col rounded-3xl border border-gray-100 bg-[#f5f0eb] p-7 hover:shadow-lg transition-shadow"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a07850]">
                {e.eyebrow}
              </p>
              <h3 className="font-serif text-2xl text-gray-900 mt-2 mb-3">{e.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">{e.desc}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#1a1a18] group-hover:gap-3 transition-all">
                {e.cta} <span>→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}