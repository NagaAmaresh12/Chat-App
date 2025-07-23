// proxy.ts
import { createProxyMiddleware } from "http-proxy-middleware";
import { getServiceTarget } from "../utils/service.discovery.js";

const proxy = (serviceName: string) => {
  const basePath = `/${serviceName.replace("-service", "")}`; // e.g., "/users"
  return createProxyMiddleware({
    target: getServiceTarget(serviceName),
    changeOrigin: true,
    pathRewrite: {
      [`^${basePath}`]: "", // removes "/users", "/chats", etc.
    },
  });
};

export default proxy;
