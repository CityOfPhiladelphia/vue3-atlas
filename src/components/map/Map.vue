<script setup>

import $config from '@/config';
if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue $config:', $config);

import { ref, onMounted, watch, watchEffect, computed } from 'vue';

// PACKAGE IMPORTS
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// this was recommended by a comment in https://github.com/mapbox/mapbox-gl-js/issues/9114
// the official mapbox-gl-draw was blocking map clicks
import '@/assets/mapbox-gl-draw.min.js'
import '@/assets/maplibre-gl-draw.css';
import destination from '@turf/destination';
import { point, polygon, multiPolygon, feature, featureCollection } from '@turf/helpers';
import bbox from '@turf/bbox';
import buffer from '@turf/buffer';

// STORES
import { useMapStore } from '@/stores/MapStore.js';
const MapStore = useMapStore();
import { useMainStore } from '@/stores/MainStore.js'
const MainStore = useMainStore();
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
const GeocodeStore = useGeocodeStore();
import { useParcelsStore } from '@/stores/ParcelsStore.js'
const ParcelsStore = useParcelsStore();
import { useLiStore } from '@/stores/LiStore.js'
const LiStore = useLiStore();
import { useVotingStore } from '@/stores/VotingStore.js'
const VotingStore = useVotingStore();
import { useNearbyActivityStore } from '@/stores/NearbyActivityStore';
const NearbyActivityStore = useNearbyActivityStore();
import { useCity311Store } from '@/stores/City311Store';
const City311Store = useCity311Store();

// ROUTER
import { useRouter, useRoute } from 'vue-router';
const route = useRoute();
const router = useRouter();

// COMPONENTS
import AddressSearchControl from '@/components/AddressSearchControl.vue';
import DistanceMeasureControl from '@/components/map/DistanceMeasureControl.vue';
import ImageryToggleControl from '@/components/map/ImageryToggleControl.vue';
import ImageryDropdownControl from '@/components/map/ImageryDropdownControl.vue';
import CyclomediaControl from '@/components/map/CyclomediaControl.vue';
import EagleviewControl from '@/components/map/EagleviewControl.vue';
import OpacitySlider from '@/components/map/OpacitySlider.vue';
import OverlayLegend from '@/components/map/OverlayLegend.vue';
import EagleviewPanel from '@/components/map/EagleviewPanel.vue';
import CyclomediaPanel from '@/components/map/CyclomediaPanel.vue';
import CyclomediaRecordingsClient from '@/util/recordings-client.js';

let map;

// keep image sources as computed props so that the publicPath can be used, for pushing the app to different environments
const markerSrc = computed(() => {
  return MainStore.publicPath + 'images/marker_blue_base_5.png';
})
const buildingColumnsSrc = computed(() => {
  return MainStore.publicPath + 'images/building-columns-solid.png';
})
const cameraSrc = computed(() => {
  return MainStore.publicPath + 'images/camera.png';
})

