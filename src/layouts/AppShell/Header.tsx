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
          px="0"
          size="sm"
        />
        <p>The Amber Codex</p>
      </Group>
    </MantineAppShell.Header>
  );
};
