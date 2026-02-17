import { describe, it, expect } from 'vitest';

describe('DorStore ArcGIS API Integration', () => {

  it('Condominium FeatureServer returns data for a known mapref', async () => {
    const mapref = '001N020906';
    const whereClause = `mapref='${mapref}' AND status IN (1,3)`;
    const url = `https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Condominium/FeatureServer/0/query?where=${encodeURIComponent(whereClause)}&outFields=*&f=json`;

    const response = await fetch(url);
    expect(response.ok).toBe(true);

    const data = await response.json();

    // Should return features
    expect(data.features).toBeDefined();
    expect(data.features.length).toBeGreaterThan(0);

    // Should have expected fields for condo processing
    const firstRecord = data.features[0].attributes;
    expect(firstRecord).toHaveProperty('recmap');
    expect(firstRecord).toHaveProperty('condoparcel');
    expect(firstRecord).toHaveProperty('condounit');
    expect(firstRecord).toHaveProperty('mapref');
    expect(firstRecord).toHaveProperty('status');
  });

});
