import mergeDeep from './util/merge-deep.js';

const cityCenterCoords = [-75.163471, 39.953338];

const addressDoubles = [
  '15 E HAMPTON RD',
];

const imageryInfo = {
  sources: {
    imageryParcelOutlines: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/PWDParcel_ImageryOverlay/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    imageryLabels: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_Labels/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    2025: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_2025_3in/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    2024: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_2024_1in/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    2023: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_2023/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    2022: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_2022_2in/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    2020: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_2020_3in/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    2019: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_2019_3in/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    2018: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_2018_3in/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    2017: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_2017_3in/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    2016: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_2016_3in/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    2015: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_2015_3in/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    2012: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_2012_3in/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    2010: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_2010_3in/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    2008: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_2008_3in/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    2004: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_2004_6in/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    1996: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_1996_6in/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    1962: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/HistoricLandUse_1962/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    1942: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/HistoricLandUse_1942/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    1910: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/HistoricBromleyAtlas_1910/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    1895: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/HistoricBromleyAtlas_1895/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    1875: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/HistoricGMHopkinsAtlas_1875/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    1860: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/HistoricHexamerLocherAtlas_1860/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    cyclomediaRecordings: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
    },
    cyclomediaCamera: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [],
        }
      }
    },
    cyclomediaViewcone: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[]]],
        }
      }
    },
  },
}

const pwdDrawnMapStyle = mergeDeep(imageryInfo,{
  version: 8,
  name: 'pwdDrawnMap',
  glyphs: '//fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    pwd: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    pwdLabels: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap_Labels/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    addressMarker: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [],
        }
      }
    },
    dorParcel: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[]]],
        }
      }
    },
  },
  layers: [
    {
      id: 'pwd',
      source: 'pwd',
      type: 'raster',
    },
    {
      id: 'pwdLabels',
      source: 'pwdLabels',
      type: 'raster',
    },
    {
      id: 'cyclomediaRecordings',
      source: 'cyclomediaRecordings',
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#5b94c6',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#a1a1a1',
        'circle-opacity': 0.5,
      }
    },
    {
      id: 'cyclomediaCamera',
      source: 'cyclomediaCamera',
      type: 'symbol',
      layout: {
        'icon-image': 'camera-icon',
        'icon-anchor' : 'center',
        'icon-size': 0.09,
        'icon-rotate': 0,
        'icon-rotation-alignment': 'map',
        "icon-allow-overlap" : true,
        "text-allow-overlap": true,
      },
    },
    {
      'id': 'cyclomediaViewcone',
      'type': 'fill',
      'source': 'cyclomediaViewcone',
      'layout': {},
      'paint': {
        'fill-color': 'rgb(0,102,255)',
        'fill-opacity': 0.2,
      },
    },
    {
      id: 'addressMarker',
      source: 'addressMarker',
      type: 'symbol',
      layout: {
        'icon-image': 'marker-blue',
        'icon-rotate': 180,
        'icon-anchor': 'bottom',
        'icon-size': .05,
        "icon-allow-overlap" : true,
        "text-allow-overlap": true,
      },
    },
  ],
});

const liDrawnMapStyle = mergeDeep(imageryInfo,{
  version: 8,
  name: 'liDrawnMap',
  glyphs: '//fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    pwd: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    pwdLabels: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap_Labels/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    liBuildingFootprints: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
    },
    addressMarker: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [],
        }
      }
    },
    dorParcel: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[]]],
        }
      }
    },
  },
  layers: [
    {
      id: 'pwd',
      source: 'pwd',
      type: 'raster',
    },
    {
      id: 'pwdLabels',
      source: 'pwdLabels',
      type: 'raster',
    },
    {
      id: 'cyclomediaRecordings',
      source: 'cyclomediaRecordings',
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#5b94c6',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#a1a1a1',
        'circle-opacity': 0.5,
      }
    },
    {
      id: 'liBuildingFootprints',
      type: 'fill',
      source: 'liBuildingFootprints',
      layout: {},
      paint: {
        'fill-color': '#C2B7FF',
        'fill-opacity': 0.5,
      },
    },
    {
      id: 'liBuildingFootprintsLine',
      type: 'line',
      source: 'liBuildingFootprints',
      layout: {},
      paint: {
        'line-color': '#C2B7FF',
        'line-width': 2,
      }
    },
    {
      id: 'cyclomediaCamera',
      source: 'cyclomediaCamera',
      type: 'symbol',
      layout: {
        'icon-image': 'camera-icon',
        'icon-anchor' : 'center',
        'icon-size': 0.09,
        'icon-rotate': 0,
        'icon-rotation-alignment': 'map',
        "icon-allow-overlap" : true,
        "text-allow-overlap": true,
      },
    },
    {
      'id': 'cyclomediaViewcone',
      'type': 'fill',
      'source': 'cyclomediaViewcone',
      'layout': {},
      'paint': {
        'fill-color': 'rgb(0,102,255)',
        'fill-opacity': 0.2,
      },
    },
    {
      id: 'addressMarker',
      source: 'addressMarker',
      type: 'symbol',
      layout: {
        'icon-image': 'marker-blue',
        'icon-rotate': 180,
        'icon-anchor': 'bottom',
        'icon-size': .05,
      },
    },
  ],
});

