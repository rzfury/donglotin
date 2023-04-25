import axios from "axios";
import * as cheerio from "cheerio";
import UserAgent from "user-agents";

export function cdnExtractor(url: string) {
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
      .catch(console.error)

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
            .catch(console.error)
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
            .catch(console.error)
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

export function extractFullFromHtml(html: string) {
  const hdSrc = html.match(/(\"hd_src\"\:\")([\s\S]*?)(\",)/g)?.[0].replace('"hd_src":"', '').slice(0, -2).replaceAll('\\u0025', '%').replaceAll('\\/', '/');
  const sdSrc = html.match(/(\"sd_src\"\:\")([\s\S]*?)(\",)/)?.[0].replace('"sd_src":"', '').slice(0, -2).replaceAll('\\/', '/');
  const sdSrcNoRateLimit = html.match(/(\"sd_src_no_ratelimit\"\:\")([\s\S]*?)(\",)/)?.[0].replace('"sd_src_no_ratelimit":"', '').slice(0, -2).replaceAll('\\/', '/');

  return {
    hdSrc,
    sdSrc,
    sdSrcNoRateLimit
  }
}