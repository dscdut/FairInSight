import { useState } from "react";
import { Bell, Search } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { FilterBar } from "./FilterBar";
import { DocumentTable } from "./DocumentTable";
import { MOCK_DOCUMENTS, LegalDocument } from "../constants/mockDocuments";

/**
 * UC-6: Legal Document Management (Admin) page.
 * Displays a searchable, filterable list of legal documents
 * with an expandable version history per row.
 */
export function DocumentListPage() {
  const [documents, setDocuments] = useState<LegalDocument[]>(MOCK_DOCUMENTS);
  const [search, setSearch] = useState("");

  const filtered = documents.filter(
    (d) =>
      d.tenVanBan.toLowerCase().includes(search.toLowerCase()) ||
      d.soHieu.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (id: number) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, active: !d.active } : d))
    );
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
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
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Bell size={18} color="#6b7280" />
          </div>
        </div>

        {/* Page heading */}
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#1a2d6b",
            margin: "0 0 2px",
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
          }}
        >
          Quản lý văn bản pháp luật
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "#6b7280",
            margin: "0 0 20px",
          }}
        >
          Cập nhật và điều chỉnh các văn bản pháp quy trong hệ thống.
        </p>

        {/* White card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
            <FilterBar search={search} onSearchChange={setSearch} />
          </div>

          {/* Document table */}
          <DocumentTable documents={filtered} onToggle={handleToggle} />
        </div>
      </main>
    </div>
  );
}
