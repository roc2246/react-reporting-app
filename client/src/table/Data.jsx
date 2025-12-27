export default function Data({ data, className, key }) {
  if (!data || !Array.isArray(data)) return null;

  return (
    <>
      {data.map((day, idx) => (
        <td
          key={idx}
          className={`${className}__table-category-value--${key}`}
        >
          {day[key]}
        </td>
      ))}
    </>
  );
}
