import { createBrowserRouter, Navigate } from "react-router";

import { AppShell } from "../layouts";
import { Worlds } from "../pages";

export const router = createBrowserRouter([
  /* eslint-disable perfectionist/sort-jsx-props, perfectionist/sort-objects */
  {
    element: <AppShell />,
    children: [
      {
        path: "/",
        element: <Navigate to="/worlds" replace />,
      },
      {
        path: "/worlds",
        element: <Worlds />,
      },
    ],
  },
  /* eslint-enable perfectionist/sort-jsx-props, perfectionist/sort-objects */
]);
