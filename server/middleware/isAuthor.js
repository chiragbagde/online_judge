const { sql } = require("../database/neon");

const isAuthorOrAdmin = async (req, res, next) => {
    try {
        let u_id = req.body.u_id || req.params.u_id;
        if (!u_id) {
          return res.status(400).json({ 
            success: false, 
            message: 'User ID is required' 
          });
        }
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