onMounted(async () => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue onMounted route.params.topic:', route.params.topic, 'route.params.address:', route.params.address);
  
  // create the maplibre map
  let currentTopicMapStyle = route.params.topic ? $config.topicStyles[route.params.topic] : 'pwdDrawnMapStyle';
  let zoom = route.params.address ? 17 : 12;

  map = new maplibregl.Map({
    container: 'map',
    style: $config[currentTopicMapStyle],
    center: $config.cityCenterCoords,
    // center: [-75.163471, 39.953338],
    zoom: zoom,
    minZoom: 6,
    maxZoom: 22,
    attributionControl: false,
  });

  map.on('load', () => {
    let canvas = document.querySelector(".maplibregl-canvas");
    canvas.setAttribute('tabindex', -1);
  })

  // add the address marker and camera icon sources
  const markerImage = await map.loadImage(markerSrc.value)
  if (import.meta.env.VITE_DEBUG == 'true') console.log('markerImage:', markerImage);
  map.addImage('marker-blue', markerImage.data);
  const buildingColumnsImage = await map.loadImage(buildingColumnsSrc.value)
  map.addImage('building-columns-solid', buildingColumnsImage.data);
  const cameraImage = await map.loadImage(cameraSrc.value)
  map.addImage('camera-icon', cameraImage.data);

  // add the unchanged maplibre controls
  map.addControl(new maplibregl.NavigationControl(), 'bottom-left');
  map.addControl(new maplibregl.GeolocateControl(), 'bottom-left');

  // whenever the map moves, check whether the cyclomedia recording circles are on and update them if so
  map.on('moveend', () => {
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('map moveend event, e:', e, 'map.getZoom()', map.getZoom(), 'map.getStyle().layers:', map.getStyle().layers, 'map.getStyle().sources:', map.getStyle().sources);
    if (MapStore.cyclomediaOn) {
      map.getZoom() > 16.5 ? MapStore.cyclomediaRecordingsOn = true : MapStore.cyclomediaRecordingsOn = false;
      if (MapStore.cyclomediaRecordingsOn) {
        updateCyclomediaRecordings();
      } else {
        let geojson = { type: 'FeatureCollection', features: [] };
        map.getSource('cyclomediaRecordings').setData(geojson);
        $config.dorDrawnMapStyle.sources.cyclomediaRecordings.data.features = [];
      }
    }
  });

  map.on('zoomend', () => {
    if (MapStore.cyclomediaOn) {
      updateCyclomediaCameraViewcone(MapStore.cyclomediaCameraHFov, MapStore.cyclomediaCameraYaw);
    }
  });

  // if the L&I topic is selected, and a building footprint is clicked, set the selected building number in the LiStore
  map.on('click', 'liBuildingFootprints', (e) => {
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('liBuildingFootprints click, e:', e);
    e.clickOnLayer = true;
    LiStore.selectedLiBuildingNumber = e.features[0].properties.id;
  });

  map.on('mouseenter', 'liBuildingFootprints', (e) => {
    if (e.features.length > 0) {
      map.getCanvas().style.cursor = 'pointer'
    }
  });

  map.on('mouseleave', 'liBuildingFootprints', () => {
    map.getCanvas().style.cursor = ''
  });

  // if a cyclomedia recording circle is clicked, set its coordinates in the MapStore
  map.on('click', 'cyclomediaRecordings', (e) => {
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('cyclomediaRecordings click, e:', e, 'e.features[0]:', e.features[0]);
    e.clickOnLayer = true;
    MapStore.clickedCyclomediaRecordingCoords = [ e.lngLat.lng, e.lngLat.lat ];
  });

  map.on('mouseenter', 'cyclomediaRecordings', (e) => {
    if (e.features.length > 0) {
      map.getCanvas().style.cursor = 'pointer'
    }
  });

  map.on('mouseleave', 'cyclomediaRecordings', () => {
    map.getCanvas().style.cursor = ''
  });

  // if a nearby circle marker is clicked or hovered on, set its id in the MainStore as the hoveredStateId
  map.on('click', 'nearby', (e) => {
    const properties = e.features[0].properties;
    let idField, infoField, row;
    if (MainStore.currentTopic == 'nearby') {
      idField = NearbyActivityStore.dataFields[properties.type].id_field;
      infoField = NearbyActivityStore.dataFields[properties.type].info_field;
      row = NearbyActivityStore[properties.type].rows.filter(row => row[idField] === properties.id)[0];
    } else if (MainStore.currentTopic == '311') {
      idField = City311Store.dataFields[properties.type].id_field;
      infoField = City311Store.dataFields[properties.type].info_field;
      row = City311Store[properties.type].rows.filter(row => row[idField] === properties.id)[0];
    }
    if (import.meta.env.VITE_DEBUG == 'true') console.log('nearby click, e:', e, 'properties:', properties, 'idField:', idField, 'infoField:', infoField, 'e.features[0]:', e.features[0], 'row:', row);
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('nearby click, e:', e, 'properties:', properties, 'idField:', idField, 'e.features[0]:', e.features[0], 'type:', type, 'row:', row);
    e.clickOnLayer = true;
    MainStore.clickedMarkerId = e.features[0].properties.id;
    MainStore.hoveredStateId = e.features[0].properties.id;
    if (row.properties) {
      row[infoField] = row.properties[infoField];
    }

    const popup = document.getElementsByClassName('maplibregl-popup');
    if (popup.length) {
      popup[0].remove();
    }
    new maplibregl.Popup({ className: 'my-class' })
      .setLngLat(e.lngLat)
      .setHTML(row[infoField])
      .setMaxWidth("300px")
      .addTo(map);
  });

  map.on('mouseenter', 'nearby', (e) => {
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('mouseenter, e:', e);
    if (e.features.length > 0) {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('map.getSource(nearby):', map.getSource('nearby'), 'map.getStyle().sources:', map.getStyle().sources);
      map.getCanvas().style.cursor = 'pointer'
      MainStore.hoveredStateId = e.features[0].properties.id;
    }
  });

  map.on('mouseleave', 'nearby', () => {
    if (hoveredStateId.value) {
      map.getCanvas().style.cursor = ''
      MainStore.hoveredStateId = null;
    }
  });

  // if the map is clicked (not on the layers above), if in draw mode, a polygon is drawn, otherwise, the lngLat is pushed to the app route
  map.on('click', (e) => {
    if (e.clickOnLayer) {
      return;
    }
    // router.push({ name: 'search', query: { lng: e.lngLat.lng, lat: e.lngLat.lat }})
    let drawLayers = map.queryRenderedFeatures(e.point).filter(feature => [ 'mapbox-gl-draw-cold', 'mapbox-gl-draw-hot' ].includes(feature.source));
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue handleMapClick, e:', e, 'drawLayers:', drawLayers, 'drawMode:', drawMode, 'e:', e, 'map.getStyle():', map.getStyle(), 'MapStore.drawStart:', MapStore.drawStart);
    if (!drawLayers.length && draw.getMode() !== 'draw_polygon') {
      MainStore.lastClickCoords = [e.lngLat.lng, e.lngLat.lat];
      router.replace({ name: 'search', query: { lng: e.lngLat.lng, lat: e.lngLat.lat, lang: MainStore.currentLang }})
    }
    if (draw.getMode() === 'draw_polygon') {
      distanceMeasureControlRef.value.getDrawDistances(e);
    }
  });

  // mapbox-gl-draw is initialized
  const draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      polygon: true,
    }
  });

  MapStore.draw = draw;
  map.addControl(draw, 'bottom-right');

  map.on('draw.create', drawCreate);
  map.on('draw.update', drawUpdate);
  map.on('draw.selectionchange', drawSelectionChange);
  map.on('draw.modechange', drawModeChange);

  map.resize();

  // map is added as Mapstore.map
  MapStore.setMap(map);
});

