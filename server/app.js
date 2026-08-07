const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/score', require('./routes/score'));
app.use('/api/timeline', require('./routes/timeline'));

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
