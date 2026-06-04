const mapsApiEndpoints = {
  getAgoTok:
    import.meta.env.VITE_VERSION === "cityatlas"
      ? import.meta.env.VITE_GETAGOTOK_URL
      : "",
  getCycloCreds:
    import.meta.env.VITE_VERSION === "cityatlas"
      ? import.meta.env.VITE_GETCYCLOCREDS_URL
      : "",
  getCycloRecs:
    "https://haydr3k097.execute-api.us-east-1.amazonaws.com/getCycloRecs",
  getCycloTid:
    "https://haydr3k097.execute-api.us-east-1.amazonaws.com/getCycloTid",
  getEagleTok:
    "https://haydr3k097.execute-api.us-east-1.amazonaws.com/getEagleTok",
  queryAisAddress:
    "https://haydr3k097.execute-api.us-east-1.amazonaws.com/queryAisAddress",
};

async function getTokenFromMapsProxy(url, useDevAuth = false) {
  const failure = "";
  try {
    const response = await fetch(
      import.meta.env.VITE_DEBUG && useDevAuth
        ? `${url}?developerid=${btoa(`${import.meta.env.VITE_DEV_NAME}:${import.meta.env.VITE_DEV_KEY}`)}`
        : url,
    );
    if (!response.ok) {
      console.error(`${response.status}: ${response.body}`);
      return failure;
    }
    return (await response.json()) || failure;
  } catch (error) {
    console.log(error);
  }
  return failure;
}

export const getAgoToken = async () =>
  await getTokenFromMapsProxy(mapsApiEndpoints.getAgoTok, true);
export const getEagleviewToken = async () =>
  await getTokenFromMapsProxy(mapsApiEndpoints.getEagleTok);

export async function getCyclomediaTidToken(imageId) {
  const failure = "";
  const searchParams = new URLSearchParams({
    imageId: imageId,
  });
  try {
    const response = await fetch(
      `${mapsApiEndpoints.getCycloTid}?${searchParams.toString()}`,
    );
    if (!response.ok) {
      console.error(`${response.status}: ${response.body}`);
      return failure;
    }
    return (await response.text()) || failure;
  } catch (error) {
    console.error(error);
  }
  return failure;
}

export async function getCyclomediaCreds() {
  const failure = {};
  if (import.meta.env.VITE_VERSION !== "cityatlas") {
    return failure;
  }
  const searchParams = new URLSearchParams({
    appId:
      import.meta.env.VITE_VERSION === "cityatlas"
        ? import.meta.env.VITE_CITYATLAS_APPID
        : "",
  });
  try {
    const response = await fetch(
      `${mapsApiEndpoints.getCycloCreds}?${searchParams.toString()}`,
    );
    if (!response.ok) {
      console.error(`${response.status}: ${response.body}`);
      return failure;
    }
    return (await response.json()) || failure;
  } catch (error) {
    console.log(error);
  }
  return failure;
}

export async function getCyclomediaRecordings(
  srid,
  swLng,
  swLat,
  neLng,
  neLat,
) {
  const failure = [];
  const version = import.meta.env.VITE_VERSION;
  const searchParams = new URLSearchParams({
    version: version,
    srid: srid,
    swLng: swLng,
    swLat: swLat,
    neLng: neLng,
    neLat: neLat,
  });

  try {
    const response = await fetch(
      `${mapsApiEndpoints.getCycloRecs}?${searchParams.toString()}`,
    );
    if (!response.ok) {
      console.error(`${response.status}: ${response.body}`);
      return failure;
    }
    const data = await response.json();
    return Array.isArray(data) ? data : failure;
  } catch (error) {
    console.error(error);
    return failure;
  }
}
