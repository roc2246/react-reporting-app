export async function fetchAwaiting(pageNo) {
  const url = `https://reporting-app-3194629a4aed.herokuapp.com/awaiting-shipment?page=${pageNo}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}

export async function fetchShipped(pageNo) {
  const url = `https://reporting-app-3194629a4aed.herokuapp.com/pull-orders?page=${pageNo}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}
