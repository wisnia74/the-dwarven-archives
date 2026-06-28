import { Burger, Group, AppShell as MantineAppShell } from "@mantine/core";
import { type UseDisclosureHandlers } from "@mantine/hooks";

export const Header = ({
  isNavbarOpened,
  toggleNavbarOpened,
}: {
  isNavbarOpened: boolean;
  toggleNavbarOpened: UseDisclosureHandlers["toggle"];
}) => {
  return (
    <MantineAppShell.Header px="sm">
      <Group>
        <Burger
          hiddenFrom="sm"
          onClick={toggleNavbarOpened}
          opened={isNavbarOpened}
          size="sm"
        />
        <p>Logo</p>
      </Group>
    </MantineAppShell.Header>
  );
};
