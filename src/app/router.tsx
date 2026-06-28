import { createBrowserRouter, Navigate } from "react-router";

import { AppShell } from "@/layouts/AppShell";
import { Artifacts } from "@/pages/Artifacts";
import { Chronicles } from "@/pages/Chronicles";
import { Civilizations } from "@/pages/Civilizations";
import { CodicesScrolls } from "@/pages/CodicesScrolls";
import { HistoricalFigures } from "@/pages/HistoricalFigures";
import { Regions } from "@/pages/Regions";
import { Sites } from "@/pages/Sites";
import { Structures } from "@/pages/Structures";
import { UndergroundRegions } from "@/pages/UndergroundRegions";
import { Worlds } from "@/pages/Worlds";

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
      {
        path: "/historical-figures",
        element: <HistoricalFigures />,
      },
      {
        path: "/sites",
        element: <Sites />,
      },
      {
        path: "/artifacts",
        element: <Artifacts />,
      },
      {
        path: "/codices-scrolls",
        element: <CodicesScrolls />,
      },
      {
        path: "/regions",
        element: <Regions />,
      },
      {
        path: "/underground-regions",
        element: <UndergroundRegions />,
      },
      {
        path: "/civilizations",
        element: <Civilizations />,
      },
      {
        path: "/structures",
        element: <Structures />,
      },
      {
        path: "/chronicles",
        element: <Chronicles />,
      },
    ],
  },
  /* eslint-enable perfectionist/sort-jsx-props, perfectionist/sort-objects */
]);
