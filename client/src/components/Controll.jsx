import { useState } from "react";

export default function Controll({ htmlFor, onChange }) {
  const [value, setValue] = useState("");

  const handleChange = (e) => {
    setValue(e.target.value);
    if (onChange) onChange(e); // call parent's onChange if provided
  };

  return (
    <div>
      <label htmlFor={htmlFor}>{`${htmlFor.toUpperCase()}:`}</label>
      <br />
      <input
        type={htmlFor === "date" ? "date" : "text"}
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
