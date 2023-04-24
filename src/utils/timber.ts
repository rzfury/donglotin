import axios from 'axios';

export function log(data: any) {
  return axios.post('https://timber.rzfury.dev/api/post', data, {
    params: {
      'i_need_to_bypass_the_challenge': process.env.TIMBER_CHALLENGE_BYPASS_PASSCODE
    }
  })
}

export default {
  log
}
