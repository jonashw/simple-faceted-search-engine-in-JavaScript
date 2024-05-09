import React from 'react';
import { Outlet, RouteObject } from "react-router-dom";
import FacetedSearchWizard from './components/FacetedSearchWizard.tsx';
import { New } from './components/New.tsx';

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <div className="container pt-3"><Outlet /></div>,
    children: [
      {
        path: "",
        element: <FacetedSearchWizard />
      },
      {
        path: "/new",
        element: <New />
      }
    ]
  },
];
