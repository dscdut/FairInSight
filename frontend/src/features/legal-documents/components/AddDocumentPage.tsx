import { Bell, User, Search } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { AddDocumentForm } from "./AddDocumentForm";
import { Toast } from "./Toast";
import { useToast } from "../hooks/useToast";

/**
 * Full-page layout: sidebar (left) + content area (right).
 * Occupies the full viewport height.
 */
export function AddDocumentPage() {
  const toast = useToast();

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily:
          "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Left sidebar */}
      <Sidebar />

      {/* Right content */}
      <main
        style={{
          flex: 1,
          background: "#f5f6f8",
          padding: "28px 32px",
          overflowY: "auto",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              color="#9ca3af"
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              type="search"
              placeholder="Search legal templates, statutes, or case laws..."
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                height: "34px",
                fontSize: "13px",
                width: "280px",
                paddingLeft: "32px",
                paddingRight: "12px",
                outline: "none",
                color: "#374151",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Right icons */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Bell size={18} color="#6b7280" style={{ cursor: "pointer" }} />
            <User size={18} color="#6b7280" style={{ cursor: "pointer" }} />
          </div>
        </div>

        {/* Form card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            padding: "28px 28px 24px",
          }}
        >
          {/* Card header */}
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#1e3a8a",
              margin: "0 0 4px",
              fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            Thêm văn bản pháp luật
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              margin: "0 0 24px",
            }}
          >
            Nhập thông tin văn bản để phục vụ tra cứu và AI phân tích
          </p>

          <AddDocumentForm onSuccess={toast.show} />
        </div>
      </main>

      {/* Toast notification */}
      <Toast
        visible={toast.visible}
        entering={toast.entering}
        exiting={toast.exiting}
        onDismiss={toast.dismiss}
      />
    </div>
  );
}
