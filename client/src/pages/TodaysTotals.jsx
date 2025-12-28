// src/pages/TodaysTotals.jsx
import React, { useState, useEffect } from "react";
import Controll from "../components/Controll";
import TotalsReport from "../sections/TotalsReport";
import LoadingMssg from "../components/LoadingMssg";
import ExcellDownloads from "../sections/ExcellDownloads";
import * as fetchLib from "../utils/fetch-library";

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
    setLoading(true);
    try {
      const data = await fetchLib.fetchJSON(`/api/data-on-fly?date=${date}`);
      const reportRows = Object.entries(data);
      setReportData(reportRows);
    } catch (err) {
      console.error("Error fetching report:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalItems = reportData.reduce(
    (sum, [, count]) => sum + Number(count),
    0
  );
  const itemsPerHour = totalHours
    ? (totalItems / parseFloat(totalHours)).toFixed(1)
    : 0;

  // ----------------- RENDER -----------------
  return (
    <div className="todays-totals-page">
      <h1 className="todays-totals-page__heading">In-Day Estimate</h1>
      <section className="report-generation">
        {/* Form for generating report */}
        <form
          className="report-generation__form"
          onSubmit={handleGenerateReport}
        >
          <Controll
            htmlFor="FBA"
            label="FBA Items Completed:"
            type="text"
            value={FBA}
            onChange={(e) => setFBA(e.target.value)}
          />
          <Controll
            htmlFor="totalHours"
            label="Estimated Total Hours:"
            type="text"
            onChange={(e) => setTotalHours(e.target.value)}
          />
          <Controll
            htmlFor="dates"
            label="Date:"
            type="date"
            onChange={(e) => setDate(e.target.value)}
          />

          <input
            type="submit"
            className="btn report-generation__btn"
            value="Generate Report"
          />
        </form>

        <ExcellDownloads date={date} />
      </section>

      <LoadingMssg bool={loading} />

      <TotalsReport data={reportData} />

      {/* Corect Later */}
      <div>
        <p>FBA: {FBA}</p>
        <p>Total Hours: {totalHours}</p>
        <p>Total Items: {totalItems}</p>
        <p>Items Per Hour: {itemsPerHour}</p>
      </div>
    </div>
  );
};

export default TodaysTotals;
