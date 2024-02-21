import "./App.css";

import React, { useEffect, useState } from "react";
import { OpenStreetMapProvider } from "leaflet-geosearch";

function App() {
  // useEffect(() => {
  //   const map = this.mapRef.current.leafletElement;
  //   const searchControl = new ELG.Geosearch().addTo(map);
  //   const results = new L.LayerGroup().addTo(map);
  //
  //   searchControl.on("results", function (data) {
  //     results.clearLayers();
  //     for (let i = data.results.length - 1; i >= 0; i--) {
  //       results.addLayer(L.marker(data.results[i].latlng));
  //     }
  //   });
  // });

  const center = [37.7833, -122.4167];

  const provider = new OpenStreetMapProvider();

  let [sourceResults, setSourceResults] = useState([]);
  let [targetResults, setTargetResults] = useState([]);
  let [source, setSource] = useState(null);
  let [target, setTarget] = useState(null);
  useEffect(() => {
    if (!source || !target) return;

    (async () => {
      console.log(`[${source.x}, ${source.y}] -> [${target.x}, ${target.y}]`);
      const res = await fetch(
        `http://router.project-osrm.org/route/v1/driving/${source.x},${source.y};${target.x},${target.y}`,
      );
      console.log(await res.json());
    })();
  }, [source, target]);
  return (
    <>
      <div>
        <input
          onChange={async (e) => {
            const r = await provider.search({ query: e.target.value });
            console.log(r);
            setSourceResults(r);
          }}
        />
        <ul>
          {sourceResults.map((r, i) => {
            return (
              <li key={i}>
                <a href="#" onClick={() => setSource(r)}>
                  {r.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <input
          onChange={async (e) => {
            const r = await provider.search({ query: e.target.value });
            console.log(r);
            setTargetResults(r);
          }}
        />
        <ul>
          {targetResults.map((r, i) => {
            return (
              <li key={i}>
                <a href="#" onClick={() => setTarget(r)}>
                  {r.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export default App;
