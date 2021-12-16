import "./styles.css";
import FacetedIndex from "./FacetedIndex";
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useSearchParams
} from "react-router-dom";
import Search from "./search";
import Settings from "./settings";

export default function App() {
  const [settings, setSettings] = React.useState({ records: [], config: {} });
  const [ix, setIx] = React.useState(FacetedIndex([], { facet_fields: [] }));
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  const searchParamsObject = Array.from(searchParams.entries()).reduce(
    (dict, [key, value]) => {
      (dict[key] = dict[key] || []).push(value);
      return dict;
    },
    {}
  );
  const reload = (records_url, facet_fields) => {
    window.location.href =
      window.location.origin +
      "?" +
      new URLSearchParams([
        ["records_url", records_url],
        ...facet_fields.map((f) => ["facet_fields", f])
      ]);
  };

  React.useEffect(() => {
    const init = async (url, facet_fields) => {
      let r = await fetch(url);
      let records = await r.json();
      rebuildIndex({
        records,
        config: {
          facet_fields
        }
      });
    };
    if (searchParamsObject.records_url && searchParamsObject.facet_fields) {
      init(searchParamsObject.records_url, searchParamsObject.facet_fields);
    } else {
      //the app should work with JSON data stored at any URL but we also want a nice introduction to newcomers with sample data
      reload("/sample-records.json", ["days", "color"]);
    }
  }, []);

  const rebuildIndex = (s) => {
    setSettings(s);
    setIx(FacetedIndex(s.records, s.config));
  };

  return (
    <div className="container-fluid">
      <nav className="my-3">
        <ul className="nav nav-tabs">
          {[
            ["Search", "/"],
            ["Settings", "/settings"]
          ].map(([label, path]) => (
            <li className="nav-item" key={label}>
              <NavLink
                activeclassname="active"
                className="nav-link"
                to={path + (!!qs ? "?" + qs : "")}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Routes>
        <Route
          path="/settings"
          element={<Settings {...{ settings, rebuildIndex }} />}
        />
        <Route path="/" element={<Search ix={ix} />} />
      </Routes>
    </div>
  );
}
