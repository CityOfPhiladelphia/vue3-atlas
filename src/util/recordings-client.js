import { getCyclomediaRecordings } from '@/composables/mapsApi/call-api';

class RecordingsClient {
  constructor(baseUrl, srid = 3857) {
    this.baseUrl = baseUrl;
    this.srid = srid;
    this.requestInProcess = false;
  }

  // this takes map bounds and an EPSG coordinate system id, e.g. 3857
  // and returns an array of cyclomedia recording points
  async getRecordings(bounds, callback) {
    if (this.requestInProcess) { if (import.meta.env.VITE_DEBUG) { console.log('recordings-client.js, request in progress...') } return; }
    if (import.meta.env.VITE_DEBUG) { console.log('recordings-client.js, getRecordings is running, bounds:', bounds) };
    this.requestInProcess = true;
    const swCoord = bounds.getSouthWest();
    const neCoord = bounds.getNorthEast();
    try {
      const data = await getCyclomediaRecordings(this.srid, swCoord.lng, swCoord.lat, neCoord.lng, neCoord.lat)
      if (data) { callback(data) }
      else if (import.meta.env.VITE_DEBUG) { console.log('no cyclomedia recordings for bounds') }
      this.requestInProcess = false;
    } catch (error) {
      this.requestInProcess = false;
      console.error(error)
    }
  }
}

export default RecordingsClient;
