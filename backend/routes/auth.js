// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User } = require('../models');
const { OAuth2Client } = require('google-auth-library');

// ✅ Initialize Google OAuth Client (set GOOGLE_CLIENT_ID in .env)
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// REGISTER

router.post('/google', async (req, res) => {
  try {
    const { googleToken } = req.body;
    
    if (!googleToken) {
      return res.status(400).json({ 
        success: false,
        error: 'Google token is required' 
      });
    }
    
    console.log('🔐 Verifying Google token...');
    
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const googleEmail = payload.email;
    const googleName = payload.name;
    const googleId = payload.sub; // ✅ Google user ID
    const profilePicture = payload.picture; // ✅ Profile picture URL
    
    console.log('🔐 Google payload:', { googleEmail, googleName, googleId });
    
    // ✅ Check by email OR googleId
    let user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { email: googleEmail },
          { googleId: googleId }
        ]
      } 
    });
    
    if (!user) {
      console.log('👤 Creating new Google user...');
      user = await User.create({
        email: googleEmail,
        name: googleName,
        googleId: googleId,
        authProvider: 'google', // ✅ Mark as Google auth
        profilePicture: profilePicture,
        password: null, // ✅ No password for OAuth users
        role: 'customer'
      });
    } else if (!user.googleId) {
      // ✅ Link existing email account to Google
      console.log('🔗 Linking existing user to Google...');
      await user.update({
        googleId: googleId,
        authProvider: 'google',
        profilePicture: profilePicture || user.profilePicture
      });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'mikes_pizza_super_secret_2025_change_in_prod',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
    
  } catch (error) {
    console.error('❌ Google auth error:', error);
    res.status(401).json({ 
      success: false,
      error: error.message || 'Google authentication failed' 
    });
  }
});

module.exports = router;
