export function cdnExtractor(url: string) {
  /**
   * Matches:
   * - https://www.facebook.com/anikaitluthra98/posts/pfbid02cAkEKWeu2gvqUARLLEnnPkWpD6x8fqi1UFYwGJVDd9rgA2ftsU6rQCvvDxAmKBipl
   * - https://www.facebook.com/matsumoto.jojo/posts/pfbid023TmPZwGXQmAjUMLkE6s2DJ6KBinbS95QwdSxrNQQ5bQgH7t5AkD6EZqEow9Ld9Bul
   */
  if ((/https:\/\/www\.facebook\.com\/[a-zA-Z0-9\.]+\/posts\/[a-zA-Z0-9]+/).test(url)) {
    return new Promise(async (resolve, reject) => {

    })
  }
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