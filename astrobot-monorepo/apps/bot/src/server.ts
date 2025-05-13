import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { apiRouter } from "./routes/api";
import { authRouter } from "./routes/auth";
import { botRouter } from "./routes/bot";
import { serverRouter } from "./routes/servers";
import { userRouter } from "./routes/users";

// Create Hono app
const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

// API Routes
app.route("/api", apiRouter);
app.route("/api/auth", authRouter);
app.route("/api/bot", botRouter);
app.route("/api/servers", serverRouter);
app.route("/api/users", userRouter);

// Root
app.get("/", (c) => {
  return c.json({
    name: "AstroBot API",
    version: "1.0.0",
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

// Health Check
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Not Found
app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      message: `Endpoint ${c.req.path} does not exist`,
      status: 404,
    },
    404
  );
});

// Error Handler
app.onError((err, c) => {
  console.error(`[ERROR] ${err.message}`);
  return c.json(
    {
      error: "Internal Server Error",
      message: err.message,
      status: 500,
    },
    500
  );
});

export default app;