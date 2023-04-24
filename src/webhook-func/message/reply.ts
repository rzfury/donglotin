import axios from 'axios';
import https from 'node:https';

export default function reply(senderId: string, message: string) {
  return axios(`https://graph.facebook.com/v16.0/${process.env.PAGE_ID}/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`, {
    method: 'POST',
    data: {
      recipient: {
        id: senderId
      },
      message: {
        text: message
      }
    },
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  });
}
