// src/pages/OrderVolumesReport.jsx
import React, { useEffect, useState } from "react";
import LoadingMssg from "../components/LoadingMssg";
import Heading from "../table/Heading";
import Data from "../table/Data";
import RowHeading from "../table/RowHeading";

const OrderVolumesReport = () => {
  const [dates, setDates] = useState([]);
  const [dayOfWeek, setDayOfWeek] = useState("sunday");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // ------------- HELPERS -----------------

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

  const closestDayOfWeek = (date, targetDay) => {
    const daysMap = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    const target = daysMap[targetDay.toLowerCase()];
    const day = new Date(date);
    let diff = target - day.getDay();
    if (diff <= 0) diff += 7;
    day.setDate(day.getDate() + diff);
    return day.toISOString().split("T")[0];
  };

  // ------------- FETCH DATES -----------------
  useEffect(() => {
    const fetchDates = async () => {
      try {
        const res = await fetch("/que-dates");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const json = await res.json();
        setDates(json.reverse());
        setStartDate(json[json.length - 1]);
        setEndDate(json[0]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDates();
  }, []);

  // ------------- FETCH REPORT -----------------
  const generateReport = async () => {
    if (!startDate || !endDate) return;
    const adjustedStart = closestDayOfWeek(startDate, dayOfWeek);
    setLoading(true);
    try {
      const res = await fetch(
        `/order-volumes-report?startDate=${adjustedStart}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // ------------- RENDER -----------------
  const keys = data[0]
    ? Object.keys(data[0]).filter((k) => k !== "productionDay")
    : [];

  return (
    <section className="order-volumes-report">
      <h1 className="order-volumes-report__heading">
        Generate Historical Range Report
      </h1>

      <label>
        Day of Week:
        <select
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(e.target.value)}
          className="order-volumes-report__day-of-week"
        >
          {[
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ].map((day) => (
            <option key={day} value={day}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <br />
      <br />

      <label>
        Report Start Date:
        <select
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="order-volumes-report__start"
        >
          {dates.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>
      </label>
      <br />
      <br />

      <label>
        Report End Date:
        <select
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="order-volumes-report__end"
        >
          {dates.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>
      </label>
      <br />
      <br />

      <button
        onClick={generateReport}
        className="order-volumes-report__generate"
      >
        Generate Report
      </button>

      <LoadingMssg bool={loading} />
      {data.length > 0 && (
        <table className="order-volumes-report__report">
          <Heading data={data} className="order-volumes-report" />
          <tbody>
            {keys.map((key) => (
              <tr key={key} className="order-volumes-report__table-category">
                <RowHeading
                  className={"order-volumes-report"}
                  key={key}
                  getRowHeading={getRowHeading(key)}
                />
                <Data data={data} className="order-volumes-report" key={key} />
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default OrderVolumesReport;