// watch GeocodeStore.aisData for moving map center and setting zoom
watch(
  () => GeocodeStore.aisData,
  async newAddress => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('MapStore aisData watch, newAddress:', newAddress);
    if (newAddress.features && newAddress.features[0].geometry.coordinates.length) {
      const newCoords = newAddress.features[0].geometry.coordinates;
      if (MainStore.lastSearchMethod !== 'mapClick') {
        map.setCenter(newCoords);
        map.setZoom(17);
      }
      MapStore.currentAddressCoords = newCoords;
  
      const popup = document.getElementsByClassName('maplibregl-popup');
      if (popup.length) {
        popup[0].remove();
      }
    }
  }
)

// watch address pwd coordinates for moving address marker
const pwdCoordinates = computed(() => {
  if (GeocodeStore.aisData.features) {
    return GeocodeStore.aisData.features[0].geometry.coordinates;
  } else {
    return [];
  }
});

watch(
  () => pwdCoordinates.value,
  newCoords => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('Map pwdCoordinates watch, newCoords:', newCoords, 'MapStore.addressMarker:', MapStore.addressMarker);
  if (newCoords.length) {
    const address = point(newCoords);
    map.getSource('addressMarker').setData(address);
  }
});

// watch dor parcel coordinates for moving dor parcel
const selectedParcelId = computed(() => { return MainStore.selectedParcelId; });
const dorCoordinates = computed(() => {
  let value;
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('computed dorCoordinates, selectedParcelId.value:', selectedParcelId.value, 'ParcelsStore.dor', ParcelsStore.dor);
  if (selectedParcelId.value && ParcelsStore.dor.features && ParcelsStore.dor.features.filter(parcel => parcel.id === selectedParcelId.value)[0]) {
    const parcel = ParcelsStore.dor.features.filter(parcel => parcel.id === selectedParcelId.value)[0];
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('computed, not watch, selectedParcelId.value:', selectedParcelId.value, 'ParcelsStore.dor.features.filter(parcel => parcel.id === selectedParcelId.value)[0]:', ParcelsStore.dor.features.filter(parcel => parcel.id === selectedParcelId.value)[0]);
    if (parcel.geometry.type === 'Polygon') {
      value = parcel.geometry.coordinates[0];
    } else if (parcel.geometry.type === 'MultiPolygon') {
      value = parcel.geometry.coordinates;
    }
  } else {
    value = [[0,0], [0,1], [1,1], [1,0], [0,0]];
  }
  return value;
});

watch(
  () => dorCoordinates.value,
  newCoords => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('Map dorCoordinates watch, newCoords:', newCoords);
  let newParcel;
  if (newCoords.length > 3) {
    newParcel = polygon([ newCoords ]);
    map.getSource('dorParcel').setData(newParcel);
  } else {
    newParcel = multiPolygon(newCoords);
    map.getSource('dorParcel').setData(newParcel);
  }
});

watch(
  () => MainStore.currentNearbyTimeInterval,
  () => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('watch currentNearbyTimeIntervals is firing');
    const popup = document.getElementsByClassName('maplibregl-popup');
    if (popup.length) {
      popup[0].remove();
    }
  }
)

// watch topic for changing map style
watch(
  () => route.params.topic,
  async newTopic => {
    MainStore.currentTopic = route.params.topic;
    if (import.meta.env.VITE_DEBUG == 'true') console.log('Map route.params.topic watch, newTopic:', newTopic);
    const popup = document.getElementsByClassName('maplibregl-popup');
    if (popup.length) {
      popup[0].remove();
    }
    if (newTopic) {
      map.setStyle($config[$config.topicStyles[newTopic]]);
      if (MapStore.imageryOn) {
        map.addLayer($config.mapLayers[imagerySelected.value], 'cyclomediaRecordings')
        map.addLayer($config.mapLayers.imageryLabels, 'cyclomediaRecordings')
        map.addLayer($config.mapLayers.imageryParcelOutlines, 'cyclomediaRecordings')
      }
      const addressMarker = map.getSource('addressMarker');
      const dorParcel = map.getSource('dorParcel');
      if (addressMarker && pwdCoordinates.value.length) {
        if (import.meta.env.VITE_DEBUG == 'true') console.log('pwdCoordinates.value:', pwdCoordinates.value);
        // if (import.meta.env.VITE_DEBUG == 'true') console.log('1 map.layers:', map.getStyle().layers, map.getStyle().sources);
        addressMarker.setData(point(pwdCoordinates.value));
      }
      if (dorParcel) {
        if ($config.parcelLayerForTopic[newTopic] == 'dor') {
          let newParcel;
          if (dorCoordinates.value.length > 3) {
            newParcel = polygon([ dorCoordinates.value ]);
            map.getSource('dorParcel').setData(newParcel);
          } else {
            newParcel = multiPolygon(dorCoordinates.value);
            map.getSource('dorParcel').setData(newParcel);
          }
        }
        if (import.meta.env.VITE_DEBUG == 'true') console.log('2 map.layers:', map.getStyle().layers, map.getStyle().sources);
      }
      if (newTopic === 'li') {
        if (selectedLiBuildingNumber.value) {
          map.setPaintProperty(
            'liBuildingFootprints',
            'fill-color',
            ['match',
            ['get', 'id'],
            selectedLiBuildingNumber.value,
            '#FFFA80',
            /* other */ '#C2B7FF'
            ],
          )
        }
      }
      MapStore.selectedRegmap = null;
    } else {
      if (!MapStore.imageryOn) {
        map.setStyle($config.pwdDrawnMapStyle);
      }
      const addressMarker = map.getSource('addressMarker');
      const dorParcel = map.getSource('dorParcel');
      if (addressMarker) {
        // if (import.meta.env.VITE_DEBUG == 'true') console.log('1 map.layers:', map.getStyle().layers, map.getStyle().sources);
        if (pwdCoordinates.value.length) {
          addressMarker.setData(point(pwdCoordinates.value));
        }
        if (import.meta.env.VITE_DEBUG == 'true') console.log('dorCoordinates.value:', dorCoordinates.value);
      }
      if (dorParcel) {
        let newParcel;
        if ($config.parcelLayerForTopic[newTopic] == 'dor') {
          if (dorCoordinates.value.length > 3) {
            newParcel = polygon([ dorCoordinates.value ]);
            map.getSource('dorParcel').setData(newParcel);
          } else {
            newParcel = multiPolygon(dorCoordinates.value);
            map.getSource('dorParcel').setData(newParcel);
          }
        }
        if (import.meta.env.VITE_DEBUG == 'true') console.log('2 map.layers:', map.getStyle().layers, map.getStyle().sources);
      }
    }
    if (MapStore.cyclomediaOn) {
      updateCyclomediaCameraAngle();
    }
    if (MapStore.labelLayers.length && MapStore.labelLayers.length > 0) {
      setLabelLayers(MapStore.labelLayers);
    }
  }
)

