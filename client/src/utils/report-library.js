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

export function grandTottals(startDate, endDate, data) {
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

      data.forEach((day) => {
        grandTotals.items += Number(day.items || 0);
        grandTotals.hats += Number(day.hats || 0);
        grandTotals.bibs += Number(day.bibs || 0);
        grandTotals.miniBears += Number(day.miniBears || 0);
        grandTotals.giftBaskets += Number(day.giftBaskets || 0);
        grandTotals.FBA += Number(day.FBA || 0);
        grandTotals.towels += Number(day.towels || 0);
        grandTotals.potHolders += Number(day.potHolders || 0);
        grandTotals.bandanas += Number(day.bandanas || 0);
        grandTotals.totalItems += Number(day.totalItems || 0);
        grandTotals.totalHours += Number(day.totalHours || 0);
      });

      grandTotals.totalHours = grandTotals.totalHours.toFixed(1);
      grandTotals.itemsPerHour = (
        grandTotals.totalItems / grandTotals.totalHours
      ).toFixed(1);

      return grandTotals;
}