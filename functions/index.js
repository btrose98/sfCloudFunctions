const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Take the text parameter passed to this HTTP endpoint and insert it into
// Firestore under the path /messages/:documentId/original
exports.alarm = functions.https.onRequest(async (req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into Firestore using the Firebase Admin SDK.
  console.log(original);
  // Send back a message that we've successfully written the message
  res.json({ result: `Message with ID: ${original} added.` });
});

//projectId: smartfire-3e198
//projectRegion:  us-central

// https://firebase.google.com/docs/functions/write-firebase-functions
//https://github.com/firebase/functions-samples 