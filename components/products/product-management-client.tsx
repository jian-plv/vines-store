"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  Search, Plus, Pencil, Trash2, X, Loader2, ChevronDown,
  AlertTriangle, Clock, CheckCircle2, Package,
  Upload, Image as ImageIcon,
} from "lucide-react";
import type { Category } from "@prisma/client";
import { addProduct, updateProduct, deleteProduct } from "../../lib/actions/products";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SerializedProduct = {
  id:                string;
  name:              string;
  categoryId:        string;
  category:          Category;
  price:             string;
  currentStock:      number;
  lowStockThreshold: number;
  expirationDate:    string | null;
  status:            string;
  barcode:           string | null;
  shelfLocation:     string | null;
  createdAt:         string;
  updatedAt:         string;
};

type FormState = {
  name:              string;
  categoryId:        string;
  price:             string;
  currentStock:      string;
  lowStockThreshold: string;
  expirationDate:    string;
  shelfLocation:     string;
  imageUrl:          string;
};

const EMPTY: FormState = {
  name: "", categoryId: "", price: "", currentStock: "",
  lowStockThreshold: "10", expirationDate: "", shelfLocation: "",
  imageUrl: "",
};

// ─── Status badge config ───────────────────────────────────────────────────────

type StatusKey = "NORMAL" | "LOW" | "NEAR_EXPIRY" | "EXPIRED";

const STATUS: Record<StatusKey, {
  label: string; bg: string; color: string; icon: React.ElementType | null;
}> = {
  NORMAL:      { label: "Normal",      bg: "#dcfce7", color: "#15803d", icon: CheckCircle2  },
  LOW:         { label: "Low",         bg: "#ffedd5", color: "#c2410c", icon: AlertTriangle  },
  NEAR_EXPIRY: { label: "Near Expiry", bg: "#fef3c7", color: "#b45309", icon: Clock          },
  EXPIRED:     { label: "Expired",     bg: "#fee2e2", color: "#b91c1c", icon: X              },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS[status as StatusKey] ?? STATUS.NORMAL;
  const Icon = cfg.icon;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 9px", borderRadius: 99,
        background: cfg.bg, color: cfg.color,
        fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap",
      }}
    >
      {Icon && <Icon size={11} strokeWidth={2.5} />}
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "2-digit",
  });
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ProductManagementClient({
  products: init,
  categories,
}: {
  products:   SerializedProduct[];
  categories: Category[];
}) {
  const [products,       setProducts]       = useState(init);
  const [search,         setSearch]         = useState("");
  const [filterStatus,   setFilterStatus]   = useState<string>("ALL");
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editTarget,     setEditTarget]     = useState<SerializedProduct | null>(null);
  const [deleteTarget,   setDeleteTarget]   = useState<SerializedProduct | null>(null);
  const [form,           setForm]           = useState<FormState>(EMPTY);
  const [formError,      setFormError]      = useState("");
  const [successMsg,     setSuccessMsg]     = useState("");
  const [isPending,      startTransition]   = useTransition();
  const [uploadingImage, setUploadingImage] = useState(false);
const [imagePreview,   setImagePreview]   = useState("");
const fileInputRef = useRef<HTMLInputElement>(null);


