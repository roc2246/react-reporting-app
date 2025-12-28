// src/utils/date-library.js

export function formatDate(dateString) {
  const dateObj = new Date(dateString + "T00:00:00-05:00"); // EST
  const options = { weekday: "long", month: "numeric", day: "numeric", year: "numeric", timeZone: "America/New_York" };
  return dateObj.toLocaleDateString("en-US", options);
}

export function getWeekdayFromDate(dateString) {
  const date = new Date(dateString + "T00:00:00-05:00");
  return date.toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" });
}

export function getTodayInTimezone(timezoneOffsetMinutes = 0) {
  const now = new Date();
  const localOffset = now.getTimezoneOffset(); // in minutes
  now.setMinutes(now.getMinutes() - localOffset + timezoneOffsetMinutes);
  return now.toISOString().split("T")[0]; // YYYY-MM-DD
}