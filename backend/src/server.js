const express = require('express');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Handled API is running'
  });
});

app.listen(PORT, () => {
  console.log(`Handled API running on http://localhost:${PORT}`);
});