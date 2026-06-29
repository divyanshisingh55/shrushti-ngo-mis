import { createContext, useState, useMemo, useContext } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ColorModeContext = createContext({ toggleColorMode: () => {}, mode: "light" });

export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem("themeMode") || "light";
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const nextMode = prevMode === "light" ? "dark" : "light";
          localStorage.setItem("themeMode", nextMode);
          return nextMode;
        });
      },
      mode
    }),
    [mode]
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: "#0d9488", // Teal brand color
          },
          secondary: {
            main: "#3b82f6", // Blue secondary
          },
          background: {
            default: mode === "light" ? "#f8fafc" : "#0b0f19",
            paper: mode === "light" ? "#ffffff" : "#111827",
          },
          text: {
            primary: mode === "light" ? "#0f172a" : "#f9fafb",
            secondary: mode === "light" ? "#64748b" : "#9ca3af",
          },
          divider: mode === "light" ? "#f1f5f9" : "#1f2937",
        },
        typography: {
          fontFamily: "'Inter', sans-serif",
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                transition: "background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
              }
            }
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                transition: "background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
              }
            }
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              }
            }
          }
        }
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export const useColorMode = () => useContext(ColorModeContext);
