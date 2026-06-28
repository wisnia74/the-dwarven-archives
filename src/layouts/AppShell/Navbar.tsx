import { AppShell as MantineAppShell } from "@mantine/core";

import { NavLink } from "./NavLink";

export const Navbar = () => (
  <MantineAppShell.Navbar>
    <NavLink label="Historical figures" to="/historical-figures" />
    <NavLink label="Sites" to="/sites" />
    <NavLink label="Artifacts" to="/artifacts" />
    <NavLink label="Codices, scrolls, etc." to="/codices-scrolls" />
    <NavLink label="Regions" to="/regions" />
    <NavLink label="Underground regions" to="/underground-regions" />
    <NavLink label="Civilizations and other entities" to="/civilizations" />
    <NavLink label="Structures" to="/structures" />
    <NavLink label="Chronicles by age" to="/chronicles" />
  </MantineAppShell.Navbar>
);
