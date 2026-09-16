import { describe, it, expect } from 'vitest';

const AIS_AUTOCOMPLETE_URL =
  'https://api-prod.phila.gov/ais-autocomplete/v1/autocomplete';
const clientId = import.meta.env.VITE_GATEWAY_CLIENT_ID;

describe.skipIf(!clientId)('AIS autocomplete API integration', () => {

  it('returns address suggestions for a typed prefix', async () => {
    const query = '1234 mar';
    const url = `${AIS_AUTOCOMPLETE_URL}?q=${encodeURIComponent(query)}&client_id=${clientId}`;

    const response = await fetch(url);
    expect(response.ok).toBe(true);

    const data = await response.json();

    expect(typeof data.count).toBe('number');

    if (data.count > 0) {
      expect(typeof data.results.addresses[0].address).toBe('string');
    }
  });

});
