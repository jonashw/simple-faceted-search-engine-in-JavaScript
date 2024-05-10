import { Outlet, RouteObject } from "react-router-dom";
import FacetedSearchWizard from './components/FacetedSearchWizard.tsx';
import { New } from './components/New.tsx';

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Outlet />,
    children: [
      {
        path: "",
        element: 
        <div className="container pt-3">
          <FacetedSearchWizard />
        </div>,
      },
      {
        path: "/new",
        element: <New />
      }
    ]
  },
];
