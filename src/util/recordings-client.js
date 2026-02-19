import { getCyclomediaRecordings } from '@/util/call-api';

class RecordingsClient {
  constructor(baseUrl, srid = 3857, proxy) {
    this.baseUrl = baseUrl;
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

      if (!data) {
        if (import.meta.env.VITE_DEBUG) console.log('no cyclomedia recordings for bounds');
        return;
      }

      callback(data);
    } catch (error) {
      console.error(error)
    }
  }
}

export default RecordingsClient;
