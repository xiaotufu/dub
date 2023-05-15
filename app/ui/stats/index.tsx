"use client";
/* 
  This Stats component lives in 3 different places:
  1. Project link page, e.g. app.dub.sh/dub/dub.sh/github
  2. Generic Dub.sh link page, e.g. app.dub.sh/links/steven
  3. Public stats page, e.g. dub.sh/stats/github, stey.me/stats/weathergpt

  We use the `useEndpoint()` hook to get the correct layout
*/

import { createContext, useCallback, useMemo, useRef, useState } from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import Clicks from "./clicks";
import Devices from "./devices";
import Feedback from "./feedback";
import Locations from "./locations";
import Referer from "./referer";
import Toggle from "./toggle";
import useScroll from "#/lib/hooks/use-scroll";
import { X } from "lucide-react";

export const StatsContext = createContext<{
  basePath: string;
  endpoint: string;
  queryString: string;
  interval: string;
  domain: string;
  key: string;
  modal?: boolean;
}>({
  basePath: "",
  endpoint: "",
  queryString: "",
  interval: "",
  domain: "",
  key: "",
  modal: false,
});

export default function Stats({
  staticDomain,
  staticKey,
  modal,
}: {
  staticDomain?: string;
  staticKey?: string;
  modal?: boolean;
}) {
  const params = useParams();
  const searchParams = useSearchParams() || new URLSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  let {
    slug,
    domain: domainSlug,
    key,
  } = params as {
    slug?: string;
    domain?: string;
    key: string;
  };
  if (staticKey) key = staticKey;

  const interval = searchParams.get("interval") || "24h";

  const queryString =
    interval || domainSlug
      ? `?${new URLSearchParams({
          ...(interval && { interval }),
          ...(domainSlug && { domain: domainSlug }),
        }).toString()}`
      : "";

  const { basePath, domain, endpoint } = useMemo(() => {
    // Project link page, e.g. app.dub.sh/dub/dub.sh/github
    if (slug && domainSlug && key) {
      return {
        basePath: `/${slug}/${domainSlug}/${key}`,
        domain: domainSlug,
        endpoint: `/api/projects/${slug}/links/${key}/stats`,
      };

      // Generic Dub.sh link page, e.g. app.dub.sh/links/steven
    } else if (key && pathname?.startsWith("/links")) {
      return {
        basePath: `/links/${key}`,
        domain: "dub.sh",
        endpoint: `/api/links/${key}/stats`,
      };
    }

    // Public stats page, e.g. dub.sh/stats/github, stey.me/stats/weathergpt
    return {
      basePath: `/stats/${key}`,
      domain: staticDomain,
      endpoint: `/api/edge/links/${key}/stats`,
    };
  }, [slug, key, pathname]);

  return (
    <StatsContext.Provider
      value={{
        basePath, // basePath for the page (e.g. /stats/[key], /links/[key], /[slug]/[domain]/[key])
        domain: domain!, // domain for the link (e.g. dub.sh, stey.me, etc.)
        endpoint, // endpoint for the API (e.g. /api/edge/links/[key]/stats)
        queryString, // query string for the API (e.g. ?interval=24h&domain=dub.sh, ?interval=24h, etc.)
        interval, // time interval (e.g. 24h, 7d, 30d, etc.)
        key, // link key (e.g. github, weathergpt, etc.)
        modal, // whether or not this is a modal
      }}
    >
      {modal && (
        <button
          className="group sticky right-4 top-4 z-30 float-right hidden rounded-full p-3 transition-all duration-75 hover:bg-gray-100 focus:outline-none active:scale-75 md:block"
          autoFocus={false}
          onClick={() => router.back()}
        >
          <X className="h-6 w-6" />
        </button>
      )}
      <div className="bg-gray-50 py-10">
        <Toggle />
        <div className="mx-auto grid max-w-4xl gap-5">
          <Clicks />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Locations />
            <Devices />
            <Referer />
            <Feedback />
          </div>
        </div>
      </div>
    </StatsContext.Provider>
  );
}
