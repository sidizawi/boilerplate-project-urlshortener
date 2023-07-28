require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const url = require('url');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const urlSchema = new mongoose.Schema({
  url: String,
  id: Number,
})

const UrlModel = mongoose.model('UrlModel', urlSchema);

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  const { url: req_url } = req.body;

  try {
    let parsedUrl = new url.URL(req_url)

    dns.lookup(parsedUrl.hostname, (err) => {
      if (err) {
        res.json({"error":"Invalid URL"});
      } else {

        UrlModel
          .findOne({
            url: req_url
          })
          .then((data) => {
            if (data != null) {
              res.json({
                "original_url": data.url,
                "short_url": data.id
              });
            } else {
              UrlModel
                .find()
                .then((data) => {
                  let count = data.length + 1

                  let doc = UrlModel({
                    url: req_url,
                    id: count
                  });

                  doc
                    .save()
                    .then(() => {
                      res.json({
                        "original_url": req_url,
                        "short_url": count
                      });
                    });

                });
            }
          })
          .catch(() => {
            res.json({"error":"Invalid URL"});
          })
      }
    })
  } catch {
    res.json({"error":"Invalid URL"});
  }

})

app.get('/api/shorturl/:id', function(req, res) {
  UrlModel
    .findOne({
      id: parseInt(req.params.id)
    })
    .then((data) => {
      if (data) {
        res.redirect(data.url);
      } else {
        res.json({"error":"No short URL found for the given input"});
      }
    })
    .catch(() => {
      res.json({"error":"No short URL found for the given input"});
    })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
