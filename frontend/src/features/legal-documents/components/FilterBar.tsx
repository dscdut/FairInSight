import { Search, ChevronDown, Calendar, Plus } from "lucide-react";

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
}

export function FilterBar({ search, onSearchChange }: FilterBarProps) {
  const controlStyle: React.CSSProperties = {
    height: "34px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#374151",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {/* Search */}
      <div style={{ position: "relative", flex: 1 }}>
        <Search
          size={13}
          color="#9ca3af"
          style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
        />
        <input
          type="text"
          placeholder="Tìm tên văn bản, số hiệu…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ ...controlStyle, width: "100%", paddingLeft: "30px", paddingRight: "10px" }}
        />
      </div>

      {/* Trạng thái */}
      <div style={{ position: "relative" }}>
        <select style={{ ...controlStyle, padding: "0 28px 0 10px", appearance: "none", cursor: "pointer", minWidth: "110px" }}>
          <option value="">Trạng thái</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
      </div>

      {/* Ngày ban hành */}
      <div style={{ position: "relative" }}>
        <Calendar size={13} color="#9ca3af" style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input
          type="text"
          placeholder="Ngày ban hành"
          style={{ ...controlStyle, paddingLeft: "28px", paddingRight: "10px", minWidth: "140px" }}
        />
      </div>

      {/* + Thêm mới */}
      <button
        type="button"
        style={{
          height: "34px",
          background: "#1a2d6b",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 500,
          borderRadius: "6px",
          border: "none",
          padding: "0 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          whiteSpace: "nowrap",
        }}
      >
        <Plus size={13} />
        Thêm mới
      </button>
    </div>
  );
}
