const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

// Start express app
const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors());
// app.use(
//   cors({
//     origin: 'https://www.natours.com',
//   })
// );
app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

//Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'js.stripe.com', "'unsafe-eval'", 'blob:'],
      styleSrc: ["'self'", 'fonts.googleapis.com', "'unsafe-inline'"],
      fontSrc: ['data:', 'https:', "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      frameSrc: [
        "'self'",
        'js.stripe.com',
        "'unsafe-inline'",
        'https://m.stripe.network',
      ],
      connectSrc: [
        "'self'",
        'https://api.stripe.com',
        'https://errors.stripe.com',
        'ws://127.0.0.1:62629/',
        'api.mapbox.com',
        'events.mapbox.com',
      ],
    },
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: false,
  })
);

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// Cookie parser
app.use(cookieParser());
// Data sanitazation against NoSQL query injection
app.use(mongoSanitize());
// Data sanitazation against XSS
app.use(xss());
// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'difficulty',
      'maxGroupSize',
      'price',
    ],
  })
);

app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//Unknown page handling
app.all('*', (req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl} on this server`, 404));
});

// Error handling
app.use(globalErrorHandler);

module.exports = app;
