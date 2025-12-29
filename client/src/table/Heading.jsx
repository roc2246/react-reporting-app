
import * as dateLib from "../utils/date-library";

export default function Heading({ data, className }) {
    return (
    <thead>
      <tr className={`${className}__table-headings`}>
        <th className={`${className}__table-heading`}></th>
        {data.map((day, idx) => (
          <th key={idx} className={`${className}__table-heading`}>
            {dateLib.formatDate(day.productionDay)}
          </th>
        ))}
      </tr>
    </thead>
  );
}
