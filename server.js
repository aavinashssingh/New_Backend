require('dotenv').config();
require("app-module-path").addPath(`${__dirname}/`);
const cors = require("cors");
const path = require("path");
const express = require("express");
const https = require("https");
const http = require("http");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const {
  LOCAL_HOST,
  LIVE_HOST,
  HTTPS_PORT,
  HTTP_PORT,
  ENV
} = require("config/index");
const { connections } = require("./config/database");
const { errorHandler } = require("./middlewares");
const { constants } = require("./utils/index");
global.appRoot = path.join(__dirname);

const app = express();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  headers: true,
});

app.use(limiter);

app.use((req, res, next) => {
  const language = req?.headers["accept-language"];
  const lang = constants.ACCEPT_HEADERS_LANGAUAGE.includes(language)
    ? language
    : constants.ACCEPT_HEADERS_LANGAUAGE[0]; // extract lang preference from request headers
  res.set("lang", lang); // set lang header in response
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With", "x-api-key"],
  credentials: true
};

// const allowedOrigins = [
//   "https://nectarplus.health",
//   "https://admin.nectarplus.health",
// ];

// const devOrigins = ["http://localhost:4400", "http://localhost:4200"];

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV === "development" && devOrigins.includes(origin))) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//   allowedHeaders: [
//     "Authorization",
//     "Content-Type",
//     "Accept",
//     "Origin",
//     "X-Requested-With",
//     "x-api-key",
//   ],
//   credentials: true,
// };

app.use(cors(corsOptions));
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, Origin, X-Requested-With, x-api-key");
    res.setHeader("Access-Control-Allow-Credentials", true);
    return res.sendStatus(204);
  }
  next();
});


app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);


// let server = {};

// if (ENV === constants.SERVER.PROD) {
//   const privateKey = fs.readFileSync(
//     "/etc/letsencrypt/live/nectarplus.health-0001/privkey.pem",
//     "utf8"
//   );
//   const certificate = fs.readFileSync(
//     "/etc/letsencrypt/live/nectarplus.health-0001/fullchain.pem",
//     "utf8"
//   );
//   const credentials = { key: privateKey, cert: certificate };

//   server = https.createServer(credentials, app).listen(HTTPS_PORT, () => {
//     console.log(
//       `Server up successfully - host: ${LIVE_HOST} , port: ${HTTPS_PORT}`
//     );
//   });
// } else {
//   server = http.createServer(app.handle.bind(app)).listen(HTTP_PORT, () => {
//     console.log(
//       `Server up successfully - host: ${LOCAL_HOST} , port: ${HTTP_PORT}`
//     );
//   });
// }

const server = require("http").createServer(app);
server.listen(HTTPS_PORT, async () =>
  console.log(`Server start on port ${LOCAL_HOST} ${HTTPS_PORT}`, server.process.ENV)
);

app.use(require("./app"));
// Error Middlewares
app.use(errorHandler.methodNotAllowed);
app.use(errorHandler.genericErrorHandler);

process.on("unhandledRejection", (err) => {
  console.error("possibly unhandled rejection happened");
  console.error(err.message);
});

const closeHandler = () => {
  Object.values(connections).forEach((connection) => connection.close());

  server.close((error) => {
    if (error) console.log(error);
    process.exit(error ? 1 : 0);
  });
};

process.on("SIGTERM", closeHandler);
process.on("SIGINT", closeHandler);
