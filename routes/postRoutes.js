const express = require("express");
const multer = require('multer');
const path = require('path');
const Image = require('../models/post');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});

// Initialize multer with storage configuration
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max file size: 10MB
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg','image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
}).single('image'); // Use 'image' as the form field name

// POST route to upload the image
router.post('/upload', (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
  
      // Assuming that the userId and description are sent in the request body
      const { userId, description } = req.body;
  
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
  
      const newImage = new Image({
        userId,
        path: req.file.path, // Path where the image is stored
        description, // Add the description to the image
      });
  
      try {
        await newImage.save();
        res.status(200).json({ message: 'Image uploaded successfully', image: newImage });
      } catch (error) {
        res.status(500).json({ message: 'Error saving image info', error });
      }
    });
  });
  
// GET route to fetch all posts
// GET route to fetch posts by user ID
router.get('/posts/:userId', async (req, res) => {
    const { userId } = req.params; // Get the userId from the request parameters
    console.log(userId);
    try {
      // Fetch all images for the specific user
      const posts = await Image.find({ userId });
      console.log(posts);
  
      if (posts.length === 0) {
        return res.status(404).json({ message: 'No posts found for this user' });
      }
  
      res.status(200).json({ message: 'Posts fetched successfully', posts });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching posts', error });
    }
  });
  
  
module.exports = router;
