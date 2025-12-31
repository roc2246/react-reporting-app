export default function Data({ data, className, category }) {
  if (!data || !Array.isArray(data)) return null;

  return (
    <>
      {data.map((row, idx) => (
        <td
          key={idx}
          className={`${className}__table-category-value--${category}`}
        >
          {category}
        </td>
      ))}
    </>
  );
}
