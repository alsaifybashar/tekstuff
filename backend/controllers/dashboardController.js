const { mockProducts } = require('../utils/mockData');

// Helper to generate random chart data
const generateChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
        name: month,
        revenue: Math.floor(Math.random() * 50000) + 10000,
        orders: Math.floor(Math.random() * 100) + 20
    }));
};

const getDashboardStats = async (req, res) => {
    try {
        // In a real app, these would come from the database (COUNT(*), SUM(price), etc.)
        // For now, we simulate this data to ensure the frontend works perfectly even without DB.

        const stats = {
            overview: {
                totalRevenue: 234990, // kr
                revenueChange: 12.5,  // %
                totalOrders: 154,
                ordersChange: 8.2,
                totalVisits: 12500,
                visitsChange: -2.4,
            },
            salesData: generateChartData(),
            topProducts: mockProducts.slice(0, 5).map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                sales: Math.floor(Math.random() * 50) + 10
            })),
            recentOrders: [
                { id: "#ORD-001", customer: "Anna Andersson", amount: 12990, status: "Completed" },
                { id: "#ORD-002", customer: "Erik Svensson", amount: 499, status: "Processing" },
                { id: "#ORD-003", customer: "Maria Nilsson", amount: 8990, status: "Shipped" },
            ]
        };

        res.json(stats);
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getDashboardStats
};
