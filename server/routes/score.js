const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const timelinePath = path.join(__dirname, '../data/timeline.json');

router.post('/', (req, res) => {
  const { user, score, log } = req.body;

  const data = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));

  data.push({
    user,
    score,
    log,
    date: new Date().toISOString()
  });

  fs.writeFileSync(timelinePath, JSON.stringify(data, null, 2));

  res.json({ status: 'ok' });
});

module.exports = router;