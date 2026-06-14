import { Burger, AppShell as MantineAppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export const AppShell = () => {
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

      <MantineAppShell.Main>Main</MantineAppShell.Main>
    </MantineAppShell>
  );
};
