import "./styles.css";
import FacetedIndex from "./FacetedIndex";
import records from "./Records";
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink
} from "react-router-dom";
import Search from "./search";
import Settings from "./settings";

export default function App() {
  const [settings, setSettings] = React.useState({ records: [], config: {} });
  const [ix, setIx] = React.useState(FacetedIndex([], { facet_fields: [] }));

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
    <Router>
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
                  to={path}
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
    </Router>
  );
}
