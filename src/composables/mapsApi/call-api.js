import * as mapsApi from './MapsApiProxyStack.json';

export async function getAgoToken() {
  try {
    const token = await (await fetch(mapsApi.getAgoTok)).json() || '';
    return token;
  } catch (err) {
    console.log(err);
  }
  return '';
}

export async function getEagleviewToken() {
  try {
    const token = await (await fetch(mapsApi.getEagleTok)).json() || '';
    return token;
  } catch (err) {
    console.log(err)
  }
  return '';
}

export async function getcyclimediaTIDtoken(imageId) {
  const accountId = import.meta.env.VITE_CYCLOMEDIA_TID_ACCOUNTID;
  const dateTime = new Date(Date.now()).toISOString().replace(/(\d{4}-\d{2}-\d{2})(?:T)(\d{2}:\d{2}:\d{2})(?:\.\d{3})(Z)/, '$1 $2$3');
  const token = `X${accountId}&${imageId}&${dateTime}&Z`;
  const searchParams = new URLSearchParams({
    token: token
  });
  try {
    const tid = await (await fetch(`${mapsApi.getCycloTid}?${searchParams.toString()}`)).text() || '';
    return tid;
  }
  catch (err) {
    console.log(err)
  }
  return '';
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
    const data = await (await fetch(`${mapsApi.getCycloRecs}?${searchParams.toString()}`)).json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}
