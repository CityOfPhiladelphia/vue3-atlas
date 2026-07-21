import { describe, it, expect } from 'vitest';

const AIS_AUTOCOMPLETE_URL =
  'https://haydr3k097.execute-api.us-east-1.amazonaws.com/queryAis/autocomplete';
const clientId = import.meta.env.VITE_AIS_CLIENTID_ATLAS;

// a node test run sends no origin, so the proxy can only identify it by client id
describe.skipIf(!clientId)('AIS autocomplete API integration', () => {

  it('returns address suggestions for a typed prefix', async () => {
    const query = '1234 mar';
    const url = `${AIS_AUTOCOMPLETE_URL}?q=${encodeURIComponent(query)}&simple=true&client_id=${clientId}`;

    const response = await fetch(url);
    expect(response.ok).toBe(true);

    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);

    if (data.length > 0) {
      expect(typeof data[0]).toBe('string');
    }
  });

});