// allow the imagery to be toggled on and off, and set to different images
const imagerySelected = computed(() => {
  return MapStore.imagerySelected;
})

const toggleImagery = () => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('toggleImagery, map.getStyle:', map.getStyle());
  if (!MapStore.imageryOn) {
    MapStore.imageryOn = true;
    map.addLayer($config.mapLayers[imagerySelected.value], 'cyclomediaRecordings')
    map.addLayer($config.mapLayers.imageryLabels, 'cyclomediaRecordings')
    map.addLayer($config.mapLayers.imageryParcelOutlines, 'cyclomediaRecordings')
  } else {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('map.getStyle().layers:', map.getStyle().layers);
    MapStore.imageryOn = false;
    map.removeLayer(imagerySelected.value);
    map.removeLayer('imageryLabels');
    map.removeLayer('imageryParcelOutlines')
    if (!route.params.topic) {
      map.setStyle($config['pwdDrawnMapStyle']);
      if (pwdCoordinates.value.length) {
        map.getSource('addressMarker').setData(point(pwdCoordinates.value));
      }
    }
  }
}

const setImagery = async (newImagery) => {
  const oldLayer = imagerySelected.value;
  if (oldLayer == newImagery) {
    return;
  }
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('setImagery, newImagery:', newImagery, 'oldLayer:', oldLayer, 'imagerySelected.value:', imagerySelected.value);
  MapStore.imagerySelected = newImagery;
  await map.addLayer($config.mapLayers[imagerySelected.value], 'imageryLabels')
  map.removeLayer(oldLayer);
}

// for Deeds topic, watch selectedRegmap for adding and changing regmap layer
const selectedRegmap = computed(() => { return MapStore.selectedRegmap; });
watch(
  () => selectedRegmap.value,
  (newRegmap, oldRegmap) => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('addRegmapLayer, newRegmap:', newRegmap, 'oldRegmap:', oldRegmap);
    if (newRegmap == null) {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('remove old regmap');
      if (map.getLayer('regmap')) {
        map.removeLayer('regmap');
        map.removeSource('regmap');
      }
      MapStore.selectedRegmap = null;
    } else if (oldRegmap == null) {
      if (map.getSource('regmap')) {
        map.removeSource('regmap');
      }
      if (import.meta.env.VITE_DEBUG == 'true') console.log('add newRegmap:', newRegmap);
      const tiles =  `https://ags-regmaps.phila.gov/arcgis/rest/services/RegMaps/MapServer/export?dpi=96&layerDefs=0:NAME='g${newRegmap.toLowerCase().trim()}.tif'&transparent=true&format=png24&bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=700,700&f=image&layers=show%3A0`;
      $config.dorDrawnMapStyle.sources.regmap = {
        type: 'raster',
        tiles: [tiles],
        tileSize: 256,
      }
      map.addLayer({
        id: 'regmap',
        type: 'raster',
        source: $config.dorDrawnMapStyle.sources.regmap,
        paint: {
          'raster-opacity': MapStore.regmapOpacity,
        },
      }, 'dorParcel');
    } else {
      map.removeLayer('regmap');
      map.removeSource('regmap');
      const tiles =  `https://ags-regmaps.phila.gov/arcgis/rest/services/RegMaps/MapServer/export?dpi=96&layerDefs=0:NAME='g${newRegmap.toLowerCase().trim()}.tif'&transparent=true&format=png24&bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=700,700&f=image&layers=show%3A0`;
      $config.dorDrawnMapStyle.sources.regmap = {
        type: 'raster',
        tiles: [tiles],
        tileSize: 256,
      }
      map.addLayer({
        id: 'regmap',
        type: 'raster',
        source: $config.dorDrawnMapStyle.sources.regmap,
        paint: {
          'raster-opacity': MapStore.regmapOpacity,
        },
      }, 'dorParcel');
    }
  }
);

// Opacity changes
// for Deeds topic, change opacity of regmap layer
const handleRegmapOpacityChange = (opacity) => {
  MapStore.regmapOpacity = opacity/100;
  map.setPaintProperty(
    'regmap',
    'raster-opacity',
    parseFloat(opacity/100),
  );
}

