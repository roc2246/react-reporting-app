import https from "https";

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

/**
 * Generic GET request to ShipStation API
 */
export async function fetchOrders(url) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: process.env.BASE_URL,
      path: url,
      method: "GET",
      auth: `${process.env.API_KEY}:${process.env.API_SECRET}`,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));

      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error("Invalid JSON response from ShipStation"));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.end();
  });
}
