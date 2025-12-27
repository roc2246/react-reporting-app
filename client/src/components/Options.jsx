export default function Options({ data }) {
  return data.map((item) => (
    <option key={item} value={item}>
        {data === "productionDates" ? item : new Date(item).toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" })}
    </option>
  ));
}
