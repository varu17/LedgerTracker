import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MenuIcon from '@mui/icons-material/Menu';
import { ReactNode, useState } from 'react';
import type { NavKey } from '../types';

const drawerWidth = 248;

const navItems: Array<{ key: NavKey; label: string; icon: ReactNode }> = [
  { key: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { key: 'people', label: 'People', icon: <PeopleIcon /> },
  { key: 'categories', label: 'Categories', icon: <CategoryIcon /> },
  { key: 'transactions', label: 'Transactions', icon: <ReceiptLongIcon /> },
];

type AppLayoutProps = {
  activePage: NavKey;
  onNavigate: (page: NavKey) => void;
  children: ReactNode;
};

export function AppLayout({ activePage, onNavigate, children }: AppLayoutProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawer = (
    <Box
      sx={{
        height: '100%',
        color: 'white',
        background:
          'linear-gradient(158deg, #031b14 0%, #063d2c 38%, #0b7a54 72%, #21c47b 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.72), transparent)',
        },
      }}
    >
      <Toolbar sx={{ px: 3, position: 'relative' }}>
        <Typography variant="h6" sx={{ letterSpacing: 0, fontWeight: 800 }}>
          IN2World
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.16)', position: 'relative' }} />
      <List sx={{ px: 1.5, py: 2, position: 'relative' }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.key}
            selected={activePage === item.key}
            onClick={() => {
              onNavigate(item.key);
              setMobileOpen(false);
            }}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              color: 'rgba(236,255,247,0.82)',
              '&.Mui-selected': {
                bgcolor: 'rgba(236,255,247,0.18)',
                color: 'white',
                boxShadow: 'inset 3px 0 0 #8ff5ba',
              },
              '&:hover': { bgcolor: 'rgba(236,255,247,0.12)' },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { md: 'none' },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid rgba(20, 34, 47, 0.1)',
        }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1 }}>
            IN2World
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop || mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              border: 0,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          pt: { xs: 9, md: 0 },
          px: { xs: 2, sm: 3, lg: 4 },
          py: { xs: 3, md: 4 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
