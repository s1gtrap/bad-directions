import "./App.css";

import React, { useEffect, useRef, useState } from "react";
import { OpenStreetMapProvider } from "leaflet-geosearch";

var _ = require("lodash");

async function translate(from, to, text) {
  const res = await fetch("http://localhost:5000/translate", {
    method: "POST",
    body: JSON.stringify({
      q: text,
      source: from,
      target: to,
    }),
    headers: { "Content-Type": "application/json" },
    mode: "cors",
  });
  const body = await res.json();
  return body.translatedText;
}

function App() {
  const osrmTextInstructions = require("osrm-text-instructions")("v5");
  const provider = new OpenStreetMapProvider();

  let [sourceResults, setSourceResults] = useState([]);
  let [targetResults, setTargetResults] = useState([]);
  let [source, setSource] = useState(null);
  let [target, setTarget] = useState(null);
  let [chain, setChain] = useState([]);
  let [legs, setLegs] = useState([]);
  useEffect(() => {
    if (!source || !target || chain.length !== 1) return;

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

  // reset translations when route or language chain changes
  useEffect(() => {
    setTranslations(_.cloneDeep(legs));
  }, [legs]);

  // translate missing translations
  useEffect(() => {
    (async () => {
      const newTranslations = _.cloneDeep(translations);
      for (let i = 1; i < chain.length; i++) {
        if (
          translations[0][0][i - 1][0] === chain[i - 1] &&
          translations[0][0][i] &&
          translations[0][0][i][0] === chain[i]
        )
          continue;
        for (let j = 0; j < legs.length; j++) {
          for (let k = 0; k < legs[j].length; k++) {
            if (!translations[j][k][i - 1]) continue;
            if (
              translations[j][k][i - 1] &&
              translations[j][k][i - 1][0] === chain[i - 1] &&
              translations[j][k][i] &&
              translations[j][k][i][0] === chain[i]
            )
              continue;

            const transText = await translate(
              chain[i - 1],
              chain[i],
              translations[j][k][i - 1][1],
            );

            newTranslations[j][k][i] = [chain[i], transText];
          }
        }
      }

      if (!_.isEqual(translations, newTranslations))
        setTranslations(newTranslations);
    })();
  }, [translations, chain]);
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
