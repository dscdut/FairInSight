import { X, CheckCircle } from "lucide-react";

interface ToastProps {
  visible: boolean;
  entering: boolean;
  exiting: boolean;
  onDismiss: () => void;
}

/**
 * Success toast notification.
 * Animated with translateY + opacity transitions.
 * Auto-dismissed by the parent hook after 4 seconds.
 */
export function Toast({ visible, entering, exiting, onDismiss }: ToastProps) {
  if (!visible) return null;

  const opacity = entering && !exiting ? 1 : 0;
  const translateY = entering && !exiting ? "0" : exiting ? "8px" : "100%";
  const transition = exiting
    ? "opacity 200ms ease-in, transform 200ms ease-in"
    : "opacity 250ms ease-out, transform 250ms ease-out";

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        background: "#16a34a",
        borderRadius: "8px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        minWidth: "260px",
        opacity,
        transform: `translateY(${translateY})`,
        transition,
        zIndex: 9999,
      }}
    >
      {/* Check icon circle */}
      <div
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        <CheckCircle size={10} color="#fff" />
      </div>

      {/* Text content */}
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            fontWeight: 500,
            color: "#fff",
          }}
        >
          Thành công
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: "12px",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          Văn bản đã được lưu vào cơ sở dữ liệu.
        </p>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Đóng thông báo"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,0.7)",
          padding: "0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "18px",
          height: "18px",
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
