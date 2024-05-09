import React from 'react'
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import ReactDOM from 'react-dom/client'
import { routes } from './routes.tsx';

const router = createBrowserRouter(routes);

ReactDOM
.createRoot(document.getElementById('root')!)
.render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>);