import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Menu as MenuIcon,
  Folder as FolderIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  PhotoLibrary as PhotoLibraryIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const drawerWidth = 280;

const menuItems = [
  { text: '프로젝트 관리', icon: <FolderIcon />, path: '/projects', badge: null },
  { text: '일정 관리', icon: <ScheduleIcon />, path: '/schedule', badge: null },
  { text: '사진첩', icon: <PhotoLibraryIcon />, path: '/gallery', badge: null },
  { text: '내 정보', icon: <PersonIcon />, path: '/profile', badge: null }
];

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const getBreadcrumbs = (pathname) => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const name = segment === 'projects' ? '프로젝트 관리' : 
                   segment === 'schedule' ? '일정 관리' :
                   segment === 'gallery' ? '사진첩' :
                   segment === 'profile' ? '내 정보' : segment;
      
      breadcrumbs.push({
        name,
        path: currentPath,
        isLast: index === pathSegments.length - 1
      });
    });
    
    return breadcrumbs;
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 3, textAlign: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" component="h1" color="primary" fontWeight="bold">
          🏗️ 안전관리 ERP
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          산업안전보고서 통합관리시스템
        </Typography>
      </Box>
      
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleMenuClick(item.path)}
              selected={location.pathname === item.path}
              sx={{
                mx: 2,
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
              {item.badge && (
                <Badge
                  badgeContent={item.badge}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.75rem',
                      height: 20,
                      minWidth: 20,
                    },
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Breadcrumbs */}
          <Box sx={{ flexGrow: 1 }}>
            <Breadcrumbs separator={<ChevronRightIcon fontSize="small" />}>
              {getBreadcrumbs(location.pathname).map((crumb, index) => (
                <Link
                  key={crumb.name}
                  color="inherit"
                  href={crumb.path}
                  underline="hover"
                  sx={{
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {crumb.name}
                </Link>
              ))}
            </Breadcrumbs>
          </Box>

          {/* Right side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Removed Search Icon */}
            
            <Tooltip title="알림">
              <IconButton color="inherit">
                <Badge badgeContent={0} color="error">
                  {/* Removed NotificationsIcon */}
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="사용자 계정">
              <IconButton color="inherit">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {/* Removed AccountCircleIcon */}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px', // AppBar height
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
