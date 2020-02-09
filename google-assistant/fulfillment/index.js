// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');
const firebaseAdmin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

firebaseAdmin.initializeApp();
const firestore = new Firestore();

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }

  function quote(agent) {
    const ERROR_TEXT = 'Sorry, we couldn\'t find a deep thought for you. Please try again later.';
    const quotesCollection = firestore.collection('quotes');
    const collectionInfoRef = quotesCollection.doc('COLLECTION_INFO');
    var quoteCount = 0;
    return collectionInfoRef.get().then(document => {
      quoteCount = document.data().count;
      console.log(`# of quotes: ${quoteCount}`);
      const randomQuoteIndex = getRandomInt(quoteCount);

      console.log(`Random quote index: ${randomQuoteIndex}`);
      return quotesCollection.where('quote_index', '==', randomQuoteIndex).get()
        .then(snapshot => {
          console.log('Retrieved random quote');
          if (snapshot.empty) {
            console.log('No matching quote documents.');
            agent.add(ERROR_TEXT);
            return;
          }

          snapshot.forEach(doc => {
            const randomQuote = doc.data();
            console.log('Selected quote: ', doc.id, '=>', randomQuote);
            agent.add(`"${randomQuote.quote}" - ${randomQuote.author}`);
            return;
          });
        })
        .catch(err => {
          console.log('Error getting random quote', err);
        });
    })
      .catch(err => {
        console.log('Error getting COLLECTION_INFO document', err);
      });
  }

  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function yourFunctionHandler(agent) {
  //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
  //   agent.add(new Card({
  //       title: `Title: this is a card title`,
  //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //       buttonText: 'This is a button',
  //       buttonUrl: 'https://assistant.google.com/'
  //     })
  //   );
  //   agent.add(new Suggestion(`Quick Reply`));
  //   agent.add(new Suggestion(`Suggestion`));
  //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  // }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }
  // // See https://github.com/dialogflow/fulfillment-actions-library-nodejs
  // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  //intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Quotes', quote);
  agent.handleRequest(intentMap);
});