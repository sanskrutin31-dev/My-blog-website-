
require("dotenv").config();

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

// Login API
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

        res.status(200).json({
            message: "Login successful!",
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

// Create Blog API
app.post("/api/blogs", async (req, res) => {
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
            content: content
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

// Get All Blogs API
app.get("/api/blogs", async (req, res) => {
    try {
        const blogs = await Blog.find().sort({
            createdAt: -1
        });

        res.status(200).json(blogs);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch blogs",
            error: error.message
        });
    }
});

// Get Single Blog API
app.get("/api/blogs/:id", async (req, res) => {
    try {
        const blogId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({
                message: "Invalid blog ID"
            });
        }

        const blog = await Blog.findById(blogId);

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        res.status(200).json(blog);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch blog",
            error: error.message
        });
    }
});

// Update Blog API
app.put("/api/blogs/:id", async (req, res) => {
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

        const updatedBlog = await Blog.findByIdAndUpdate(
            blogId,
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
app.delete("/api/blogs/:id", async (req, res) => {
    try {
        const blogId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({
                message: "Invalid blog ID"
            });
        }

        const deletedBlog = await Blog.findByIdAndDelete(blogId);

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
