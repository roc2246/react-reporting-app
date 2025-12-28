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

export function closestDayOfWeek(dateString, targetDay) {
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
  const day = new Date(dateString + "T00:00:00-05:00"); // EST base
  let diff = target - day.getDay();
  if (diff <= 0) diff += 7;
  day.setDate(day.getDate() + diff);
  return day.toISOString().split("T")[0]; // YYYY-MM-DD
}