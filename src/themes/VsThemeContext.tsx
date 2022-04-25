import { createContext } from "react";

const VsThemeContext = createContext({
  theme: "vs-light",
  handleThemeChange: (theme: string) => {},
});

export default VsThemeContext;
