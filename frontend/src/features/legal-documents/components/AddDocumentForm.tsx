import { useRef } from "react";
import { Controller } from "react-hook-form";
import { Info, Calendar, Link, ArrowRight } from "lucide-react";
import { useDocumentForm } from "../hooks/useDocumentForm";
import { FormField } from "./FormField";
import { ToggleSwitch } from "./ToggleSwitch";
import { DuplicateWarningBanner } from "./DuplicateWarningBanner";
import { MarkdownTextarea } from "./MarkdownTextarea";

// Common style for all text inputs
const inputStyle = (hasError?: boolean, isWarning?: boolean): React.CSSProperties => ({
  height: "38px",
  border: `1px solid ${hasError ? "#dc2626" : isWarning ? "#d97706" : "#d1d5db"}`,
  borderRadius: "8px",
  padding: "0 12px",
  fontSize: "13px",
  color: "#111827",
  background: hasError ? "#fff8f8" : isWarning ? "#fffbf0" : "#ffffff",
  width: "100%",
  boxSizing: "border-box" as const,
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
});

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.12)";
    e.currentTarget.style.borderColor = "#6366f1";
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.boxShadow = "none";
    e.currentTarget.style.borderColor = "#d1d5db";
  },
};

// Tooltip for the document number info icon
function InfoTooltip() {
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <Info
        size={13}
        color="#9ca3af"
        style={{ cursor: "help" }}
        tabIndex={0}
        className="peer"
      />
      <span
        className="peer-hover:opacity-100 peer-focus:opacity-100"
        style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "6px",
          padding: "6px 10px",
          fontSize: "12px",
          color: "#374151",
          whiteSpace: "nowrap",
          zIndex: 10,
          pointerEvents: "none",
          opacity: 0,
          transition: "opacity 0.15s",
        }}
      >
        Định dạng: số/năm/cơ quan. Ví dụ: 31/2024/QH15
      </span>
    </span>
  );
}

interface AddDocumentFormProps {
  onSuccess: () => void;
}

