import { watch } from 'vue';
import { useMapStore } from '@/stores/MapStore';

// sets data on a map source that may not exist yet. On a deep link, topic data can
// arrive before the map exists (MapStore.setMap) or before Map.vue's setup has added
// the source - a plain getSource().setData() then throws inside the caller's watcher
// and the map stays empty. This waits for whichever piece is missing: the map (via a
// store watch) and then the source (via the map's sourcedata event), and sets the
// data as soon as both are real. Later calls for the same source supersede earlier
// pending ones.
export default function useMapSource() {
  const MapStore = useMapStore();
  const pending = {};

  const trySet = (sourceId) => {
    const map = MapStore.map;
    if (map && map.getSource && map.getSource(sourceId)) {
      map.getSource(sourceId).setData(pending[sourceId]);
      delete pending[sourceId];
      return true;
    }
    return false;
  };

  const awaitSource = (sourceId) => {
    const map = MapStore.map;
    const retry = () => {
      if (!(sourceId in pending) || trySet(sourceId)) {
        map.off('sourcedata', retry);
      }
    };
    map.on('sourcedata', retry);
  };

  const setSourceData = (sourceId, data) => {
    const alreadyWaiting = sourceId in pending;
    pending[sourceId] = data;
    if (alreadyWaiting || trySet(sourceId)) {
      return;
    }
    const map = MapStore.map;
    if (map && map.on) {
      awaitSource(sourceId);
      return;
    }
    const stop = watch(() => MapStore.map, (newMap) => {
      if (newMap && newMap.on) {
        stop();
        if (!(sourceId in pending)) {
          return;
        }
        if (!trySet(sourceId)) {
          awaitSource(sourceId);
        }
      }
    });
  };

  // clears a source if it exists right now - for unmount cleanup, which should never
  // schedule a retry that could clear a later topic's data
  const clearSourceData = (sourceId, emptyData) => {
    delete pending[sourceId];
    const map = MapStore.map;
    if (map && map.getSource && map.getSource(sourceId)) {
      map.getSource(sourceId).setData(emptyData);
    }
  };

  return { setSourceData, clearSourceData };
}
