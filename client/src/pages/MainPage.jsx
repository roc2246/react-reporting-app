// src/pages/MainPage.jsx
import React from "react";
import { Link } from "react-router-dom";
// import "./style.css";

const MainPage = () => {
  return (
    <section className="menu">
      <h1 className="menu__heading">Choose your query</h1>

      <ul className="menu__options">
        <li className="menu__option">
          <Link to="/todays-totals" className="menu__link">
            Today's Productivity Totals
          </Link>
        </li>
        <li className="menu__option">
          <Link to="/historical-range" className="menu__link">
            Historical Productivity Date Details
          </Link>
        </li>
        <li className="menu__option">
          <Link to="/historical-summary" className="menu__link">
            Historical Productivity Summary
          </Link>
        </li>
        <li className="menu__option">
          <Link to="/7-day-volume-report" className="menu__link">
            7 Day Historical Order Que
          </Link>
        </li>
        <li className="menu__option">
          <Link to="/order-volumes-report" className="menu__link">
            Historical Order Queue
          </Link>
        </li>
        <li className="menu__option">
          <Link to="/record-hours" className="menu__link">
            Record Hours and FBA
          </Link>
        </li>
      </ul>
    </section>
  );
};

export default MainPage;
