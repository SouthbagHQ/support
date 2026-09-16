import { PostHog } from "posthog-node";
import { PALANTIR_HOST, PALANTIR_KEY } from "./palantir-config";

let posthogClient: PostHog | null = null;

export function getPostHogClient() {
  if (!posthogClient) {
    posthogClient = new PostHog(PALANTIR_KEY, {
      host: PALANTIR_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
}
