export default function RowHeading({ className, key, getRowHeading }) {
  return (
    <th className={`${className}__table-category-name--${key}`}>
      {getRowHeading}
    </th>
  );
}
