"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Axios from "@/utils/Axios";
import AxiosToastError from "@/utils/AxiosToastError";
import { SummeryApi } from "@/app/common/SummeryApi";
import FundingSupportModal from "./FundingSupportModal";
import { useSearchParams } from "next/navigation";

interface ProductOption {
  id: string;
  title: string;
  sizes?: string[];
}
interface Line {
  productId: string;
  productName: string;
  size?: string;
  absorbency?: string;
  dailyPads: number;
  packQuantity?: number;
}
interface Totals {
  items: any[];
  subtotal: number;
  discount: number;
  delivery: number;
  gst: number;
  total: number;
}

const PERIODS = ["One-off", "Monthly", "Annual"];
const money = (n: number) => `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;

export default function QuoteBuilder() {
  const [step, setStep] = useState(0);
  const [products, setProducts] = useState<ProductOption[]>([]);

  // Quote state
  const [participantRef, setParticipantRef] = useState("");
  const [planManagerEmail, setPlanManagerEmail] = useState("");
  const [supplyPeriod, setSupplyPeriod] = useState("Monthly");
  const [lines, setLines] = useState<Line[]>([]);

  // Calculator + persistence
  const [totals, setTotals] = useState<Totals | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [savedQuote, setSavedQuote] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [fundingOpen, setFundingOpen] = useState(false);
  const [textSearch, setTextSearch] = useState("")

  useEffect(() => {
    Axios({ ...SummeryApi.fetchProducts })
      .then((res) => {
        if (res.data?.success) {
          setProducts(
            (res.data.data || []).map((p: any) => ({ id: p.id, title: p.title, sizes: p.sizes }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const searchProduct = async (e:any)=>{
    const text = e.target.value;
    const response = await Axios({
      ...SummeryApi.searchProduct,
      params:{q:text,page:1}
    })
    setProducts(response.data.data)
  }

  const validLines = useMemo(
    () => lines.filter((l) => l.productId && l.dailyPads > 0),
    [lines]
  );

  // Live preview whenever lines/period change (and we're on review step).
  useEffect(() => {
    if (step !== 2 || validLines.length === 0) {
      setTotals(null);
      return;
    }
    let cancelled = false;
    setPreviewing(true);
    Axios({
      ...SummeryApi.previewQuote,
      data: {
        supplyPeriod,
        lines: validLines.map((l) => ({
          productId: l.productId,
          size: l.size,
          absorbency: l.absorbency,
          dailyPads: Number(l.dailyPads),
          packQuantity: l.packQuantity ? Number(l.packQuantity) : undefined,
        })),
      },
    })
      .then((res) => {
        if (!cancelled && res.data?.success) setTotals(res.data.data);
      })
      .catch(() => {})
      .finally(() => !cancelled && setPreviewing(false));
    return () => {
      cancelled = true;
    };
  }, [step, supplyPeriod, validLines]);

  const addLine = () =>
    setLines([...lines, { productId: "", productName: "", dailyPads: 1 }]);
  const updateLine = (i: number, patch: Partial<Line>) =>
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  const saveQuote = async () => {
    try {
      setBusy(true);
      const res = await Axios({
        ...SummeryApi.createQuote,
        data: {
          supplyPeriod,
          participantRef,
          planManagerEmail,
          lines: validLines.map((l) => ({
            productId: l.productId,
            size: l.size,
            absorbency: l.absorbency,
            dailyPads: Number(l.dailyPads),
            packQuantity: l.packQuantity ? Number(l.packQuantity) : undefined,
          })),
        },
      });
      if (res.data?.success) {
        setSavedQuote(res.data.data);
        toast.success("Quote saved");
      }
    } catch (e) {
      AxiosToastError(e);
    } finally {
      setBusy(false);
    }
  };

  const emailQuote = async () => {
    let quote = savedQuote;
    if (!quote) {
      await saveQuote();
      quote = savedQuote;
    }
    try {
      setBusy(true);
      const id = quote?.id ?? savedQuote?.id;
      if (!id) return;
      const res = await Axios({ ...SummeryApi.emailQuote, data: { id } });
      if (res.data?.success) toast.success("Quote emailed");
    } catch (e) {
      AxiosToastError(e);
    } finally {
      setBusy(false);
    }
  };

  const stepValid =
    step === 0
      ? true
      : step === 1
      ? validLines.length > 0
      : true;

  return (
    <div className="p-8 max-w-5xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
        NDIS Coordinator
      </p>
      <h1 className="font-serif text-4xl text-gray-900 mt-1 mb-6">New quote</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {["Details", "Products & usage", "Review"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                i <= step ? "bg-[#2f7d6f] text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-sm ${i === step ? "text-gray-900 font-medium" : "text-gray-400"}`}>
              {label}
            </span>
            {i < 2 && <span className="w-8 h-px bg-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Details ── */}
        {step === 0 && (
          <motion.div
            key="s0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl border border-gray-100 p-7 grid gap-5 max-w-lg"
          >
            <Field label="Participant reference (optional)">
              <input
                value={participantRef}
                onChange={(e) => setParticipantRef(e.target.value)}
                className={inputCls}
                placeholder="e.g. NDIS-12345"
              />
            </Field>
            <Field label="Plan manager email (optional)">
              <input
                value={planManagerEmail}
                onChange={(e) => setPlanManagerEmail(e.target.value)}
                className={inputCls}
                placeholder="planmanager@example.com"
              />
            </Field>
            <Field label="Supply period">
              <div className="flex gap-2">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSupplyPeriod(p)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      supplyPeriod === p
                        ? "bg-secondary text-white border-secondary"
                        : "bg-white text-gray-600 border-gray-300 hover:border-secondary"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {supplyPeriod === "Annual" && (
                <p className="text-xs text-secondary mt-1">
                  Annual supply applies the NDIS 12-month discount automatically.
                </p>
              )}
            </Field>
          </motion.div>
        )}

        {/* ── Step 2: Products & usage ── */}
        {step === 1 && (
          <motion.div
            key="s1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-4"
          >
            {lines.length === 0 && (
              <p className="text-sm text-gray-400">Add the products this participant needs.</p>
            )}
            {lines.map((line, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 grid md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <Field label="Product">
                    <input type="text"   onChange={(e)=>searchProduct(e)} />
                    <select
                      value={line.productId}
                      onChange={(e) => {
                        const p = products.find((x) => x.id === e.target.value);
                        updateLine(i, { productId: e.target.value, productName: p?.title ?? "" });
                      }}
                      className={inputCls}
                    >
                      <option value="">Select…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Size">
                    <input value={line.size ?? ""} onChange={(e) => updateLine(i, { size: e.target.value })} className={inputCls} />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Absorbency">
                    <input value={line.absorbency ?? ""} onChange={(e) => updateLine(i, { absorbency: e.target.value })} className={inputCls} />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Pads / day">
                    <input
                      type="number"
                      min={0}
                      value={line.dailyPads}
                      onChange={(e) => updateLine(i, { dailyPads: Number(e.target.value) })}
                      className={inputCls}
                    />
                  </Field>
                </div>
                {supplyPeriod === "One-off" && (
                  <div className="md:col-span-1">
                    <Field label="Pack qty">
                      <input
                        type="number"
                        min={1}
                        value={line.packQuantity ?? 1}
                        onChange={(e) => updateLine(i, { packQuantity: Number(e.target.value) })}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                )}
                <div className="md:col-span-1">
                  <button
                    onClick={() => removeLine(i)}
                    className="text-red-500 text-xs hover:underline py-2.5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addLine}
              className="self-start text-sm font-semibold text-[#2f7d6f] hover:underline"
            >
              + Add product
            </button>
          </motion.div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 2 && (
          <motion.div
            key="s2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Line items */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Product</th>
                    <th className="text-left px-4 py-3">Usage</th>
                    <th className="text-right px-4 py-3">Total pads</th>
                    <th className="text-right px-4 py-3">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {(totals?.items ?? []).map((it: any, i: number) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{it.productName}</div>
                        <div className="text-xs text-gray-400">
                          {[it.size, it.absorbency].filter(Boolean).join(" · ")}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {it.dailyPads}/day × {it.days}d
                      </td>
                      <td className="px-4 py-3 text-right">{it.totalPads}</td>
                      <td className="px-4 py-3 text-right">{money(it.lineTotal)}</td>
                    </tr>
                  ))}
                  {(!totals || totals.items.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                        {previewing ? "Calculating…" : "No items to quote"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals + actions */}
            <div className="bg-[#1a1a18] text-white rounded-2xl p-6 flex flex-col gap-3">
              <h3 className="font-serif text-xl mb-2">Quote summary</h3>
              <Row label="Subtotal" value={money(totals?.subtotal ?? 0)} />
              {(totals?.discount ?? 0) > 0 && (
                <Row label="Annual discount" value={`-${money(totals!.discount)}`} accent />
              )}
              <Row label="Delivery" value={money(totals?.delivery ?? 0)} />
              <Row label="GST" value={money(totals?.gst ?? 0)} />
              <div className="border-t border-white/10 my-2" />
              <Row label="Total" value={money(totals?.total ?? 0)} big />

              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={saveQuote}
                  disabled={busy || !totals}
                  className="bg-[#c9b89a] text-[#1a1a18] font-semibold text-sm py-2.5 rounded-full hover:bg-[#b8a489] transition-colors disabled:opacity-50"
                >
                  {savedQuote ? "Saved ✓ Save again" : "Save quote"}
                </button>
                <button
                  onClick={emailQuote}
                  disabled={busy || !totals}
                  className="border border-white/30 text-white font-semibold text-sm py-2.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Email PDF quote
                </button>
                <button
                  onClick={() => setFundingOpen(true)}
                  className="text-[#c9b89a] text-sm py-2 hover:underline"
                >
                  Funding doesn’t cover this? Talk to us →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav buttons */}
      <div className="flex justify-between mt-8 max-w-5xl">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
        >
          Back
        </button>
        {step < 2 && (
          <button
            onClick={() => stepValid && setStep((s) => s + 1)}
            disabled={!stepValid}
            className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#2f7d6f] text-white hover:bg-[#27675b] disabled:opacity-50"
          >
            Continue
          </button>
        )}
      </div>

      <FundingSupportModal
        open={fundingOpen}
        onClose={() => setFundingOpen(false)}
        quoteId={savedQuote?.id}
      />
    </div>
  );
}

const inputCls =
  "w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#2f7d6f] text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, big, accent }: { label: string; value: string; big?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`${big ? "text-base font-semibold" : "text-sm"} ${accent ? "text-[#c9b89a]" : "text-gray-300"}`}>
        {label}
      </span>
      <span className={`${big ? "text-2xl font-serif" : "text-sm"} ${accent ? "text-[#c9b89a]" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}
