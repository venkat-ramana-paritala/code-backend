const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "defaultsecret", {
        expiresIn: "30d",
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { username, email, password, pharmacyAddress, pharmacyBranch } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Please add all fields" });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        username,
        email,
        password: hashedPassword,
        pharmacyAddress,
        pharmacyBranch,
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            username: user.username,
            email: user.email,
            pharmacyAddress: user.pharmacyAddress,
            pharmacyBranch: user.pharmacyBranch,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: "Invalid user data" });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user.id,
            username: user.username,
            email: user.email,
            pharmacyAddress: user.pharmacyAddress,
            pharmacyBranch: user.pharmacyBranch,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: "Invalid credentials" });
    }
};

// @desc    Get user data
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user.id);

    if (user) {
        res.json({
            _id: user.id,
            username: user.username,
            email: user.email,
            pharmacyAddress: user.pharmacyAddress,
            pharmacyBranch: user.pharmacyBranch,
        });
    } else {
        res.status(404).json({ message: "User not found" });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user.id);

    if (user) {
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.pharmacyAddress = req.body.pharmacyAddress || user.pharmacyAddress;
        user.pharmacyBranch = req.body.pharmacyBranch || user.pharmacyBranch;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            pharmacyAddress: updatedUser.pharmacyAddress,
            pharmacyBranch: updatedUser.pharmacyBranch,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404).json({ message: "User not found" });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
};
