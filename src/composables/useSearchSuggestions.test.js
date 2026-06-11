import { describe, it, expect } from 'vitest';

describe('AIS autocomplete API integration', () => {

  it('returns address suggestions for a typed prefix', async () => {
    const query = '1234 mar';
    const url = `https://haydr3k097.execute-api.us-east-1.amazonaws.com/queryAis/autocomplete?q=${encodeURIComponent(query)}&simple=true&client_id=${import.meta.env.VITE_DEBUG ? import.meta.env.VITE_AIS_CLIENTID_OEMFLOOD : ''}`

    const response = await fetch(url);
    expect(response.ok).toBe(true);

    const data = await response.json();

    expect(data).toHaveProperty('count');
    expect(data).toHaveProperty('results');
    expect(data.results).toHaveProperty('addresses');
    expect(Array.isArray(data.results.addresses)).toBe(true);

    if (data.count > 0) {
      expect(data.results.addresses[0]).toHaveProperty('address');
      expect(typeof data.results.addresses[0].address).toBe('string');
    }
  });

});
