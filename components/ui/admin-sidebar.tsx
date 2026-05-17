"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, Package, ClipboardList,
  BarChart2, Bell, ShoppingCart, Truck,
  Settings, LogOut, ChevronRight, Menu, X,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { label:"Dashboard",          href:"/dashboard/admin",           icon:LayoutDashboard },
  { label:"Product Management", href:"/dashboard/admin/products",  icon:Package         },
  { label:"Stock Monitoring",   href:"/dashboard/admin/stock",     icon:ClipboardList   },
  { label:"Reports",            href:"/dashboard/admin/reports",   icon:BarChart2       },
  { label:"Alerts",             href:"/dashboard/admin/alerts",    icon:Bell, alertKey:true },
  { label:"POS / Sales",        href:"/dashboard/admin/pos",       icon:ShoppingCart    },
  { label:"Supplier Portal",    href:"/dashboard/admin/suppliers", icon:Truck           },
];

export function AdminSidebar({ alertCount = 0 }: { alertCount?: number }) {
  const pathname       = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const active = (href: string) =>
    href === "/dashboard/admin"
      ? pathname === "/dashboard/admin"
      : pathname.startsWith(href);

  const SidebarContent = () => (
    <div style={{
      width: 230, background: "#0f172a",
      height: "100%", display: "flex",
      flexDirection: "column", overflow: "hidden",
    }}>
      {/* Logo row */}
      <div style={{
        display:"flex", alignItems:"center",
        justifyContent:"space-between",
        padding:"18px 16px 14px",
        borderBottom:"1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:"#16a34a",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 2px 8px rgba(22,163,74,0.35)", flexShrink:0,
          }}>
            <span style={{ fontWeight:800, fontSize:13, color:"#fff" }}>VS</span>
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:13.5, color:"#fff", lineHeight:1.25 }}>
              Vine's Store
            </div>
            <div style={{ fontSize:10.5, color:"#64748b", marginTop:2 }}>
              Admin Panel
            </div>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button onClick={() => setOpen(false)}
          style={{
            display:"none",
            background:"none", border:"none", cursor:"pointer",
            color:"#64748b", padding:4,
          }}
          className="sidebar-close-btn">
          <X size={20}/>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding:"10px", flex:1, display:"flex",
        flexDirection:"column", gap:2, overflowY:"auto" }}>
        {NAV_ITEMS.map(item => {
          const Icon     = item.icon;
          const isActive = active(item.href);
          const badge    = (item as any).alertKey && alertCount > 0 ? alertCount : 0;
          return (
            <Link key={item.href} href={item.href}
              onClick={() => setOpen(false)}
              style={{
                display:"flex", alignItems:"center", gap:9,
                padding:"9px 10px", borderRadius:8,
                textDecoration:"none",
                background: isActive ? "#16a34a" : "transparent",
                color:      isActive ? "#fff"    : "#94a3b8",
                fontWeight: isActive ? 600       : 450,
                fontSize:13, transition:"all 0.13s",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#1e293b";
                  (e.currentTarget as HTMLAnchorElement).style.color      = "#e2e8f0";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color      = "#94a3b8";
                }
              }}
            >
              <Icon size={17} style={{ flexShrink:0, opacity: isActive?1:0.7 }}/>
              <span style={{ flex:1 }}>{item.label}</span>
              {badge > 0 && (
                <span style={{
                  background:"#dc2626", color:"#fff",
                  fontSize:10, fontWeight:800,
                  padding:"1px 6px", borderRadius:99,
                }}>
                  {badge}
                </span>
              )}
              {isActive && badge === 0 && (
                <ChevronRight size={13} style={{ opacity:0.7 }}/>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        borderTop:"1px solid rgba(255,255,255,0.06)",
        padding:"10px", display:"flex",
        flexDirection:"column", gap:2, flexShrink:0,
      }}>

        
        {/* User row */}
        {session?.user && (
          <div style={{
            padding:"8px 10px", display:"flex",
            alignItems:"center", gap:8,
          }}>
            <div style={{
              width:30, height:30, borderRadius:"50%",
              background:"#16a34a",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12, fontWeight:700, color:"#fff", flexShrink:0,
            }}>
{session.user.role === "ADMIN" ? "A" : session.user.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{
                fontSize:12.5, fontWeight:600, color:"#e2e8f0",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              }}>
                {session.user.name}
              </div>
              <div style={{ fontSize:10.5, color:"#64748b" }}>admin</div>
            </div>
          </div>
        )}

        <Link href="/dashboard/admin/settings"
          onClick={() => setOpen(false)}
          style={{
            display:"flex", alignItems:"center", gap:9,
            padding:"9px 10px", borderRadius:8,
            textDecoration:"none", color:"#94a3b8",
            fontSize:13, fontWeight:450,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = "#1e293b";
            (e.currentTarget as HTMLAnchorElement).style.color      = "#e2e8f0";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            (e.currentTarget as HTMLAnchorElement).style.color      = "#94a3b8";
          }}
        >
          <Settings size={17} style={{ opacity:0.7 }}/><span>Settings</span>
        </Link>

        <button onClick={() => signOut({ callbackUrl:"/login" })}
          style={{
            display:"flex", alignItems:"center", gap:9,
            padding:"9px 10px", borderRadius:8,
            background:"transparent", border:"none",
            cursor:"pointer", color:"#94a3b8",
            fontSize:13, fontWeight:450,
            width:"100%", textAlign:"left",
            fontFamily:"DM Sans, sans-serif",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "#1e293b";
            (e.currentTarget as HTMLButtonElement).style.color      = "#e2e8f0";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color      = "#94a3b8";
          }}
        >
          <LogOut size={17} style={{ opacity:0.7 }}/><span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP: fixed sidebar ── */}
      <aside style={{
        width:230, background:"#0f172a",
        minHeight:"100vh", position:"fixed",
        top:0, left:0, bottom:0,
        display:"flex", flexDirection:"column",
        zIndex:40, overflowY:"auto", overflowX:"hidden",
      }}
        className="desktop-sidebar"
      >
        <SidebarContent/>
      </aside>

      {/* ── MOBILE: hamburger button ── */}
      <button
        onClick={() => setOpen(true)}
        className="hamburger-btn"
        style={{
          display:"none",
          position:"fixed", top:12, left:12,
          zIndex:50,
          width:40, height:40, borderRadius:10,
          background:"#0f172a", border:"none",
          alignItems:"center", justifyContent:"center",
          cursor:"pointer", color:"#fff",
          boxShadow:"0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        <Menu size={20}/>
      </button>

      {/* ── MOBILE: overlay + drawer ── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position:"fixed", inset:0, zIndex:49,
            background:"rgba(0,0,0,0.6)",
            backdropFilter:"blur(2px)",
          }}
        />
      )}

      <div
        className="mobile-drawer"
        style={{
          position:"fixed", top:0, left:0, bottom:0,
          width:230, zIndex:50,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition:"transform 0.25s ease",
          display:"none",
        }}
      >
        <SidebarContent/>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .hamburger-btn   { display: flex !important; }
          .mobile-drawer   { display: block !important; }
          .sidebar-close-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}