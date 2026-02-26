import { StreetSmartApi } from "@cyclomedia/streetsmart-api";

export async function getAgoToken() {
  try {
    const response = await fetch('https://3mc2xsgnaj.execute-api.us-east-1.amazonaws.com/getAgoTok')
    const data = await response.json();
    return data.token;
  } catch (err) {
    console.log(err);
  }
  return '';
}

export async function getEagleviewToken() {
  try {
    const response = await fetch('https://3mc2xsgnaj.execute-api.us-east-1.amazonaws.com/getEagleTok');
    const data = await response.json();
    return data.access_token;
  } catch (err) {
    console.log(err)
  }
  return '';
}

export async function getcyclimediaTIDtoken(imageId = 'W0E2O3QH') {
  const accountId = '39419';
  const dateTime = new Date(Date.now()).toISOString().replace(/[-:TZ]|\.\d{3}/g, '');
  const token = `W${accountId}&${dateTime}&UTC&${imageId}`;
  console.log(token)
  const searchParams = new URLSearchParams({
    token: token
  });
  try {
    const response = await fetch(`https://3mc2xsgnaj.execute-api.us-east-1.amazonaws.com/getCycloTid?${searchParams.toString()}`);
    const data = await response.text();
    return data;
  } catch (err) {
    console.log(err)
  }
  return '';
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
    const response = await fetch(`https://3mc2xsgnaj.execute-api.us-east-1.amazonaws.com/getCycloRecs?${searchParams.toString()}`)
    const data = await response.json();
    data.forEach((item, i, arr) => arr[i] = JSON.parse(item));
    return data
  } catch (error) {
    console.error(error)
  }
}
