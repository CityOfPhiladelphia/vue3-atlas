import axios from 'axios';

export async function getEagleviewToken() {
  const clientId = import.meta.env.VITE_EAGLEVIEW_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_EAGLEVIEW_CLIENT_SECRET;
  const options = {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
      'content-type': 'application/x-www-form-urlencoded'
    },
    data: 'grant_type=client_credentials',
    url: 'https://apicenter.eagleview.com/oauth2/v1/token',
  };
  try {
    const response = await axios(options);
    if (response.status === 200) {
      return response.data.access_token;
    }
  } catch (err) {
    console.log(err)
  }
  return '';
}

export async function getAgoToken() {
  let data = qs.stringify({
    'f': 'json',
    'username': import.meta.env.VITE_AGO_USERNAME,
    'password': import.meta.env.VITE_AGO_PASSWORD,
    'referer': 'https://www.mydomain.com'
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://www.arcgis.com/sharing/rest/generateToken',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data
  };

  try {
    const response = await axios(config);
    if (response.status === 200) {
      return response.data.token;
    }

  } catch (err) {
    console.log(err);
  }
  return '';
}
