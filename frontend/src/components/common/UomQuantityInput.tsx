import React, { useMemo } from "react";
import { UI_TOKENS } from "../../config/designTokens";
import {
  DEFAULT_MASTER_METADATA,
  type UomItem,
} from "../../services/masterMetadataService";

export interface UomQuantityInputProps {
  value: number | string;
  uom: string;
  category?: "apparel" | "fabric" | "accessories" | "packing";
  customScales?: UomItem[];
  onChangeQuantity: (quantity: string) => void;
  onChangeUom: (uom: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isError?: boolean;
  className?: string;
  inputClassName?: string;
  selectClassName?: string;
}

/**
 * UomQuantityInput — Central Enterprise Reusable Primitive
 * Pairs numeric quantity with dynamic Units of Measure dropdown.
 * Backed by UI_TOKENS.inputGroup design tokens.
 */
export const UomQuantityInput: React.FC<UomQuantityInputProps> = ({
  value,
  uom,
  category = "apparel",
  customScales,
  onChangeQuantity,
  onChangeUom,
  placeholder = "0",
  disabled = false,
  isError = false,
  className = "",
  inputClassName = "",
  selectClassName = "",
}) => {
  // Resolve UOM items from props or default metadata
  const availableUoms: UomItem[] = useMemo(() => {
    if (customScales && customScales.length > 0) {
      return customScales;
    }
    const catScales = DEFAULT_MASTER_METADATA.uom_scales?.[category];
    if (catScales && catScales.length > 0) {
      return catScales;
    }
    // Universal safe fallback
    return [
      { code: "Pcs", name: "Pieces", is_base: true, factor: 1 },
      { code: "Dzn", name: "Dozen", is_base: false, factor: 12 },
    ];
  }, [category, customScales]);

  return (
    <div
      className={`${UI_TOKENS.inputGroup.container} ${
        isError ? "border-rose-500 ring-1 ring-rose-500" : ""
      } ${disabled ? "bg-slate-50 opacity-80 cursor-not-allowed" : ""} ${className}`}
    >
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChangeQuantity(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`${UI_TOKENS.inputGroup.input} ${inputClassName}`}
      />
      <select
        value={uom}
        onChange={(e) => onChangeUom(e.target.value)}
        disabled={disabled}
        className={`${UI_TOKENS.inputGroup.addonSelect} ${selectClassName}`}
        aria-label="Unit of Measure"
      >
        {availableUoms.map((unit) => (
          <option key={unit.code} value={unit.code}>
            {unit.code}
          </option>
        ))}
      </select>
    </div>
  );
};
