// src/index.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import routes from "./routes/index.js"; 
import * as models from "./models/index.js"; // Make sure this exports a function that connects to your DB

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// ----------------- MIDDLEWARE -----------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------- API ROUTES -----------------
// Prefix all API routes with /api to avoid conflicts with React routes
app.use("/api", routes);

// ----------------- PRODUCTION REACT BUILD -----------------
if (process.env.NODE_ENV === "production") {
  // Serve React build
  const buildPath = path.join(__dirname, "public");
  app.use(express.static(buildPath));

  // All other requests return the React index.html
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

// ----------------- ERROR HANDLING -----------------
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

// ----------------- START SERVER -----------------
async function startServer() {
  try {
    await models.connectToDB(); // ensure DB is connected before starting
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
