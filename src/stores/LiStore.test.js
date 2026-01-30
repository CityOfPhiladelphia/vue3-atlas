import { describe, it, expect } from 'vitest';

describe('ArcGIS API Integration', () => {

  it('CASE_INVESTIGATIONS returns data for 1234 Market St', async () => {
    const whereClause = "address='1234 MARKET ST'";
    const url = `https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/CASE_INVESTIGATIONS/FeatureServer/0/query?where=${encodeURIComponent(whereClause)}&outFields=*&f=json`;

    const response = await fetch(url);
    expect(response.ok).toBe(true);

    const data = await response.json();

    // Should return features
    expect(data.features).toBeDefined();
    expect(data.features.length).toBeGreaterThan(0);

    // Should have expected fields (lowercase for this service)
    const firstRecord = data.features[0].attributes;
    expect(firstRecord).toHaveProperty('casenumber');
    expect(firstRecord).toHaveProperty('address');
    expect(firstRecord).toHaveProperty('investigationstatus');
  });

});
