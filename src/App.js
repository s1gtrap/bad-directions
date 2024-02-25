import "./App.css";

import React, { useEffect, useRef, useState } from "react";
import { OpenStreetMapProvider } from "leaflet-geosearch";

import { Input } from "./Input";

var _ = require("lodash");

function fetchLT(resource, options) {
  return fetch(
    `https://libretranslate.eownerdead.dedyn.io${resource}`,
    options,
  );
}

async function fetchLanguages() {
  const res = await fetchLT("/languages", {
    method: "GET",
    mode: "cors",
  });
  return await res.json();
}

async function translate(from, to, text) {
  const res = await fetchLT("/translate", {
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
  const osrmLanguages = require("osrm-text-instructions/languages");
  const provider = new OpenStreetMapProvider();

  let [languages, setLanguages] = useState([]);
  useEffect(() => {
    (async () => {
      const languages = await fetchLanguages();
      setLanguages(languages);
    })();
  }, []);

  let [source, setSource] = useState(null);
  let [target, setTarget] = useState(null);
  let [chain, setChain] = useState([]);
  let [legs, setLegs] = useState([]);
  useEffect(() => {
    if (!source || !target || chain.length !== 1) return;

    (async () => {
      console.log(`[${source.x}, ${source.y}] -> [${target.x}, ${target.y}]`);
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${source.x},${source.y};${target.x},${target.y}?overview=false&steps=true`,
        {
          mode: "cors",
        },
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
  let [isTranslating, setIsTranslating] = useState([]);

  // reset translations when route or language chain changes
  useEffect(() => {
    setTranslations(_.cloneDeep(legs));
  }, [legs]);

  // translate missing translations
  useEffect(() => {
    setIsTranslating(true);

    (async () => {
      const newTranslations = _.cloneDeep(translations);
      for (let i = 1; i < chain.length; i++) {
        if (!translations[0][0][i - 1]) continue;
        for (let j = 0; j < legs.length; j++) {
          const input = translations[j].map((leg) => leg[i - 1][1]);
          const output = await translate(chain[i - 1], chain[i], input);
          for (let k = 0; k < legs[j].length; k++) {
            newTranslations[j][k][i] = [chain[i], output[k]];
          }
        }
      }

      if (!_.isEqual(translations, newTranslations))
        setTranslations(newTranslations);

      setIsTranslating(false);
    })();
  }, [translations, chain]);
  const newLang = useRef(null);
  return (
    <div className="container mx-auto">
      <div>
        <Input
          placeholder="Choose point of origin"
          onChange={async (s) => {
            if (s === "") {
              return null;
            }
            if (s.trim() === "") {
              return [];
            }
            const results = await provider.search({ query: s });
            return results.map((r) => [r.label, r]);
          }}
          onSelect={(label, coords) => {
            setSource(coords);
          }}
        />
      </div>
      <div>
        <Input
          placeholder="Choose destination"
          onChange={async (s) => {
            if (s === "") {
              return null;
            }
            if (s.trim() === "") {
              return [];
            }
            const results = await provider.search({ query: s });
            return results.map((r) => [r.label, r]);
          }}
          onSelect={(label, coords) => {
            setTarget(coords);
          }}
        />
      </div>
      <div>
        {chain.map((l, i) => {
          return (
            <span key={i}>
              <input value={l} disabled={true} size={2} />
              {" >> "}
            </span>
          );
        })}
        <input
          ref={newLang}
          disabled={isTranslating}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              setChain([...chain, newLang.current.value]);
              newLang.current.value = "";
            }
          }}
          size={2}
        />
        <button
          disabled={isTranslating}
          onClick={() => {
            setChain([...chain, newLang.current.value]);
            newLang.current.value = "";
          }}
        >
          add
        </button>
        <button
          disabled={isTranslating}
          onClick={() => {
            const code = _.sample(
              chain.length === 0
                ? osrmLanguages.supportedCodes
                : languages.find(
                    (lang) => lang.code === chain[chain.length - 1],
                  )?.targets,
            );
            setChain([...chain, code]);
          }}
        >
          random
        </button>
        {isTranslating && " loading..."}
      </div>
      <div>
        Available languages:
        {chain.length === 0
          ? osrmLanguages.supportedCodes
              .map((code) => [
                code,
                languages.find((lang) => lang.code === code),
              ])
              .filter(([code, lang]) => !!lang)
              .map(([code, lang], i) => (
                <span key={i}>{` ${lang.name} [${lang.code}]`}</span>
              ))
          : languages
              .find((lang) => lang.code === chain[chain.length - 1])
              ?.targets.map((code, i) => {
                const lang = languages.find((lang) => lang.code === code);
                return <span key={i}>{` ${lang.name} [${lang.code}]`}</span>;
              })}
      </div>
      <div className={isTranslating ? "loading" : ""}>
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
    </div>
  );
}

export default App;
