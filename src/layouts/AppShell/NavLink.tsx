import type { ComponentProps } from "react";

import { NavLink as MantineNavLink } from "@mantine/core";
import { NavLink as ReactRouterNavLink } from "react-router";

export const NavLink = ({
  label,
  to,
}: {
  label: ComponentProps<typeof MantineNavLink<"a">>["label"];
  to: ComponentProps<typeof ReactRouterNavLink>["to"];
}) => (
  <MantineNavLink
    label={label}
    p="xs"
    renderRoot={(props) => <ReactRouterNavLink {...props} to={to} />}
  />
);
