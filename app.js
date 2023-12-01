// Import necessary modules and packages
const express = require('express') // Import Express.js framework
const shortId = require('shortid') // Generate short IDs for URLs
const createHttpError = require('http-errors') // Create HTTP errors
const mongoose = require('mongoose') // MongoDB object modeling tool designed to work in an asynchronous environment
const path = require('path') // Provides utilities for working with file and directory paths
const ShortUrl = require('./models/url.model') // Importing the model for ShortUrl

// Create an Express application
const app = express()

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')))

// Parse incoming JSON requests
app.use(express.json())

// Parse incoming URL-encoded data with querystring library
app.use(express.urlencoded({ extended: false }))

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost:27017', {
    dbName: 'url-shortner',
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log('mongoose connected '))
  .catch((error) => console.log('Error connecting..'))

// Set the view engine to render EJS templates
app.set('view engine', 'ejs')

// Handle GET requests to the root URL
app.get('/', async (req, res, next) => {
  res.render('index') // Render the 'index' EJS template
})

// Handle POST requests to the root URL
app.post('/', async (req, res, next) => {
  try {
    const { url } = req.body // Extract URL from the request body
    if (!url) {
      throw createHttpError.BadRequest('Provide a valid url') // Throw a BadRequest error if URL is missing
    }
    const urlExists = await ShortUrl.findOne({ url }) // Check if the URL already exists in the database
    if (urlExists) {
      res.render('index', {
        short_url: `${req.headers.host}/${urlExists.shortId}`, // Render the existing short URL
      })
      return
    }
    const shortUrl = new ShortUrl({ url: url, shortId: shortId.generate() }) // Create a new ShortUrl object with a generated short ID
    const result = await shortUrl.save() // Save the new short URL to the database
    res.render('index', {
      short_url: `${req.headers.host}/${result.shortId}`, // Render the newly created short URL
    })
  } catch (error) {
    next(error) // Pass any errors to the error handling middleware
  }
})

// Handle GET requests to access short URLs
app.get('/:shortId', async (req, res, next) => {
  try {
    const { shortId } = req.params // Extract the short ID from the request parameters
    const result = await ShortUrl.findOne({ shortId }) // Find the corresponding URL in the database
    if (!result) {
      throw createHttpError.NotFound('Short URL does not exist') // Throw a NotFound error if the short URL does not exist
    }
    res.redirect(result.url) // Redirect to the original URL associated with the short ID
  } catch (error) {
    next(error) // Pass any errors to the error handling middleware
  }
})

// Middleware to handle 404 Not Found errors
app.use((req, res, next) => {
  next(createHttpError.NotFound()) // Create and pass a NotFound error to the error handling middleware
})

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500) // Set the response status code to the error status or default to 500 (Internal Server Error)
  res.render('index', { error: err.message }) // Render the 'index' EJS template with the error message
})

// Start the Express server on port 3000
app.listen(3000, () => console.log('🌏 on port 3000...'))
