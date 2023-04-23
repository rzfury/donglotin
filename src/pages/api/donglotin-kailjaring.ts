import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

async function getVideoCDNUrl(url: string, postIdOnly?: boolean) {
  return new Promise(async (resolve, reject) => {
    let embedsTemplate: string = '', fails: boolean = false;

    if (url.includes('multi_permalinks') && url.includes('groups')) {
      const permalinksUrl = new URL(url);
      const postId = permalinksUrl.searchParams.get('multi_permalinks');
      const postUrlTemplate = `${permalinksUrl.origin}${permalinksUrl.pathname}posts/${postId}`;
      await axios(postUrlTemplate.trim())
        .then(res => {
          const videoPhpUrl = getMetaTwitterPlayerContent(res.data);
          if (videoPhpUrl.length > 0) {
            embedsTemplate = videoPhpUrl.replaceAll('&amp;', '&').replaceAll('\\', '');
          }
          else {
            reject('Video Unavailable, video link: ' + url);
          }
        })
        .catch(reject);
    }
    else if (postIdOnly) {
      await axios(url)
        .then(res => {
          const videoPhpUrl = getMetaTwitterPlayerContent(res.data);
          if (videoPhpUrl.length > 0) {
            const fixUrl = new URL(videoPhpUrl.replaceAll('&amp;', '&').replaceAll('\\', ''));
            fixUrl.searchParams.set('href', ('https://www.facebook.com' + fixUrl.searchParams.get('href')));
            embedsTemplate = fixUrl.toString();
          }
          else {
            reject('Video Unavailable, video link: ' + url);
          }
        })
        .catch(reject);
    }
    else {
      embedsTemplate = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&width=500&show_text=false&height=889`;
    }

    await fetch(embedsTemplate)
      .then(async res => {
        const html: string = await res.text();
        const matches = html.match(/"([^"]*\.mp4[^"]*)"/);
        if (matches) {
          const cdn = matches[1].replaceAll('&amp;', '&').replaceAll('\\', '');
          resolve(cdn);
        }
        else {
          reject('Video Unavailable, video link: ' + url);
        }
      })
      .catch(reject);
  });
}

function getMetaTwitterPlayerContent(htmlString: string) {
  const match = htmlString.match(/<meta\s+name="twitter:player"\s+content="([^"]+)"\s*\/?>/);
  const twitterPlayerContent = match ? match[1] : '';
  return twitterPlayerContent;
}

function sendDefaultErrorMessage(senderId: string, text?: string) {
  const data = {
    message: {
      text: text ? text : 'Link tidak ditemukan, mungkin karena private video atau link sudah rusak.',
    },
    recipient: {
      id: senderId.toString(),
    }
  };

  axios(`https://graph.facebook.com/v16.0/${process.env.PAGE_ID}/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`, {
    method: 'POST',
    data
  })
    .then(res => {
      
    })
    .catch(err => {
      console.log("ERROR: " + err.response);
    });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  if (req.method === 'GET' || req.method === 'POST') {
    const query = req.query;
    const body = req.body;

    if (('hub.mode' in query) && ('hub.challenge' in query) && ('hub.verify_token' in query)) {
      if (query['hub.verify_token'] === process.env.WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(query['hub.challenge']);
      }
      else {
        res.status(400).end();
      }
    }
    else {
      try {
        if (body.entry[0].changes?.[0].field === 'mention') {
          const postId = body.entry[0].changes[0].value.post_id;
          const commentId = body.entry[0].changes[0].value.comment_id;
          const postUrl = `https://www.facebook.com/${postId}`;
          const cdnUrl = await getVideoCDNUrl(postUrl, true);
          const data = {
            message: cdnUrl,
          };

          axios(`https://graph.facebook.com/v16.0/${process.env.PAGE_ID}_${commentId}/comments?access_token=${process.env.PAGE_ACCESS_TOKEN}`, {
            method: 'POST',
            data
          })
            .then(res => {
              console.log("MENTION HOOK SUCCESSFULL:", "\n", JSON.stringify(res.data))
            })
            .catch(err => {
              console.log("MENTION HOOK ERROR: " + err.response);
            });
        }
        else if (body.entry[0].messaging?.[0]) {
          const attachments = body.entry[0].messaging[0].message.attachments;

          if (Array.isArray(attachments)) {
            const payload = attachments[0].payload;
            const senderId = body.entry[0].messaging[0].sender.id;

            if (typeof (payload.url) === 'string') {
              const cdnUrl = await getVideoCDNUrl(payload.url);
              const data = {
                message: {
                  text: cdnUrl
                },
                recipient: {
                  id: senderId.toString(),
                }
              };

              axios(`https://graph.facebook.com/v16.0/${process.env.PAGE_ID}/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`, {
                method: 'POST',
                data
              })
                .then(res => {
                  console.log("MESSAGE HOOK SUCCESSFULL:", "\n", JSON.stringify(res.data))
                })
                .catch(err => {
                  console.log("MESSAGE HOOK ERROR: " + err.response);
                });
            }
            else {
              sendDefaultErrorMessage(senderId)
            }
          }
          else {
            const message = body.entry[0].messaging[0].message.text;
            console.log(`MESSAGE(from: ${body.entry[0].messaging[0].sender.id}): ${message}`);
          }
        }

        res.status(200).json({ success: true });
      }
      catch (err) {
        console.log("ERROR: " + err);
        res.status(200).json({ success: false });
      }
    }
  }
  else {
    res.status(404).end()
  }
}
