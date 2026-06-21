import { createBrowserRouter } from "react-router";

import { WorldsPage } from "./pages";

export const router = createBrowserRouter([
  {
    element: <WorldsPage />,
    path: "/",
  },
]);
