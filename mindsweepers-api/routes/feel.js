'use strict'

const express = require('express')
const asyncify = require('express-asyncify')
const routes = asyncify(express.Router())

const Analyzer = require('natural').SentimentAnalyzer;
const stemmer = require('natural').PorterStemmer;
const analyzer = new Analyzer("Spanish", stemmer, "afinn");



routes.post('/sentiment', async (req, res, next) => {
    console.log('Request a sentiment/')
    try {
    
    let content = req.body.content
    let resR = content.split(' ')
    let results = analyzer.getSentiment(resR)    
    let returnObject = {
        error: false,
        results: results
      }
      return res.status(200).send(returnObject)
    } catch (error) {
      next(error)
    }
  })

  module.exports = routes

