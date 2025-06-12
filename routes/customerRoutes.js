const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const os = require('os');

// Use temp directory for file uploads
const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Get customers with pagination
router.get('/customers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      Customer.find()
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments()
    ]);

    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalCustomers: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload CSV file
router.post('/upload', upload.single('file'), async (req, res) => {
  const batchSize = 1000;
  const results = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        // Process in batches
        for (let i = 0; i < results.length; i += batchSize) {
          const batch = results.slice(i, i + batchSize);
          await Customer.insertMany(batch, { ordered: false });
        }
        
        fs.unlinkSync(req.file.path);
        res.json({ message: 'Data imported successfully' });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });
});

// Optimized statistics endpoint
router.get('/statistics', async (req, res) => {
  try {
    const [genderStats, locationTypeStats, digitalInterestStats] = await Promise.all([
      Customer.aggregate([
        { $group: { _id: "$gender", count: { $sum: 1 } } },
        { $project: { _id: 0, gender: "$_id", count: 1 } }
      ]).allowDiskUse(true),
      
      Customer.aggregate([
        { $group: { _id: "$Location Type", count: { $sum: 1 } } },
        { $project: { _id: 0, locationType: "$_id", count: 1 } }
      ]).allowDiskUse(true),
      
      Customer.aggregate([
        { $group: { _id: "$Digital Interest", count: { $sum: 1 } } },
        { $project: { _id: 0, digitalInterest: "$_id", count: 1 } }
      ]).allowDiskUse(true)
    ]);

    res.json({
      gender: genderStats,
      locationType: locationTypeStats,
      digitalInterest: digitalInterestStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
