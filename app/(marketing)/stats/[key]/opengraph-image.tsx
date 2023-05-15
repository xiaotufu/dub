import { ImageResponse } from "next/server";
import { headers } from "next/headers";
import { getLinkViaEdge } from "@/lib/planetscale";
import { getStats } from "@/lib/stats";
import { getDomain, nFormatter, truncate } from "@/lib/utils";

export const runtime = "edge";
export const contentType = "image/png";

const satoshiBLack = fetch(
  new URL("@/styles/Satoshi-Black.ttf", import.meta.url),
).then((res) => res.arrayBuffer());

const satoshiBold = fetch(
  new URL("@/styles/Satoshi-Bold.ttf", import.meta.url),
).then((res) => res.arrayBuffer());

export default async function StatsOG({ params }: { params: { key: string } }) {
  const [satoshiBlackData, satoshiBoldData] = await Promise.all([
    satoshiBLack,
    satoshiBold,
  ]);

  const domain = getDomain(headers());

  const data = await getLinkViaEdge(domain, params.key);
  if (!data?.publicStats) {
    return new Response(`Stats for this link are not public`, {
      status: 403,
    });
  }

  const timeseries = await getStats({
    domain,
    key: params.key,
    endpoint: "timeseries",
    interval: "30d",
  });

  const maxClicks = Math.max(...timeseries.map((t) => t.clicks));
  const totalClicks = timeseries.reduce((acc, t) => acc + t.clicks, 0);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "white",
          backgroundImage: `url(${new URL(
            "./background.png",
            import.meta.url,
          ).toString()})`,
        }}
      >
        <img
          src={new URL("./logo.png", import.meta.url).toString()}
          style={{
            width: "80px",
            height: "80px",
            position: "absolute",
            top: "40px",
            right: "40px",
          }}
        />
        <h1
          style={{
            fontSize: "90px",
            fontFamily: "Satoshi Black",
            background:
              "linear-gradient(95.78deg, #C7BF00 21.66%, #E43838 86.47%)",
            backgroundClip: "text",
            color: "transparent",
            marginTop: "50px",
            lineHeight: "7rem",
          }}
        >
          {domain}/{truncate(params.key, 12)}
        </h1>
        <p
          style={{
            fontSize: "50px",
            fontFamily: "Satoshi Bold",
            color: "black",
            opacity: 0.8,
            marginTop: "0px",
          }}
        >
          {nFormatter(totalClicks)} clicks in the last 30 days
        </p>
        <div
          style={{
            position: "absolute",
            bottom: "0px",
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "center",
            marginTop: "50px",
          }}
        >
          {timeseries.map(({ start, clicks }) => (
            <div
              key={start}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "25px",
                height: `${(clicks / maxClicks) * 360}px`, // normalize clicks count to scale of 360px
                marginRight: "12px",
                backgroundColor: "#2563eb",
              }}
            />
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Satoshi Black",
          data: satoshiBlackData,
        },
        {
          name: "Satoshi Bold",
          data: satoshiBoldData,
        },
      ],
    },
  );
}
