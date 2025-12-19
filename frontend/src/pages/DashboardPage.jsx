import React, { useEffect, useState } from "react";
import {
    Container, Row, Col, Card, Navbar, Nav,
    Button, Table, Spinner, Badge, OverlayTrigger, Tooltip
} from "react-bootstrap";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, LineChart, Line, AreaChart, Area
} from "recharts";
import {
    LayoutDashboard, ShoppingBag, Users, TrendingUp,
    LogOut, Package, ExternalLink, ArrowUp, ArrowDown
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch dashboard stats
        const fetchStats = async () => {
            try {
                const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
                const response = await fetch(`${baseUrl}/dashboard/stats`);
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center min-vh-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    // Calculate trends for cards
    const StatCard = ({ title, value, trend, icon: Icon, color }) => (
        <Card className="border-0 shadow-sm h-100 rounded-4 overflow-hidden">
            <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className={`p-3 rounded-3 bg-${color} bg-opacity-10 text-${color}`}>
                        <Icon size={24} />
                    </div>
                    {trend !== undefined && (
                        <Badge bg={trend >= 0 ? "success" : "danger"} className="px-2 py-1 rounded-pill">
                            {trend >= 0 ? <ArrowUp size={12} className="me-1" /> : <ArrowDown size={12} className="me-1" />}
                            {Math.abs(trend)}%
                        </Badge>
                    )}
                </div>
                <div className="text-muted small mb-1 text-uppercase fw-bold ls-1">{title}</div>
                <h3 className="fw-bold mb-0">{value}</h3>
            </Card.Body>
        </Card>
    );

    return (
        <div className="bg-light min-vh-100 pb-5">
            {/* Top Navbar */}
            <Navbar bg="white" variant="light" className="shadow-sm py-3 mb-5 px-4 sticky-top">
                <Container fluid>
                    <Navbar.Brand href="/admin" className="d-flex align-items-center fw-bold text-primary">
                        <LayoutDashboard size={24} className="me-2" />
                        Admin Dashboard
                    </Navbar.Brand>
                    <Nav className="ms-auto align-items-center">
                        <span className="me-3 text-muted d-none d-md-block">
                            Välkommen, <strong>{user?.username}</strong>
                        </span>
                        <Button variant="outline-danger" size="sm" onClick={handleLogout} className="d-flex align-items-center rounded-pill px-3">
                            <LogOut size={16} className="me-2" /> Logga ut
                        </Button>
                    </Nav>
                </Container>
            </Navbar>

            <Container fluid="xl">
                {/* Stats Row */}
                <Row className="g-4 mb-5">
                    <Col md={4}>
                        <StatCard
                            title="Total Försäljning"
                            value={`${stats?.overview?.totalRevenue?.toLocaleString()} kr`}
                            trend={stats?.overview?.revenueChange}
                            icon={TrendingUp}
                            color="success"
                        />
                    </Col>
                    <Col md={4}>
                        <StatCard
                            title="Antal Order"
                            value={stats?.overview?.totalOrders}
                            trend={stats?.overview?.ordersChange}
                            icon={ShoppingBag}
                            color="primary"
                        />
                    </Col>
                    <Col md={4}>
                        <StatCard
                            title="Besökare"
                            value={stats?.overview?.totalVisits?.toLocaleString()}
                            trend={stats?.overview?.visitsChange}
                            icon={Users}
                            color="info"
                        />
                    </Col>
                </Row>

                {/* Charts & Main Content */}
                <Row className="g-4 mb-5">
                    <Col lg={8}>
                        <Card className="border-0 shadow-sm h-100 rounded-4">
                            <Card.Header className="bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">Försäljningsöversikt</h5>
                                <select className="form-select form-select-sm w-auto rounded-pill border-0 bg-light">
                                    <option>Senaste 6 mån</option>
                                    <option>Senaste året</option>
                                </select>
                            </Card.Header>
                            <Card.Body className="px-4 pb-4">
                                <div style={{ height: 350, width: "100%" }}>
                                    <ResponsiveContainer>
                                        <AreaChart data={stats?.salesData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#0d6efd" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} unit=" kr" />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#0d6efd"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorRevenue)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm h-100 rounded-4">
                            <Card.Header className="bg-white border-0 py-3 px-4">
                                <h5 className="fw-bold mb-0">Toppsäljare</h5>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div className="list-group list-group-flush">
                                    {stats?.topProducts?.map((product, idx) => (
                                        <div key={idx} className="list-group-item border-0 px-4 py-3 d-flex align-items-center">
                                            <div className="bg-light rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: 40, height: 40 }}>
                                                <Package size={20} className="text-secondary" />
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="fw-semibold text-truncate" style={{ maxWidth: '150px' }}>{product.name}</div>
                                                <div className="small text-muted">{product.sales} sålda</div>
                                            </div>
                                            <div className="fw-bold text-end">
                                                {product.price} kr
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 text-center border-top">
                                    <Button variant="link" className="text-decoration-none text-muted fw-bold small">
                                        Visa alla produkter <ExternalLink size={14} className="ms-1" />
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Recent Orders Table */}
                <Card className="border-0 shadow-sm rounded-4">
                    <Card.Header className="bg-white border-0 py-3 px-4">
                        <h5 className="fw-bold mb-0">Senaste ordrar</h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Table responsive hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4 py-3 border-0 text-muted small fw-bold text-uppercase">Order ID</th>
                                    <th className="py-3 border-0 text-muted small fw-bold text-uppercase">Kund</th>
                                    <th className="py-3 border-0 text-muted small fw-bold text-uppercase">Datum</th>
                                    <th className="py-3 border-0 text-muted small fw-bold text-uppercase">Status</th>
                                    <th className="px-4 py-3 border-0 text-muted small fw-bold text-uppercase text-end">Belopp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentOrders?.map((order) => (
                                    <tr key={order.id}>
                                        <td className="px-4 py-3 fw-bold text-primary">{order.id}</td>
                                        <td>{order.customer}</td>
                                        <td className="text-muted text-nowrap">Idag, 14:30</td>
                                        <td>
                                            <Badge
                                                bg={
                                                    order.status === 'Completed' ? 'success' :
                                                        order.status === 'Shipped' ? 'info' :
                                                            'warning'
                                                }
                                                className="rounded-pill px-3 fw-normal"
                                            >
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 text-end fw-bold">{order.amount.toLocaleString()} kr</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
}
