export const routing = {
  locales: ["en", "id"] as const,
  defaultLocale: "en" as const,
};

export type AppLocale = (typeof routing.locales)[number];