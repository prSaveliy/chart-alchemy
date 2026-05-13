import { createJwtBackendClient } from "@/lib/proxy";
import { ProxyChartService } from "@/services/proxyChartService";
import { refreshAccessToken } from "@/lib/refreshAccessToken";

const backendClient = createJwtBackendClient(
  () => localStorage.getItem("accessToken"),
  refreshAccessToken,
);

export const proxyChartService = new ProxyChartService(backendClient);