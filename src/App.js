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

  const provider = new OpenStreetMapProvider();

  let [sourceResults, setSourceResults] = useState([]);
  let [targetResults, setTargetResults] = useState([]);
  let [source, setSource] = useState(null);
  let [target, setTarget] = useState(null);
  let [chain, setChain] = useState([]);
  let [legs, setLegs] = useState([]);
  useEffect(() => {
    if (!source || !target || !chain.length) return;

    (async () => {
      console.log(`[${source.x}, ${source.y}] -> [${target.x}, ${target.y}]`);
      const res = await fetch(
        `http://router.project-osrm.org/route/v1/driving/${source.x},${source.y};${target.x},${target.y}?overview=false&steps=true`,
      );
      const response = (await res.json()).routes[0];
      const legs = response.legs.map(function (leg) {
        return leg.steps.map(function (step) {
          return [[chain[0], osrmTextInstructions.compile(chain[0], step, {})]];
        });
      });
      setLegs(legs);
    })();
  }, [source, target, chain]);
  let [translations, setTranslations] = useState([]);
  useEffect(() => {
    (async () => {
      for (let i = 1; i < chain.length; i++) {
        for (let j = 0; j < legs.length; j++) {
          for (let k = 0; k < legs[j].length; k++) {
            const res = await fetch("http://localhost:5000/translate", {
              method: "POST",
              body: JSON.stringify({
                q: legs[j][k][i - 1][1],
                source: chain[i - 1],
                target: chain[i],
              }),
              headers: { "Content-Type": "application/json" },
              mode: "cors",
            });
            legs[j][k][i] = [chain[i], (await res.json()).translatedText];
            setTranslations(legs);
          }
        }
      }
    })();
  }, [legs, chain]);
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
            <span key={i}>
              <input value={l} disabled={true} size={2} />
              <button onClick={() => setChain(chain.filter((l, j) => i !== j))}>
                del
              </button>
              {" >> "}
            </span>
          );
        })}
        <input
          ref={newLang}
          onKeyUp={(e) => {
            if (e.key == "Enter") {
              setChain([...chain, newLang.current.value]);
              newLang.current.value = "";
            }
          }}
          size={2}
        />
        <button
          onClick={() => {
            setChain([...chain, newLang.current.value]);
            newLang.current.value = "";
          }}
        >
          add
        </button>
      </div>
      <div>
        {translations.map((leg, i) => {
          return (
            <div key={i}>
              {leg.map((step, i) => {
                return <p key={i}>{step[step.length - 1][1]}</p>;
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default App;