const dorDrawnMapStyle = mergeDeep(imageryInfo,{
  version: 8,
  name: 'dorDrawnMap',
  glyphs: '//fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    dor: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/dor_basemap_no_labels/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    parcelLabels: {
      tiles: [
        'https://citygeo-geoserver.databridge.phila.gov/geoserver/dor_basemap_small_labels/wms?service=WMS\
          &version=1.3.0\
          &request=GetMap\
          &layers=dor_basemap_small_labels\
          &bbox={bbox-epsg-3857}\
          &width=1024\
          &height=1024\
          &srs=EPSG%3A3857\
          &format=image/png8\
          &transparent=true\
          &tiled=true'
      ],
      type: 'raster',
      tileSize: 1024,
      minzoom: 15
    },
    addressMarker: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [],
        }
      }
    },
    dorParcel: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[]]],
        }
      }
    },
  },
  layers: [
    {
      id: 'dor',
      source: 'dor',
      type: 'raster',
    },
    {
      id: 'parcelLabels',
      source: 'parcelLabels',
      type: 'raster',
      paint: {
        'raster-opacity': 1,
      }
    },
    {
      id: 'cyclomediaRecordings',
      source: 'cyclomediaRecordings',
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#5b94c6',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#a1a1a1',
        'circle-opacity': 0.5,
      }
    },
    {
      id: 'cyclomediaCamera',
      source: 'cyclomediaCamera',
      type: 'symbol',
      layout: {
        'icon-image': 'camera-icon',
        'icon-anchor' : 'center',
        'icon-size': 0.09,
        'icon-rotate': 0,
        'icon-rotation-alignment': 'map',
        "icon-allow-overlap" : true,
        "text-allow-overlap": true,
      },
    },
    {
      'id': 'cyclomediaViewcone',
      'type': 'fill',
      'source': 'cyclomediaViewcone',
      'layout': {},
      'paint': {
        'fill-color': 'rgb(0,102,255)',
        'fill-opacity': 0.2,
      },
    },
    {
      id: 'dorParcel',
      type: 'fill',
      source: 'dorParcel',
      layout: {},
      paint: {
        'fill-color': 'blue',
        'fill-opacity': 0.4
      }
    },
    {
      id: 'dorParcelLine',
      type: 'line',
      source: 'dorParcel',
      layout: {},
      paint: {
        'line-color': 'blue',
        'line-width': 2
      }
    },
  ],
});

// zoning district color by long_code, shared by the zoning fill and outline layers
const zoningColorByCode = [
  'match',
  ['get', 'long_code'],
  ['CA-1', 'CA-2'], '#fed2cd',
  ['CMX-1', 'CMX-2', 'CMX-2.5'], '#ff7070',
  'CMX-3', '#eb0000',
  ['CMX-4', 'CMX-5'], '#850000',
  'I-1', '#c27df0',
  'I-2', '#9c27db',
  'I-3', '#43009c',
  'I-P', '#7c7ac4',
  'ICMX', '#c500e6',
  'IRMX', '#ef8ff7',
  ['RM-1', 'RM-2', 'RM-3', 'RM-4'], '#ffa929',
  ['RMX-1', 'RMX-2', 'RMX-3'], '#ff8336',
  ['RSA-1', 'RSA-2', 'RSA-3', 'RSA-4', 'RSA-5', 'RSA-6'], '#ffff0d',
  ['RTA-1', 'RTA-2'], '#d4d40b',
  ['RSD-1', 'RSD-2', 'RSD-3'], '#fff5c4',
  'SP-AIR', '#b1b3b6',
  'SP-ENT', '#815723',
  ['SP-INS', 'SP-CIV'], '#63beff',
  ['SP-PO-A', 'SP-PO-P'], '#118e00',
  'SP-STA', '#89cd66',
  'rgba(0,0,0,0)',
];

