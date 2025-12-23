// src/pages/HistoricalSummary.jsx
import React, { useState, useEffect } from "react";

const HistoricalSummary = () => {
  // ----------------- STATE -----------------
  const [productionDates, setProductionDates] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [showDropdown, setShowDropdown] = useState(true);

  // ----------------- EFFECTS -----------------
  useEffect(() => {
    const fetchProductionDates = async () => {
      try {
        const res = await fetch("/production-dates");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setProductionDates(data);
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
  const createRowData = (grandTotals) => {
    return Object.entries(grandTotals).map(([key, value]) => ({
      key,
      value,
    }));
  };

  const handleGenerateReport = async () => {
    if (new Date(endDate) < new Date(startDate)) {
      alert("Please enter a valid range");
      return;
    }
    setShowDropdown(false);

    try {
      const res = await fetch(`/summarized-range?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const dailyTotals = await res.json();

      const grandTotals = {
        from: `${startDate} to ${endDate}`,
        items: 0,
        hats: 0,
        bibs: 0,
        miniBears: 0,
        giftBaskets: 0,
        FBA: 0,
        towels: 0,
        potHolders: 0,
        bandanas: 0,
        totalItems: 0,
        totalHours: 0,
        itemsPerHour: 0,
      };

      dailyTotals.forEach((day) => {
        grandTotals.items += parseInt(day.items);
        grandTotals.hats += parseInt(day.hats);
        grandTotals.bibs += parseInt(day.bibs);
        grandTotals.miniBears += parseInt(day.miniBears);
        grandTotals.giftBaskets += parseInt(day.giftBaskets);
        grandTotals.FBA += parseInt(day.FBA);
        grandTotals.towels += parseInt(day.towels);
        grandTotals.potHolders += parseInt(day.potHolders);
        grandTotals.bandanas += parseInt(day.bandanas);
        grandTotals.totalItems += parseInt(day.totalItems);
        grandTotals.totalHours += day.totalHours;
      });

      grandTotals.totalHours = parseFloat(grandTotals.totalHours).toFixed(1);
      grandTotals.itemsPerHour = (grandTotals.totalItems / grandTotals.totalHours).toFixed(1);

      setReportData(createRowData(grandTotals));
    } catch (err) {
      console.error("Error generating report:", err);
    }
  };

  const handleDownload = async (type = "report") => {
    if (new Date(endDate) < new Date(startDate)) {
      alert("Please enter a valid range");
      return;
    }
    const url =
      type === "report"
        ? `/download-report?startDate=${startDate}&endDate=${endDate}`
        : `/download-ids?startDate=${startDate}&endDate=${endDate}`;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Report - ${startDate}-to-${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const handleBack = () => {
    setShowDropdown(true);
    setReportData([]);
  };

  // ----------------- RENDER -----------------
  return (
    <div className="historical-summary-page">
      <section className="historical-summary">
        <h1 className="historical-summary__heading">HISTORICAL SUMMARY</h1>
        {!showDropdown && (
          <button className="historical-summary__back" onClick={handleBack}>
            Back
          </button>
        )}

        <div className="historical-summary__data">
          {reportData.map((row) => (
            <span key={row.key} className="historical-summary__row">
              <h4 className="historical-summary__product-name">{row.key}</h4>
              <p className="historical-summary__product-count">{row.value}</p>
            </span>
          ))}
        </div>
      </section>

      {showDropdown && (
        <section className="dates">
          <h1>Select Date</h1>
          <span className="dates__label">Start: </span>
          <select
            className="dates__dropdown--start"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          >
            {productionDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
          <br />
          <br />
          <span className="dates__label">End: </span>
          <select
            className="dates__dropdown--end"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          >
            {productionDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
          <br />
          <br />
          <button className="dates__select" onClick={handleGenerateReport}>
            Generate Report
          </button>
        </section>
      )}

      {!showDropdown && (
        <>
          <button
            className="download-orders download-orders--orders"
            onClick={() => handleDownload("report")}
          >
            download orders timeframe
          </button>
          <br />
          <br />
          <button
            className="download-orders download-orders--ids"
            onClick={() => handleDownload("ids")}
          >
            download order ids for this timeframe
          </button>
        </>
      )}
    </div>
  );
};

export default HistoricalSummary;
