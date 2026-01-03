export async function fetchAwaiting(pageNo) {
  const response = await fetch(`/api/awaiting-shipment?page=${pageNo}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}

export async function fetchShipped(pageNo) {
  const response = await fetch(`/api/pull-orders?page=${pageNo}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}

export async function fetchDataFromDay() {
  const response = await fetch("/api/data-from-day");
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}
