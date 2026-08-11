import { useState, useRef } from "react";
import { Eye, Maximize2 } from "lucide-react";

interface MarkdownTextareaProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Textarea with a preview toggle that renders Markdown as HTML.
 * Uses the marked library loaded as an ES module from CDN via dynamic import.
 */
export function MarkdownTextarea({
  id,
  value,
  onChange,
  placeholder,
}: MarkdownTextareaProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const inputStyle: React.CSSProperties = {
    minHeight: "160px",
    resize: "vertical",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "13px",
    color: "#111827",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const handleTogglePreview = async () => {
    if (!isPreview) {
      // Dynamically import marked to parse markdown
      try {
        const { marked } = await import("marked");
        setPreviewHtml(marked(value || "") as string);
      } catch {
        setPreviewHtml(`<pre>${value}</pre>`);
      }
    }
    setIsPreview((prev) => !prev);
  };

  return (
    <div>
      {isPreview ? (
        <div
          style={{
            ...inputStyle,
            overflowY: "auto",
            cursor: "default",
          }}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      ) : (
        <textarea
          id={id}
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow =
              "0 0 0 3px rgba(79,70,229,0.12)";
            e.currentTarget.style.borderColor = "#6366f1";
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.borderColor = "#d1d5db";
          }}
        />
      )}

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "6px",
          marginTop: "6px",
        }}
      >
        {/* Preview toggle */}
        <button
          type="button"
          title={isPreview ? "Edit" : "Preview"}
          onClick={handleTogglePreview}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "5px",
            padding: "4px 6px",
            background: isPreview ? "#f3f4f6" : "#ffffff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Eye size={14} color="#6b7280" />
        </button>

        {/* Expand (visual-only) */}
        <button
          type="button"
          title="Fullscreen"
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "5px",
            padding: "4px 6px",
            background: "#ffffff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Maximize2 size={14} color="#6b7280" />
        </button>
      </div>
    </div>
  );
}
