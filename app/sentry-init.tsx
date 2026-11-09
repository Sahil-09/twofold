"use client";

import { init } from "@sentry/nextjs";
import sentryClientConfig from "@/sentry.client.config";

init(sentryClientConfig);

export default function SentryInit() {
  return null;
}
