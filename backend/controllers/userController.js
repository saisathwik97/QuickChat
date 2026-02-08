const asyncHandler = require("express-async-handler");
const User = require("../models/userSchema");
const generateToken = require("../config/token");
const bcrypt = require("bcrypt");
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, pic } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error("Please enter all the fields");
  }
  const passwordHash = await bcrypt.hash(password, 10);

  const isExistingUser = await User.findOne({ email });
  if (isExistingUser) {
    res.status(400);
    throw new Error("User already exists");
  }

  const newUser = await User.create({
    username,
    email,
    password: passwordHash,
    pic
  });

  if (!newUser) {
    res.status(400);
    throw new Error("User not found");
  }

  res.status(201).json({
    _id: newUser._id,
    username: newUser.username,
    email: newUser.email,
    token: generateToken(newUser._id)
  });
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            pic: user.pic,
            token: generateToken(user._id),
        });
    }
    else {
        res.status(401);
        throw new Error("Invalid email or password");
    }         
});
const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search?{
   $or: [
      { username: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } }, 
    ],
  } : {};
  const users = await User.find(keyword).find({_id: {$ne: req.user._id}});
  res.send(users);
});

module.exports = { registerUser , authUser , allUsers };
