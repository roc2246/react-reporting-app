import express from "express";
import path from "path";
import { fileURLToPath } from "url";
// import routes from "./routes/index.js"; 
import dotenv from "dotenv";
// import { dbConnect } from "./models/index.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// await dbConnect();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// app.use("/api", routes);

app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});