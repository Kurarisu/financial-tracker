import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { routing, type AppLocale } from "./routing";

const messagesByLocale: Record<AppLocale, () => Promise<{ default: Record<string, any> }>> = {
  en: () => import("../messages/en.json"),
  id: () => import("../messages/id.json"),
};

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const rawCookieLocale = cookieStore.get("NEXT_LOCALE")?.value as AppLocale | undefined;

  let locale: AppLocale = routing.defaultLocale;
  if (rawCookieLocale && routing.locales.includes(rawCookieLocale)) {
    locale = rawCookieLocale;
  } else {
    const headerList = await headers();
    const acceptLanguage = headerList.get("accept-language");
    if (acceptLanguage?.includes("id")) {
      locale = "id";
    }
  }

  const module = await messagesByLocale[locale]();

  return {
    locale,
    messages: module.default,
  };
});