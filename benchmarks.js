// state tracking
// let currentStation = "";
// let currentBenchmarkSelection = "";
let benchmarkData = [];
let stationCenter = [0, 0];
let useEnglishUnits = false;

// Set up initial map

let initialZoom = 16;
let initialPosition = stationCenter;
const map = L.map("map").setView(initialPosition, initialZoom);

// Set up basemap layers

const esriSatelliteMap = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri. Sources: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  }
);

const googleSatellite = L.gridLayer.googleMutant({
  type: "satellite",
});

const cartoMap = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }
);
cartoMap.addTo(map); // Set light map as initial basemap

// Set up initial empty layer group for benchmark layers. (Just using this since it makes it easier to select and clear layer when station changes)
const benchmarkLayerGroup = L.layerGroup().addTo(map);

// Add basemap switch to map
function switchBasemap(e) {
  const satelliteBasemap = USE_GOOGLE_MAPS ? googleSatellite : esriSatelliteMap;
  const basemapKeys = { light: cartoMap, satellite: satelliteBasemap };
  const selectedBasemap = document.querySelector(
    'input[name="basemap-radio"]:checked'
  ).id;
  const unselectedBasemap = document.querySelector(
    'input[name="basemap-radio"]:not(:checked)'
  ).id;
  map.removeLayer(basemapKeys[unselectedBasemap]);
  map.addLayer(basemapKeys[selectedBasemap]);
}

const basemapSwitch = L.control({
  position: "topright",
  initialBasemap: "light",
});

basemapSwitch.onAdd = function (opts) {
  const controlContainer = L.DomUtil.create(
    "div",
    "leaflet-bar basemap-switch"
  );
  const basemapRadio = L.DomUtil.create("div", "btn-group", controlContainer);
  basemapRadio.id = "basemap-radio";
  basemapRadio.role = "group";
  basemapRadio.setAttribute("aria-label", "Select a basemap");
  basemapRadio.onchange = switchBasemap;

  const options = [
    { label: "Light", value: "light" },
    { label: "Satellite", value: "satellite" },
  ];

  options.map((entry) => {
    const btn = L.DomUtil.create("input", "btn-check", basemapRadio);
    btn.type = "radio";
    btn.name = "basemap-radio";
    btn.checked = this.options.initialBasemap == entry.value;
    btn.id = entry.value;
    const label = L.DomUtil.create("label", "btn btn-light", basemapRadio);
    label.setAttribute("for", btn.id);
    label.innerHTML = entry.label;
  });

  return controlContainer;
};

basemapSwitch.addTo(map);

const mapLegend = L.control({ position: "topright" });

mapLegend.onAdd = function () {
  const legendContainer = L.DomUtil.create("div", "leaflet-bar map-legend");
  const entries = [
    { icon: "./images/station.svg", label: "Tide Gauge" },
    { icon: "./images/benchmark.svg", label: "Benchmark" },
    { icon: "./images/star-centered.svg", label: "Primary" },
  ];

  for (let i = 0; i < entries.length; i++) {
    const entry = L.DomUtil.create("div", "", legendContainer);
    const entryIcon = L.DomUtil.create("img", "legend-icon", entry);
    entryIcon.src = entries[i].icon;
    const entryLabel = L.DomUtil.create("div", "", entry);
    entryLabel.innerHTML = entries[i].label;
  }
  return legendContainer;
};

mapLegend.addTo(map);

// Add reset view/home button
L.easyButton("fa fa-house fa-solid", () => {
  map.setView(initialPosition, initialZoom);
}).addTo(map);

// Functions to add benchmark/station layers
function customIcon(url) {
  const iconSize = [28, 28];
  const iconAnchor = [14, 28];
  const tooltipAnchor = [7, -14];
  const icon = L.icon({
    iconUrl: url,
    iconSize: iconSize,
    iconAnchor: iconAnchor,
    tooltipAnchor: tooltipAnchor,
  });
  return icon;
}

