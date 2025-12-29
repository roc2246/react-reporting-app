import React, { useState, useEffect } from "react";
import LoadingMssg from "../components/LoadingMssg";
import Select from "../components/Select";
import ExcellDownloads from "../components/ExcellDownloads";
import * as fetchLib from "../utils/fetch-library";
import Heading from "../table/Heading";
import RowHeading from "../table/RowHeading";
import Data from "../table/Data";

const HistoricalRange = () => {
  const [productionDates, setProductionDates] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  // ----------------- EFFECTS -----------------
  useEffect(() => {
    const fetchProductionDates = async () => {
      try {
        const data = await fetchLib.fetchJSON("/production-dates");
        const reversed = [...data].reverse();

        setProductionDates(reversed);

        if (reversed.length > 0) {
          setStartDate(reversed[0]);
          setEndDate(reversed[reversed.length - 1]);
        }
      } catch (err) {
        console.error("Error fetching production dates:", err);
      }
    };

    fetchProductionDates();
  }, []);

  // ----------------- HANDLERS -----------------
  const handleGenerateReport = async () => {
    if (new Date(endDate) < new Date(startDate)) {
      alert("Please select appropriate range");
      return;
    }

    setLoading(true);

    try {
      const data = await fetchLib.fetchJSON(
        `/historical-range?startDate=${startDate}&endDate=${endDate}`
      );
      setReportData(data);
    } catch (err) {
      console.error("Error generating report:", err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------- TABLE HELPERS -----------------
  const tableKeys =
    reportData.length > 0 ? Object.keys(reportData[0]).slice(2) : [];

  const calculateGrandTotals = (cat) => {
    if (reportData.length === 0) return "N/A";

    const total = reportData.reduce((sum, row) => sum + (row[cat] ?? 0), 0);

    if (cat === "totalHours") return total.toFixed(1);

    if (cat === "itemsPerHour") {
      const hours = reportData.reduce(
        (sum, row) => sum + (row.totalHours ?? 0),
        0
      );

      if (hours === 0) return "N/A";

      return (
        reportData.reduce((sum, row) => sum + (row.totalItems ?? 0), 0) / hours
      ).toFixed(1);
    }

    return total;
  };

  // ----------------- RENDER -----------------
  return (
    <div className="historical-range-page">
      <section className="historical-range">
        <h1 className="historical-range__heading">Generate Historical Range</h1>

        <Select
          label="Start:"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          options={productionDates}
          className="historical-range__start"
        />

        <br />
        <br />

        <Select
          label="End:"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          options={productionDates}
          className="historical-range__end"
        />

        <br />
        <br />

        <ReportGeneration
          className="historical-range"
          handleGenerateReport={handleGenerateReport}
        />

        <LoadingMssg bool={loading} />

        {reportData.length > 0 && (
          <>
            <table className="historical-range__report">
              <Heading data={reportData} className="historical-range" />

              <tbody>
                {tableKeys.map((key) => (
                  <tr key={key} className="table-category">
                    <RowHeading className={"historical-range"} key={key} />
                    <Data
                      data={reportData}
                      className="historical-range"
                      key={key}
                    />
                    <td
                      className={`historical-range__table-category-value--${key}`}
                    >
                      {calculateGrandTotals(key)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <br />

            <ExcellDownloads startDate={startDate} endDate={endDate} />
          </>
        )}
      </section>
    </div>
  );
};

export default HistoricalRange;
