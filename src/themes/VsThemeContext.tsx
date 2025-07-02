import { ThemeProvider } from "@emotion/react";
import { createContext, useEffect, useState } from "react";
import pageTheme, { darkTheme } from "./pageTheme";

const VsThemeContext = createContext<{
  theme: string;
  handleThemeChange: (theme: string) => void;
}>({
  theme: "vs-light",
  handleThemeChange: () => {},
});

export const VsThemeContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [vsTheme, setVsTheme] = useState("vs-light");

  useEffect(() => {
    const previousTheme = localStorage.getItem("theme");
    if (previousTheme) {
      setVsTheme(previousTheme);
    }
  }, []);

  const handleThemeChange = (theme: string) => {
    setVsTheme(theme);
    localStorage.setItem("theme", theme);
  };

  return (
    <VsThemeContext.Provider
      value={{ theme: vsTheme, handleThemeChange: handleThemeChange }}
    >
      <ThemeProvider theme={vsTheme === "vs-dark" ? darkTheme : pageTheme}>
        {children}
      </ThemeProvider>
    </VsThemeContext.Provider>
  );
};

export default VsThemeContext;
