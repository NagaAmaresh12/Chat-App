import helmet from "helmet";

export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Disable if you're loading scripts/styles from CDN
  crossOriginEmbedderPolicy: false, // Needed if using media/canvas
  crossOriginResourcePolicy: { policy: "cross-origin" },
});
