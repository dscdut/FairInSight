import { Eye, RotateCcw } from "lucide-react";
import { VersionHistory } from "../constants/mockDocuments";

interface VersionHistoryPanelProps {
  versions: VersionHistory[];
}

/**
 * Inline expandable version history panel.
 * Appears as a sub-row within the document table.
 * Uses the exact same visual language as the main table rows.
 */
export function VersionHistoryPanel({ versions }: VersionHistoryPanelProps) {
  return (
    <tr>
      <td
        colSpan={6}
        style={{
          padding: "0",
          background: "#f8fafc",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {/* Header label */}
        <div
          style={{
            padding: "8px 20px 6px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              color: "#6b7280",
            }}
          >
            Lịch sử phiên bản
          </span>
        </div>

        {/* Version rows */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {versions.map((v, i) => (
              <tr
                key={i}
                style={{
                  borderBottom:
                    i < versions.length - 1 ? "1px solid #f3f4f6" : "none",
                }}
              >
                {/* Version badge */}
                <td style={{ padding: "9px 20px", width: "120px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      background: "#e0e7ff",
                      color: "#3730a3",
                      fontSize: "11px",
                      fontWeight: 600,
                      borderRadius: "100px",
                      padding: "2px 10px",
                    }}
                  >
                    {v.version}
                  </span>
                </td>

                {/* Saved date */}
                <td
                  style={{
                    padding: "9px 20px",
                    fontSize: "13px",
                    color: "#374151",
                    width: "160px",
                  }}
                >
                  {v.savedDate}
                </td>

                {/* Status */}
                <td style={{ padding: "9px 20px", width: "120px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      background: v.status === "Active" ? "#dbeafe" : "#f3f4f6",
                      color: v.status === "Active" ? "#1d4ed8" : "#6b7280",
                      fontSize: "11px",
                      fontWeight: 600,
                      borderRadius: "100px",
                      padding: "3px 10px",
                      textTransform: "uppercase",
                    }}
                  >
                    {v.status}
                  </span>
                </td>

                {/* Actions */}
                <td style={{ padding: "9px 20px" }}>
                  <div style={{ display: "flex", gap: "14px" }}>
                    <button
                      type="button"
                      title="Xem"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        color: "#9ca3af",
                      }}
                    >
                      <Eye size={15} />
                    </button>
                    {v.status === "Archived" && (
                      <button
                        type="button"
                        title="Khôi phục"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          color: "#9ca3af",
                        }}
                      >
                        <RotateCcw size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );
}
