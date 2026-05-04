import React from "react";

interface FormFieldProps {
  id: string;
  label: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable label + input slot + error message wrapper.
 * Renders any input/select/custom control passed as children.
 */
export function FormField({
  id,
  label,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column" }}>
      <label
        htmlFor={id}
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.6px",
          textTransform: "uppercase",
          color: "#6b7280",
          marginBottom: "6px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <span
          role="alert"
          aria-live="polite"
          style={{
            fontSize: "11.5px",
            color: "#dc2626",
            marginTop: "4px",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
