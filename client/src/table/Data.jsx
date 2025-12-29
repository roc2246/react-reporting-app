export default function Data({ data, className, key }) {
  if (!data || !Array.isArray(data)) return null;

  return (
    <>
      {data.map((row, idx) => (
        <td key={idx} className={`${className}__table-category-value--${key}`}>
          {key === "totalHours"
            ? row[key]?.toFixed(1) ?? "N/A"
            : row[key] ?? "N/A"}
        </td>
      ))}
    </>
  );
}
