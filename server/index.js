const express = require("express");
const admin = require("firebase-admin");

const app = express();
const path = require("path");

const session = require("express-session");
const MongoStore = require("connect-mongo");

const router = require("./routes/index");
const middleware = require("./middleware/index");

// Imports config files
require("dotenv").config({
  path: path.join(__dirname, "../config/.env"),
});

// Initialize Firebase admin
(() => {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://reportingapp---file-uploads.firebaseio.com",
    storageBucket: "reportingapp---file-uploads.appspot.com"
  });
})();

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Configures express session
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }), // Replace with your MongoDB connection string
  })
);

// Apply the requireLogin middleware to protect the restricted page route
app.get("/hours-and-fba.html", middleware.manageLogin, (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.sendFile(__dirname + "/views/hours-and-fba.html");
});

// Set up middleware for static files (CSS, JS, images, etc.)
app.use(express.static("views"));

// Sets up route for home page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Set up route for login page
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/views/login.html");
});



// Sets up routers
app.use("/", router);

// Sets up recovery logic
// require("./recovery/index")();

// Sets up websocket functionality
/* HOLD OFF ON WEBSOCKET FUNCTIONALITY */
// require("./websocket/index")(app);

// Sets up chron jobs
require("./chron/index")();

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
