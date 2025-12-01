export async function getEagleviewToken() {
  const clientId = import.meta.env.VITE_EAGLEVIEW_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_EAGLEVIEW_CLIENT_SECRET;
  try {
    const response = await fetch('https://apicenter.eagleview.com/oauth2/v1/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        'grant_type': 'client_credentials'
      })
    });
    const data = await response.json();
    return data.access_token;
  } catch (err) {
    console.log(err)
  }
  return '';
}

export async function getAgoToken() {
  try {
    const response = await fetch('https://www.arcgis.com/sharing/rest/generateToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'f': 'json',
        'username': import.meta.env.VITE_AGO_USERNAME,
        'password': import.meta.env.VITE_AGO_PASSWORD,
        'referer': 'https://www.mydomain.com'
      })
    })
    const data = await response.json();
    return data.token;
  } catch (err) {
    console.log(err);
  }
  return '';
}
