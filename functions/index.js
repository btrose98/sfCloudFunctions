const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Take the text parameter passed to this HTTP endpoint and insert it into
// Firestore under the path /messages/:documentId/original
exports.alarm = functions.https.onRequest(async (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId) return res.status(400).send('Error: Bad request');

  // Get device data from firestore
  const deviceRef = admin.firestore().collection('devices').doc(deviceId);
  const device = await deviceRef.get();
  if (!device.exists) return res.status(404).send('Error: Device not found');

  const deviceData = device.data();
  const deviceSubscribersIds = deviceData.subscribersIds;

  // Get data for each subscriber id
  let deviceSubscribers = await Promise.all(
    deviceSubscribersIds.map(async (id) => {
      const ref = await admin.firestore().collection('users').doc(id).get();
      if (ref.exists) return ref.data();
    })
  );

  // Remove every subscriber with no data
  deviceSubscribers = deviceSubscribers.filter((d) => d !== undefined);

  //Setting up Twilio communications - Cameron
  const sid = functions.config().twilio.id;
  const token = functions.config().twilio.token;
  const twilioClient = require('twilio')(sid, token);

  twilioClient.messages
    .create({
      body: `Fire alarm detected at ${deviceData.address}`,
      to: '+1' + deviceData.emergencyContact, // Text this number
      from: '+14243519803', // From a valid Twilio number
    })
    .then((message) => console.log(message.sid));

  // Send notification to each subscriber
  deviceSubscribers.forEach(async (user) => {
    admin
      .messaging()
      .send({
        topic: user.email.replace('@', '_'),
        notification: { body: `Your alarm went off at ${deviceData.address}`, title: `${user.name}, fire alarm is detected` },
      })
      .then((r) => {
        console.log(r);
      })
      .catch((e) => {
        console.log(e);
      });
  });

  // Grab the text parameter.
  res.status(200).send('Success: Notification sent');
});

//projectId: smartfire-3e198
//projectRegion:  us-central

// https://firebase.google.com/docs/functions/write-firebase-functions
//https://github.com/firebase/functions-samples
