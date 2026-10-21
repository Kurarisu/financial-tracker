import { useMemo } from "react";
import NextLink from "next/link";
import {
  redirect as nextRedirect,
  usePathname as nextUsePathname,
  useRouter as nextUseRouter,
} from "next/navigation";

export const Link = NextLink;
export const usePathname = nextUsePathname;
export const redirect = nextRedirect;

export function useRouter() {
  const router = nextUseRouter();

  return useMemo(
    () => ({
      ...router,
      push(
        href: string | { pathname: string; query?: Record<string, string> },
        options?: Parameters<typeof router.push>[1],
      ) {
        if (typeof href === "object") {
          const queryParams = new URLSearchParams(href.query).toString();
          const url = queryParams ? `${href.pathname}?${queryParams}` : href.pathname;
          return router.push(url, options);
        }
        return router.push(href, options);
      },
      replace(
        href: string | { pathname: string; query?: Record<string, string> },
        options?: Parameters<typeof router.replace>[1],
      ) {
        if (typeof href === "object") {
          const queryParams = new URLSearchParams(href.query).toString();
          const url = queryParams ? `${href.pathname}?${queryParams}` : href.pathname;
          return router.replace(url, options);
        }
        return router.replace(href, options);
      },
    }),
    [router],
  );
}