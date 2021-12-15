import "./styles.css";
import FacetedIndex from "./FacetedIndex";
import records from "./Records";
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
  React.useEffect(() => {
    rebuildIndex({
      records,
      config: {
        facet_fields: ["days", "color", "priority"]
      }
    });
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
            <li className="nav-item">
              <NavLink
                activeClassName="active"
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
