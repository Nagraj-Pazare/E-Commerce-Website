import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required."],
    match: /^[a-zA-Z0-9_]+$/,
    validate: {
      validator: function(v) {
        return v && v.trim().length > 0; // Fails if empty or just spaces
      },
      message: "Username cannot be empty"
    }
  },
  role:{
    type: String,
    required: [true, "Role is required."],
    enum: {
      values: ['user', 'admin'],
      message: '{VALUE} is not a valid role. Allowed roles are: user, admin'
    },
    default: 'user'
  },
  email: {
    type: String,
    required: [true, "Email is required."],
    unique: true,
    match: /.+\@.+\..+/,
    validate: {
      validator: function(v) {
        return v && v.trim().length > 0; // Fails if empty or just spaces
      },
      message: "Email cannot be empty"
    }
  },
  password: {
    type: String,
    required: [true, "Password is required."],
    validate: {
      validator: function(v) {
        return v && v.trim().length > 0; // Fails if empty or just spaces
      },
      message: "Password cannot be empty"
    }
  },
});

const User = mongoose.model("User", userSchema);

export default User;
