import { mapsApiEndpoints } from './MapsApiProxyStack';

export async function getAgoToken() {
  try {
    const token = await (await fetch(mapsApiEndpoints.getAgoTok)).json() || '';
    return token;
  } catch (err) {
    console.log(err);
  }
  return '';
}

export async function getEagleviewToken() {
  try {
    const token = await (await fetch(mapsApiEndpoints.getEagleTok)).json() || '';
    return token;
  } catch (err) {
    console.log(err)
  }
  return '';
}

export async function getcyclimediaTIDtoken(imageId) {
  const searchParams = new URLSearchParams({
    imageId: imageId
  });
  try {
    const tid = await (await fetch(`${mapsApiEndpoints.getCycloTid}?${searchParams.toString()}`)).text() || '';
    return tid;
  }
  catch (err) {
    console.log(err)
  }
  return '';
}

export async function getcyclimediaCreds() {
  const searchParams = new URLSearchParams({
    appId: import.meta.env.VITE_VERSION === "cityatlas" ? import.meta.env.VITE_CITYATLAS_APPID : ''
  });
  try {
    const creds = await (await fetch(`${mapsApiEndpoints.getCycloCreds}?${searchParams.toString()}`)).json() || '';
    return creds;
  }
  catch (err) {
    console.log(err)
  }
  return {};
}

export async function getCyclomediaRecordings(srid, swLng, swLat, neLng, neLat) {
  const version = import.meta.env.VITE_VERSION;
  const searchParams = new URLSearchParams({
    version: version,
    srid: srid,
    swLng: swLng,
    swLat: swLat,
    neLng: neLng,
    neLat: neLat
  });

  try {
    const data = await (await fetch(`${mapsApiEndpoints.getCycloRecs}?${searchParams.toString()}`)).json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}
