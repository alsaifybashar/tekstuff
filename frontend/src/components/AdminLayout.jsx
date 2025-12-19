import React, { useState } from 'react';
import { Navbar, Nav, Container, Button, Offcanvas } from 'react-bootstrap';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut, Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showSidebar, setShowSidebar] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Översikt', path: '/admin' },
        { icon: Package, label: 'Produkter', path: '/admin/products' },
        { icon: ShoppingBag, label: 'Ordrar', path: '/admin/orders' },
        { icon: Users, label: 'Kunder', path: '/admin/users' },
        { icon: Settings, label: 'Inställningar', path: '/admin/settings' },
    ];

    const SidebarContent = () => (
        <div className="d-flex flex-column h-100">
            <div className="p-4 border-bottom">
                <h5 className="fw-bold text-primary mb-0 d-flex align-items-center">
                    <LayoutDashboard className="me-2" /> Admin
                </h5>
            </div>
            <Nav className="flex-column flex-grow-1 p-3">
                {navItems.map((item) => (
                    <Nav.Link
                        key={item.path}
                        as={NavLink}
                        to={item.path}
                        end={item.path === '/admin'} // Exact match for root
                        className={`d-flex align-items-center rounded-3 mb-1 px-3 py-2 ${location.pathname === item.path ? 'bg-primary text-white' : 'text-dark hover-bg-light'
                            }`}
                        onClick={() => setShowSidebar(false)} // Close mobile drawer on click
                    >
                        <item.icon size={18} className="me-3" />
                        {item.label}
                    </Nav.Link>
                ))}
            </Nav>
            <div className="p-3 border-top mt-auto">
                <div className="d-flex align-items-center mb-3 px-3">
                    <div className="flex-grow-1">
                        <div className="small fw-bold">{user?.username || 'Admin'}</div>
                        <div className="small text-muted" style={{ fontSize: '0.75rem' }}>Administratör</div>
                    </div>
                </div>
                <Button variant="outline-danger" className="w-100 d-flex align-items-center justify-content-center" onClick={handleLogout}>
                    <LogOut size={16} className="me-2" /> Logga ut
                </Button>
            </div>
        </div>
    );

    return (
        <div className="d-flex min-vh-100 bg-light">
            {/* Desktop Sidebar */}
            <div className="d-none d-lg-block bg-white border-end shadow-sm" style={{ width: '260px', position: 'fixed', top: 0, bottom: 0, overflowY: 'auto' }}>
                <SidebarContent />
            </div>

            {/* Mobile Sidebar (Offcanvas) */}
            <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Meny</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">
                    <SidebarContent />
                </Offcanvas.Body>
            </Offcanvas>

            {/* Main Content Area */}
            <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: '0', lg: { marginLeft: '260px' } }}>
                <div className="d-lg-none bg-white border-bottom p-3 d-flex align-items-center shadow-sm">
                    <Button variant="light" onClick={() => setShowSidebar(true)} className="me-3">
                        <Menu size={24} />
                    </Button>
                    <h5 className="mb-0 fw-bold">Admin Dashboard</h5>
                </div>

                <main className="p-4" style={{ marginLeft: window.innerWidth >= 992 ? '260px' : '0' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
