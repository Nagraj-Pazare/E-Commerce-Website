import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required."],
    match: /^[a-zA-Z0-9_]+$/
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
    match: /.+\@.+\..+/
  },
  password: {
    type: String,
    required: [true, "Password is required."],
     match: [
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character.'
    ]
  },
});

const User = mongoose.model("User", userSchema);

export default User;
