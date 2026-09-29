const { createApp } = require('./app');

const app = createApp();
const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`Handled API running on http://localhost:${PORT}`);
});