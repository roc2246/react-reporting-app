import { useState, useEffect } from "react";
import Select from "../components/Select";
import LoadingMssg from "../components/LoadingMssg";
import * as fetchLib from "../utils/fetch-library";

const HistoricalSummary = () => {
  // ----------------- STATE -----------------
  const [productionDates, setProductionDates] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [showDropdown, setShowDropdown] = useState(true);
  const [loading, setLoading] = useState(false);

  // ----------------- EFFECTS -----------------
  useEffect(() => {
    const fetchProductionDates = async () => {
      try {
        const data = await fetchLib.fetchJSON("/production-dates");
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
  const createRowData = (grandTotals) =>
    Object.entries(grandTotals).map(([key, value]) => ({ key, value }));

  const handleGenerateReport = async () => {
    if (new Date(endDate) < new Date(startDate)) {
      alert("Please enter a valid range");
      return;
    }

    setShowDropdown(false);
    setLoading(true);

    try {
      const dailyTotals = await fetchLib.fetchJSON(
        `/summarized-range?startDate=${startDate}&endDate=${endDate}`
      );

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
        grandTotals.items += parseInt(day.items || 0);
        grandTotals.hats += parseInt(day.hats || 0);
        grandTotals.bibs += parseInt(day.bibs || 0);
        grandTotals.miniBears += parseInt(day.miniBears || 0);
        grandTotals.giftBaskets += parseInt(day.giftBaskets || 0);
        grandTotals.FBA += parseInt(day.FBA || 0);
        grandTotals.towels += parseInt(day.towels || 0);
        grandTotals.potHolders += parseInt(day.potHolders || 0);
        grandTotals.bandanas += parseInt(day.bandanas || 0);
        grandTotals.totalItems += parseInt(day.totalItems || 0);
        grandTotals.totalHours += parseFloat(day.totalHours || 0);
      });

      grandTotals.totalHours = parseFloat(grandTotals.totalHours).toFixed(1);
      grandTotals.itemsPerHour = (
        grandTotals.totalItems / grandTotals.totalHours
      ).toFixed(1);

      setReportData(createRowData(grandTotals));
    } catch (err) {
      console.error("Error generating report:", err);
    } finally {
      setLoading(false);
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
      const blob = await fetchLib.fetchBlob(url);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Report-${startDate}-to-${endDate}.xlsx`;
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
        <h1 className="historical-summary__heading">Historical Summary</h1>

        {!showDropdown && (
          <button
            className="historical-summary__back"
            onClick={handleBack}
          >
            Back
          </button>
        )}

        <LoadingMssg bool={loading} />

        {!showDropdown && (
          <div className="historical-summary__data">
            {reportData.map((row) => (
              <span key={row.key} className="historical-summary__row">
                <h4 className="historical-summary__product-name">{row.key}</h4>
                <p className="historical-summary__product-count">{row.value}</p>
              </span>
            ))}

            <button
              className="download-orders download-orders--orders"
              onClick={() => handleDownload("report")}
            >
              Download Orders Timeframe
            </button>

            <button
              className="download-orders download-orders--ids"
              onClick={() => handleDownload("ids")}
            >
              Download Order IDs Timeframe
            </button>
          </div>
        )}

        {showDropdown && (
          <section className="historical-summary__dates">
            <Select
              label="Start:"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              options={productionDates}
              className="historical-summary__start"
            />

            <Select
              label="End:"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              options={productionDates}
              className="historical-summary__end"
            />

            <button
              className="historical-summary__generate"
              onClick={handleGenerateReport}
            >
              Generate Report
            </button>
          </section>
        )}
      </section>
    </div>
  );
};

export default HistoricalSummary;