// for Zoning topic, change opacity of zoning layer
const handleZoningOpacityChange = (opacity) => {
  MapStore.zoningOpacity = opacity/100;
  map.setPaintProperty(
    'zoning',
    'raster-opacity',
    opacity/100,
  );
}

// for Cityatlas Stormwater topic, change opacity of stormwater layer
const handleStormwaterOpacityChange = (opacity) => {
  MapStore.stormwaterOpacity = opacity/100;
  map.setPaintProperty(
    'stormwater',
    'raster-opacity',
    opacity/100,
  );
}

// for L&I topic, watch selected building for changing building footprint color
const selectedLiBuildingNumber = computed(() => { return LiStore.selectedLiBuildingNumber; });
watch(
  () => selectedLiBuildingNumber.value,
  newSelectedLiBuildingNumber => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue watch newSelectedLiBuildingNumber:', newSelectedLiBuildingNumber, 'selectedLiBuildingNumber.value:', selectedLiBuildingNumber.value);
    if (newSelectedLiBuildingNumber == null) {
      map.setPaintProperty(
        'liBuildingFootprints',
        'fill-color',
        '#C2B7FF',
      )
      return;
    }
    map.setPaintProperty(
      'liBuildingFootprints',
      'fill-color',
      ['match',
      ['get', 'id'],
      newSelectedLiBuildingNumber,
      '#FFFA80',
      /* other */ '#C2B7FF'
      ],
    )
  }
)

// for Voting topic, watch voting division and polling place for changing map center and zoom
const votingDivision = computed(() => { 
  if (import.meta.env.VITE_VOTING_DATA_SOURCE == 'carto') {
    if (VotingStore.divisions.rows) {
      return JSON.parse(VotingStore.divisions.rows[0].st_asgeojson);
    } else {
      return [[0,0], [0,1], [1,1], [1,0], [0,0]];
    }
  } else if (import.meta.env.VITE_VOTING_DATA_SOURCE == 'arcgis') {
    if (VotingStore.divisions.features) {
      return VotingStore.divisions.features[0].geometry.coordinates[0];
    } else {
      return [[0,0], [0,1], [1,1], [1,0], [0,0]];
    }
  } else {
    return [[0,0], [0,1], [1,1], [1,0], [0,0]];
  }
});
const pollingPlaceCoordinates = computed(() => {
  if (import.meta.env.VITE_VOTING_DATA_SOURCE == 'carto') {
    if (VotingStore.pollingPlaces.rows) {
      return [ VotingStore.pollingPlaces.rows[0].lng, VotingStore.pollingPlaces.rows[0].lat] ;
    } else {
      return [];
    }
  } else if (import.meta.env.VITE_VOTING_DATA_SOURCE == 'arcgis') {
    if (VotingStore.pollingPlaces.features) {
      return VotingStore.pollingPlaces.features[0].geometry.coordinates;
    } else {
      return [];
    }
  }
});
watchEffect(() => {
  if (VotingStore.divisions.rows && VotingStore.pollingPlaces.rows) {
    const newDivision = feature(votingDivision.value);
    if (import.meta.env.VITE_DEBUG == 'true') console.log('watchEffect 1, newDivision:', newDivision, 'votingDivision.value:', votingDivision.value, 'pollingPlaceCoordinates.value:', pollingPlaceCoordinates.value);
    map.getSource('votingDivision').setData(newDivision);
    $config.votingDrawnMapStyle.sources.votingDivision.data = newDivision;
    const newPollingPlace = point(pollingPlaceCoordinates.value);
    map.getSource('buildingColumnsMarker').setData(newPollingPlace);
    $config.votingDrawnMapStyle.sources.buildingColumnsMarker.data = newPollingPlace;
    const theFeatureCollection = featureCollection([newDivision, newPollingPlace]);
    const bounds = bbox(buffer(theFeatureCollection, 400, {units: 'feet'}));
    map.fitBounds(bounds);
  }
});

watchEffect(() => {
  if (VotingStore.divisions.features && VotingStore.pollingPlaces.features) {
    const newDivision = polygon([votingDivision.value]);
    if (import.meta.env.VITE_DEBUG == 'true') console.log('watchEffect 2, newDivision:', newDivision, 'votingDivision.value:', votingDivision.value, 'pollingPlaceCoordinates.value:', pollingPlaceCoordinates.value);
    map.getSource('votingDivision').setData(newDivision);
    $config.votingDrawnMapStyle.sources.votingDivision.data = newDivision;
    const newPollingPlace = point(pollingPlaceCoordinates.value);
    map.getSource('buildingColumnsMarker').setData(newPollingPlace);
    $config.votingDrawnMapStyle.sources.buildingColumnsMarker.data = newPollingPlace;
    const theFeatureCollection = featureCollection([newDivision, newPollingPlace]);
    const bounds = bbox(buffer(theFeatureCollection, 400, {units: 'feet'}));
    map.fitBounds(bounds);
  }
});

