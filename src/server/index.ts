const express = require('express');
const cors = require('cors');
const generateImageRouter = require('./api/generate-image');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use('/api', generateImageRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 