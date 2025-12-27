export default function Heading({ data, className }) {
    const formatDate = (inputDate) => {
    const options = {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      timeZone: "America/New_York",
    };
    const dateObj = new Date(inputDate + "T00:00:00-05:00");
    return dateObj.toLocaleDateString("en-US", options);
  };
    return (
    <thead>
      <tr className={`${className}__table-headings`}>
        <th className={`${className}__table-heading`}></th>
        {data.map((day, idx) => (
          <th key={idx} className={`${className}__table-heading`}>
            {formatDate(day.productionDay)}
          </th>
        ))}
      </tr>
    </thead>
  );
}
