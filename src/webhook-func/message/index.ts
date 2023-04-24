import timber from "~/utils/timber";

export function handleMessage(entry: any) {
  return new Promise((resolve, reject) => {
    const msg = entry.messaging[0];
    const senderId = msg.sender.id;

    if (senderId === '12334') {
      timber.log({
        __source: 'Donglotin',
        message: 'Testing value received for messaging webhook',
        webhookEntry: entry
      });
      resolve(true);
      return;
    }

    const attachments = msg.message.attachments;
    if (attachments) {      
      try {
        if (typeof(attachments[0]?.payload?.url) === 'string') {

        }
        else {
          throw {
            message: 'Attachment does not have any payloads.',
            additional: {
              payload: attachments[0]?.payload
            }
          };
        }
      }
      catch(err: any) {
        timber.log({
          __source: 'Donglotin',
          webhookEntry: entry,
          ...err
        })
        reject(false);
      }

      return;
    }

    timber.log({
      __source: 'Donglotin',
      message: 'Message does not have any attachments.',
      webhookEntry: entry,
    })
    reject(false);
  })
}
