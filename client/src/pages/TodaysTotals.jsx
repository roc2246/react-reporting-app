// src/pages/TodaysTotals.jsx
import React, { useState, useEffect } from "react";

const TodaysTotals = () => {
  // ----------------- STATE -----------------
  const [FBA, setFBA] = useState("");
  const [totalHours, setTotalHours] = useState("");
  const [date, setDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  // ----------------- EFFECTS -----------------
  // Set default date to today in Eastern Time
  useEffect(() => {
    const currentDate = new Date();
    const offsetMinutes = currentDate.getTimezoneOffset();
    currentDate.setMinutes(currentDate.getMinutes() - offsetMinutes - 300);
    setDate(currentDate.toISOString().split("T")[0]);
  }, []);

  // ----------------- HANDLERS -----------------
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(date)) {
      alert("Please enter a valid date in yyyy-mm-dd format");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/data-on-fly/?date=${date}`);
      const data = await response.json();

      const reportRows = Object.entries(data).filter(([key]) => key !== "_id");
      setReportData(reportRows);
    } catch (err) {
      console.error("Error fetching report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (urlSuffix, filename) => {
    try {
      const response = await fetch(`${urlSuffix}?startDate=${date}&endDate=${date}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const totalItems = reportData.reduce((sum, [, count]) => sum + Number(count), 0);
  const itemsPerHour = totalHours ? (totalItems / parseFloat(totalHours)).toFixed(1) : 0;

  // ----------------- RENDER -----------------
  return (
    <div className="todays-totals-page">
      <section className="historical-summary">
        <h1 className="historical-summary__heading">In-Day Estimate</h1>
        <button
          className="historical-summary__back"
          onClick={() => setReportData([])}
        >
          Back
        </button>

        <div className="historical-summary__data">
          {reportData.map(([name, count]) => (
            <div className="historical-summary__row" key={name}>
              <h4 className="historical-summary__product-name">{name}</h4>
              <p className={`historical-summary__product-count--${name}`}>
                {count}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="report-generation">
        <form className="report-generation__form" onSubmit={handleGenerateReport}>
          <label htmlFor="FBA">FBA Items Completed:</label><br />
          <input
            type="text"
            id="FBA"
            value={FBA}
            onChange={(e) => setFBA(e.target.value)}
            required
          /><br /><br />

          <label htmlFor="totalHours">Estimated Total Hours:</label><br />
          <input
            type="text"
            id="totalHours"
            value={totalHours}
            onChange={(e) => setTotalHours(e.target.value)}
            required
          /><br /><br />

          <label htmlFor="dates">Date:</label><br />
          <input
            type="date"
            id="dates"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          /><br /><br />

          <input
            type="submit"
            className="report-generation__button"
            value="Generate Report"
          />
        </form>

        <button
          className="download-orders download-orders--orders"
          onClick={() => handleDownload("/download-report", `Report - ${date}.xlsx`)}
        >
          Download Orders for this timeframe
        </button>

        <button
          className="download-orders download-orders--ids"
          onClick={() => handleDownload("/download-ids", `Order IDs - ${date}.xlsx`)}
        >
          Download Order IDs for this timeframe
        </button>

        {loading && <h1 className="report-generation__status">Report is generating, please wait...</h1>}

        <div>
          <p>FBA: {FBA}</p>
          <p>Total Hours: {totalHours}</p>
          <p>Total Items: {totalItems}</p>
          <p>Items Per Hour: {itemsPerHour}</p>
        </div>
      </section>
    </div>
  );
};

export default TodaysTotals;
