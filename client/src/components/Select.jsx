import React from "react";

export default function Select({ label, value, onChange, options, className }) {
  return (
    <label className={className}>
      {label}
      <select
        value={value}
        onChange={onChange}
        className={`${className}__select`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
