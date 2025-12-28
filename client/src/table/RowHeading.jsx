export default function RowHeading({ className, key}) {
    const getRowHeading = (catName) => {
    switch (catName) {
      case "fiveAM":
        return "Orders @ 5 am";
      case "threePM":
        return "Orders @ 3 pm";
      case "sixPM":
        return "Orders @ 6 pm";
      case "ninePM":
        return "Orders @ 9 pm";
      case "elevenPM":
        return "Orders @ 11 pm";
      case "productionHours":
        return "Production Hours";
      default:
        return catName;
    }
  };
  return (
    <th className={`${className}__table-category-name--${key}`}>
      {getRowHeading(key)}
    </th>
  );
}