export function AddDocumentForm({ onSuccess }: AddDocumentFormProps) {
  const {
    form,
    isDuplicate,
    isSubmitting,
    checkDuplicate,
    clearDuplicate,
    onSubmit,
    handleCancel,
  } = useDocumentForm(onSuccess);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  // Ref for scroll-to-first-error
  const firstErrorRef = useRef<HTMLDivElement>(null);

  const handleFormSubmit = handleSubmit(
    (data) => onSubmit(data),
    () => {
      // Scroll to first invalid field
      const firstError = document.querySelector("[aria-invalid='true'], [data-error='true']");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  );

  return (
    <form onSubmit={handleFormSubmit} noValidate>
      {/* ── Field 1: Tên văn bản ── */}
      <div ref={firstErrorRef}>
        <FormField
          id="tenVanBan"
          label="TÊN VĂN BẢN"
          error={errors.tenVanBan?.message}
        >
          <input
            id="tenVanBan"
            type="text"
            placeholder="Ví dụ: Luật Đất đai 2024"
            aria-invalid={!!errors.tenVanBan}
            {...register("tenVanBan")}
            style={inputStyle(!!errors.tenVanBan)}
            {...focusHandlers}
          />
        </FormField>
      </div>

      {/* ── Row 2: Số hiệu + Trạng thái ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        {/* Số hiệu văn bản */}
        <FormField
          id="soHieuVanBan"
          label={
            <>
              SỐ HIỆU VĂN BẢN
              <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>
              <InfoTooltip />
            </>
          }
          error={errors.soHieuVanBan?.message}
        >
          <input
            id="soHieuVanBan"
            type="text"
            aria-invalid={!!errors.soHieuVanBan}
            data-error={!!errors.soHieuVanBan}
            {...register("soHieuVanBan", {
              onBlur: (e) => checkDuplicate(e.target.value),
            })}
            onChange={(e) => {
              register("soHieuVanBan").onChange(e);
              clearDuplicate();
            }}
            style={inputStyle(!!errors.soHieuVanBan, isDuplicate)}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.12)";
              e.currentTarget.style.borderColor = "#6366f1";
            }}
          />
          {isDuplicate && <DuplicateWarningBanner />}
        </FormField>

        {/* Trạng thái hiệu lực */}
        <FormField id="trangThaiHieuLuc" label="TRẠNG THÁI HIỆU LỰC">
          <Controller
            name="trangThaiHieuLuc"
            control={control}
            render={({ field }) => (
              <ToggleSwitch
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormField>
      </div>

      {/* ── Row 3: Ngày ban hành + Ngày hiệu lực ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        {/* Ngày ban hành */}
        <FormField id="ngayBanHanh" label="NGÀY BAN HÀNH">
          <div style={{ position: "relative" }}>
            <input
              id="ngayBanHanh"
              type="date"
              {...register("ngayBanHanh")}
              style={{ ...inputStyle(), paddingRight: "32px" }}
              {...focusHandlers}
            />
            <Calendar
              size={14}
              color="#9ca3af"
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
          </div>
        </FormField>

        {/* Ngày hiệu lực */}
        <FormField
          id="ngayHieuLuc"
          label="NGÀY HIỆU LỰC"
          error={errors.ngayHieuLuc?.message}
        >
          <div style={{ position: "relative" }}>
            <input
              id="ngayHieuLuc"
              type="date"
              aria-invalid={!!errors.ngayHieuLuc}
              {...register("ngayHieuLuc")}
              style={{ ...inputStyle(!!errors.ngayHieuLuc), paddingRight: "32px" }}
              {...focusHandlers}
            />
            <Calendar
              size={14}
              color="#9ca3af"
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
          </div>
        </FormField>
      </div>

      {/* ── Field 4: Nguồn văn bản (URL) ── */}
      <FormField
        id="nguonVanBan"
        label="NGUỒN VĂN BẢN (URL)"
        error={errors.nguonVanBan?.message}
        className="mt-4"
      >
        <div style={{ position: "relative", marginTop: "16px" }}>
          <input
            id="nguonVanBan"
            type="url"
            placeholder="https://thuvienphapluat.vn/..."
            aria-invalid={!!errors.nguonVanBan}
            {...register("nguonVanBan")}
            style={{ ...inputStyle(!!errors.nguonVanBan), paddingRight: "32px" }}
            {...focusHandlers}
          />
          <Link
            size={14}
            color="#9ca3af"
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
        </div>
      </FormField>

      {/* ── Field 5: Nội dung văn bản ── */}
      <div style={{ marginTop: "16px" }}>
        <label
          htmlFor="noiDungVanBan"
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            color: "#6b7280",
            display: "block",
            marginBottom: "6px",
          }}
        >
          NỘI DUNG VĂN BẢN
        </label>

        <Controller
          name="noiDungVanBan"
          control={control}
          render={({ field }) => (
            <MarkdownTextarea
              id="noiDungVanBan"
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="Dán nội dung văn bản tại đây..."
            />
          )}
        />
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          borderTop: "1px solid #f3f4f6",
          paddingTop: "20px",
          marginTop: "24px",
        }}
      >
        {/* Cancel */}
        <button
          type="button"
          onClick={handleCancel}
          style={{
            background: "none",
            border: "none",
            color: "#6b7280",
            fontSize: "13px",
            padding: "8px 12px",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "#374151")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "#6b7280")
          }
        >
          Hủy
        </button>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
          style={{
            background: isSubmitting ? "#1e3a8a" : "#1e3a8a",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 500,
            borderRadius: "8px",
            padding: "9px 20px",
            border: "none",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            opacity: isSubmitting ? 0.7 : 1,
            transition: "background 0.15s, opacity 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) e.currentTarget.style.background = "#1e40af";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#1e3a8a";
          }}
        >
          {isSubmitting ? (
            <>
              Đang lưu...
              <span
                style={{
                  display: "inline-block",
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            </>
          ) : (
            <>
              Lưu văn bản
              <ArrowRight size={13} />
            </>
          )}
        </button>
      </div>

      {/* Keyframe for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
}
