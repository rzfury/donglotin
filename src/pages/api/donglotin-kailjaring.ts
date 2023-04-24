import type { NextApiRequest, NextApiResponse } from 'next'
import https from 'node:https'
import axios from 'axios'
import * as cheerio from 'cheerio'
import UserAgent from 'user-agents'
import timber from '~/utils/timber'
import { extractFullFromHtml } from '~/webhook-func/extractor'

let timberLogData: any = {}

function timberLog(data: any) {
  axios.post('https://timber.rzfury.dev/api/post', data, {
    params: {
      'i_need_to_bypass_the_challenge': process.env.TIMBER_CHALLENGE_BYPASS_PASSCODE
    }
  })
}

async function getVideoCDNUrl(url: string) {
  return new Promise(async (resolve, reject) => {
    let success: boolean = false;

    // directly use plugin/video.php

    await axios.get('https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(url))
      .then(res => {
        const html = res.data;

        if (html.includes('.mp4')) {
          resolve(extractFullFromHtml(html));
          success = true;
        }
      })
      .catch(err => {
        timber.log({
          __source: 'Donglotin',
          message: 'Get Video CDN: Case 1',
          errorData: err,
        })
      })

    if (success)
      return;

    // inspecting element

    const ua = new UserAgent({ deviceCategory: 'mobile', platform: 'iPhone' }).toString();
    await axios.get(url, { headers: { 'User-Agent': ua } })
      .then(async res => {
        const html = res.data;
        const $ = cheerio.load(html);

        // checking meta og:url

        const ogUrl = $('meta[property="og:url"]');
        if (ogUrl.attr('content')) {
          await axios.get('https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(ogUrl.attr('content')!))
            .then(res => {
              const html = res.data;

              if (html.includes('.mp4')) {
                resolve(extractFullFromHtml(html))
                success = true;
              }
            })
            .catch(err => {
              timber.log({
                __source: 'Donglotin',
                message: 'Get Video CDN: Case 2',
                errorData: err,
              })
            })
        }

        if (success)
          return;

        // if link has groups and multi_permalinks
        if (url.includes('groups') && url.includes('multi_permalinks')) {
          const videoId = url.match(/multi_permalinks=\d+/g)![0].replace('multi_permalinks=', '');
          const pageCanonical = $('link[rel="canonical"]').attr('href')!;
          const allegedlyUrl = `${pageCanonical.replace('groups/', '')}posts/${videoId}`;

          await axios.get('https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(allegedlyUrl))
            .then(res => {
              const html = res.data;

              if (html.includes('.mp4')) {
                resolve(extractFullFromHtml(html))
                success = true;
              }
            })
            .catch(err => {
              timber.log({
                __source: 'Donglotin',
                message: 'Get Video CDN: Case 3',
                errorData: err,
              })
            })
        }

        if (success)
          return;

        // checking element with data-store

        const dataStoreEl = $('[data-store*=.mp4]');

        if (dataStoreEl.attr('data-store')) {
          // has data-store element, can directly get cdn
          const dataStore = JSON.parse(dataStoreEl.attr('data-store')!);
          resolve({
            hdSrc: undefined,
            sdSrc: undefined,
            sdSrcNoRateLimit: dataStore.src,
          });
          success = true;
        }

        if (success)
          return;
      })
      .catch(reject)

    if (success)
      return;

    // use m.facebook.com with very specific macintosh user-agent

    await axios.get(url.replace('www.facebook', 'm.facebook'), { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15' } })
      .then(async res => {
        const $ = cheerio.load(res.data);
        const dataStoreEl = $('[data-store*=.mp4]');
        if (dataStoreEl.attr('data-store')) {
          const dataStore = JSON.parse(dataStoreEl.attr('data-store')!);
          resolve({
            hdSrc: undefined,
            sdSrc: undefined,
            sdSrcNoRateLimit: dataStore.src,
          });
          success = true;
        }

        if (success)
          return;
      })
      .catch(reject);

    if (success)
      return;

    reject('Cannot get CDN');
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  console.log('WEBHOOK! 1')

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
          const cdnUrl = await getVideoCDNUrl(postUrl).catch(err => {
            throw err
          });
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
              timber.log({
                __source: 'Donglotin',
                whatsFailing: 'FB Graph API to reply to comments',
                message: 'Failed to post reply on mention logic',
                errorData: err,
                apiPayload: data,
                webhookEntries: body.entry
              })
            });
        }
        else if (body.entry[0].messaging?.[0]) {
          console.log('WEBHOOK! 2')
          if (body.entry[0].messaging[0].sender.id === '12334') {
            timber.log({
              __source: 'Donglotin',
              message: 'Testing value received for messaging webhook',
              webhookEntries: body.entry
            })
          }
          else {
            const attachments = body.entry[0].messaging[0].message.attachments;

            if (Array.isArray(attachments)) {
              const payload = attachments[0].payload;
              const senderId = body.entry[0].messaging[0].sender.id;

              if (typeof (payload.url) === 'string') {
                const cdnUrl: any = await getVideoCDNUrl(payload.url).catch(err => {
                  throw err;
                });

                let message = '';
                if (typeof (cdnUrl.hdSrc) === 'string') {
                  message = `Kualitas: HD dan Standar.\n\nHD: ${cdnUrl.hdSrc}\n\nStandar: ${cdnUrl.sdSrcNoRateLimit}`;
                }
                else {
                  message = `Kualitas: Standar.\n\n${cdnUrl.sdSrcNoRateLimit}`;
                }

                const data = {
                  message: {
                    text: message
                  },
                  recipient: {
                    id: senderId.toString(),
                  }
                };

                await axios(`https://graph.facebook.com/v16.0/${process.env.PAGE_ID}/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`, {
                  method: 'POST',
                  data,
                  httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                  })
                })
                  .then(res => {
                    console.log('SUCCESS SEND TO USER: ' + JSON.stringify(res.data))
                  })
                  .catch(err => {
                    timber.log({
                      __source: 'Donglotin',
                      whatsFailing: 'FB Graph API to reply to message',
                      message: 'Failed to post reply on messaging',
                      errorData: err,
                      apiPayload: data,
                      webhookEntries: body.entry
                    })
                  });
              }
              else {
                timber.log({
                  __source: 'Donglotin',
                  whatsFailing: 'FB Graph API to reply to message',
                  message: 'Message does not have any attachments',
                  webhookEntries: body.entry
                });
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
        timber.log({
          __source: 'Donglotin',
          errorData: err
        })
        res.status(200).json({ success: false });
      }
    }
  }
  else {
    res.status(404).end()
  }
}
