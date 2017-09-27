console.log('EverydayAww bot is starting');

const Twit = require('twit');
const download = require('image-downloader');
const getJSON = require('get-json');
const fs = require('fs');
const config = require('./config');

const T = new Twit(config);


// ----------- Like tweets with the hastag #aww -----------
let stream = T.stream('statuses/filter', { track: '#aww', language: 'en' })

stream.on('tweet', function (data) {
  //console.log(data);
  let tweetID = data.id_str;
  if (data.user.screen_name !== 'EverydayAww') {
    T.post('favorites/create', { id: tweetID }, function() {
      // Tweet liked
    });
  }
});


// Tweet once every 6 hours
let tweetInterval = setInterval(getContent, 1000*60*60*6);


// ------------ Make JSON call & download photo --------------
function getContent() {
  console.log('Running getContent function');
  const url = 'https://www.reddit.com/r/aww/hot.json?limit=5';

  getJSON(url, function(error, response){
    // Store JSON data
    let data = response.data.children;
    let imageURL;
    let title;
    let credit;
    let status;
    let hashtags = '#EverydayAww #aww #animals';

    for (let i = 0; i < data.length; i++) {
      if (data[i].data.stickied) {
        // Post is stickied, ignore it
        console.log(i + ' is stickied post, skipping');
      } else if (data[i].data.preview.images[0].variants.gif !== undefined) {
        // Check if content is a gif
        console.log('Content is a gif, skipping');        
      } else {
        // Post not stickied, post if title length under 95 chars
        if (data[i].data.title.length <= 95) {
          console.log(i + ' is valid post, downloading photo');
          imageURL = data[i].data.preview.images[0].source.url;
          title = data[i].data.title;
          credit = data[i].data.author;
          status = '"' + title + '"' + '\n\n' + 'Credit: u/' + credit + '\n' + hashtags;
          break;
        } else {
          console.log('Title length too long, skipping post');
        }
      }
    }

    // Download image
    const options = {
      url: imageURL,
      dest: 'img/photo.jpg'
    }

    download.image(options)
      .then(({ filename, image }) => {
        console.log('File saved to', filename);
        // Call tweet function
        tweetImage(filename, status);
      }).catch((err) => {

        throw err
      });
  });
}

// ------------ Tweet function --------------
function tweetImage(imgPath, text) {
  let imagePath = imgPath;
  let b64content = fs.readFileSync(imagePath, { encoding: 'base64' })

  // first we must post the media to Twitter
  T.post('media/upload', { media_data: b64content }, function (err, data, response) {
    let mediaIdStr = data.media_id_string
    // now we can reference the media and post a tweet (media will attach to the tweet)
    let params = { status: text, media_ids: [mediaIdStr] }

    T.post('statuses/update', params, function (err, data, response) {
      console.log('Tweeted Image');
    });
  });
}
