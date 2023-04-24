import type { NextApiRequest, NextApiResponse } from "next";
import handleVerfication from "~/webhook-func/handle-verification";
import { handleMention } from "~/webhook-func/mention";
import { handleMessage } from "~/webhook-func/message";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  if (req.method === 'GET') {
    const query = req.query;
    handleVerfication(
      query,
      (challenge) => {
        res.status(200).send(challenge);
      },
      () => {
        res.status(400).end()
      }
    )
    return;
  }

  if (req.method === 'POST') {
    const body = req.body;

    if (body.entry[0].changes?.[0].field === 'mention') {
      handleMention(body.entry[0]);
      res.status(200).end();
      return;
    }

    if (body.entry[0].messaging?.[0]) {
      await handleMessage(body.entry[0])
        .then(() => {
          res.status(200).end()
        })
        .catch(() => {
          res.status(500).end()
        });
    }
  }
}
