import React from 'react';
import { useRoutes } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { routes } from './app/routes';
import { theme } from './app/theme';
import Navbar from './components/Layout/Navbar';
import { AuthProvider } from './context/AuthContext';


const App = () => {
  const element = useRoutes(routes);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Navbar />
        {element}
      </AuthProvider>
    </ThemeProvider>
  );
};


export default App;
