import { Box, AppShell as MantineAppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet } from "react-router";

import { Header } from "./Header";
import { Navbar } from "./Navbar";

export const AppShell = () => {
  const [isNavbarOpened, { toggle: toggleNavbarOpened }] = useDisclosure(false);

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        breakpoint: "sm",
        collapsed: { mobile: !isNavbarOpened },
        width: 300,
      }}
    >
      <Header
        isNavbarOpened={isNavbarOpened}
        toggleNavbarOpened={toggleNavbarOpened}
      />
      <Navbar />
      <MantineAppShell.Main>
        <Box pt="xs" px="sm">
          <Outlet />
        </Box>
      </MantineAppShell.Main>
    </MantineAppShell>
  );
};
