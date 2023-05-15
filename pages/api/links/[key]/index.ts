import { NextApiRequest, NextApiResponse } from "next";
import { deleteLink, editLink } from "@/lib/api/links";
import { Session, withUserAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isBlacklistedDomain, isBlacklistedKey, log } from "@/lib/utils";
import { GOOGLE_FAVICON_URL } from "@/lib/constants";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1500kb",
    },
  },
};

const domain = "dub.sh";

export default withUserAuth(
  async (req: NextApiRequest, res: NextApiResponse, session: Session) => {
    const { key: oldKey } = req.query as { key: string };

    const link = await prisma.link.findUnique({
      where: {
        domain_key: {
          domain,
          key: oldKey,
        },
      },
    });

    const isOwner = link?.userId === session.user.id;

    if (!isOwner) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (req.method === "GET") {
      return res.status(200).json(link);
    } else if (req.method === "PUT") {
      let { key, url } = req.body;
      if (!key || !url) {
        return res
          .status(400)
          .json({ error: "Missing key or url or title or timestamp" });
      }
      const keyBlacklisted = await isBlacklistedKey(key);
      if (keyBlacklisted) {
        return res.status(400).json({ error: "Invalid key" });
      }
      const domainBlacklisted = await isBlacklistedDomain(url);
      if (domainBlacklisted) {
        return res.status(400).json({ error: "Invalid url" });
      }
      const [response, invalidFavicon] = await Promise.allSettled([
        editLink(
          {
            domain,
            ...req.body,
            userId: session.user.id,
          },
          oldKey,
        ),
        fetch(`${GOOGLE_FAVICON_URL}${url}}`).then((res) => !res.ok),
        // @ts-ignore
      ]).then((results) => results.map((result) => result.value));

      if (response === null) {
        return res.status(400).json({ error: "Key already exists" });
      }
      await log(
        `*${session.user.email}* edited a link (*dub.sh/${key}*) to the ${url} ${
          invalidFavicon ? " but it has an invalid favicon :thinking_face:" : ""
        }`,
        "links",
        invalidFavicon ? true : false,
      );
      return res.status(200).json(response);
    } else if (req.method === "DELETE") {
      const response = await deleteLink(domain, oldKey);
      return res.status(200).json(response);
    } else {
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }
  },
);
