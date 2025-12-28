// src/pages/SevenDayVolumeReport.jsx
import React, { useEffect, useState } from "react";
import Heading from "../table/Heading";
import Data from "../table/Data";
import RowHeading from "../table/RowHeading";
import * as fetchLib from "../utils/fetch-library";

const SevenDayVolumeReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ----------------- FETCH DATA -----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const json = await fetchLib.fetchJSON("/weeks-volumes-report");
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

  if (loading) {
    return (
      <h1 className="_7-day-volumes-report__status">Loading, Please Wait...</h1>
    );
  }

  if (!data || data.length === 0) {
    return <h1 className="_7-day-volumes-report__status">No data available</h1>;
  }

  const keys = Object.keys(data[0]).filter((key) => key !== "productionDay");

  // ----------------- RENDER -----------------
  return (
    <section className="_7-day-volumes-report">
      <h1 className="_7-day-volumes-report__heading">
        7 Day Historical Order Que
      </h1>
      <table className="_7-day-volumes-report__report">
        <Heading data={data} className="_7-day-volumes-report" />
        <tbody>
          {keys.map((key) => (
            <tr key={key} className="_7-day-volumes-report__table-category">
              <RowHeading className={"_7-day-volumes-report"} key={key} />
              <Data data={data} className="_7-day-volumes-report" key={key} />
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default SevenDayVolumeReport;