const zoningDrawnMapStyle = mergeDeep(imageryInfo,{
  version: 8,
  name: 'zoningDrawnMap',
  glyphs: '//fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    dor: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/dor_basemap_no_labels/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    parcelLabels: {
      tiles: [
        'https://citygeo-geoserver.databridge.phila.gov/geoserver/dor_basemap_small_labels/wms?service=WMS\
          &version=1.3.0\
          &request=GetMap\
          &layers=dor_basemap_small_labels\
          &bbox={bbox-epsg-3857}\
          &width=1024\
          &height=1024\
          &srs=EPSG%3A3857\
          &format=image/png8\
          &transparent=true\
          &tiled=true'
      ],
      type: 'raster',
      tileSize: 1024,
      minzoom: 15
    },
    zoning: {
      tiles: [
        'https://tiles.citygeo.phila.city/atlas_zoning_basedisricts/{z}/{x}/{y}.mvt',
      ],
      type: 'vector',
      // the CityGeo tile server serves zoning at z10-16; overzoom past that
      minzoom: 10,
      maxzoom: 16,
      attribution: 'City of Philadelphia',
    },
    zoningParcels: {
      tiles: [
        'https://tiles.citygeo.phila.city/atlas_zoning_parcels/{z}/{x}/{y}.mvt',
      ],
      type: 'vector',
      // the parcel tileset is only built at z16; nothing shows below it, overzoom above
      minzoom: 16,
      maxzoom: 16,
      attribution: 'City of Philadelphia',
    },
    zoningFloodplain: {
      // the overlay tilesets (floodplain, waterfront setback, hydro, steep slope) are built at z10-16
      tiles: [
        'https://tiles.citygeo.phila.city/atlas_zoning_floodplain/{z}/{x}/{y}.mvt',
      ],
      type: 'vector',
      minzoom: 10,
      maxzoom: 16,
      attribution: 'City of Philadelphia',
    },
    zoningWaterfrontSetback: {
      tiles: [
        'https://tiles.citygeo.phila.city/atlas_zoning_waterfrontsetback/{z}/{x}/{y}.mvt',
      ],
      type: 'vector',
      minzoom: 10,
      maxzoom: 16,
      attribution: 'City of Philadelphia',
    },
    zoningHydro: {
      tiles: [
        'https://tiles.citygeo.phila.city/atlas_zoning_hydroclip2012/{z}/{x}/{y}.mvt',
      ],
      type: 'vector',
      minzoom: 10,
      maxzoom: 16,
      attribution: 'City of Philadelphia',
    },
    zoningSteepSlope: {
      tiles: [
        'https://tiles.citygeo.phila.city/atlas_zoning_steepslopeprotectarea_r/{z}/{x}/{y}.mvt',
      ],
      type: 'vector',
      minzoom: 10,
      maxzoom: 16,
      attribution: 'City of Philadelphia',
    },
    selectedOverlay: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[]]],
        }
      }
    },
    addressMarker: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [],
        }
      }
    },
    dorParcel: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[]]],
        }
      }
    },
  },
  layers: [
    {
      id: 'dor',
      source: 'dor',
      type: 'raster',
    },
    {
      id: 'cyclomediaRecordings',
      source: 'cyclomediaRecordings',
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#5b94c6',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#a1a1a1',
        'circle-opacity': 0.5,
      }
    },
    {
      id: 'zoning-fill',
      source: 'zoning',
      'source-layer': 'basedistricts',
      type: 'fill',
      paint: {
        'fill-color': zoningColorByCode,
        'fill-opacity': 1,
      }
    },
    {
      id: 'zoning-outline',
      source: 'zoning',
      'source-layer': 'basedistricts',
      type: 'line',
      minzoom: 15,
      paint: {
        'line-color': zoningColorByCode,
        'line-width': 3,
        'line-opacity': 1,
      }
    },
    {
      // parcels drawn over the zoning districts as light gray outlines only (no fill)
      id: 'zoning-parcels-outline',
      source: 'zoningParcels',
      'source-layer': 'zoning_parcels',
      type: 'line',
      minzoom: 15,
      paint: {
        'line-color': '#d3d3d3',
        'line-width': 1,
        'line-opacity': 1,
      }
    },
    {
      // thin dark line along the zoning district boundaries, above the parcels
      id: 'zoning-outline-dark',
      source: 'zoning',
      'source-layer': 'basedistricts',
      type: 'line',
      minzoom: 15,
      paint: {
        'line-color': '#232323',
        'line-width': 1.5,
        'line-opacity': 1,
      }
    },
    {
      id: 'zoning-waterfront-setback-fill',
      source: 'zoningWaterfrontSetback',
      'source-layer': 'zoning_waterfrontsetback',
      type: 'fill',
      paint: {
        'fill-color': '#a6d8f5',
        'fill-opacity': 0.6,
      }
    },
    {
      // the fill drops out at z18 and closer; the outline below shows at every zoom
      id: 'zoning-steep-slope-fill',
      source: 'zoningSteepSlope',
      'source-layer': 'zoning_steepslopeprotectarea_r',
      type: 'fill',
      maxzoom: 18,
      paint: {
        'fill-color': '#a0703c',
        'fill-opacity': 0.35,
      }
    },
    {
      // 'hatch' (single diagonal lines) is generated and registered in Map.vue
      id: 'zoning-floodplain-hatch',
      source: 'zoningFloodplain',
      'source-layer': 'zoning_fema_floodplain',
      type: 'fill',
      paint: {
        'fill-pattern': 'hatch',
      }
    },
    {
      id: 'zoning-floodplain-outline',
      source: 'zoningFloodplain',
      'source-layer': 'zoning_fema_floodplain',
      type: 'line',
      paint: {
        'line-color': '#000000',
        'line-width': 1,
      }
    },
    {
      id: 'zoning-hydro-outline',
      source: 'zoningHydro',
      'source-layer': 'zoning_hydroclip2012',
      type: 'line',
      paint: {
        'line-color': '#5b9fd0',
        'line-width': 1.5,
      }
    },
    {
      id: 'zoning-steep-slope-outline',
      source: 'zoningSteepSlope',
      'source-layer': 'zoning_steepslopeprotectarea_r',
      type: 'line',
      paint: {
        'line-color': '#6b4423',
        'line-width': 1.5,
      }
    },
    {
      id: 'zoning-label',
      source: 'zoning',
      'source-layer': 'basedistricts',
      type: 'symbol',
      minzoom: 15,
      layout: {
        'text-field': ['get', 'long_code'],
        // fonts.openmaptiles.org doesn't serve Noto Sans (it returns an HTML page, which breaks
        // the whole tile's layout), so use the closest weight it does serve
        'text-font': ['Open Sans Semibold'],
        'text-size': 17,
        'text-rotate': ['coalesce', ['get', 'label_angle'], 0],
        'text-rotation-alignment': 'map',
        // keep labels at least ~40px apart; a district split across tiles gets one label per tile piece,
        // and this hides the copies that land close together
        'text-padding': 40,
      },
      paint: {
        'text-color': '#323232',
        'text-halo-color': '#fafafa',
        'text-halo-width': 2,
        'text-opacity': 1,
      }
    },
    {
      id: 'selectedOverlay',
      source: 'selectedOverlay',
      type: 'fill',
      layout: {},
      paint: {
        'fill-color': 'rgba(0, 0, 0, 0.3)',
      }
    },
    {
      id: 'selectedOverlayLine',
      source: 'selectedOverlay',
      type: 'line',
      layout: {},
      paint: {
        'line-color': 'rgba(0, 0, 0, 1)',
        'line-width': 4,
      }
    },
    {
      id: 'cyclomediaCamera',
      source: 'cyclomediaCamera',
      type: 'symbol',
      layout: {
        'icon-image': 'camera-icon',
        'icon-anchor' : 'center',
        'icon-size': 0.09,
        'icon-rotate': 0,
        'icon-rotation-alignment': 'map',
        "icon-allow-overlap" : true,
        "text-allow-overlap": true,
      },
    },
    {
      'id': 'cyclomediaViewcone',
      'type': 'fill',
      'source': 'cyclomediaViewcone',
      'layout': {},
      'paint': {
        'fill-color': 'rgb(0,102,255)',
        'fill-opacity': 0.2,
      },
    },
    {
      id: 'dorParcel',
      type: 'fill',
      source: 'dorParcel',
      layout: {},
      paint: {
        'fill-color': 'blue',
        'fill-opacity': 0.4
      }
    },
    {
      id: 'dorParcelLine',
      type: 'line',
      source: 'dorParcel',
      layout: {},
      paint: {
        'line-color': 'blue',
        'line-width': 2
      }
    },
  ],
});

