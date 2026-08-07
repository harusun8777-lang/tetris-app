const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const timelinePath = path.join(__dirname, '../data/timeline.json');

router.get('/', (req, res) => {
  const data = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
  res.json(data);
});

module.exports = router;