// for Nearby topic, watch the clicked row to fly to its coordinates and show a popup
const clickedRow = computed(() => { return MainStore.clickedRow; })
watch(
  () => clickedRow.value,
  newClickedRow => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue clickedRow watch, newClickedRow:', newClickedRow, 'newClickedRow.type:', newClickedRow.type);
    if (newClickedRow) map.flyTo({ center: newClickedRow.lngLat });
    let idField, infoField, row;
    if (MainStore.currentTopic == 'nearby') {
      idField = NearbyActivityStore.dataFields[newClickedRow.type].id_field;
      infoField = NearbyActivityStore.dataFields[newClickedRow.type].info_field;
      row = NearbyActivityStore[newClickedRow.type].rows.filter(row => row[idField] === newClickedRow.id)[0];
    } else if (MainStore.currentTopic == 'city311') {
      idField = City311Store.dataFields.city311.id_field;
      infoField = City311Store.dataFields.city311.info_field;
      row = City311Store[newClickedRow.type].rows.filter(row => row[idField] === newClickedRow.id)[0];
    }
    if (import.meta.env.VITE_DEBUG == 'true') console.log('nearby click, newClickedRow:', newClickedRow, 'idField:', idField, 'row:', row);
    if (row.properties) row[infoField] = row.properties[infoField];
    const popup = document.getElementsByClassName('maplibregl-popup');
    if (popup.length) {
      popup[0].remove();
    }
    new maplibregl.Popup({ className: 'my-class' })
      .setLngLat(newClickedRow.lngLat)
      .setHTML(row[infoField] || row.properties[infoField])
      .setMaxWidth("300px")
      .addTo(map);
  }
);

// for Nearby topic, watch the id of the circle marker that is hovered on to change the color of the circle
const hoveredStateId = computed(() => { return MainStore.hoveredStateId; })
watch(
  () => hoveredStateId.value,
  newHoveredStateId => {
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue hoveredStateId watch, newHoveredStateId:', newHoveredStateId, 'map.getStyle().sources.nearby.data.features:', map.getStyle().sources.nearby.data.features);
    if (newHoveredStateId) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('map.getStyle().sources.nearby.data.features', map.getStyle().sources.nearby.data.features, 'newHoveredStateId:', newHoveredStateId);
      const feature = map.getStyle().sources.nearby.data.features.filter(feature => feature.properties.id === newHoveredStateId)[0];
      const index = map.getStyle().sources.nearby.data.features.indexOf(feature);
      if (import.meta.env.VITE_DEBUG == 'true') console.log('feature:', feature, 'index:', index, 'map.getStyle().sources.nearby.data.features:', map.getStyle().sources.nearby.data.features.filter(feature => feature.properties.id === newHoveredStateId)[0]);
      map.getStyle().sources.nearby.data.features.splice(index, 1);
      map.getStyle().sources.nearby.data.features.push(feature);
      console.log("map.getSource('nearby'):", map.getSource('nearby'), "map.getStyle().sources.nearby.data:", map.getStyle().sources.nearby.data);
      map.getSource('nearby').setData(map.getStyle().sources.nearby.data);
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('map.getStyle().sources:', map.getStyle().sources.filter(source => source.id === 'nearby')[0]);
      map.setPaintProperty(
        'nearby',
        'circle-stroke-color',
        ['match',
        ['get', 'id'],
        newHoveredStateId,
        'black',
        'white',
        ]
      )
      map.setPaintProperty(
        'nearby', 
        'circle-color',
        ['match',
        ['get', 'id'],
        newHoveredStateId,
        "#F3D661",
        ['match',
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
        ]
      ]
      );
    } else {
      map.setPaintProperty(
        'nearby',
        'circle-stroke-color',
        'white',
      )
      map.setPaintProperty(
        'nearby', 
        'circle-color', 
        ['match',
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
        ]
      );
    }
  }
)

// the distance measure control is added in the template with a ref, so that functions within the component can be called from this file
const distanceMeasureControlRef = ref(null)

const drawCreate = (e) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('drawCreate is running, e', e);
  distanceMeasureControlRef.value.getDrawDistances(e);
}
const drawUpdate = (e) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('drawUpdate is running, e:', e);
  distanceMeasureControlRef.value.getDrawDistances(e);
}
const drawSelectionChange = (e) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('drawSelectionChange is running, e:', e);
  distanceMeasureControlRef.value.handleDrawSelectionChange(e);
}
const drawModeChange = (e) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('drawModeChange is running, e', e);
  if (e.mode === 'draw_polygon') {
    map.getCanvas().style.cursor = 'crosshair';
  } else {
    map.getCanvas().style.cursor = ''
  }
  distanceMeasureControlRef.value.handleDrawModeChange(e);
}
const drawDelete = (e) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('drawDelete is running, e:', e);
  // distanceMeasureControlRef.value.handleDrawDelete(e);
  if (map.getSource(e)) {
    map.getSource(e).setData({ type: 'FeatureCollection', features: [] });
  }
}

const drawCancel = (e) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('drawCancel is running e:', e);
  if (map.getSource(e)) {
    map.getSource(e).setData({ type: 'FeatureCollection', features: [] });
  }
  map.getCanvas().style.cursor = ''
}

const labelLayers = computed(() => { return MapStore.labelLayers; });

watch(
  () => labelLayers,
  (newLabelLayers) => {
    setLabelLayers(newLabelLayers.value);
  },
  { deep: true }
)

