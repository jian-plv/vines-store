import { Package, AlertTriangle, Clock, TrendingUp } from "lucide-react";

interface Props {
  totalProducts:  number;
  lowStockCount:  number;
  nearExpiryCount: number;
  totalRevenue:   number;
  isAdmin:        boolean;
}

export function DashboardStats({
  totalProducts,
  lowStockCount,
  nearExpiryCount,
  totalRevenue,
  isAdmin,
}: Props) {
  const cards = [
    {
      label: "Total Products",
      value: totalProducts.toLocaleString(),
      icon: Package,
      iconBg: "#dbeafe",
      iconColor: "#2563eb",
    },
    {
      label: "Low Stock Items",
      value: lowStockCount.toLocaleString(),
      icon: AlertTriangle,
      iconBg: "#ffedd5",
      iconColor: "#ea580c",
    },
    {
      label: "Near Expiry",
      value: nearExpiryCount.toLocaleString(),
      icon: Clock,
      iconBg: "#fef3c7",
      iconColor: "#d97706",
    },
    ...(isAdmin
      ? [
          {
            label: "Total Revenue",
            value: `₱${totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
            icon: TrendingUp,
            iconBg: "#dcfce7",
            iconColor: "#16a34a",
          },
        ]
      : []),
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cards.length}, 1fr)`,
        gap: 16,
      }}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="stat-card">
            <div
              className="stat-card-icon"
              style={{ background: card.iconBg }}
            >
              <Icon size={20} color={card.iconColor} strokeWidth={2} />
            </div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-label">{card.label}</div>
          </div>
        );
      })}
    </div>
  );
}
