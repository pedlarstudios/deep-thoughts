'use strict';

const functions = require('firebase-functions');
const firebaseAdmin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');

firebaseAdmin.initializeApp();
const firestore = new Firestore();

exports.addQuote = functions.https.onRequest((request, response) => {
  const body = request.body;
  console.log(`Request body: ${JSON.stringify(body)}`);
  const validationResult = validateRequest(body);
  if (!validationResult.valid) {
    return response.status(400).send({
      message: validationResult.message
    });
  }
  const quotesCollection = firestore.collection('quotes');
  const newQuoteDoc = {
    author: body.author || "Jack Handey",
    quote: body.quote,
    quote_index: Number(body.quote_index),
    source: body.source || "Deep Thoughts book",
    creation_date: Date(),
    modify_date: Date()
  };
  return quotesCollection.add(newQuoteDoc).then(ref => {
    return response.send(`Success, added ${JSON.stringify(ref)}`);
  }).catch(err => {
    console.log('Error getting COLLECTION_INFO document', err);
  });    
});

function validateRequest(quote) {
  if (!quote) {
    return {
      valid: false,
      message: 'No request specified'
    };
  }
  if (!quote.quote) {
    return {
      valid: false,
      message: 'No quote specified'
    };
  }
  if (!quote.quote_index) {
    return {
      valid: false,
      message: 'No quote_index specified'
    };
  }
  return {
    valid: true
  }
}