const setLabelLayers = (newLabelLayers) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue setLabelLayers, newLabelLayers:', newLabelLayers, 'map.getStyle().layers:', map.getStyle().layers);
    if (newLabelLayers.length) {
      newLabelLayers.forEach(layer => {
        if (!map.getSource(layer.id)) {
          // if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue setLabelLayers, NOT THERE, layer:', layer, 'layer.id:', layer.id, 'JSON.parse(JSON.stringify(layer.source)):', JSON.parse(JSON.stringify(layer.source)));
          map.addSource(layer.id, JSON.parse(JSON.stringify(layer.source)));
          map.addLayer(layer.layer, 'cyclomediaRecordings');
        } else {
          // if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue setLabelLayers, YES THERE, layer:', layer, 'layer.id:', layer.id, 'JSON.parse(JSON.stringify(layer.source)):', JSON.parse(JSON.stringify(layer.source)));
          map.getSource(layer.id).setData(layer.source.data);
        }
      })
    }
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue setLabelLayers, map.getStyle:', map.getStyle(), 'map.getStyle().layers:', map.getStyle().layers, 'map.getStyle().sources:', map.getStyle().sources);
}

const removeAllCyclomediaMapLayers = () => {
  let recordingsGeojson = {
    type: 'FeatureCollection',
    features: []
  }
  map.getSource('cyclomediaRecordings').setData(recordingsGeojson);
  $config.dorDrawnMapStyle.sources.cyclomediaRecordings.data.features = [];

  let cameraGeojson = point([0,0]);
  map.getSource('cyclomediaCamera').setData(cameraGeojson);
  $config.dorDrawnMapStyle.sources.cyclomediaCamera.data = cameraGeojson;
  let viewConeGeojson = polygon([[[0,0], [0,0], [0,0], [0,0]]]);
  map.getSource('cyclomediaViewcone').setData(viewConeGeojson);
  $config.dorDrawnMapStyle.sources.cyclomediaViewcone.data = viewConeGeojson;
  MapStore.setCyclomediaCameraLngLat(MapStore.cyclomediaCameraLngLat, null);
}

// toggle cyclomedia on and off
const toggleCyclomedia = async() => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('toggleCyclomedia, map.getStyle().sources:', map.getStyle().sources, 'map.getStyle().layers:', map.getStyle().layers);
  MapStore.cyclomediaOn = !MapStore.cyclomediaOn;
  if (MapStore.cyclomediaOn) {
    MapStore.eagleviewOn = false;
    const zoom = map.getZoom();
    if (zoom > 16.5) {
      await updateCyclomediaRecordings();
      if (MapStore.cyclomediaCameraLngLat) {
        if (import.meta.env.VITE_DEBUG == 'true') console.log('in toggleCyclomedia, calling updateCyclomediaCameraLngLat, MapStore.cyclomediaCameraLngLat:', MapStore.cyclomediaCameraLngLat);
        updateCyclomediaCameraLngLat(MapStore.cyclomediaCameraLngLat);
      }
      if (MapStore.cyclomediaCameraHFov && MapStore.cyclomediaCameraYaw) {
        if (import.meta.env.VITE_DEBUG == 'true') console.log('calling updateCyclomediaCameraViewcone');
        updateCyclomediaCameraViewcone(MapStore.cyclomediaCameraHFov, MapStore.cyclomediaCameraYaw);
      }
    }
  } else {
    removeAllCyclomediaMapLayers();
  }
}

// an object class called CyclomediaRecordingsClient is used for adding the cyclomedia recordings circles to the map 
let cyclomediaRecordingsClient = new CyclomediaRecordingsClient(
  'https://atlasapi.cyclomedia.com/api/recording/wfs',
  import.meta.env.VITE_CYCLOMEDIA_USERNAME,
  import.meta.env.VITE_CYCLOMEDIA_PASSWORD,
  4326,
);

const updateCyclomediaRecordings = async () => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('updateCyclomediaRecordings is running');
  const bounds = map.getBounds();
  cyclomediaRecordingsClient.getRecordings(
    bounds,
    recordings => {
      let geojson = {
        type: 'FeatureCollection',
        features: []
      }
      let features = [];
      for (let item of recordings) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [item.lng, item.lat]
          },
          properties: {
            id: item.imageId,
            type: 'cyclomediaRecording',
          }
        })
      }
      geojson.features = features;
      // if (import.meta.env.VITE_DEBUG == 'true') console.log("map.getSource('cyclomediaRecordings'):", 'map.getStyle().layers:', map.getStyle().layers);
      map.getSource('cyclomediaRecordings').setData(geojson);
      // I don't know why this works - maybe because the mergeDeep is still running
      $config.dorDrawnMapStyle.sources.cyclomediaRecordings.data.features = features;
    },
  );
}

// everything for adding, moving, and orienting the cyclomedia camera icon and viewcone
const updateCyclomediaCameraLngLat = (lngLat) => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('updateCyclomediaCameraLngLat is running, lngLat:', lngLat);
  if (!MapStore.cyclomediaOn) {
    return;
  } else {
    const theData = point(lngLat);
    map.getSource('cyclomediaCamera').setData(theData);
    $config.dorDrawnMapStyle.sources.cyclomediaCamera.data = theData;
  }
}

const updateCyclomediaCameraAngle = (newOrientation) => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('updateCyclomediaCameraAngle is running, newOrientation:', newOrientation);
  if (!newOrientation) {
    newOrientation = MapStore.cyclomediaCameraYaw;
  }
  map.setLayoutProperty('cyclomediaCamera', 'icon-rotate', newOrientation);
}

