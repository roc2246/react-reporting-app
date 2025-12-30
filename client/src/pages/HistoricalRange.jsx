import React, { useState, useEffect } from "react";
import LoadingMssg from "../components/LoadingMssg";
import Select from "../components/Select";
import ExcellDownloads from "../components/ExcellDownloads";
import * as fetchLib from "../utils/fetch-library";
import Heading from "../table/Heading";
import RowHeading from "../table/RowHeading";
import Data from "../table/Data";
import { Table } from "../table/Table";

const HistoricalRange = () => {
  const [productionDates, setProductionDates] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setdata] = useState([]);
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
    if (!startDate || !endDate) return;
    
    if (new Date(endDate) < new Date(startDate)) {
      alert("Please enter a valid range");
      return;
    }

    setLoading(true);

    try {
      const data = await fetchLib.fetchJSON(
        `/historical-range?startDate=${startDate}&endDate=${endDate}`
      );
      setdata(data);
    } catch (err) {
      console.error("Error generating report:", err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------- TABLE HELPERS -----------------
  const keys = data.length > 0 ? Object.keys(data[0]).slice(2) : [];

  // ________________HELPERS________________
  const className = "historical-range";
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

        {data.length > 0 && (
          <>
            <Table className={className} data={data} keys={keys} />
            <br />
            <ExcellDownloads startDate={startDate} endDate={endDate} />
          </>
        )}
      </section>
    </div>
  );
};

export default HistoricalRange;