const stormwaterDrawnMapStyle = mergeDeep(imageryInfo,{
  version: 8,
  name: 'stormwaterDrawnMap',
  glyphs: '//fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    pwd: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    pwdLabels: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap_Labels/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    stormwater: {
      tiles: [
        'https://stormwater.phila.gov/arcgis/rest/services/parcel_viewer/pv_data/MapServer/export?dpi=120\
          &transparent=true\
          &format=png32\
          &bbox={bbox-epsg-3857}\
          &bboxSR=3857\
          &imageSR=3857\
          &size=1024,1024\
          &f=image\
        ',
      ],
      type: 'raster',
      tileSize: 1024,
    },
    addressMarker: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [],
        }
      }
    },
    dorParcel: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[]]],
        }
      }
    },
  },
  layers: [
    {
      id: 'pwd',
      source: 'pwd',
      type: 'raster',
    },
    {
      id: 'pwdLabels',
      source: 'pwdLabels',
      type: 'raster',
    },
    {
      id: 'cyclomediaRecordings',
      source: 'cyclomediaRecordings',
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#5b94c6',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#a1a1a1',
        'circle-opacity': 0.5,
      }
    },
    {
      id: 'stormwater',
      source: 'stormwater',
      type: 'raster',
      paint: {
        'raster-opacity': 1,
      }
    },
    {
      id: 'cyclomediaCamera',
      source: 'cyclomediaCamera',
      type: 'symbol',
      layout: {
        'icon-image': 'camera-icon',
        'icon-anchor' : 'center',
        'icon-size': 0.09,
        'icon-rotate': 0,
        'icon-rotation-alignment': 'map',
        "icon-allow-overlap" : true,
        "text-allow-overlap": true,
      },
    },
    {
      'id': 'cyclomediaViewcone',
      'type': 'fill',
      'source': 'cyclomediaViewcone',
      'layout': {},
      'paint': {
        'fill-color': 'rgb(0,102,255)',
        'fill-opacity': 0.2,
      },
    },
    {
      id: 'addressMarker',
      source: 'addressMarker',
      type: 'symbol',
      layout: {
        'icon-image': 'marker-blue',
        'icon-rotate': 180,
        'icon-anchor': 'bottom',
        'icon-size': .05,
      },
    },
  ],
});

