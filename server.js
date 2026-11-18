
require("dotenv").config();
const jwt = require("jsonwebtoken");
const connectDB = require("./db");
const User = require("./models/User");
const Blog = require("./models/Blog");

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());

// Home API
app.get("/", (req, res) => {
    res.send("MyBlog Backend Server is Running!");
});

// Registration API
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name,
            email: email.toLowerCase(),
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({
            message: "User registered successfully!"
        });

    } catch (error) {
        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
});

// Login API with JWT Authentication
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase()
        });

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid password"
            });
        }

        // Generate JWT Token
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login successful!",
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// JWT Authentication Middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access denied. No token provided."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

// Private Dashboard API
app.get("/api/dashboard", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "Welcome to your private dashboard!",
            user: user
        });

    } catch (error) {
        res.status(500).json({
            message: "Dashboard error",
            error: error.message
        });
    }
});
// User Profile API
app.get("/api/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "Profile fetched successfully!",
            user: user
        });

    } catch (error) {
        res.status(500).json({
            message: "Profile fetch failed",
            error: error.message
        });
    }
});


// Create Blog API - JWT Protected
app.post("/api/blogs", verifyToken, async (req, res) => {
    try {
        const { title, author, content } = req.body;

        if (!title || !author || !content) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const newBlog = new Blog({
            title: title.trim(),
            author: author.trim(),
            content: content,
            user: req.user.id
        });

        await newBlog.save();

        res.status(201).json({
            message: "Blog Published Successfully!",
            blog: newBlog
        });

    } catch (error) {
        res.status(500).json({
            message: "Blog creation failed",
            error: error.message
        });
    }
});

// Get Logged-in User's Blogs
app.get("/api/blogs", verifyToken, async (req, res) => {
    try {
        const blogs = await Blog.find({
            user: req.user.id
        }).sort({
            createdAt: -1
        });

        res.status(200).json(blogs);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch user blogs",
            error: error.message
        });
    }
});

// Update Blog API
app.put("/api/blogs/:id", verifyToken, async (req, res) => {
    try {
        const { title, author, content } = req.body;
        const blogId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({
                message: "Invalid blog ID"
            });
        }

        if (!title || !author || !content) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

       const updatedBlog = await Blog.findOneAndUpdate(
    {
        _id: blogId,
        user: req.user.id
    },
    {
        title: title.trim(),
        author: author.trim(),
        content: content.trim()
    },
    { new: true, runValidators: true }
);

        if (!updatedBlog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        res.status(200).json({
            message: "Blog updated successfully!",
            blog: updatedBlog
        });

    } catch (error) {
        res.status(500).json({
            message: "Blog update failed",
            error: error.message
        });
    }
});
// Delete Blog API
app.delete("/api/blogs/:id", verifyToken, async (req, res) => {
    try {
        const blogId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({
                message: "Invalid blog ID"
            });
        }

       const deletedBlog = await Blog.findOneAndDelete({
    _id: blogId,
    user: req.user.id
});

        if (!deletedBlog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        res.status(200).json({
            message: "Blog deleted successfully!"
        });

    } catch (error) {
        res.status(500).json({
            message: "Blog deletion failed",
            error: error.message
        });
    }
});


// Start Server after MongoDB connection
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});
