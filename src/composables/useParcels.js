import { point, polygon, multiPolygon } from '@turf/helpers';
import length from '@turf/length';
import distance from '@turf/distance';
import area from '@turf/area';
import { segmentReduce } from '@turf/meta';

export default function useParcels() {

  const processParcels = async(featureCollection) => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('featureCollection:', featureCollection, 'featureCollection.features.length:', featureCollection.features.length);
    if (!featureCollection || featureCollection.features.length === 0) {
      return;
    }
    const features = featureCollection.features;
    const featuresSorted = sortDorParcelFeatures(features);

    // use turf to get area and perimeter of all parcels returned
    if (import.meta.env.VITE_DEBUG == 'true') console.log('featuresSorted:', featuresSorted);
    for (let featureSorted of featuresSorted) {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('featureSorted:', featureSorted);
      const geometry = calculateAreaAndPerimeter(featureSorted);
      featureSorted.properties.turf_perimeter = geometry.perimeter;
      featureSorted.properties.turf_area = geometry.area;
    }

    // at this point there is definitely a feature or features - put it in state
    // this.setParcelsInState(parcelLayer, multipleAllowed, feature, featuresSorted, mapregStuff);
    let featuresSortedComplete = { features: featuresSorted };
    return featuresSortedComplete;
  }

  const sortDorParcelFeatures = (features) => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('features:', features);
    // map parcel status to a numeric priority
    // (basically so remainders come before inactives)
    const status_priority = {
      1: 1,
      2: 3,
      3: 2,
      9: 4,
    };

    // first sort by mapreg (descending)
    features.sort((a, b) => {
      const mapregA = a.properties.mapreg;
      const mapregB = b.properties.mapreg;

      if (mapregA < mapregB) {
        return 1;
      }
      if (mapregA > mapregB) {
        return -1;
      }
      return 0;
    });

    // then sort by status
    features.sort((a, b) => {
      const statusA = status_priority[a.properties.status];
      const statusB = status_priority[b.properties.status];

      if (statusA < statusB) {
        return -1;
      }
      if (statusA > statusB) {
        return 1;
      }
      return 0;
    });

    return features;
  }

  const calculateAreaAndPerimeter = (feature) => {
    let perimeter = segmentReduce(feature.geometry,
      (previousSegment, currentSegment) => {
        let len = length(currentSegment, { units: 'feet' });
        return previousSegment + len;
      },
      0
    );
    return {
      perimeter,
      area: area(feature.geometry) * 10.7639,
    };
  }

  return {
    processParcels,
    sortDorParcelFeatures,
    calculateAreaAndPerimeter,
  }
}