function benchmarkPointToLayer(feature, latlng) {
  const isSelected =
    feature.properties.uhslc_id_fmt == stn &&
    feature.properties.benchmark == currentBenchmarkSelection;

  let icon = null;

  // do not plot other station benchmarks
  if (feature.properties.uhslc_id_fmt != stn) {
    return null;
  }

  if (feature.properties.type == "station") {
    icon = customIcon(`./images/station${isSelected ? "-selected" : ""}.svg`);
  } else {
    icon = customIcon(
      `./images/benchmark${isSelected ? "-selected" : ""}${
        feature.properties.primary ? "-primary" : ""
      }.svg`
    );
  }

  const zOffset = isSelected ? 1000 : feature.properties.primary ? 500 : 0;
  const marker = L.marker(latlng, { icon: icon });

  marker.setZIndexOffset(zOffset);

  return marker;
}

function benchmarkOnEachFeature(feature, layer) {
  const benchmarkFormatted = `${
    feature.properties.type == "station"
      ? "Tide Gauge"
      : feature.properties.benchmark.toUpperCase()
  }${feature.properties.primary ? " (Primary)" : ""}`;
  layer.bindTooltip(benchmarkFormatted);

  layer.on({
    click: (e) => {
      currentBenchmarkSelection = e.target.feature.properties.benchmark;
      currentStation = e.target.feature.properties.uhslc_id_fmt;
      const isPrimary = e.target.feature.properties.primary;

      if (e.target.feature.properties.type == "station") {
        e.target.setIcon(customIcon("./images/station-selected.svg"));
      } else {
        e.target.setIcon(
          customIcon(
            `./images/benchmark-selected${isPrimary ? "-primary" : ""}.svg`
          )
        );
      }

      e.target.setZIndexOffset(1000);
      // Remove selected icon from any other points
      map.eachLayer((layer) => {
        if (
          layer.feature &&
          layer.feature.properties.benchmark &&
          layer.feature.properties.benchmark != currentBenchmarkSelection
        ) {
          const isPrimary = layer.feature.properties.primary;
          if (layer.feature.properties.type == "station") {
            layer.setIcon(customIcon("./images/station.svg"));
          } else {
            layer.setIcon(
              customIcon(`./images/benchmark${isPrimary ? "-primary" : ""}.svg`)
            );
          }

          layer.setZIndexOffset(isPrimary ? 500 : 0);
        }
      });

      updatePanel(currentBenchmarkSelection);
    },
  });
}

// Other support functions for updating map, panel, table
function setDefaultSelection() {
  const stationData = benchmarkData.features.filter(
    (entry) => entry.properties.uhslc_id_fmt == stn
  );
  const stationEntry = stationData.filter(
    (entry) => entry.properties.type == "station"
  )[0];

  return stationEntry.properties.benchmark;
}

function setStationCenter() {
  const stationPrimary = benchmarkData.features.filter(
    (entry) =>
      entry.properties.uhslc_id_fmt == stn && entry.properties.type == "station"
  )[0];
  stationCenter = [
    Number(stationPrimary.properties.lat),
    Number(stationPrimary.properties.lon),
  ];

  return stationCenter;
}

