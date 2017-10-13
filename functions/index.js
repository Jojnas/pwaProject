const functions = require('firebase-functions');
let admin = require('firebase-admin');
let cors = require('cors')({origin: true});
let webpush = require('web-push');
let formidable = require('formidable');
let fs = require('fs');
let UUID = require('uuid-v4');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
let serviceAccount = require("./pwagram-firebase-admin.json");

let googleCloudConfig = {
  projectId: 'pwagram-5d1f3',
  keyFilename: 'pwagram-firebase-admin.json'
};

let googleCloudStorage = require('@google-cloud/storage')(googleCloudConfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwagram-5d1f3.firebaseio.com/'
});


exports.storePostData = functions.https.onRequest((request, response) => {
 cors(request, response, ()  =>{
   let uuid = UUID();
   let formData = new formidable.IncomingForm();
   formData.parse(request, (err, fields, files) => {
     fs.rename(files.file.path, '/tmp/' + files.file.name);
     let bucket = googleCloudStorage.bucket('pwagram-5d1f3.appspot.com');

     bucket.upload('/tmp/' + files.file.name, {
       uploadType: 'media',
       metaData: {
         metaData: {
           contentType: files.file.type,
           firebaseStorageDownloadTokens: uuid,
         }
       }
     }, (err, file) => {
       if (!err) {
         admin.database().ref('posts').push({
           id: fields.id,
           title: fields.title,
           location: fields.location,
           rawLocation: {
             lat: fields.rawLocationLat,
             lng: fields.rawLocationLng
           },
           image: 'https://firebasestorage.googleapis.com/v0/b/' + bucket.name + '/o/' + encodeURIComponent(file.name) + '?alt=media&token=' + uuid
         })
           .then(() => {
             webpush.setVapidDetails('mailto: skull102@centrum.sk', 'BGD6RPtx50ztltlmtY2QOkndaxfg4SstpuBaGShsm4hR2WoqhuyWf02ipT4yk48MdZTXxv2oPkXuqrQdGoBpRj8', '-vtZfdR3kVdeYbaGuRjaqH6MbydOfDB2QSSWNCU_7I4');
             return admin.database().ref('subscriptions').once('value');

           })
           .then((subscriptions) => {
             subscriptions.forEach((sub) => {
               let pushConfig = {
                 endpoint: sub.val().endpoint,
                 keys: {
                   auth: sub.val().keys.auth,
                   p256dh: sub.val().keys.p256dh
                 }
               };
               webpush.sendNotification(pushConfig, JSON.stringify({
                 title: 'New Post',
                 content: 'New Post added!',
                 openUrl: '/help'
               }))
                 .catch((err) => {
                   console.log(err);
                 })
             });
             response.status(201).json({message: 'Data stored', id: fields.id});
           })
           .catch(err => {
             response.status(500).json({error: err});
           })
       } else {
         console.log(!err);
       }
     });
   });
  });
});
