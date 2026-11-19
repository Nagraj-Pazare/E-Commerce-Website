import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../../models/userModel.js';

export const configureGoogleOAuth = () => {
  // 1. Configure Strategy
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (user){
          return done(null, user);
        } 

        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          user.googleId = profile.id;
          await user.save();
          return done(null, user);
        }

        user = await User.create({
          username: profile.displayName || profile.emails[0].value.split('@')[0],
          email: profile.emails[0].value,
          googleId: profile.id,
          role: 'user'
        });

        return done(null, user);
      } catch (err) {
        console.log("configGoogle: ",err);
        
        return done(err, null);
      }
    }
  ));

  // 2. Serialize user into session
  passport.serializeUser((user, done) => {
    if (!user) {
        
        return done(new Error("User object is missing during serialization"));
    }
    // Use user.id (Mongoose provides .id as a virtual getter for _id string)
    done(null, user.id);
  });

  // 3. Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
  });
};