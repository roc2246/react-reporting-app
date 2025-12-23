async function callRoute(endpoint) {
  const url = `https://reporting-app-3194629a4aed.herokuapp.com/${endpoint}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const { orders } = await response.json();

  return { orders: orders };
}

module.exports = {
  callRoute,
};