function updatePanel(currentBenchmarkSelection) {
  const currentEntry = benchmarkData.features.filter((entry) => {
    return (
      entry.properties.benchmark == currentBenchmarkSelection &&
      entry.properties.uhslc_id_fmt == stn
    );
  });

  if (currentEntry[0].properties.type == "station") {
    // document.getElementById("benchmark-header").classList.add("is-hidden");
    document.getElementById("panel-description").classList.add("is-hidden");
    document.getElementById("select-message").classList.remove("is-hidden");
    // document.getElementById("panel-photo-header").innerHTML =
    //   "Station Photo(s)";
    // const country = document.getElementById("panel-country");
    // country.classList.remove("is-hidden");
    // country.innerHTML = currentEntry[0].properties.country_name;

    const currentBenchmark = document.getElementById("current-benchmark");
    currentBenchmark.innerHTML =
      currentEntry[0].properties.name + " Tide Gauge";

    const currentIcon = document.getElementById("current-icon");
    // currentIcon.src = "./images/gray-icon.svg";
    currentIcon.src = "./images/station-selected.svg";
    const coords = document.getElementById("current-coords");
    coords.innerHTML = `${currentEntry[0].properties.lat}, ${currentEntry[0].properties.lon}`;
  } else {
    // document.getElementById("panel-country").classList.add("is-hidden");
    document.getElementById("select-message").classList.add("is-hidden");
    // document.getElementById("benchmark-header").classList.remove("is-hidden");
    document.getElementById("panel-description").classList.remove("is-hidden");
    // document.getElementById("panel-photo-header").innerHTML = "Photo(s)";

    const currentBenchmark = document.getElementById("current-benchmark");
    currentBenchmark.innerHTML = `${currentEntry[0].properties.benchmark}${
      currentEntry[0].properties.primary ? " (Primary)" : ""
    }`;

    const currentIcon = document.getElementById("current-icon");
    currentIcon.src = currentEntry[0].properties.primary
      ? "./images/benchmark-selected-primary.svg"
      : "./images/benchmark-selected.svg";
    // currentIcon.src = "./images/gray-icon.svg";
    currentIcon.setAttribute("alt", "location icon");
    const coords = document.getElementById("current-coords");
    coords.innerHTML = `${currentEntry[0].properties.lat}, ${currentEntry[0].properties.lon}`;

    const currentDescription = document.getElementById("current-description");
    currentDescription.innerHTML = currentEntry[0].properties.description;
  }

  const photos = currentEntry[0].properties.photo_files;
  const photoCarousel = document.getElementById("photo-carousel");

  if (photos.length == 0) {
    document.getElementById("photos").classList.add("no-photos");
    photoCarousel.classList.add("is-hidden");
  } else {
    //Initialize photo carousel (and modal carousel)
    photoCarousel.classList.remove("is-hidden");
    document.getElementById("photos").classList.remove("no-photos");
    createCarousel("photo-carousel", photos);
    const photoCaptionDate = document.getElementById("photo-date");
    photoCaptionDate.innerHTML = photos[0].date;

    // Add event listener to open modal on photo carousel click
    photoCarousel.addEventListener("click", (e) => {
      if (e.target.tagName == "IMG") {
        // let photoModal = Modal.getOrCreateInstance(
        //   document.getElementById("photo-modal")
        // );
        createCarousel("modal-carousel", photos, e.target.dataset.idx, true);
        $("#photo-modal").modal("show");
      }
    });
  }
}

function createCarousel(divId, photos, photoIdx, modal) {
  const currentPhotoIdx = photoIdx ? photoIdx : 0;

  const carousel = document.getElementById(divId);
  const carouselIndicators = document.querySelector(
    `#${divId} .carousel-indicators`
  );
  const carouselInner = document.querySelector(`#${divId} .carousel-inner`);
  const prevButton = document.querySelector(`#${divId} .carousel-control-prev`);
  const nextButton = document.querySelector(`#${divId} .carousel-control-next`);

  // Clear out previous contents
  carouselIndicators.innerHTML = "";
  carouselInner.innerHTML = "";

  for (let i = 0; i < photos.length; i++) {
    // add indicators if there are multiple photos
    if (photos.length > 1) {
      const indicator = document.createElement("button");
      indicator.type = "button";
      indicator.setAttribute("data-target", `#${divId}`);
      indicator.setAttribute("data-slide-to", String(i));
      indicator.setAttribute("aria-label", `Photo ${String(i)}`);
      if (i == currentPhotoIdx) {
        indicator.classList.add("active");
        indicator.setAttribute("aria-current", true);
      }
      carouselIndicators.appendChild(indicator);

      // make sure previous/next buttons are displayed
      prevButton.classList.remove("is-hidden");
      nextButton.classList.remove("is-hidden");
    } else {
      // hide previous/next buttons if there is only 1 photo
      prevButton.classList.add("is-hidden");
      nextButton.classList.add("is-hidden");
    }
    // add photos
    const photoItem = document.createElement("div");
    photoItem.classList.add("item");
    photoItem.classList.add("carousel-item"); // just to keep consistent with css based on bootstrap 5
    if (i == currentPhotoIdx) {
      photoItem.classList.add("active");
    }

    const photoImg = document.createElement("img");
    photoImg.src = `./images/benchmark_photos/${photos[i].file}`;
    photoImg.classList.add("d-block", "w-100");
    photoImg.alt = `Photo ${i + 1}`; // add alt text eventually
    photoImg.setAttribute("data-idx", i);

    photoItem.appendChild(photoImg);

    const photoDate = document.createElement("div");
    if (modal) {
      photoDate.classList.add("modal-photo-date");
      photoDate.innerHTML = photos[i].date;
      photoItem.appendChild(photoDate);
    }

    carouselInner.appendChild(photoItem);
  }

  // Bootstrap 3
  $(`#${divId}`).carousel({ interval: false, wrap: false });

  // Set initial button display settings
  document.querySelector(`#${divId} .carousel-control-next`).style.display =
    currentPhotoIdx == photos.length - 1 ? "none" : "block";
  document.querySelector(`#${divId} .carousel-control-prev`).style.display =
    currentPhotoIdx == 0 ? "none" : "block";

  $(`#${divId}`).on("slid.bs.carousel", function (e) {
    const photoCaptionDate = document.getElementById("photo-date");
    const currentIndex = $(e.relatedTarget).index();
    if (photos[currentIndex]) {
      photoCaptionDate.innerHTML = photos[currentIndex].date;

      document.querySelector(`#${divId} .carousel-control-next`).style.display =
        currentIndex == photos.length - 1 ? "none" : "block";
      document.querySelector(`#${divId} .carousel-control-prev`).style.display =
        currentIndex == 0 ? "none" : "block";
    }
  });
}

