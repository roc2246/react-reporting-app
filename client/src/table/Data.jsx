import React from "react";

export default function Data({ data, className, category }) {
  if (!Array.isArray(data)) return null;

  return (
    <>
      {data.map((row, idx) => (
        <React.Fragment key={idx}>
          
          <td className={`${className}__table-category-value--${category}`}>
            {category}
          </td>
          {className === "_7-day-volumes-report" && (
            <td className={`${className}__table-category-value--${category}`}>
              {row[category] ?? "N/A"}
            </td>
          )}

        </React.Fragment>
      ))}
    </>
  );
}
