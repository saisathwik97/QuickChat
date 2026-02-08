const express = require("express");
const router = express.Router();
const { registerUser, authUser ,allUsers} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
router.post("/register", registerUser);
router.post("/login", require("../controllers/userController").authUser);
router.get("/",protect,allUsers);
module.exports = router;