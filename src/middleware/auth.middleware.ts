// Authentication Middleware
export function authenticate(req, res, next) {
    // Logic for authentication
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).send('Unauthorized');
    }
    // Verify token logic here...

    next(); // Call next middleware
}

// Admin Middleware
export function isAdmin(req, res, next) {
    // Logic for checking admin rights
    const user = req.user; // Assuming user is set by previous middleware
    if (!user || !user.isAdmin) {
        return res.status(403).send('Forbidden: Admins only');
    }
    next(); // Call next middleware
}