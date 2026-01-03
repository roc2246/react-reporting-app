export async function fetchAwaiting(pageNo) {
  const response = await fetch(`/api/awaiting-shipment?page=${pageNo}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}

export async function fetchData(url) {
   const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}