function populateTable(isEnglishUnits) {
  const useEnglishUnits = isEnglishUnits ? isEnglishUnits : 0;

  const tbody = document
    .getElementById("benchmark-table")
    .getElementsByTagName("tbody")[0];
  tbody.innerHTML = "";

  const headers = useEnglishUnits
    ? ["benchmark", "type", "lat", "lon", "level_ft", "level_date"]
    : ["benchmark", "type", "lat", "lon", "level", "level_date"];
  document.getElementById("table-units").innerHTML = useEnglishUnits
    ? "ft"
    : "m";

  const stationBenchmarks = benchmarkData.features.filter(
    (entry) =>
      entry.properties.uhslc_id_fmt == stn && entry.properties.type != "station"
  );

  for (let i = 0; i < stationBenchmarks.length; i++) {
    const row = tbody.insertRow(i);
    for (let j = 0; j < headers.length; j++) {
      const cell = row.insertCell(j);
      let content = stationBenchmarks[i].properties[headers[j]];
      if (!content || content === "nan") {
        content = "--";
      }
      cell.innerHTML = content;
    }
  }
}

function refreshMap() {
  initialPosition = setStationCenter(benchmarkData);
  map.setView(initialPosition, initialZoom);

  benchmarkLayerGroup.clearLayers(); // clear out any existing benchmark layer
  benchmarkLayer = L.geoJSON(benchmarkData, {
    pointToLayer: benchmarkPointToLayer,
    onEachFeature: benchmarkOnEachFeature,
  }).addTo(benchmarkLayerGroup);

  // reset home button
  map.removeControl(document.querySelector(".easy-button-container"));
  // Add reset view/home button
  L.easyButton("fa fa-house fa-solid", () => {
    map.setView(initialPosition, initialZoom);
  }).addTo(map);
}

// Populate page after loading benchmark data

async function loadBenchmarkData() {
  try {
    const response = await fetch("./data/all_benchmarks.json", {
      cache: "no-cache",
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching benchmark JSON:", error);
  }
}

async function populateBenchmarkPage() {
  benchmarkData = await loadBenchmarkData();
  const availableStations = Array.from(
    new Set(benchmarkData.features.map((a) => a.properties.uhslc_id_fmt))
  );
  if (!availableStations.includes(stn)) {
    document.getElementById("no-benchmarks").classList.remove("is-hidden");
    document.getElementById("benchmark-content").classList.add("is-hidden");
  } else {
    document.getElementById("no-benchmarks").classList.add("is-hidden");
    document.getElementById("benchmark-content").classList.remove("is-hidden");

    currentBenchmarkSelection = setDefaultSelection();
    useEnglishUnits = document.getElementById("unitToggle").checked;

    refreshMap();
    updatePanel(currentBenchmarkSelection);
    populateTable(useEnglishUnits);
  }
}
