import { useState } from "react";

export default function Controll({ htmlFor, label, type = "text", onChange }) {
  const [value, setValue] = useState("");

  const handleChange = (e) => {
    setValue(e.target.value);
    if (onChange) onChange(e); // call parent's onChange if provided
  };

  return (
    <div>
      <label htmlFor={htmlFor}>{label}</label>
      <br />
      <input
        type={type}
        id={htmlFor}
        value={value}
        onChange={handleChange}
        required
      />
      <br />
      <br />
    </div>
  );
}