const votingDrawnMapStyle = mergeDeep(imageryInfo,{
  version: 8,
  name: 'votingDrawnMap',
  glyphs: '//fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    pwd: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    pwdLabels: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap_Labels/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    votingDivision: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[]]],
        }
      }
    },
    buildingColumnsMarker: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [],
        }
      }
    },
    addressMarker: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [],
        }
      }
    },
    dorParcel: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[]]],
        }
      }
    },
  },
  layers: [
    {
      id: 'pwd',
      source: 'pwd',
      type: 'raster',
    },
    {
      id: 'pwdLabels',
      source: 'pwdLabels',
      type: 'raster',
    },
    {
      id: 'cyclomediaRecordings',
      source: 'cyclomediaRecordings',
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#5b94c6',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#a1a1a1',
        'circle-opacity': 0.5,
      }
    },
    {
      id: 'cyclomediaCamera',
      source: 'cyclomediaCamera',
      type: 'symbol',
      layout: {
        'icon-image': 'camera-icon',
        'icon-anchor' : 'center',
        'icon-size': 0.09,
        'icon-rotate': 0,
        'icon-rotation-alignment': 'map',
        "icon-allow-overlap" : true,
        "text-allow-overlap": true,
      },
    },
    {
      'id': 'cyclomediaViewcone',
      'type': 'fill',
      'source': 'cyclomediaViewcone',
      'layout': {},
      'paint': {
        'fill-color': 'rgb(0,102,255)',
        'fill-opacity': 0.2,
      },
    },
    {
      id: 'votingDivision',
      type: 'fill',
      source: 'votingDivision',
      layout: {},
      paint: {
        'fill-color': '#9e9ac8',
        'fill-opacity': 0.4,
        'fill-outline-color': '#9e9ac8',
      }
    },
    {
      id: 'votingDivisionLine',
      type: 'line',
      source: 'votingDivision',
      layout: {},
      paint: {
        'line-color': '#9e9ac8',
        'line-width': 2
      }
    },
    {
      id: 'buildingColumnsMarker',
      source: 'buildingColumnsMarker',
      type: 'symbol',
      layout: {
        'icon-image': 'building-columns-solid',
        'icon-anchor' : 'bottom',
        'icon-size': .05,
        "icon-allow-overlap" : true,
        "text-allow-overlap": true,
      },
    },
    {
      id: 'addressMarker',
      source: 'addressMarker',
      type: 'symbol',
      layout: {
        'icon-image': 'marker-blue',
        'icon-rotate': 180,
        'icon-anchor': 'bottom',
        'icon-size': .05,
        "icon-allow-overlap" : true,
        "text-allow-overlap": true,
      },
    },
  ],
});

const nearbyActivityDrawnMapStyle = mergeDeep(imageryInfo,{
  version: 8,
  name: 'nearbyActivityDrawnMap',
  glyphs: '//fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    pwd: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    pwdLabels: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap_Labels/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    addressMarker: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [],
        },
      }
    },
    dorParcel: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[]]],
        }
      }
    },
    nearbyActivity: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
    },
  },
  layers: [
    {
      id: 'pwd',
      source: 'pwd',
      type: 'raster',
    },
    {
      id: 'pwdLabels',
      source: 'pwdLabels',
      type: 'raster',
    },
    {
      id: 'cyclomediaRecordings',
      source: 'cyclomediaRecordings',
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#5b94c6',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#a1a1a1',
        'circle-opacity': 0.5,
      }
    },
    {
      id: 'nearbyActivity',
      source: 'nearbyActivity',
      type: 'circle',
      paint: {
        'circle-radius': 7,
        'circle-color': [
          'match',
          ['get', 'type'],
          'nearby311',
          '#FF0000',
          'city311',
          '#FF0000',
          'nearbyCrimeIncidents',
          '#0096FF',
          'nearbyZoningAppeals',
          '#009900',
          'nearbyVacantIndicatorPoints',
          '#9400c6',
          'nearbyConstructionPermits',
          '#FF0000',
          'nearbyDemolitionPermits',
          '#0096FF',
          'nearbyUnsafeBuildings',
          '#009900',
          /* other */ '#000000'
        ],
        'circle-stroke-width': 1,
        'circle-stroke-color': 'white',
      },
    },
    {
      id: 'cyclomediaCamera',
      source: 'cyclomediaCamera',
      type: 'symbol',
      layout: {
        'icon-image': 'camera-icon',
        'icon-anchor' : 'center',
        'icon-size': 0.09,
        'icon-rotate': 0,
        'icon-rotation-alignment': 'map',
        "icon-allow-overlap" : true,
        "text-allow-overlap": true,
      },
    },
    {
      'id': 'cyclomediaViewcone',
      'type': 'fill',
      'source': 'cyclomediaViewcone',
      'layout': {},
      'paint': {
        'fill-color': 'rgb(0,102,255)',
        'fill-opacity': 0.2,
      },
    },
    {
      id: 'addressMarker',
      source: 'addressMarker',
      type: 'symbol',
      layout: {
        'icon-image': 'marker-blue',
        'icon-rotate': 180,
        'icon-anchor': 'bottom',
        'icon-size': .05,
      }
    },
  ],
});

