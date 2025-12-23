import { StreetSmartApi } from "@cyclomedia/streetsmart-api";

export async function getEagleviewToken() {
  try {
    const response = await fetch('https://apicenter.eagleview.com/oauth2/v1/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${import.meta.env.VITE_EAGLEVIEW_CLIENT_ID}:${import.meta.env.VITE_EAGLEVIEW_CLIENT_SECRET}`),
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
  const requestXml = `<wfs:GetFeature service="WFS" version="1.1.0" resultType="results" outputFormat="text/xml; subtype=gml/3.1.1" xmlns:wfs="http://www.opengis.net/wfs">
											<wfs:Query typeName="atlas:Recording" srsName="EPSG:${srid}" xmlns:atlas="http://www.cyclomedia.com/atlas">
												<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
						    					<ogc:And>
						      					<ogc:BBOX>
											        <gml:Envelope srsName="EPSG:${srid}" xmlns:gml="http://www.opengis.net/gml">
											          <gml:lowerCorner>${swLng} ${swLat}</gml:lowerCorner>
											          <gml:upperCorner>${neLng} ${neLat}</gml:upperCorner>
											        </gml:Envelope>
											      </ogc:BBOX>
											      <ogc:PropertyIsNull>
											        <ogc:PropertyName>expiredAt</ogc:PropertyName>
											      </ogc:PropertyIsNull>
											    </ogc:And>
											  </ogc:Filter>
											 </wfs:Query>
											</wfs:GetFeature>`;
  const request = {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Authorization': 'Basic ' + window.btoa(`${import.meta.env.VITE_VERSION == 'cityatlas' ? import.meta.env.VITE_CITYATLAS_CYCLOMEDIA_USERNAME : import.meta.env.VITE_CYCLOMEDIA_USERNAME}:${import.meta.env.VITE_VERSION == 'cityatlas' ? import.meta.env.VITE_CITYATLAS_CYCLOMEDIA_PASSWORD : import.meta.env.VITE_CYCLOMEDIA_PASSWORD}`)
    },
    body: requestXml
  }

  try {
    const response = await fetch(url, request)
    return await response.text()
  } catch (error) {
    console.error(error)
  }
}
