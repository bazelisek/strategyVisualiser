import { createTheme } from "@mui/material/styles";

const materialTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#4cafef" },
    background: {
      default: "#121212",
      paper: "#1e1e2a",
    },
    text: {
      primary: "#e0e0e0",
      secondary: "#e0e0e0",
    },
    divider: "rgba(76, 175, 239, 0.25)",
  },
  shape: { borderRadius: 1 },
  typography: { fontFamily: "var(--font-base)" },
});

export default materialTheme;
