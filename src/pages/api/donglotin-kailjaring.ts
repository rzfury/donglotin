import type { NextApiRequest, NextApiResponse } from 'next'
import https from 'node:https'
import axios from 'axios'

let timberLogData: any = {}

function timberLog(data: any) {
  axios.post('https://timber.rzfury.dev/api/post', data, {
    params: {
      'i_need_to_bypass_the_challenge': process.env.TIMBER_CHALLENGE_BYPASS_PASSCODE
    }
  })
}

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
            timberLogData = {
              ...timberLogData,
              ...{
                __source: 'Donglotin',
                message: 'Failed to get embed for group permalinks',
                reason: 'No matches for "twitter:player"',
                type: 'group-permalinks',
                url,
                postUrlTemplate,
                videoPhpUrl,
              }
            }
            reject(false);
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
            timberLogData = {
              ...timberLogData,
              ...{
                __source: 'Donglotin',
                whatsFailing: 'Twitter Player Embed Extraction',
                message: 'Failed to get embed for post id only',
                reason: 'No matches for "twitter:player"',
                type: 'post-id-only',
                url,
                videoPhpUrl,
              }
            }
            reject(false);
          }
        })
        .catch(reject);
    }
    else {
      embedsTemplate = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&width=500&show_text=false&height=889`;
    }

    await axios(embedsTemplate)
      .then(res => {
        const html: string = res.data;
        const matches = html.match(/"([^"]*\.mp4[^"]*)"/);
        if (matches) {
          const cdn = matches[1].replaceAll('&amp;', '&').replaceAll('\\', '');
          resolve(cdn);
        }
        else {
          timberLogData = {
            ...timberLogData,
            ...{
              __source: 'Donglotin',
              whatsFailing: 'CDN Extraction',
              message: 'Failed to get CDN',
              reason: 'No matches for "twitter:player"',
              embedsTemplate,
              url,
            }
          }
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
            data,
            httpsAgent: new https.Agent({
              rejectUnauthorized: false
            })
          })
            .catch(err => {
              timberLogData = {
                ...timberLogData,
                ...{
                  __source: 'Donglotin',
                  whatsFailing: 'FB Graph API to reply to comments',
                  message: 'Failed to post reply on mention logic',
                  errorData: err,
                  apiPayload: data,
                  webhookEntries: body.entry
                }
              }
            });
        }
        else if (body.entry[0].messaging?.[0]) {
          if (body.entry[0].messaging[0].sender.id === '12334') {
            timberLogData = {
              ...timberLogData,
              ...{
                __source: 'Donglotin',
                message: 'Testing value received for messaging webhook',
                webhookEntries: body.entry
              }
            }
          }
          else {
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
                  data,
                  httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                  })
                })
                  .then(res => {
                    console.log("MESSAGE HOOK SUCCESSFULL:", "\n", JSON.stringify(res.data))
                  })
                  .catch(err => {
                    timberLogData = {
                      ...timberLogData,
                      ...{
                        __source: 'Donglotin',
                        whatsFailing: 'FB Graph API to reply to message',
                        message: 'Failed to post reply on messaging',
                        errorData: err,
                        apiPayload: data,
                        webhookEntries: body.entry
                      }
                    }
                  });
              }
              else {
                timberLogData = {
                  ...timberLogData,
                  ...{
                    __source: 'Donglotin',
                    whatsFailing: 'FB Graph API to reply to message',
                    message: 'Message does not have any attachments',
                    webhookEntries: body.entry
                  }
                }
              }
            }
            else {
              const message = body.entry[0].messaging[0].message.text;
              console.log(`MESSAGE(from: ${body.entry[0].messaging[0].sender.id}): ${message}`);
            }
          }
        }

        res.status(200).json({ success: true });
      }
      catch (err) {
        timberLogData = {
          ...timberLogData,
          ...{
            __source: 'Donglotin',
            errorData: err
          }
        }
        res.status(200).json({ success: false });
      }
    }
  }
  else {
    res.status(404).end()
  }

  if (Object.keys(timberLogData).length > 0) {
    timberLog(timberLogData);
  }
}
