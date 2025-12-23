// src/pages/HistoricalRange.jsx
import React, { useState, useEffect } from "react";

const HistoricalRange = () => {
  // ----------------- STATE -----------------
  const [productionDates, setProductionDates] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  // ----------------- EFFECTS -----------------
  // Fetch available production dates on mount
  useEffect(() => {
    const fetchProductionDates = async () => {
      try {
        const res = await fetch("/production-dates");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setProductionDates(data.reverse());
        if (data.length > 0) {
          setStartDate(data[0]);
          setEndDate(data[data.length - 1]);
        }
      } catch (err) {
        console.error("Error fetching production dates:", err);
      }
    };
    fetchProductionDates();
  }, []);

  // ----------------- HELPERS -----------------
  const formatDate = (inputDate) => {
    const dateObj = new Date(inputDate + "T00:00:00-05:00");
    const options = { weekday: "long", month: "numeric", day: "numeric", timeZone: "America/New_York" };
    const formatted = dateObj.toLocaleDateString("en-US", options);
    const [weekday, dateStr] = formatted.split(",");
    const [month, day] = dateStr.trim().split(" ");
    return `${weekday.trim()} ${month} ${day}`;
  };

  const handleGenerateReport = async () => {
    if (new Date(endDate) < new Date(startDate)) {
      alert("Please select appropriate range");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/historical-range?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error("Error generating report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (new Date(endDate) < new Date(startDate)) {
      alert("Please select appropriate range");
      return;
    }
    try {
      const res = await fetch(`/download-range?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "output.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const tableKeys = reportData.length > 0 ? Object.keys(reportData[0]).slice(2) : [];

  const calculateGrandTotals = (cat) => {
    if (reportData.length === 0) return "N/A";
    const total = reportData.reduce((sum, row) => sum + (row[cat] ?? 0), 0);
    if (cat === "totalHours") return total.toFixed(1);
    if (cat === "itemsPerHour") {
      const hours = reportData.reduce((sum, row) => sum + (row.totalHours ?? 0), 0);
      if (hours === 0) return "N/A";
      return (reportData.reduce((sum, row) => sum + (row.totalItems ?? 0), 0) / hours).toFixed(1);
    }
    return total;
  };

  // ----------------- RENDER -----------------
  return (
    <div className="historical-range-page">
      <section className="historical-range">
        <h1 className="historical-range__heading">Generate Historical Range</h1>

        <label>
          Start:
          <select
            className="historical-range__start"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          >
            {productionDates.map((date) => (
              <option key={date} value={date}>
                {date} | {new Date(date).toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" })}
              </option>
            ))}
          </select>
        </label>

        <br /><br />

        <label>
          End:
          <select
            className="historical-range__end"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          >
            {productionDates.map((date) => (
              <option key={date} value={date}>
                {date} | {new Date(date).toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" })}
              </option>
            ))}
          </select>
        </label>

        <br /><br />
        <button className="historical-range__generate" onClick={handleGenerateReport}>
          Generate Report
        </button>

        {loading && (
          <h1 className="historical-range__status">Report is generating, please wait...</h1>
        )}

        {reportData.length > 0 && (
          <table className="historical-range__report">
            <thead>
              <tr>
                <th></th>
                {reportData.map((day) => (
                  <th key={day.productionDay}>{formatDate(day.productionDay)}</th>
                ))}
                <th>{reportData.length} Day Total</th>
              </tr>
            </thead>
            <tbody>
              {tableKeys.map((key) => (
                <tr key={key} className="table-category">
                  <th className={`historical-range__table-category-name--${key}`}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </th>
                  {reportData.map((row, idx) => (
                    <td key={idx} className={`historical-range__table-category-value--${key}`}>
                      {key === "totalHours" ? row[key]?.toFixed(1) ?? "N/A" : row[key] ?? "N/A"}
                    </td>
                  ))}
                  <td className={`historical-range__table-category-value--${key}`}>
                    {calculateGrandTotals(key)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <br />
        <button className="download" onClick={handleDownload}>
          Download Report
        </button>
      </section>
    </div>
  );
};

export default HistoricalRange;
