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
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/DORBasemap/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    dorLabels: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/DORBasemap_Labels/MapServer/tile/{z}/{y}/{x}',
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
      id: 'dor',
      source: 'dor',
      type: 'raster',
    },
    {
      id: 'dorLabels',
      source: 'dorLabels',
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

const zoningDrawnMapStyle = mergeDeep(imageryInfo,{
  version: 8,
  name: 'zoningDrawnMap',
  glyphs: '//fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    dor: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/DORBasemap/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    dorLabels: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/DORBasemap_Labels/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    zoning: {
      tiles: [
        'https://citygeo-geoserver.databridge.phila.gov/geoserver/wms?service=WMS&version=1.1.0&request=GetMap&layers=atlas_zoning_grouped&bbox={bbox-epsg-3857}&width=1024&height=1024&srs=EPSG%3A3857&styles=&format=image/png&transparent=true'
        // 'https://citygeo-geocoder-pub.databridge.phila.gov/arcgis/rest/services/Atlas/ZoningMap/MapServer/export?dpi=120\
        //   &transparent=true\
        //   &format=png32\
        //   &bbox={bbox-epsg-3857}\
        //   &bboxSR=3857\
        //   &imageSR=3857\
        //   &size=512,512\
        //   &f=image\
        // ',
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
      id: 'dor',
      source: 'dor',
      type: 'raster',
    },
    {
      id: 'dorLabels',
      source: 'dorLabels',
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
      id: 'zoning',
      source: 'zoning',
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

const nearbyDrawnMapStyle = mergeDeep(imageryInfo,{
  version: 8,
  name: 'nearbyDrawnMap',
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
    nearby: {
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
      id: 'nearby',
      source: 'nearby',
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

const $config = {
  topicStyles: {
    property: 'pwdDrawnMapStyle',
    condos: 'pwdDrawnMapStyle',
    deeds: 'dorDrawnMapStyle',
    li: 'liDrawnMapStyle',
    zoning: 'zoningDrawnMapStyle',
    voting: 'votingDrawnMapStyle',
    city311: 'nearbyDrawnMapStyle',
    stormwater: 'stormwaterDrawnMapStyle',
    nearby: 'nearbyDrawnMapStyle',
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
    nearby: 'pwd',
    districts: 'pwd',
  },
  mapLayers: {
    pwdBasemap: {
      id: 'pwdBasemap',
      source: 'pwdBasemap',
      type: 'raster',
    },
    pwdLabels: {
      id: 'pwdLabels',
      source: 'pwdLabels',
      type: 'raster',
    },
    dorBasemap: {
      id: 'dorBasemap',
      source: 'dorBasemap',
      type: 'raster',
    },
    dorLabels: {
      id: 'dorLabels',
      source: 'dorLabels',
      type: 'raster',
    },
    zoning: {
      id: 'zoning',
      source: 'zoning',
      type: 'raster',
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
    description: 'Residential (Center City) Mixed-Use-3',
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
$config['nearbyDrawnMapStyle'] = nearbyDrawnMapStyle;
$config['ZONING_CODE_MAP'] = ZONING_CODE_MAP;
$config['dorLegendData'] = dorLegendData;
$config['stormwaterLegendData'] = stormwaterLegendData;

export default $config;