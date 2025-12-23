// src/pages/SevenDayVolumeReport.jsx
import React, { useEffect, useState } from "react";

const SevenDayVolumeReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ----------------- FETCH DATA -----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/weeks-volumes-report");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching 7-day volume report:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ----------------- HELPERS -----------------
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

  if (loading) {
    return <h1 className="_7-day-volumes-report__status">Loading, Please Wait...</h1>;
  }

  if (!data || data.length === 0) {
    return <h1 className="_7-day-volumes-report__status">No data available</h1>;
  }

  const keys = Object.keys(data[0]).filter((key) => key !== "productionDay");

  // ----------------- RENDER -----------------
  return (
    <section className="_7-day-volumes-report">
      <h1 className="_7-day-volumes-report__heading">7 Day Historical Order Que</h1>
      <table className="_7-day-volumes-report__report">
        <thead>
          <tr className="_7-day-volumes-report__table-headings">
            <th className="_7-day-volumes-report__table-heading"></th>
            {data.map((day, idx) => (
              <th key={idx} className="_7-day-volumes-report__table-heading">
                {day.productionDay}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => (
            <tr key={key} className="_7-day-volumes-report__table-category">
              <th
                className={`_7-day-volumes-report__table-category-name--${key}`}
              >
                {getRowHeading(key)}
              </th>
              {data.map((day, idx) => (
                <td
                  key={idx}
                  className={`_7-day-volumes-report__table-category-value--${key}`}
                >
                  {day[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default SevenDayVolumeReport;
