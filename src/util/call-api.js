import { StreetSmartApi } from "@cyclomedia/streetsmart-api";

export async function getAgoToken() {
  try {
    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    const response = await fetch('https://a2lvwn3tcb.execute-api.us-east-1.amazonaws.com/getAgoTok')
    const data = await response.json();
    return data.token;
  } catch (err) {
    console.log(err);
  }
  return '';
}

export async function getEagleviewToken() {
  try {
    console.log("YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY")
    const response = await fetch('https://a2lvwn3tcb.execute-api.us-east-1.amazonaws.com/getEagleTok');
    const data = await response.json();
    return data.access_token;
  } catch (err) {
    console.log(err)
  }
  return '';
}

export async function cyclomediaInit(element) {
  await StreetSmartApi.init({
    targetElement: element,
    username: import.meta.env.VITE_VERSION == 'cityatlas' ? import.meta.env.VITE_CITYATLAS_CYCLOMEDIA_USERNAME : import.meta.env.VITE_CYCLOMEDIA_USERNAME,
    password: import.meta.env.VITE_VERSION == 'cityatlas' ? import.meta.env.VITE_CITYATLAS_CYCLOMEDIA_PASSWORD : import.meta.env.VITE_CYCLOMEDIA_PASSWORD,
    apiKey: import.meta.env.VITE_CYCLOMEDIA_API_KEY,
    srs: 'EPSG:4326',
    locale: 'en-us',
    addressSettings: {
      locale: 'en-us',
      database: 'CMDatabase'
    }
  })
}

export async function getCyclomediaRecordings(url, srid, swLng, swLat, neLng, neLat) {
  const version = import.meta.env.VITE_VERSION;
  const searchParams = new URLSearchParams({
    version: version,
    url: url,
    srid: srid,
    swLng: swLng,
    swLat: swLat,
    neLng: neLng,
    neLat: neLat
  });

  try {
    console.log("ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ")
    const response = await fetch(`https://a2lvwn3tcb.execute-api.us-east-1.amazonaws.com/getCycloRecs?${searchParams.toString()}`)
    const data = await response.json()
    data.forEach((item, i, arr) => arr[i] = JSON.parse(item))
    return data
  } catch (error) {
    console.error(error)
  }
}
