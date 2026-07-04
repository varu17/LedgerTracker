import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1f6f5b' },
    secondary: { main: '#7b4f9d' },
    background: { default: '#f6f7f9', paper: '#ffffff' },
    success: { main: '#257a4d' },
    warning: { main: '#b26a00' },
    error: { main: '#b42318' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: ['Inter', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'].join(','),
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: { root: { boxShadow: 'none' } },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(20, 34, 47, 0.08)',
          boxShadow: '0 8px 28px rgba(20, 34, 47, 0.06)',
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
