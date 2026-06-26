import { MantineProvider } from "@mantine/core";
import { RouterProvider } from "react-router/dom";

import { router } from "./router";

export const Providers = () => (
  <MantineProvider defaultColorScheme="auto">
    <RouterProvider router={router} />
  </MantineProvider>
);
