export default function handleVerfication(query: any, onSuccess: (challengeValue: string) => void, onError: () => void) {
  if (('hub.mode' in query) && ('hub.challenge' in query) && ('hub.verify_token' in query)) {
    if (query['hub.verify_token'] === process.env.WEBHOOK_VERIFY_TOKEN) {
      onSuccess(query['hub.challenge']);
    }
    else {
      onError();
    }
  }
}
