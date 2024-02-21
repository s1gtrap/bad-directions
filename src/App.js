import "./App.css";

import React, { useEffect, useRef, useState } from "react";
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
  const osrmTextInstructions = require("osrm-text-instructions")("v5");

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
        `http://router.project-osrm.org/route/v1/driving/${source.x},${source.y};${target.x},${target.y}?overview=false&steps=true`,
      );
      const response = (await res.json()).routes[0];
      response.legs.forEach(function (leg) {
        console.log("leg", leg);
        leg.steps.forEach(function (step) {
          console.log(osrmTextInstructions.compile("en", step, {}));
        });
      });
    })();
  }, [source, target]);
  let [chain, setChain] = useState([]);
  const newLang = useRef(null);
  return (
    <>
      <div>
        {"source: "}
        <input
          onChange={async (e) => {
            const r = await provider.search({ query: e.target.value });
            setSourceResults(r);
          }}
        />
        {source && <>{` ${source.x}, ${source.y}`}</>}
        <ul>
          {sourceResults.map((r, i) => {
            return (
              <li key={i}>
                <a
                  href="#"
                  onClick={() => {
                    setSourceResults([]);
                    setSource(r);
                  }}
                >
                  {r.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        {"target: "}
        <input
          onChange={async (e) => {
            const r = await provider.search({ query: e.target.value });
            console.log(r);
            setTargetResults(r);
          }}
        />
        {target && <>{` ${target.x}, ${target.y}`}</>}
        <ul>
          {targetResults.map((r, i) => {
            return (
              <li key={i}>
                <a
                  href="#"
                  onClick={() => {
                    setTargetResults([]);
                    setTarget(r);
                  }}
                >
                  {r.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        {chain.map((l, i) => {
          return (
            <>
              <input value={l} disabled={true} size={2} />
              <button onClick={() => setChain(chain.filter((l, j) => i !== j))}>
                del
              </button>
              {" >> "}
            </>
          );
        })}
        <input
          ref={newLang}
          onKeyUp={(e) => {
            if (e.key == "Enter") {
              setChain([...chain, newLang.current.value]);
            }
          }}
          size={2}
        />
        <button
          onClick={() => {
            console.log(newLang.current.value);
            setChain([...chain, newLang.current.value]);
          }}
        >
          add
        </button>
      </div>
    </>
  );
}

export default App;
