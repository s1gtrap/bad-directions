import React, { useEffect, useRef, useState } from "react";

export function Input(props) {
  const [results, setResults] = useState(null);
  const input = useRef(null);
  return (
    <>
      <input
        ref={input}
        className="block w-full rounded-md border-0 my-2 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        placeholder={props.placeholder}
        onChange={async (e) => {
          if (props.onChange) {
            setResults(await props.onChange(e.target.value));
          }
        }}
      />
      <div className="relative">
        {results && (
          <ul
            className="block w-full rounded-md border-0 ring-1 py-1.5 px-2 list-none z-10 bg-white absolute"
            role="list"
          >
            {results.length > 0 ? (
              results.map(([r, k], i) => {
                return (
                  <li key={i}>
                    <a
                      href="#"
                      className="w-full block hover:bg-slate-200"
                      onClick={() => {
                        if (props.onSelect) {
                          props.onSelect(r, k);
                        }
                        input.current.value = r;
                        setResults(null);
                      }}
                    >
                      {r}
                    </a>
                  </li>
                );
              })
            ) : (
              <p className="text-slate-400">No results found</p>
            )}
          </ul>
        )}
      </div>
    </>
  );
}
