import Heading from "../table/Heading";
import Data from "../table/Data";
import RowHeading from "../table/RowHeading";

export function Table({ className, data, keys }) {
  const calculateGrandTotals = (cat) => {
    if (data.length === 0) return "N/A";

    const total = data.reduce((sum, row) => sum + (row[cat] ?? 0), 0);

    if (cat === "totalHours") return total.toFixed(1);

    if (cat === "itemsPerHour") {
      const hours = data.reduce((sum, row) => sum + (row.totalHours ?? 0), 0);

      if (hours === 0) return "N/A";

      return (
        data.reduce((sum, row) => sum + (row.totalItems ?? 0), 0) / hours
      ).toFixed(1);
    }

    return total;
  };
  return (
    <table className={`${className}__report`}>
      <Heading data={data} className={className} />
      <tbody>
        {keys.map((key) => (
          <tr key={key} className={`${className}__table-category`}>
            <RowHeading className={className} key={key} />
            <Data data={data} className={className} key={key} />
            {className === "historical-range" && (
              <td className={`historical-range__table-category-value--${key}`}>
                {calculateGrandTotals(key)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
