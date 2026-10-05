const jwt = require("jsonwebtoken");
const User = require("../models/user.models");

const frontendUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

const googleAuth = (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CALLBACK_URL) {
    return res.status(500).json({ message: "Google sign-in is not configured" });
  }

  const state = jwt.sign({ purpose: "google" }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

const googleCallback = async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || req.query.error) {
    return res.redirect(`${frontendUrl()}/login?error=google`);
  }

  try {
    const payload = jwt.verify(state, process.env.JWT_SECRET);
    if (payload.purpose !== "google") {
      return res.redirect(`${frontendUrl()}/login?error=google`);
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return res.redirect(`${frontendUrl()}/login?error=google`);
    }

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.email || !profile.id) {
      return res.redirect(`${frontendUrl()}/login?error=google`);
    }

    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.findOne({ email: profile.email });
      if (user) {
        user.googleId = profile.id;
        user.isVerified = true;
        if (!user.profilePictureUrl && profile.picture) {
          user.profilePictureUrl = profile.picture;
        }
        await user.save();
      } else {
        user = await User.create({
          firstName: String(profile.given_name || "Aether").slice(0, 50),
          lastName: String(profile.family_name || "User").slice(0, 50),
          email: profile.email,
          googleId: profile.id,
          isVerified: true,
          profilePictureUrl: profile.picture || null,
        });
      }
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    return res.redirect(`${frontendUrl()}/auth/callback?token=${token}`);
  } catch (error) {
    console.log(error);
    return res.redirect(`${frontendUrl()}/login?error=google`);
  }
};

module.exports = { googleAuth, googleCallback };