async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;

  // Show local preview immediately
  const reader = new FileReader();
  reader.onload = (ev) => setImagePreview(ev.target?.result as string);
  reader.readAsDataURL(file);

  // Upload to server
  setUploadingImage(true);
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res  = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (data.error) {
      setFormError(data.error);
      setImagePreview("");
    } else {
      setForm((f) => ({ ...f, imageUrl: data.url }));
    }
  } catch {
    setFormError("Image upload failed. Please try again.");
    setImagePreview("");
  } finally {
    setUploadingImage(false);
  }
}


  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus first input when modal opens
  useEffect(() => {
    if (modalOpen) setTimeout(() => firstInputRef.current?.focus(), 60);
  }, [modalOpen]);

  // ── Filtered rows ────────────────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Count per status ─────────────────────────────────────────────────────────
  const counts = {
    ALL:         products.length,
    NORMAL:      products.filter((p) => p.status === "NORMAL").length,
    LOW:         products.filter((p) => p.status === "LOW").length,
    NEAR_EXPIRY: products.filter((p) => p.status === "NEAR_EXPIRY").length,
    EXPIRED:     products.filter((p) => p.status === "EXPIRED").length,
  };

  // ── Open add ────────────────────────────────────────────────────────────────
  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY);
    setFormError("");
     setImagePreview("");
    setModalOpen(true);
  }

  // ── Open edit ────────────────────────────────────────────────────────────────
  function openEdit(p: SerializedProduct) {
    setEditTarget(p);
    setForm({
      name:              p.name,
      categoryId:        p.categoryId,
      price:             p.price,
      currentStock:      String(p.currentStock),
      lowStockThreshold: String(p.lowStockThreshold),
      expirationDate:    p.expirationDate ? p.expirationDate.slice(0, 10) : "",
      shelfLocation:     p.shelfLocation ?? "",
      imageUrl:          (p as any).imageUrl ?? "",
    });
    setImagePreview((p as any).imageUrl ?? "");
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setFormError("");
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const price = parseFloat(form.price);
    const stock = parseInt(form.currentStock) || 0;
    const threshold = parseInt(form.lowStockThreshold) || 10;

    if (!form.name.trim()) { setFormError("Product name is required."); return; }
    if (!form.categoryId)  { setFormError("Please select a category."); return; }
    if (isNaN(price) || price < 0) { setFormError("Enter a valid price."); return; }

    const payload = {
      name:              form.name.trim(),
      categoryId:        form.categoryId,
      price,
      currentStock:      stock,
      lowStockThreshold: threshold,
      expirationDate:    form.expirationDate || null,
      shelfLocation:     form.shelfLocation.trim() || null,
      imageUrl:          form.imageUrl || null,
    };

    startTransition(async () => {
      try {
        if (editTarget) {
          const updated = await updateProduct(editTarget.id, payload);
          setProducts((prev) =>
            prev.map((p) => (p.id === editTarget.id ? { ...p, ...updated } : p))
          );
          flash("Product updated successfully.");
        } else {
          const created = await addProduct(payload);
          setProducts((prev) => [created, ...prev]);
          flash("Product added successfully.");
        }
        closeModal();
      } catch (err: any) {
        setFormError(err.message ?? "Something went wrong.");
      }
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteProduct(deleteTarget.id);
        setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        setDeleteTarget(null);
        flash("Product deleted.");
      } catch (err: any) {
        setFormError(err.message ?? "Delete failed.");
      }
    });
  }

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24 }}>

      {/* ── Success toast ── */}
      {successMsg && (
        <div
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 100,
            background: "#15803d", color: "#fff",
            padding: "12px 18px", borderRadius: 10,
            fontSize: 13.5, fontWeight: 600,
            boxShadow: "0 8px 24px rgba(21,128,61,0.35)",
            display: "flex", alignItems: "center", gap: 8,
            animation: "toast-in 0.25s ease",
          }}
        >
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {/* ── Toolbar: search + filter tabs + add button ── */}
      <div style={{ marginBottom: 16 }}>

        {/* Row 1: search + add */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>

          {/* Search */}
          <div
            style={{
              position: "relative", flex: 1,
              display: "flex", alignItems: "center",
            }}
          >
            <Search
              size={15}
              style={{
                position: "absolute", left: 11,
                color: "#94a3b8", pointerEvents: "none",
              }}
            />
            <input
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 13.5,
                fontFamily: "DM Sans, sans-serif",
                color: "#0f172a",
                background: "#fff",
                outline: "none",
              }}
              placeholder="Q Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#16a34a";
                e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(22,163,74,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.boxShadow   = "none";
              }}
            />
          </div>

          {/* + Add Product */}
          <button
            onClick={openAdd}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px",
              background: "#16a34a", color: "#fff",
              border: "none", borderRadius: 8,
              fontSize: 13.5, fontWeight: 700,
              fontFamily: "DM Sans, sans-serif",
              cursor: "pointer", whiteSpace: "nowrap",
              transition: "background 0.14s",
              boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#15803d")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#16a34a")}
          >
            <Plus size={16} strokeWidth={2.5} />
            Add Product
          </button>
        </div>

        {/* Row 2: status filter tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { key: "ALL",         label: "All",         count: counts.ALL         },
            { key: "NORMAL",      label: "Normal",      count: counts.NORMAL      },
            { key: "LOW",         label: "Low Stock",   count: counts.LOW         },
            { key: "NEAR_EXPIRY", label: "Near Expiry", count: counts.NEAR_EXPIRY },
            { key: "EXPIRED",     label: "Expired",     count: counts.EXPIRED     },
          ].map((tab) => {
            const active = filterStatus === tab.key;
            const cfg    = STATUS[tab.key as StatusKey];
            return (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px",
                  border: `1px solid ${active ? (cfg?.color ?? "#16a34a") : "#e2e8f0"}`,
                  borderRadius: 99,
                  background: active ? (cfg?.bg ?? "#dcfce7") : "#fff",
                  color:      active ? (cfg?.color ?? "#15803d") : "#64748b",
                  fontSize: 12.5, fontWeight: active ? 700 : 500,
                  fontFamily: "DM Sans, sans-serif",
                  cursor: "pointer", transition: "all 0.12s",
                }}
              >
                {tab.label}
                <span
                  style={{
                    background: active ? (cfg?.color ?? "#16a34a") : "#e2e8f0",
                    color:      active ? "#fff" : "#64748b",
                    fontSize: 10, fontWeight: 700,
                    padding: "1px 6px", borderRadius: 99,
                    lineHeight: 1.6,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table card ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {/* ── Table head ── */}
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["PRODUCT", "CATEGORY", "PRICE", "STOCK", "EXPIRATION", "STATUS", ""].map((col, i) => (
                  <th
                    key={col + i}
                    style={{
                      padding: "11px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#94a3b8",
                      borderBottom: "1px solid #f1f5f9",
                      whiteSpace: "nowrap",
                      ...(i === 6 ? { width: 100 } : {}),
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            {/* ── Table body ── */}
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div
                      style={{
                        padding: "48px 24px",
                        textAlign: "center",
                        color: "#94a3b8",
                      }}
                    >
                      <Package
                        size={36}
                        strokeWidth={1.5}
                        style={{ marginBottom: 10, opacity: 0.4 }}
                      />
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {search
                          ? `No products match "${search}"`
                          : "No products yet — add your first one!"}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p, rowIdx) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    isLast={rowIdx === filtered.length - 1}
                    onEdit={() => openEdit(p)}
                    onDelete={() => setDeleteTarget(p)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12.5, color: "#94a3b8" }}>
            Showing {filtered.length} of {products.length} products
          </span>
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                fontSize: 12, color: "#16a34a", fontWeight: 600,
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              Clear search ×
            </button>
          )}
        </div>
      </div>

      {/* ══ ADD / EDIT MODAL ══════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(3px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              width: "100%", maxWidth: 520,
              boxShadow: "0 24px 64px rgba(0,0,0,0.20)",
              animation: "modal-in 0.2s cubic-bezier(0.22,1,0.36,1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 22px 14px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "#dcfce7",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Package size={16} color="#15803d" />
                </div>
                <span
                  style={{
                    fontSize: 15, fontWeight: 700, color: "#0f172a",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {editTarget ? "Edit Product" : "Add New Product"}
                </span>
              </div>
              <button
                onClick={closeModal}
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: "none", border: "1px solid #e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#64748b",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "none";
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit}>
              <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>


{/* Product Image */}
<ModalField label="Product Photo">
  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>

    {/* Preview box */}
    <div
      onClick={() => fileInputRef.current?.click()}
      style={{
        width: 80, height: 80, borderRadius: 10, flexShrink: 0,
        border: "2px dashed #e2e8f0",
        background: "#f8fafc",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", overflow: "hidden",
        transition: "border-color 0.14s",
        position: "relative",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#16a34a")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#e2e8f0")}
    >
      {uploadingImage ? (
        <Loader2 size={22} color="#94a3b8"
          style={{ animation: "spin 0.7s linear infinite" }} />
      ) : imagePreview ? (
        <img
          src={imagePreview}
          alt="Product"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div style={{ textAlign: "center" }}>
          <ImageIcon size={22} color="#94a3b8" style={{ marginBottom: 4 }} />
          <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>
            Click to upload
          </div>
        </div>
      )}
    </div>

    {/* Upload info */}
    <div style={{ flex: 1 }}>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadingImage}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "7px 14px",
          border: "1px solid #e2e8f0", borderRadius: 8,
          background: "#fff", color: "#374151",
          fontSize: 13, fontWeight: 600,
          fontFamily: "DM Sans, sans-serif",
          cursor: uploadingImage ? "not-allowed" : "pointer",
          marginBottom: 6,
        }}
      >
        {uploadingImage
          ? <><Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} />Uploading…</>
          : <><Upload size={13} />Choose Photo</>}
      </button>
      <div style={{ fontSize: 11.5, color: "#94a3b8", lineHeight: 1.5 }}>
        JPG, PNG, WEBP or GIF<br />
        Max size: 2MB
      </div>

      {/* Remove button */}
      {imagePreview && (
        <button
          type="button"
          onClick={() => {
            setImagePreview("");
            setForm((f) => ({ ...f, imageUrl: "" }));
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          style={{
            marginTop: 6, fontSize: 12, color: "#dc2626",
            background: "none", border: "none",
            cursor: "pointer", fontFamily: "DM Sans, sans-serif",
            padding: 0, fontWeight: 600,
          }}
        >
          ✕ Remove photo
        </button>
      )}
    </div>
  </div>

  {/* Hidden file input */}
  <input
    ref={fileInputRef}
    type="file"
    accept="image/jpeg,image/png,image/webp,image/gif"
    style={{ display: "none" }}
    onChange={handleImageUpload}
  />
</ModalField>


                {/* Product Name */}
                <ModalField label="Product Name" required>
                  <input
                    ref={firstInputRef}
                    style={inputStyle}
                    placeholder="e.g. Fresh Milk 1L"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                    required
                  />
                </ModalField>

                {/* Category + Price row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <ModalField label="Category" required>
                    <div style={{ position: "relative" }}>
                      <select
                        style={{ ...inputStyle, paddingRight: 32, cursor: "pointer", appearance: "none" as any }}
                        value={form.categoryId}
                        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                        required
                      >
                        <option value="">Select…</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown
                        size={13}
                        style={{
                          position: "absolute", right: 10, top: "50%",
                          transform: "translateY(-50%)",
                          color: "#94a3b8", pointerEvents: "none",
                        }}
                      />
                    </div>
                  </ModalField>

                  <ModalField label="Price (₱)" required>
                    <input
                      style={inputStyle}
                      type="number" step="0.01" min="0"
                      placeholder="0.00"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                      required
                    />
                  </ModalField>
                </div>

                {/* Quantity + Threshold row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <ModalField label="Quantity" required>
                    <input
                      style={inputStyle}
                      type="number" min="0"
                      placeholder="0"
                      value={form.currentStock}
                      onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                      required
                    />
                  </ModalField>

                  <ModalField label="Low Stock Threshold">
                    <input
                      style={inputStyle}
                      type="number" min="1"
                      placeholder="10"
                      value={form.lowStockThreshold}
                      onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                    />
                  </ModalField>
                </div>

                {/* Expiration Date */}
                <ModalField label="Expiration Date">
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.expirationDate}
                    onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </ModalField>

                {/* Error message */}
                {formError && (
                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: "#fef2f2", border: "1px solid #fecaca",
                      color: "#dc2626", padding: "10px 13px",
                      borderRadius: 8, fontSize: 13, fontWeight: 500,
                    }}
                  >
                    <AlertTriangle size={14} />
                    {formError}
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "flex-end",
                  gap: 10, padding: "14px 22px",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: "8px 18px", borderRadius: 8,
                    border: "1px solid #e2e8f0", background: "#fff",
                    fontSize: 13.5, fontWeight: 600, color: "#374151",
                    cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f8fafc")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#fff")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "8px 20px", borderRadius: 8,
                    background: isPending ? "#86efac" : "#16a34a",
                    color: "#fff", border: "none",
                    fontSize: 13.5, fontWeight: 700,
                    fontFamily: "DM Sans, sans-serif",
                    cursor: isPending ? "not-allowed" : "pointer",
                    transition: "background 0.12s",
                    boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isPending) (e.currentTarget as HTMLButtonElement).style.background = "#15803d";
                  }}
                  onMouseLeave={(e) => {
                    if (!isPending) (e.currentTarget as HTMLButtonElement).style.background = "#16a34a";
                  }}
                >
                  {isPending ? (
                    <>
                      <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} />
                      Saving…
                    </>
                  ) : editTarget ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM MODAL ══════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(3px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 14,
              width: "100%", maxWidth: 400,
              boxShadow: "0 24px 64px rgba(0,0,0,0.20)",
              animation: "modal-in 0.2s cubic-bezier(0.22,1,0.36,1)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Red accent bar */}
            <div style={{ height: 4, background: "#dc2626" }} />

            <div style={{ padding: "22px 24px 20px" }}>
              {/* Icon + title */}
              <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: "#fee2e2",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={18} color="#dc2626" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                    Delete Product
                  </div>
                  <div style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.5 }}>
                    Are you sure you want to delete{" "}
                    <strong style={{ color: "#0f172a" }}>{deleteTarget.name}</strong>?
                    This will also remove all associated stock movements and alerts.
                    This action cannot be undone.
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setDeleteTarget(null)}
                  style={{
                    padding: "8px 18px", borderRadius: 8,
                    border: "1px solid #e2e8f0", background: "#fff",
                    fontSize: 13.5, fontWeight: 600, color: "#374151",
                    cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "8px 18px", borderRadius: 8,
                    background: isPending ? "#fca5a5" : "#dc2626",
                    color: "#fff", border: "none",
                    fontSize: 13.5, fontWeight: 700,
                    fontFamily: "DM Sans, sans-serif",
                    cursor: isPending ? "not-allowed" : "pointer",
                  }}
                >
                  {isPending
                    ? <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} />
                    : <><Trash2 size={14} /> Delete</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin      { from { transform: rotate(0deg); }  to { transform: rotate(360deg); } }
        @keyframes modal-in  { from { opacity:0; transform: scale(0.96) translateY(10px); } to { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes toast-in  { from { opacity:0; transform: translateY(10px); }            to { opacity:1; transform: translateY(0); }           }
      `}</style>
    </div>
  );
}

// ─── Product Row ───────────────────────────────────────────────────────────────

function ProductRow({
  product: p, isLast, onEdit, onDelete,
}: {
  product: SerializedProduct;
  isLast:  boolean;
  onEdit:  () => void;
  onDelete:() => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <tr
      style={{ borderBottom: isLast ? "none" : "1px solid #f8fafc" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Product column */}
<td style={{ padding: "13px 16px", background: hovered ? "#fafafa" : "transparent" }}>
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

    {/* Product image or placeholder */}
    <div style={{
      width: 40, height: 40, borderRadius: 8, flexShrink: 0,
      background: "#f1f5f9", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "1px solid #e2e8f0",
    }}>
      {(p as any).imageUrl ? (
        <img
          src={(p as any).imageUrl}
          alt={p.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <Package size={18} color="#94a3b8" strokeWidth={1.5} />
      )}
    </div>

    {/* Name + shelf */}
    <div style={{ minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0f172a" }}>
        {p.name}
      </div>
      {p.shelfLocation && (
        <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 1 }}>
          {p.shelfLocation}
        </div>
      )}
    </div>
  </div>
</td>

      {/* Category */}
      <td style={{ padding: "13px 16px", background: hovered ? "#fafafa" : "transparent" }}>
        <span
          style={{
            fontSize: 12.5, color: "#475569",
            background: "#f1f5f9",
            padding: "3px 8px", borderRadius: 6,
            fontWeight: 500,
          }}
        >
          {p.category.name}
        </span>
      </td>

      {/* Price */}
      <td style={{ padding: "13px 16px", background: hovered ? "#fafafa" : "transparent" }}>
  {(p as any).isDiscounted ? (
    <div>
      {/* Discounted price in green */}
      <div style={{ fontSize: 13.5, fontWeight: 800, color: "#15803d" }}>
        ₱{parseFloat(p.price).toFixed(2)}
      </div>
      {/* Original price struck through */}
      <div style={{ fontSize: 11.5, color: "#94a3b8",
        textDecoration: "line-through" }}>
        ₱{parseFloat((p as any).originalPrice ?? p.price).toFixed(2)}
      </div>
      {/* Discount badge */}
      <span style={{ fontSize: 10, fontWeight: 800,
        background: "#fef3c7", color: "#b45309",
        padding: "1px 6px", borderRadius: 99,
        border: "1px solid #fde68a" }}>
        -{(p as any).discountPercent ?? 0}% OFF
      </span>
    </div>
  ) : (
    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
      ₱{parseFloat(p.price).toFixed(2)}
    </div>
  )}
</td>

      {/* Stock */}
      <td style={{ padding: "13px 16px", background: hovered ? "#fafafa" : "transparent" }}>
        <div
          style={{
            fontSize: 13.5, fontWeight: 700,
            color: p.currentStock <= p.lowStockThreshold ? "#c2410c" : "#0f172a",
          }}
        >
          {p.currentStock}
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
          min {p.lowStockThreshold}
        </div>
      </td>

      {/* Expiration */}
      <td
        style={{
          padding: "13px 16px",
          fontSize: 13, color: "#64748b",
          background: hovered ? "#fafafa" : "transparent",
        }}
      >
        {formatDate(p.expirationDate)}
      </td>

      {/* Status */}
      <td style={{ padding: "13px 16px", background: hovered ? "#fafafa" : "transparent" }}>
        <StatusBadge status={p.status} />
      </td>

      {/* Actions */}
      <td style={{ padding: "13px 16px", background: hovered ? "#fafafa" : "transparent" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {/* Edit */}
          <button
            onClick={onEdit}
            title="Edit product"
            style={{
              width: 30, height: 30, borderRadius: 7,
              border: "1px solid #e2e8f0", background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#475569",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background     = "#f0fdf4";
              (e.currentTarget as HTMLButtonElement).style.borderColor    = "#86efac";
              (e.currentTarget as HTMLButtonElement).style.color          = "#15803d";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background     = "#fff";
              (e.currentTarget as HTMLButtonElement).style.borderColor    = "#e2e8f0";
              (e.currentTarget as HTMLButtonElement).style.color          = "#475569";
            }}
          >
            <Pencil size={13} strokeWidth={2} />
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            title="Delete product"
            style={{
              width: 30, height: 30, borderRadius: 7,
              border: "1px solid #e2e8f0", background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#475569",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background     = "#fef2f2";
              (e.currentTarget as HTMLButtonElement).style.borderColor    = "#fca5a5";
              (e.currentTarget as HTMLButtonElement).style.color          = "#dc2626";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background     = "#fff";
              (e.currentTarget as HTMLButtonElement).style.borderColor    = "#e2e8f0";
              (e.currentTarget as HTMLButtonElement).style.color          = "#475569";
            }}
          >
            <Trash2 size={13} strokeWidth={2} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function ModalField({
  label, required, children,
}: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label
        style={{
          fontSize: 12.5, fontWeight: 600, color: "#374151",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "#dc2626", marginLeft: 3 }}>*</span>
        )}
      </label>
      {children}
    </div>
  );
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  fontSize: 13.5,
  fontFamily: "DM Sans, sans-serif",
  color: "#0f172a",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.14s, box-shadow 0.14s",
};

function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "#16a34a";
  e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(22,163,74,0.12)";
}

function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "#e2e8f0";
  e.currentTarget.style.boxShadow   = "none";
}
