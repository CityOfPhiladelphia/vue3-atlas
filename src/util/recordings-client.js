import { getCyclomediaRecordings } from '@/util/call-api';

class RecordingsClient {
  constructor(baseUrl, username, password, srid = 3857, proxy) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;
    this.srid = srid;
    this.proxy = proxy;
  }

  // this takes map bounds and an EPSG coordinate system id, e.g. 3857
  // and returns an array of cyclomedia recording points
  async getRecordings(bounds, callback) {
    if (import.meta.env.VITE_DEBUG) console.log('recordings-client.js, getRecordings is running, bounds:', bounds);
    const swCoord = bounds.getSouthWest();
    const neCoord = bounds.getNorthEast();
    const url = (this.proxy || '') + this.baseUrl;
    try {
      const data = await getCyclomediaRecordings(url, this.srid, swCoord.lng, swCoord.lat, neCoord.lng, neCoord.lat)
      const responseXml = new window.DOMParser().parseFromString(data, "text/xml")
      const recordingEls = [].slice.call(responseXml.getElementsByTagNameNS('*', 'Recording'));

      // check for > 1
      if (recordingEls.length < 1) {
        if (import.meta.env.VITE_DEBUG) console.log('no cyclomedia recordings for bounds');
        return;
      }

      const recordings = recordingEls.map(recordingEl => {
        const imageId = recordingEl.getElementsByTagNameNS('*', 'imageId')[0].firstChild.data;
        const coords = recordingEl.getElementsByTagNameNS('*', 'pos')[0].firstChild.data;
        const [lng, lat] = coords.split(' ').map(parseFloat);
        return {
          imageId,
          lng,
          lat,
        };
      });

      callback(recordings);
    } catch (error) {
      console.error(error)
    }
  }
}

export default RecordingsClient;
