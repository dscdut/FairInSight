import { useState } from "react";
import { Eye, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { LegalDocument } from "../constants/mockDocuments";
import { VersionHistoryPanel } from "./VersionHistoryPanel";

// Inline toggle — smaller knob, muted blue ON color
function InlineToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        position: "relative",
        width: "34px",
        height: "18px",
        borderRadius: "9px",
        background: checked ? "#2563eb" : "#d1d5db",
        border: "none",
        padding: 0,
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.15s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "2px",
          left: checked ? "16px" : "2px",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.15s ease",
          display: "block",
        }}
      />
    </button>
  );
}

const thStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  color: "#6b7280",
  padding: "10px 16px",
  textAlign: "left",
  background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "11px 16px",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "middle",
};

interface DocumentTableProps {
  documents: LegalDocument[];
  onToggle: (id: number) => void;
}

export function DocumentTable({ documents, onToggle }: DocumentTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>TÊN VĂN BẢN</th>
            <th style={thStyle}>SỐ HIỆU</th>
            <th style={thStyle}>NGÀY HIỆU LỰC</th>
            <th style={thStyle}>VERSION</th>
            <th style={thStyle}>TRẠNG THÁI</th>
            <th style={{ ...thStyle, textAlign: "right" }}>HÀNH ĐỘNG</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <>
              <tr key={doc.id} style={{ background: "#fff" }}>
                {/* Tên văn bản */}
                <td style={tdStyle}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#111827", lineHeight: 1.35 }}>
                    {doc.tenVanBan}
                  </p>
                  <p style={{ margin: "1px 0 0", fontSize: "11.5px", color: "#9ca3af", lineHeight: 1.3 }}>
                    {doc.subDescription}
                  </p>
                </td>

                {/* Số hiệu */}
                <td style={{ ...tdStyle, fontSize: "13px", color: "#374151" }}>
                  {doc.soHieu}
                </td>

                {/* Ngày hiệu lực */}
                <td style={{ ...tdStyle, fontSize: "13px", color: "#374151" }}>
                  {doc.ngayHieuLuc}
                </td>

                {/* Version badge — clickable to expand */}
                <td style={tdStyle}>
                  <button
                    type="button"
                    onClick={() => toggleExpand(doc.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                      background: "#eef2ff",
                      color: "#4338ca",
                      fontSize: "11px",
                      fontWeight: 600,
                      borderRadius: "100px",
                      padding: "2px 8px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {doc.version}
                    {expandedId === doc.id
                      ? <ChevronUp size={10} />
                      : <ChevronDown size={10} />}
                  </button>
                </td>

                {/* Trạng thái */}
                <td style={tdStyle}>
                  <span
                    style={{
                      display: "inline-block",
                      background: "#eff6ff",
                      color: "#2563eb",
                      fontSize: "11px",
                      fontWeight: 500,
                      borderRadius: "100px",
                      padding: "2px 10px",
                      textTransform: "uppercase",
                    }}
                  >
                    {doc.trangThai}
                  </span>
                </td>

                {/* Hành động */}
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      title="Xem"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, display: "flex", alignItems: "center" }}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      title="Chỉnh sửa"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#374151", padding: 0, display: "flex", alignItems: "center" }}
                    >
                      <Pencil size={14} />
                    </button>
                    <InlineToggle checked={doc.active} onChange={() => onToggle(doc.id)} />
                  </div>
                </td>
              </tr>

              {expandedId === doc.id && (
                <VersionHistoryPanel versions={doc.versions} />
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
