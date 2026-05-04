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
  { icon: <Home size={16} />, label: "Trang chủ" },
  { icon: <MessageSquare size={16} />, label: "Chat" },
  { icon: <FolderOpen size={16} />, label: "Kho biểu mẫu" },
  { icon: <Shield size={16} />, label: "Phân tích pháp lý", active: true },
  { icon: <BarChart2 size={16} />, label: "Quản lý báo cáo" },
  { icon: <Users size={16} />, label: "Quản lý người dùng" },
  { icon: <Settings size={16} />, label: "Cài đặt" },
];

export function Sidebar() {
  return (
    <aside
      style={{
        width: "220px",
        minWidth: "220px",
        background: "#1e3a8a",
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
          fontWeight: 500,
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
              color: item.active ? "#fff" : "rgba(255,255,255,0.55)",
              ...(item.active
                ? {
                    background: "rgba(255,255,255,0.10)",
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

      {/* Upgrade button */}
      <div style={{ padding: "16px" }}>
        <button
          style={{
            background: "#1d4ed8",
            color: "#fff",
            fontSize: "12px",
            borderRadius: "6px",
            border: "none",
            width: "100%",
            padding: "8px 0",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Upgrade Now
        </button>
      </div>
    </aside>
  );
}
