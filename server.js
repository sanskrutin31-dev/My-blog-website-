
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors());
app.use(express.json());

// Temporary User Storage
let users = [];
let blogs = [];

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

        const existingUser = users.find(
            user => user.email === email
        );

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: Date.now(),
            name: name,
            email: email,
            password: hashedPassword
        };

        users.push(newUser);

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

        const user = users.find(
            user => user.email === email
        );

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
                id: user.id,
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
app.post("/api/blogs", (req, res) => {
    try {
        const { title, author, content } = req.body;

        if (!title || !author || !content) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const newBlog = {
            id: Date.now(),
            title: title,
            author: author,
            content: content
        };

        blogs.push(newBlog);

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
app.get("/api/blogs", (req, res) => {
    res.status(200).json(blogs);
});


// Server Port
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
