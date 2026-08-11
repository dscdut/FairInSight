import { AlertTriangle } from "lucide-react";

/**
 * ⭐ Primary deliverable for this sprint.
 * Soft warning shown when the entered document number matches an existing one.
 * Does NOT block form submission — purely informational.
 */
export function DuplicateWarningBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: "#fffbeb",
        border: "1px solid #fcd34d",
        borderRadius: "6px",
        padding: "7px 10px",
        marginTop: "6px",
        display: "flex",
        alignItems: "flex-start",
        gap: "6px",
      }}
    >
      {/* Warning icon */}
      <AlertTriangle
        size={13}
        color="#d97706"
        style={{ flexShrink: 0, marginTop: "1px" }}
      />
      {/* Warning text */}
      <span
        style={{
          fontSize: "11.5px",
          color: "#92400e",
          lineHeight: 1.4,
        }}
      >
        Số hiệu này có thể đã tồn tại trong bản nháp.
      </span>
    </div>
  );
}
