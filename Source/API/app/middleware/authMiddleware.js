const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // token is sent in the header 'Authorization' as: 'Bearer <token>'
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. Token not included.' });
    }

    try {
        // verifies token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // adds the decoded payload (email, isProfessor) to the req object
        // any contoller can access the logged-in user's info through req.user
        req.user = decoded;
        
        next(); // goes to next step (controller)
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

module.exports = verifyToken;