const cityServicesDrawnMapStyle = mergeDeep(imageryInfo,{
  version: 8,
  name: 'cityServicesDrawnMap',
  glyphs: '//fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    pwd: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    pwdLabels: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap_Labels/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    schoolMarkers: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
    },
    policeStationMarker: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [],
        },
      }
    },
    addressMarker: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [],
        },
      }
    },
    dorParcel: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[]]],
        }
      }
    },
    cityServices: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
    },
  },
  layers: [
    {
      id: 'pwd',
      source: 'pwd',
      type: 'raster',
    },
    {
      id: 'pwdLabels',
      source: 'pwdLabels',
      type: 'raster',
    },
    {
      id: 'cyclomediaRecordings',
      source: 'cyclomediaRecordings',
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#5b94c6',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#a1a1a1',
        'circle-opacity': 0.5,
      }
    },
    {
      id: 'cityServices',
      source: 'cityServices',
      type: 'circle',
      paint: {
        'circle-radius': 7,
        'circle-color': [
          'match',
          ['get', 'type'],
          'nearbySchools',
          '#9400c6',
          'nearbyFireStations',
          '#FF0000',
          'nearbyRecreationFacilities',
          '#0096FF',
          /* other */ '#000000'
        ],
        'circle-stroke-width': 1,
        'circle-stroke-color': 'white',
      },
    },
    {
      id: 'cyclomediaCamera',
      source: 'cyclomediaCamera',
      type: 'symbol',
      layout: {
        'icon-image': 'camera-icon',
        'icon-anchor' : 'center',
        'icon-size': 0.09,
        'icon-rotate': 0,
        'icon-rotation-alignment': 'map',
        "icon-allow-overlap" : true,
        "text-allow-overlap": true,
      },
    },
    {
      'id': 'cyclomediaViewcone',
      'type': 'fill',
      'source': 'cyclomediaViewcone',
      'layout': {},
      'paint': {
        'fill-color': 'rgb(0,102,255)',
        'fill-opacity': 0.2,
      },
    },
    {
      id: 'policeStationMarker',
      source: 'policeStationMarker',
      type: 'symbol',
      layout: {
        'icon-image': 'police-station-solid',
        'icon-rotate': 0,
        'icon-anchor': 'center',
        'icon-size': .15,
        "icon-allow-overlap" : true,
        "text-allow-overlap": true,
      }
    },
    {
      id: 'schoolMarkers',
      source: 'schoolMarkers',
      type: 'symbol',
      layout: {
        // 'icon-image': 'school-solid',
        'icon-image': [
          'match',
          ['get', 'grade_level'],
          'PRE-K/KINDERGARTEN',
          'pink-school-solid',
          'ELEMENTARY SCHOOL',
          'red-school-solid',
          'ELEMENTARY/MIDDLE',
          'orange-school-solid',
          'MIDDLE SCHOOL',
          'yellow-school-solid',
          'MIDDLE/HIGH',
          'green-school-solid',
          'HIGH SCHOOL',
          'blue-school-solid',
          'ELEMENTARY/MIDDLE/HIGH',
          'purple-school-solid',
          'red-school-solid',
        ],
        'icon-anchor' : 'center',
        'icon-size': .05,
        "icon-allow-overlap" : true,
        "text-allow-overlap": true,
      },
    },
    {
      id: 'addressMarker',
      source: 'addressMarker',
      type: 'symbol',
      layout: {
        'icon-image': 'marker-blue',
        'icon-rotate': 180,
        'icon-anchor': 'bottom',
        'icon-size': .05,
      }
    },
  ],
});

