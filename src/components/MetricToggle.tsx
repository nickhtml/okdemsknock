import React from "react";

/**
 * @interface MetricToggleProps
 * @description Type definitions for the MetricToggle component properties.
 */
interface MetricToggleProps {
  /** The currently active selection metric */
  metric: "doors_attempted" | "doors_canvassed";
  /** Callback fired whenever the active metric selection is changed */
  onChange: (metric: "doors_attempted" | "doors_canvassed") => void;
}

/**
 * @component MetricToggle
 * @description A high-contrast, brutalist toggle switch matching the OKDEMS
 * campaign design language. Sharp rectangular buttons, bold outlines, solid dark blue fill.
 */
export default function MetricToggle({ metric, onChange }: MetricToggleProps): React.JSX.Element {
  return (
    <div 
      id="okdems-metric-toggle-container"
      className="inline-flex bg-white p-1 border-2 border-slate-900 rounded-none shadow-[2px_2px_0px_rgba(15,23,42,1)] select-none"
    >
      <button
        type="button"
        id="toggle-btn-attempted"
        onClick={() => onChange("doors_attempted")}
        className={`px-4 py-2 rounded-none text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
          metric === "doors_attempted"
            ? "bg-[#0b2d5a] text-white"
            : "text-slate-700 hover:bg-slate-50"
        }`}
      >
        Doors Attempted
      </button>
      <button
        type="button"
        id="toggle-btn-canvassed"
        onClick={() => onChange("doors_canvassed")}
        className={`px-4 py-2 rounded-none text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
          metric === "doors_canvassed"
            ? "bg-[#0b2d5a] text-white"
            : "text-slate-700 hover:bg-slate-50"
        }`}
      >
        Doors Canvassed
      </button>
    </div>
  );
}
