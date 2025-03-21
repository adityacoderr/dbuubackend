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

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg','image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
}).single('image'); 

router.post('/upload', (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
  
      const { userId, description } = req.body;
  
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
  
      const newImage = new Image({
        userId,
        path: req.file.path, 
        description, 
      });
  
      try {
        await newImage.save();
        res.status(200).json({ message: 'Image uploaded successfully', image: newImage });
      } catch (error) {
        res.status(500).json({ message: 'Error saving image info', error });
      }
    });
  });
  

router.get('/posts/:userId', async (req, res) => {
    const { userId } = req.params; 
    console.log(userId);
    try {
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
