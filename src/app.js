const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const apiRoutes = require('./routes/api.routes');
const pageRoutes = require('./routes/page.routes');
const apiRateLimit = require('./middleware/apiRateLimit');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api', apiRateLimit, apiRoutes);
app.use('/static', express.static('src/public'));
app.use('/', pageRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Not found'
  });
});

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({
    message: 'Lỗi máy chủ nội bộ.',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

module.exports = app;
