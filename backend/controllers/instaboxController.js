const axios = require('axios');

// Using memory cache for token for simplicity in this session
// In production, use Redis or a more robust solution
let tokenCache = {
    accessToken: null,
    expiresAt: 0
};

const INSTABOX_API_URL = process.env.INSTABOX_API_URL || 'https://api.instabox.se';
const CLIENT_ID = process.env.INSTABOX_CLIENT_ID;
const CLIENT_SECRET = process.env.INSTABOX_CLIENT_SECRET;

// Helper to get access token
const getAccessToken = async () => {
    // Return cached token if still valid (with 5 min buffer)
    if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 300000) {
        return tokenCache.accessToken;
    }

    try {
        if (!CLIENT_ID || !CLIENT_SECRET) {
            throw new Error("Instabox credentials not configured in environment");
        }

        const response = await axios.post(`${INSTABOX_API_URL}/v2/oauth/token`, {
            grant_type: 'client_credentials',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
        });

        const { access_token, expires_in } = response.data;

        tokenCache = {
            accessToken: access_token,
            expiresAt: Date.now() + (expires_in * 1000)
        };

        return access_token;
    } catch (error) {
        console.error('Instabox Auth Error:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with Instabox');
    }
};

exports.checkAvailability = async (req, res) => {
    try {
        const {
            street,
            zip_code,
            city,
            country_code = 'SE'
        } = req.body;

        // Security: Input Validation
        if (!zip_code || typeof zip_code !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid or missing zip code' });
        }

        // Sanitize Strings to prevent massive payloads or unexpected types
        const cleanZip = zip_code.trim().substring(0, 10); // Max 10 chars
        if (cleanZip.length < 3) {
            return res.status(400).json({ success: false, message: 'Zip code too short' });
        }

        // Optional fields validation
        if (street && (typeof street !== 'string' || street.length > 200)) {
            return res.status(400).json({ success: false, message: 'Invalid street address' });
        }
        if (city && (typeof city !== 'string' || city.length > 100)) {
            return res.status(400).json({ success: false, message: 'Invalid city' });
        }

        // Mock response if no credentials (to prevent app breaking during dev without keys)
        if (!CLIENT_ID || !CLIENT_SECRET) {
            console.warn("Using MOCK Instabox response (Missing Credentials)");

            // Simulate API delay
            await new Promise(r => setTimeout(r, 600));

            const isStockholm = zip_code.startsWith('1');
            if (!isStockholm) {
                return res.json({
                    success: true,
                    options: []
                });
            }

            return res.json({
                success: true,
                options: [
                    {
                        id: 'ib-express',
                        name: 'Instabox Express',
                        type: 'LOCKER',
                        price: 39,
                        eta: 'Imorgon 12:30',
                        location: {
                            name: 'ICA Nära',
                            address: 'Storgatan 1',
                            distance: '350m'
                        }
                    },
                    {
                        id: 'ib-home',
                        name: 'Instabox Hem',
                        type: 'HOME',
                        price: 69,
                        eta: 'Imorgon 17:00-22:00'
                    }
                ]
            });
        }

        // Real API Call
        const token = await getAccessToken();

        // Using Availability v3 as per docs
        const response = await axios.post(
            `${INSTABOX_API_URL}/v3/availability`,
            {
                street,
                zip_code, // Instabox often expects "zip_code" specifically
                city,
                country_code,
                service_types: ['LOCKER', 'HOME'] // Request both
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Transform response to our frontend format
        // Instabox structure varies, typically returns list of "availability" objects
        const options = response.data.map(opt => {
            let name = 'Instabox';
            let type = 'UNKNOWN';
            let price = 49; // Default or calculate based on rules

            if (opt.service_type === 'LOCKER') {
                name = 'Instabox Express';
                type = 'LOCKER';
                price = 39;
            } else if (opt.service_type === 'HOME') {
                name = 'Instabox Hem';
                type = 'HOME';
                price = 69;
            }

            return {
                id: `ib-${opt.service_type.toLowerCase()}-${opt.availability_token || Math.random()}`,
                name,
                type,
                price, // backend logic for pricing usually goes here or from shipping rules
                eta: opt.eta || '1-2 dagar',
                location: opt.location ? {
                    name: opt.location.name,
                    address: opt.location.address,
                    distance: opt.distance
                } : null,
                raw: opt // keep raw for debugging or booking later
            };
        });

        res.json({
            success: true,
            options
        });

    } catch (error) {
        console.error('Instabox Availability Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch delivery options check internal logs'
        });
    }
};
