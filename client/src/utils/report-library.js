// src/utils/report-library.js
import * as fetchLib from "./fetch-library";

/**
 * generateReport - generic helper for fetching report data
 *
 * @param {Object} params
 * @param {Function} params.validate - optional validation function, return false to cancel
 * @param {Function} params.url - function returning the URL to fetch
 * @param {Function} params.onSuccess - callback to receive fetched data
 * @param {Function} params.beforeFetch - optional callback before fetch (e.g., setLoading(true))
 * @param {Function} params.afterFetch - optional callback after fetch (e.g., setLoading(false))
 * @param {Event} params.event - optional event to preventDefault on
 */
export default async function generateReport({
  validate,
  url,
  onSuccess,
  beforeFetch,
  afterFetch,
  event,
}) {
  if (event?.preventDefault) event.preventDefault();

  if (validate && !validate()) return;

  beforeFetch?.();

  try {
    const data = await fetchLib.fetchJSON(url());
    onSuccess(data);
  } catch (err) {
    console.error("Error generating report:", err);
  } finally {
    afterFetch?.();
  }
}

export function validateRange(startDate, endDate) {
  if (!startDate || !endDate) return;

  if (new Date(endDate) < new Date(startDate)) {
    alert("Please enter a valid range");
    return;
  }
}

export function validateDate(date) {
  if (!date) return;

  if (date === " ") {
    alert("Please enter a valid date");
    return;
  }
}