// Date and time helpers

export function getModifyTime(dateString) {
  const pacificTimeZoneOffset = -7 * 60;
  const easternTimeZoneOffset = -4 * 60;
  const date = new Date(dateString);
  const timeZoneOffset = date.getTimezoneOffset();
  if (timeZoneOffset === pacificTimeZoneOffset) {
    date.setMinutes(date.getMinutes() + (pacificTimeZoneOffset - easternTimeZoneOffset));
  }
  return date.toISOString().split("T")[0];
}

export function getEastCoastTime() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes < 10 ? "0" : ""}${minutes} ${ampm}`;
}

export function parseTime(timeString) {
  const time = new Date();
  const pieces = timeString.match(/(\d+):(\d+) ([APap][Mm])/);
  let hours = parseInt(pieces[1]);
  const minutes = parseInt(pieces[2]);
  const period = pieces[3].toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  time.setHours(hours, minutes);
  return time;
}

export function productionDay() {
  const options = { timeZone: "America/New_York" };
  const formatDate = (dateString) => {
    const [month, day, year] = dateString.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  const today = new Date();
  const formattedToday = formatDate(today.toLocaleString("en-US", options).split(",")[0]);

  const tomorrowsDate = new Date(today);
  tomorrowsDate.setDate(today.getDate() + 1);
  const formattedTomorrow = formatDate(tomorrowsDate.toLocaleString("en-US", options).split(",")[0]);

  const thirtyOneDaysAgoDate = new Date(today);
  thirtyOneDaysAgoDate.setDate(today.getDate() - 31);
  const formattedThirtyOneDaysAgo = formatDate(thirtyOneDaysAgoDate.toLocaleString("en-US", options).split(",")[0]);

  return { thirtyOneDaysAgo: formattedThirtyOneDaysAgo, today: formattedToday, tomorrow: formattedTomorrow };
}

export function formatDay(dateString) {
  const date = new Date(dateString);
  date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
  date.setTime(date.getTime() + 5 * 60 * 60 * 1000);
  const options = { weekday: "long", month: "numeric", day: "numeric", timeZone: "America/New_York" };
  return date.toLocaleDateString("en-US", options).replace(/,/g, "");
}

export function dateToDays(date) {
  return new Date(date).getTime() / (24 * 60 * 60 * 1000);
}

export function getDatesForWeeks(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  while (currentDate <= new Date(endDate)) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate = new Date(currentDate.getTime() + oneWeek);
  }
  return dates;
}

export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getWeekSpan() {
  const dates = [];
  let [year, month, day] = productionDay().today.split("-").map(Number);

  for (let x = 0; x < 7; x++) {
    let tempDay = day - x;
    let tempMonth = month;
    let tempYear = year;

    if (tempDay < 1) {
      tempMonth--;
      if (tempMonth < 1) { tempYear--; tempMonth = 12; }
      const lastDayOfPrevMonth = new Date(tempYear, tempMonth, 0).getDate();
      tempDay = lastDayOfPrevMonth + tempDay;
      if (tempMonth === 2 && isLeapYear(tempYear)) tempDay++;
    }

    const formattedDay = String(tempDay).padStart(2, "0");
    const formattedMonth = String(tempMonth).padStart(2, "0");
    const formattedYear = String(tempYear);
    dates.push(`${formattedYear}-${formattedMonth}-${formattedDay}`);
  }

  return dates.reverse();
}