const $config = {
  topicStyles: {
    property: 'pwdDrawnMapStyle',
    condos: 'pwdDrawnMapStyle',
    deeds: 'dorDrawnMapStyle',
    li: 'liDrawnMapStyle',
    zoning: 'zoningDrawnMapStyle',
    voting: 'votingDrawnMapStyle',
    city311: 'nearbyActivityDrawnMapStyle',
    stormwater: 'stormwaterDrawnMapStyle',
    'nearby-activity': 'nearbyActivityDrawnMapStyle',
    'city-services': 'cityServicesDrawnMapStyle',
    districts: 'pwdDrawnMapStyle',
  },
  parcelLayerForTopic: {
    undefined: 'pwd',
    property: 'pwd',
    condos: 'pwd',
    deeds: 'dor',
    li: 'pwd',
    zoning: 'dor',
    voting: 'pwd',
    city311: 'pwd',
    stormwater: 'pwd',
    'nearby-activity': 'pwd',
    'city-services': 'pwd',
    districts: 'pwd',
  },
  mapLayers: {
    pwd: {
      id: 'pwd',
      source: 'pwd',
      type: 'raster',
    },
    pwdLabels: {
      id: 'pwdLabels',
      source: 'pwdLabels',
      type: 'raster',
    },
    DOR_Basemap: {
      id: 'DOR_Basemap',
      source: 'DOR_Basemap',
      type: 'raster',
    },
    zoning: {
      id: 'zoning-fill',
      source: 'zoning',
      'source-layer': 'basedistricts',
      type: 'fill',
    },
    addressMarker: {
      id: 'addressMarker',
      source: 'addressMarker',
      type: 'circle',
    },
    dorParcel: {
      id: 'dorParcel',
      type: 'fill',
      source: 'dorParcel',
      layout: {},
      paint: {
        'fill-color': 'blue',
        'fill-opacity': 0.4
      }
    },
    dorParcelLine: {
      id: 'dorParcelLine',
      type: 'line',
      source: 'dorParcel',
      layout: {},
      paint: {
        'line-color': 'blue',
        'line-width': 2
      }
    },
    imageryParcelOutlines: {
      id: 'imageryParcelOutlines',
      source: 'imageryParcelOutlines',
      type: 'raster',
      minzoom: 0,
      maxzoom: 22,
    },
    imageryLabels: {
      id: 'imageryLabels',
      source: 'imageryLabels',
      type: 'raster',
    },
    2025: {
      id: '2025',
      source: '2025',
      type: 'raster',
    },
    2024: {
      id: '2024',
      source: '2024',
      type: 'raster',
    },
    2023: {
      id: '2023',
      source: '2023',
      type: 'raster',
    },
    2022: {
      id: '2022',
      source: '2022',
      type: 'raster',
    },
    2020: {
      id: '2020',
      source: '2020',
      type: 'raster',
    },
    2019: {
      id: '2019',
      source: '2019',
      type: 'raster',
    },
    2018: {
      id: '2018',
      source: '2018',
      type: 'raster',
    },
    2017: {
      id: '2017',
      source: '2017',
      type: 'raster',
    },
    2016: {
      id: '2016',
      source: '2016',
      type: 'raster',
    },
    2015: {
      id: '2015',
      source: '2015',
      type: 'raster',
    },
    2012: {
      id: '2012',
      source: '2012',
      type: 'raster',
    },
    2010: {
      id: '2010',
      source: '2010',
      type: 'raster',
    },
    2008: {
      id: '2008',
      source: '2008',
      type: 'raster',
    },
    2004: {
      id: '2004',
      source: '2004',
      type: 'raster',
    },
    1996: {
      id: '1996',
      source: '1996',
      type: 'raster',
    },
    1962: {
      id: '1962',
      source: '1962',
      type: 'raster',
    },
    1942: {
      id: '1942',
      source: '1942',
      type: 'raster',
    },
    1910: {
      id: '1910',
      source: '1910',
      type: 'raster',
    },
    1895: {
      id: '1895',
      source: '1895',
      type: 'raster',
    },
    1875: {
      id: '1875',
      source: '1875',
      type: 'raster',
    },
    1860: {
      id: '1860',
      source: '1860',
      type: 'raster',
    },
  },
}

