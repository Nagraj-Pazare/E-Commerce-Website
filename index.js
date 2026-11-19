import express from "express";
import "dotenv/config";
import http from "http";
import passport from "passport";
import { configureGoogleOAuth } from "./services/oauth/googleServices.js";
import { initSocket } from "./services/socket/chatSocket.js";
import './services/bullmq/workers/emailWorker.js'
import cookieParser from "cookie-parser";
import bodyParser from 'body-parser'
import userRouter from "./routes/user.routes.js";
import productRouter from "./routes/product.routes.js";
import methodOverride from "method-override";
import fileUpload from "express-fileupload";
import session from "express-session";
import { authRefreshToken } from "./controllers/authToken.controller.js";
import hbs from 'hbs'




const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static('public')); 
// app.use(express.static(path.join(__dirname)));
app.use(fileUpload({
  createParentPath: true
}));
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "hbs");
app.get("/refresh", authRefreshToken); 
app.use("/", userRouter);
app.use("/", productRouter);
app.use(passport.initialize());
app.use(passport.session());

app.set("view options", { layout: false });
app.use((req, res, next) => {
  res.status(404).render("error-page", {
    statusCode: 404,
    errorTitle: "Page Not Found",
    errorMessage: "We couldn't find the page you were looking for."
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong",
    error: process.env.NODE_ENV === "production"
      ? undefined
      : err.stack,
  });
});

hbs.registerHelper('json', function (context) {
    return JSON.stringify(context);
});
hbs.registerHelper('toLowerCase', function (str) {
  return str ? str.toLowerCase() : '';
});

hbs.registerHelper('ifCond', function (v1, operator, v2, options) {
  switch (operator) {
    case '==':
      return (v1 == v2) ? options.fn(this) : options.inverse(this);
    case '===':
      return (v1 === v2) ? options.fn(this) : options.inverse(this);
    case '!=':
      return (v1 != v2) ? options.fn(this) : options.inverse(this);
    case '!==':
      return (v1 !== v2) ? options.fn(this) : options.inverse(this);
    case '<':
      return (v1 < v2) ? options.fn(this) : options.inverse(this);
    case '<=':
      return (v1 <= v2) ? options.fn(this) : options.inverse(this);
    case '>':
      return (v1 > v2) ? options.fn(this) : options.inverse(this);
    case '>=':
      return (v1 >= v2) ? options.fn(this) : options.inverse(this);
    case '&&':
      return (v1 && v2) ? options.fn(this) : options.inverse(this);
    case '||':
      return (v1 || v2) ? options.fn(this) : options.inverse(this);
    default:
      return options.inverse(this);
  }
});

configureGoogleOAuth();
connectToDB();
initSocket(server);

server.listen(3000, () => {
  console.log("Server is running on 3000 port");
});
