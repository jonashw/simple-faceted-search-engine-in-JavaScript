import { StrictMode } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./components/App";
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <StrictMode>
    <Router>
      <div className="container pt-3">
        <App/>
      </div>
    </Router>
  </StrictMode>);