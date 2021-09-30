const tj = require("togeojson"),
  fs = require("fs"),
  turf = require("@turf/turf"),
  write = require("write"),
  // node doesn't have xml parsing or a dom. use xmldom
  DOMParser = require("xmldom").DOMParser;

const districtsKML = new DOMParser().parseFromString(
  fs.readFileSync("data/districts.kml", "utf8")
);
const buildingsKML = new DOMParser().parseFromString(
  fs.readFileSync("data/buildings.kml", "utf8")
);

let districtsGeoJSON = tj.kml(districtsKML),
  districtGIDs = [],
  buildingsGeoJSON = tj.kml(buildingsKML);

let districtsCount = districtsGeoJSON.features.map((district) => {
  districtGIDs.push(district.properties.gid);
  return {
    name: district.properties.name,
    buildingsCount: 0,
    gid: district.properties.gid,
  };
});

let errorBuildingCount = 0;

districtsGeoJSON.features.forEach((district) => {
  buildingsGeoJSON.features.forEach((building) => {
    try {
      if (turf.booleanContains(district, building)) {
        districtsCount[
          districtGIDs.indexOf(district.properties.gid)
        ].buildingsCount += 1;
      }
    } catch (error) {
      errorBuildingCount += 1;
    }
  });
});

districtsCount.sort((a, b) => b.buildingsCount - a.buildingsCount);
const top3Districts = districtsCount.slice(0, 3);

write.sync(
  "exports/top3Districts.txt",
  top3Districts.map((district) => JSON.stringify(district)).join("\n"),
  {
    newline: true,
  }
);

write.sync(
  "exports/allDistricts.txt",
  districtsCount.map((district) => JSON.stringify(district)).join("\n"),
  {
    newline: true,
  }
);

write.sync(
  "exports/report.txt",
  [
    {
      "Top 3 Districts": top3Districts
        .map((district) => district.name)
        .join(","),
    },
    { "Building Count": buildingsGeoJSON.features.length },
    { "District Count": districtsGeoJSON.features.length },
    { "Geometry Error Building Count": errorBuildingCount },
  ]
    .map((district) => JSON.stringify(district))
    .join("\n"),
  {
    newline: true,
  }
);
