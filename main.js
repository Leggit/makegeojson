import Map from "ol/Map.js";
import View from "ol/View.js";
import Draw from "ol/interaction/Draw.js";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector.js";
import OSM from "ol/source/OSM.js";
import VectorSource from "ol/source/Vector.js";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import Circle from "ol/style/Circle";
import GeoJSON from "ol/format/GeoJSON.js";
import { unByKey } from "ol/Observable";

const raster = new TileLayer({
  source: new OSM(),
});

const style = new Style({
  image: new Circle({
    radius: 5,
    fill: new Fill({
      color: "red",
    }),
  }),
  stroke: new Stroke({
    color: "red",
    width: 2,
  }),
  fill: new Fill({
    color: "rgba(255, 0, 0, 0.3)",
  }),
});

const source = new VectorSource({ wrapX: false });

const vector = new VectorLayer({
  source: source,
  style,
});

const map = new Map({
  layers: [raster, vector],
  target: "map",
  view: new View({
    center: [-402135.0114847244, 6762516.63206223],
    zoom: 11,
  }),
});

map.getView().on("change", () => {
  console.log(map.getView().getZoom());
  console.log(map.getView().getCenter());
});

const typeSelect = document.getElementById("type");

let draw; // global so we can remove it later
function addInteraction() {
  const value = typeSelect.value;
  if (value !== "None") {
    draw = new Draw({
      source: source,
      type: typeSelect.value,
      style,
    });
    map.addInteraction(draw);
  }
}

/**
 * Handle change event.
 */
typeSelect.onchange = function () {
  map.removeInteraction(draw);
  addInteraction();
};

const copyAllGeoJson = document.getElementById("copyAllGeoJson");
copyAllGeoJson.onclick = function () {
  const features = source.getFeatures();
  const geojson = new GeoJSON().writeFeatures(features);
  navigator.clipboard.writeText(geojson);
  copyAllGeoJson.textContent = "Copied!";
  setTimeout(() => {
    copyAllGeoJson.textContent = "Copy all";
  }, 2000);
};

let isSelecting = false;
const copyOneGeoJson = document.getElementById("copyOneGeoJson");
copyOneGeoJson.onclick = function () {
  if (isSelecting) {
    return;
  }
  isSelecting = true;
  copyAllGeoJson.disabled = true;
  typeSelect.disabled = true;
  map.removeInteraction(draw);
  copyOneGeoJson.textContent = "Click a shape";

  const pointerMoveListener = map.on("pointermove", function (evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      return feature;
    });

    if (feature) {
      map.getTargetElement().style.cursor = "pointer";
    } else {
      map.getTargetElement().style.cursor = "";
    }
  });

  map.once("singleclick", function (evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      return feature;
    });

    if (feature) {
      const geojson = new GeoJSON().writeFeature(feature);
      navigator.clipboard.writeText(geojson);
      copyOneGeoJson.textContent = "Copied!";
      setTimeout(() => {
        copyOneGeoJson.textContent = "Copy one";
        copyAllGeoJson.disabled = false;
        typeSelect.disabled = false;
      }, 1000);
    } else {
      copyOneGeoJson.textContent = "Nothing here";
      setTimeout(() => {
        copyOneGeoJson.textContent = "Copy one";
        copyAllGeoJson.disabled = false;
        typeSelect.disabled = false;
      }, 1000);
    }

    unByKey(pointerMoveListener);
  });
};

addInteraction();
