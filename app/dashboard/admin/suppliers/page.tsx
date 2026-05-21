export default function SuppliersPage() {
  return (
    <div style={{
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      minHeight:      "60vh",
      padding:        24,
      textAlign:      "center",
    }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🚚</div>

      <h1 style={{
        fontSize:      24,
        fontWeight:    800,
        color:         "#0f172a",
        letterSpacing: "-0.03em",
        margin:        "0 0 10px",
      }}>
        Supplier Portal
      </h1>

      <p style={{
        fontSize:   14,
        color:      "#64748b",
        maxWidth:   400,
        lineHeight: 1.6,
        margin:     "0 0 24px",
      }}>
        This feature is currently under development. Purchase orders,
        supplier management, and demand tracking will be available soon.
      </p>

      <span style={{
        display:      "inline-flex",
        alignItems:   "center",
        gap:          6,
        background:   "#fef3c7",
        color:        "#b45309",
        border:       "1px solid #fde68a",
        borderRadius: 99,
        padding:      "6px 16px",
        fontSize:     13,
        fontWeight:   700,
      }}>
        🔧 Coming Soon
      </span>
    </div>
  );
}