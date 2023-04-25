import type { NextApiRequest, NextApiResponse } from "next";
import { cdnExtractor } from "~/webhook-func/extractor";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  if (req.method === 'GET') {
    const query = req.query;

    if ('url' in query) {
      await cdnExtractor(decodeURIComponent(query.url as string))
        .then(cdn => {
          res.status(200).json(cdn);
        })
        .catch(err => {
          console.error(err);
          res.status(500).end();
        })

      return;
    }

    res.status(400).end();
    return;
  }
}
