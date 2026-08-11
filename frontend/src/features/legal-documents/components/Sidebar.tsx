import {
  Home,
  MessageSquare,
  FolderOpen,
  Shield,
  BarChart2,
  Users,
  Settings,
} from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const navItems: NavItem[] = [
  { icon: <Home size={15} />, label: "Trang chủ" },
  { icon: <MessageSquare size={15} />, label: "Chat" },
  { icon: <FolderOpen size={15} />, label: "Kho biểu mẫu" },
  { icon: <Shield size={15} />, label: "Phân tích pháp lý", active: true },
  { icon: <BarChart2 size={15} />, label: "Quản lý báo cáo" },
  { icon: <Users size={15} />, label: "Quản lý người dùng" },
  { icon: <Settings size={15} />, label: "Cài đặt" },
];

export function Sidebar() {
  return (
    <aside
      style={{
        width: "220px",
        minWidth: "220px",
        // Deep saturated dark blue matching Figma reference
        background: "#1a2d6b",
        display: "flex",
        flexDirection: "column",
        paddingTop: "16px",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          color: "#fff",
          fontSize: "15px",
          fontWeight: 600,
          padding: "0 16px",
          marginBottom: "20px",
        }}
      >
        LegalAI
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1 }}>
        {navItems.map((item) => (
          <div
            key={item.label}
            style={{
              height: "36px",
              padding: "0 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
              cursor: "pointer",
              color: item.active ? "#fff" : "rgba(255,255,255,0.50)",
              ...(item.active
                ? {
                    background: "rgba(255,255,255,0.12)",
                    borderRadius: "6px",
                    margin: "0 8px",
                    padding: "0 8px",
                  }
                : {}),
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Upgrade section */}
      <div style={{ padding: "12px 14px 8px" }}>
        {/* Upgrade card */}
        <div
          style={{
            background: "rgba(255,255,255,0.08)",
            borderRadius: "10px",
            padding: "14px 14px 10px",
            marginBottom: "12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Lamp illustration placeholder */}
          <div
            style={{
              width: "48px",
              height: "48px",
              marginBottom: "8px",
              opacity: 0.7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="36" height="48" viewBox="0 0 36 48" fill="none">
              <ellipse cx="18" cy="42" rx="10" ry="4" fill="rgba(255,255,255,0.15)" />
              <path d="M10 20 Q8 8 18 4 Q28 8 26 20 L24 32 H12 Z" fill="rgba(255,255,255,0.55)" />
              <rect x="14" y="32" width="8" height="8" rx="2" fill="rgba(255,255,255,0.4)" />
            </svg>
          </div>

          {/* Upgrade button */}
          <button
            style={{
              background: "#3b5bdb",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 500,
              borderRadius: "6px",
              border: "none",
              width: "100%",
              padding: "7px 0",
              cursor: "pointer",
            }}
          >
            Upgrade Now
          </button>
        </div>

        {/* Admin badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 2px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "#3b5bdb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "9px", fontWeight: 700, color: "#fff" }}>AB</span>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, color: "#fff" }}>
              ABCDEF
            </p>
            <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
              ADMIN
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
