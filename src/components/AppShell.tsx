import { Burger, AppShell as MantineAppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import React from "react";

type AppShellProps = React.PropsWithChildren;

export const AppShell = ({ children }: AppShellProps) => {
  const [opened, { toggle }] = useDisclosure();

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        breakpoint: "sm",
        collapsed: { mobile: !opened },
        width: 300,
      }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Burger hiddenFrom="sm" onClick={toggle} opened={opened} size="sm" />

        <div>Logo</div>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar>Navbar</MantineAppShell.Navbar>

      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  );
};
