import type { NextApiRequest, NextApiResponse } from 'next'
import https from 'node:https'
import axios from 'axios'
import * as cheerio from 'cheerio'
import UserAgent from 'user-agents'
import timber from '~/utils/timber'
import { extractFullFromHtml } from '~/webhook-func/extractor'
import handleVerfication from '~/webhook-func/handle-verification'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  console.log('Function Hit!');

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
    let success: boolean = false;
    const body = req.body;

    if (body.entry[0].changes?.[0].field === 'mention') {
      const postId = body.entry[0].changes[0].value.post_id;
      const commentId = body.entry[0].changes[0].value.comment_id;
      const postUrl = `https://www.facebook.com/${postId}`;
      const cdnUrl = await getVideoCDNUrl(postUrl).catch(err => {
        timber.log({
          __source: 'Donglotin',
          message: 'Failed to get CDN',
          errorData: err.response,
          apiPayload: data,
          webhookEntries: body.entry
        })
      });
      const data = {
        message: cdnUrl,
      };

      await axios(`https://graph.facebook.com/v16.0/${process.env.PAGE_ID}_${commentId}/comments?access_token=${process.env.PAGE_ACCESS_TOKEN}`, {
        method: 'POST',
        data,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      })
      .catch(err => {
        console.error(err.response);
      })

      res.status(200).end();
      return;
    }

    if (body.entry[0].messaging?.[0].sender.id.toString() === '12334') {
      timber.log({
        __source: 'Donglotin',
        message: 'Testing value received for messaging webhook',
        webhookEntries: body.entry
      })
      res.status(200).end();
      return;
    }

    const attachments = body.entry?.[0]?.messaging?.[0]?.message?.attachments;

    if (Array.isArray(attachments)) {
      const payload = attachments[0].payload;
      const senderId = body.entry[0].messaging[0].sender.id;

      if (typeof (payload.url) === 'string') {
        const cdnUrl: any = await getVideoCDNUrl(payload.url).catch(err => {
          timber.log({
            __source: 'Donglotin',
            message: 'Failed to get CDN',
            errorData: err,
            payloadUrl: payload.url,
            webhookEntries: body.entry
          })
        });

        let responseMessage = '';
        if (typeof (cdnUrl.hdSrc) === 'string') {
          responseMessage = `Kualitas: HD dan Standar.\n\nHD: ${cdnUrl.hdSrc}\n\nStandar: ${cdnUrl.sdSrcNoRateLimit}`;
        }
        else {
          responseMessage = `Kualitas: Standar.\n\n${cdnUrl.sdSrcNoRateLimit}`;
        }

        const apiPayload = {
          message: {
            text: responseMessage
          },
          recipient: {
            id: senderId.toString(),
          }
        };

        console.log('fail?')
        await axios.post(`https://graph.facebook.com/v16.0/${process.env.PAGE_ID}/messages?access_token=${process.env.PAGE_MESSENGER_TOKEN}`, apiPayload, {
          httpsAgent: new https.Agent({
            rejectUnauthorized: false
          })
        })
          .then(res => {
            console.log('SUCCESS SEND TO USER')
            success = true;
          })
          .catch(err => {
            timber.log({
              __source: 'Donglotin',
              whatsFailing: 'FB Graph API to reply to message',
              message: 'Failed to post reply on messaging',
              errorData: JSON.stringify(err.response),
              apiPayload: apiPayload,
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

        res.status(200).end()
      }
    }

    if(success) {
      res.status(200).end()
      return;
    }    
    
    const message = body.entry[0].messaging[0].message.text;
    console.log(`MESSAGE(from: ${body.entry[0].messaging[0].sender.id}): ${message}`);
    
    res.status(200).end()
    return;
  }

  res.status(404).end()
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
          errorData: err.response,
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
                errorData: err.response,
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
                errorData: err.response,
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

    reject('Cannot get CDN, URL: ' + url);
  });
}
