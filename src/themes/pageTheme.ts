import { createTheme } from "@mui/material/styles";

const pageTheme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
  },
  palette: {
    primary: {
      main: "#0a9396",
    },
    secondary: {
      main: "#e9d8a6",
    },
  },
});

export default pageTheme;