const updateCyclomediaCameraViewcone = (cycloHFov, cycloYaw) => {
  const halfAngle = cycloHFov / 2.0;
  let angle1 = cycloYaw - halfAngle;
  let angle2 = cycloYaw + halfAngle;
  if (import.meta.env.VITE_DEBUG == 'true') console.log('updateCyclomediaCameraViewcone, cycloHFov:', cycloHFov, 'halfAngle:', halfAngle, 'angle1:', angle1, 'cycloYaw:', cycloYaw, 'angle2:', angle2);
  const watchedZoom = map.getZoom();
  let distance;
  if (watchedZoom < 9) {
    distance = 2000 * (21 - watchedZoom);
  } else if (watchedZoom < 10) {
    distance = 1000 * (21 - watchedZoom);
  } else if (watchedZoom < 11) {
    distance = 670 * (21 - watchedZoom);
  } else if (watchedZoom < 12) {
    distance = 420 * (21 - watchedZoom);
  } else if (watchedZoom < 13) {
    distance = 270 * (21 - watchedZoom);
  } else if (watchedZoom < 14) {
    distance = 150 * (21 - watchedZoom);
  } else if (watchedZoom < 15) {
    distance = 100 * (21 - watchedZoom);
  } else if (watchedZoom < 16) {
    distance = 55 * (21 - watchedZoom);
  } else if (watchedZoom < 17) {
    distance = 30 * (21 - watchedZoom);
  } else if (watchedZoom < 18) {
    distance = 25 * (21 - watchedZoom);
  } else if (watchedZoom < 20.4) {
    distance = 15 * (21 - watchedZoom);
  } else {
    distance = 10;
  }

  const cyclomediaCameraLngLat = MapStore.cyclomediaCameraLngLat;
  let options = { units: 'feet' };
  if (!cyclomediaCameraLngLat) {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('no cyclomediaCameraLngLat');
    return;
  }
  if (import.meta.env.VITE_DEBUG == 'true') console.log('cyclomediaCameraLngLat:', cyclomediaCameraLngLat);

  var destination1 = destination([ cyclomediaCameraLngLat[0], cyclomediaCameraLngLat[1] ], distance, angle1, options);
  var destination2 = destination([ cyclomediaCameraLngLat[0], cyclomediaCameraLngLat[1] ], distance, angle2, options);
  let data = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [ cyclomediaCameraLngLat[0], cyclomediaCameraLngLat[1] ],
        [ destination1.geometry.coordinates[0], destination1.geometry.coordinates[1] ],
        [ destination2.geometry.coordinates[0], destination2.geometry.coordinates[1] ],
        [ cyclomediaCameraLngLat[0], cyclomediaCameraLngLat[1] ],
      ]],
    }
  }

  map.getSource('cyclomediaViewcone').setData(data);
  $config.dorDrawnMapStyle.sources.cyclomediaViewcone.data = data;
}

const toggleEagleview = () => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('toggleEagleview');
  MapStore.eagleviewOn = !MapStore.eagleviewOn;
  if (MapStore.eagleviewOn) {
    MapStore.cyclomediaOn = false;
    removeAllCyclomediaMapLayers();
  }
}

</script>

<template>
  <div
    id="map"
    class="map map-class"
  >
  <div
      v-if="MainStore.addressSearchRunning"
      class="map-cover is-align-content-center has-text-centered"
    >
      <font-awesome-icon
        icon="fa-solid fa-spinner"
        class="fa-6x center-spinner"
        spin
        />
    </div>

    <AddressSearchControl :input-id="'map-search-input'" />
    <ImageryToggleControl @toggle-imagery="toggleImagery" />
    <ImageryDropdownControl
      v-if="MapStore.imageryOn"
      @set-imagery="setImagery"
    />
    <EagleviewControl @toggle-eagleview="toggleEagleview" />
    <CyclomediaControl @toggle-cyclomedia="toggleCyclomedia" />
    <OpacitySlider
      v-if="MainStore.currentTopic == 'deeds' && selectedRegmap"
      :initial-opacity="MapStore.regmapOpacity"
      @opacity-change="handleRegmapOpacityChange"
    />
    <OpacitySlider
      v-if="MainStore.currentTopic == 'zoning'"
      :initial-opacity="MapStore.zoningOpacity"
      @opacity-change="handleZoningOpacityChange"
    />
    <OpacitySlider
      v-if="MainStore.currentTopic == 'stormwater'"
      :initial-opacity="MapStore.stormwaterOpacity"
      @opacity-change="handleStormwaterOpacityChange"
    />
    <!-- the distance measure control uses a ref, so that functions within the component can be called from this file -->
    <DistanceMeasureControl
      ref="distanceMeasureControlRef"
      @drawDelete="drawDelete"
      @drawCancel="drawCancel"
    />
    <OverlayLegend
      v-show="!MapStore.imageryOn && ['stormwater'].includes(MainStore.currentTopic)"
      :items="$config.stormwaterLegendData"
      :options="{ shape: 'square' }"
    />
    <OverlayLegend
      v-show="!MapStore.imageryOn && ['deeds', 'zoning'].includes(MainStore.currentTopic)"
      :items="$config.dorLegendData"
      :options="{ shape: 'square' }"
    />
  </div>
  <KeepAlive>
    <CyclomediaPanel
      v-if="MapStore.cyclomediaOn"
      @update-camera-yaw="updateCyclomediaCameraAngle"
      @update-camera-h-fov="updateCyclomediaCameraViewcone"
      @update-camera-lng-lat="updateCyclomediaCameraLngLat"
      @toggle-cyclomedia="toggleCyclomedia"
    />
  </KeepAlive>
  <KeepAlive>
    <EagleviewPanel
      v-if="MapStore.eagleviewOn"
      @toggle-eagleview="toggleEagleview"
    />
  </KeepAlive>
</template>

<style>

.center-spinner {
  color: #333333;
}

</style>