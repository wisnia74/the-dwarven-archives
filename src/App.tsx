import { Link, useLocation, useNavigation } from "react-router";

export const App = () => {
  const [nav, loc] = [useNavigation(), useLocation()];

  console.log({ loc, nav });

  return <Link to={"test"}>test</Link>;
};
