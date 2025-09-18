import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../firebase/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Meeting Rooms
        </Typography>
        <Button color="inherit" component={Link} to="/">Rooms</Button>
        <Button color="inherit" component={Link} to="/bookings">Bookings</Button>
        {user ? (
          <>
            <Typography sx={{ mx: 2 }}>{user.displayName || user.email}</Typography>
            <Button color="inherit" onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <>
            <Button color="inherit" component={Link} to="/login">Login</Button>
            <Button color="inherit" component={Link} to="/register">Register</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
