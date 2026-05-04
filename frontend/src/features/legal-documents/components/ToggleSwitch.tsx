interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const ToggleSwitch = ({ checked, onChange }: ToggleSwitchProps) => {
  return (
    <div className="h-[38px] border border-[#d1d5db] rounded-lg px-3 flex items-center gap-2.5">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative w-9 h-5 rounded-full transition-colors duration-150"
        style={{ backgroundColor: checked ? "#22c55e" : "#d1d5db" }}
        aria-label="Toggle status"
      >
        <span
          className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-150"
          style={{ left: checked ? "18px" : "2px" }}
        />
      </button>
      <span
        className={`text-[13px] ${
          checked ? "text-[#16a34a] font-medium" : "text-[#6b7280] font-normal"
        }`}
      >
        {checked ? "Còn hiệu lực" : "Hết hiệu lực"}
      </span>
    </div>
  );
};
