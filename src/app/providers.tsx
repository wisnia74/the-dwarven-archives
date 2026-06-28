import { MantineProvider } from "@mantine/core";
import { RouterProvider } from "react-router/dom";

import { router } from "./router";
import { theme } from "./theme";

export const Providers = () => (
  <MantineProvider defaultColorScheme="auto" theme={theme}>
    <RouterProvider router={router} />
  </MantineProvider>
);
