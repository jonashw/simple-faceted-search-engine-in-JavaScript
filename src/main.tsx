import React from 'react'
import { BrowserRouter as Router } from "react-router-dom";
import ReactDOM from 'react-dom/client'
import App from './components/App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <div className="container pt-3">
        <App/>
      </div>
    </Router>
  </React.StrictMode>,
)
