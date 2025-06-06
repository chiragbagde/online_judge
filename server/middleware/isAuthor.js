const { sql } = require("../database/neon");

const isAuthorOrAdmin = async (req, res, next) => {
    try {
      const { u_id } = req.body;
      const user = await sql`SELECT * FROM users WHERE id = ${u_id}`;
      console.log(user);
      const adminUser = user[0].role;
      
      if (adminUser !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to perform this action' 
        });
      }
      
      next();
    } catch (error) {
      console.error('Error checking user role:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  };

module.exports = isAuthorOrAdmin;