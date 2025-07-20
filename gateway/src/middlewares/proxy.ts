import { createProxyMiddleware } from "http-proxy-middleware";
import { getServiceTarget } from "../utils/service.discovery.js";

const proxy = (serviceName: string) => {
  return createProxyMiddleware({
    target: getServiceTarget(serviceName),
    changeOrigin: true,
    pathRewrite: { [`^/api/${serviceName.replace("-service", "")}`]: "" },
  });
};

export default proxy;