const ZONING_CODE_MAP = {
  'RSD-1': {
    description: 'Residential Single Family Detached-1',
    color: '#FFF4C4',
  },
  'RSD-2': {
    description: 'Residential Single Family Detached-2',
    color: '#FFF4C4',
  },
  'RSD-3': {
    description: 'Residential Single Family Detached-3',
    color: '#FFF4C4',
  },
  'RSA-1': {
    description: 'Residential Single Family Attached-1',
    color: '#FFFF0F',
  },
  'RSA-2': {
    description: 'Residential Single Family Attached-2',
    color: '#FFFF0F',
  },
  'RSA-3': {
    description: 'Residential Single Family Attached-3',
    color: '#FFFF0F',
  },
  'RSA-4': {
    description: 'Residential Single Family Attached-4',
    color: '#FFFF0F',
  },
  'RSA-5': {
    description: 'Residential Single Family Attached-5',
    color: '#FFFF0F',
  },
  'RSA-6': {
    description: 'Residential Single Family Attached-6',
    color: '#FFFF0F',
  },
  'RTA-1': {
    description: 'Residential Two-Family Attached-1',
    color: '#D4D40D',
  },
  'RM-1': {
    description: 'Residential Multi-Family-1',
    color: '#FFA72B',
  },
  'RM-2': {
    description: 'Residential Multi-Family-2',
    color: '#FFA72B',
  },
  'RM-3': {
    description: 'Residential Multi-Family-3',
    color: '#FFA72B',
  },
  'RM-4': {
    description: 'Residential Multi-Family-4',
    color: '#FFA72B',
  },
  'RMX-1': {
    description: 'Residential Mixed-Use-1',
    color: '#FF8138',
  },
  'RMX-2': {
    description: 'Residential Mixed-Use-2',
    color: '#FF8138',
  },
  'RMX-3': {
    description: 'Residential Mixed-Use-3',
    color: '#FF8138',
  },
  'CA-1': {
    description: 'Auto-Oriented Commercial-1',
    color: '#FCD1CC',
  },
  'CA-2': {
    description: 'Auto-Oriented Commercial-2',
    color: '#FCD1CC',
  },
  'CMX-1': {
    description: 'Neighborhood Commercial Mixed-Use-1',
    color: '#FF7070',
  },
  'CMX-2': {
    description: 'Neighborhood Commercial Mixed-Use-2',
    color: '#FF7070'
  },
  'CMX-2.5': {
    description: 'Neighborhood Commercial Mixed-Use-2.5',
    color: '#FF7070',
  },
  'CMX-3': {
    description: 'Community Commercial Mixed-Use',
    color: '#EB0000',
  },
  'CMX-4': {
    description: 'Center City Commercial Mixed-Use',
    color: '#850000',
  },
  'CMX-5': {
    description: 'Center City Core Commercial Mixed-Use',
    color: '#850000',
  },
  'I-1': {
    description: 'Light Industrial',
    color: '#C37FF0',
  },
  'I-2': {
    description: 'Medium Industrial',
    color: '#9B27D9',
  },
  'I-3': {
    description: 'Heavy Industrial',
    color: '#41009C',
  },
  'I-P': {
    description: 'Port Industrial',
    color: '#7C7AC4',
  },
  'ICMX': {
    description: 'Industrial Commercial Mixed-Use',
    color: '#C300E6',
  },
  'IRMX': {
    description: 'Industrial Residential Mixed-Use',
    color: '#EC8EF5',
  },
  'SP-ENT': {
    description: 'Commercial Entertainment (Casinos)', // should this be "Entertainment"?
    color: '#805624',
  },
  'SP-AIR': {
    description: 'Airport',
    color: '#B1B3B5',
  },
  'SP-INS': {
    description: 'Institutional Development',
    color: '#63BEFF',
  },
  'SP-STA': {
    description: 'Stadium',
    color: '#8ACC66',
  },
  'SP-PO-A': {
    description: 'Recreation',
    color: '#138C00',
  },
  'SP-PO-P': {
    description: 'Recreation',
    color: '#118E00',
  },
  'SP-CIV': {
    description: 'Civic, Educational, and Medical',
    color: '#63BEFF',
  },
};

const dorLegendData = {
  'Easements': {
    'border-color': 'rgb(255, 0, 197)',
    'border-style': 'solid',
    'border-weight': '1px',
    'width': '12px',
    'height': '12px',
    'font-size': '10px',
  },
  'Trans Parcels': {
    'border-color': 'rgb(0, 168, 132)',
    'border-style': 'solid',
    'border-weight': '1px',
    'width': '12px',
    'height': '12px',
    'font-size': '10px',
  },
  'Rights of Way': {
    'border-color': 'rgb(249, 147, 0)',
    'border-style': 'solid',
    'border-weight': '1px',
    'width': '12px',
    'height': '12px',
    'font-size': '10px',
  },
};

const stormwaterLegendData = {
  'Roof': {
    'background-color': '#FEFF7F',
    'font-size': '12px',
  },
  'Other Impervious Surface': {
    'background-color': '#F2DCFF',
    'font-size': '12px',
  },
}

$config['cityCenterCoords'] = cityCenterCoords;
$config['addressDoubles'] = addressDoubles;
$config['pwdDrawnMapStyle'] = pwdDrawnMapStyle;
$config['dorDrawnMapStyle'] = dorDrawnMapStyle;
$config['liDrawnMapStyle'] = liDrawnMapStyle;
$config['zoningDrawnMapStyle'] = zoningDrawnMapStyle;
$config['votingDrawnMapStyle'] = votingDrawnMapStyle;
$config['stormwaterDrawnMapStyle'] = stormwaterDrawnMapStyle;
$config['nearbyActivityDrawnMapStyle'] = nearbyActivityDrawnMapStyle;
$config['cityServicesDrawnMapStyle'] = cityServicesDrawnMapStyle;
$config['ZONING_CODE_MAP'] = ZONING_CODE_MAP;
$config['dorLegendData'] = dorLegendData;
$config['stormwaterLegendData'] = stormwaterLegendData;

export default $config;
