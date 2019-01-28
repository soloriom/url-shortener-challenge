const mongo = require('../../server/mongodb');
const mongoose = require('mongoose');

const url =  new mongoose.Schema({
  url: {
    type: String,
    required: true
  },

  user: mongoose.Schema.Types.ObjectId,

  hash: {
    type: String,
    required: true,
    unique: true
  },
  isCustom: {
    type: Boolean,
    required: true
  },

  removeToken: {
    type: String,
    required: true
  },

  protocol: String,
  domain: String,
  path: String,

  createdAt: {
    type: Date,
    default: Date.now
  },
  removedAt: Date,

  active: {
    type: Boolean,
    required: true,
    default: true
  },
  visits:{
    type: Number,
    default:0,
  },
  requestId:{
    type: Number,
  }
});

const counter = new mongoose.Schema({
  _id: { type: String, required: true },
  count: { type: Number, default: 100000 }
});

let Counters = mongo.model('counter', counter);
url.pre('save', function(next) {
  var doc = this;
  Counters.findByIdAndUpdate({ _id: 'url_count' }, { $inc: { count: 1 } }, function(err, counter) {
      if(err) return next(err);      
      doc.requestId = counter.count;
      doc.created_at = new Date();
      next();
  });
});

let URLs = mongo.model('Url', url);
//Code below deletes schemas for a fresh start every time the server starts running
//Initilize Counter Schemas 
mongo.then(async function(db) {
//Clean URL schema   
 await  URLs.remove({}, function() {
  })
  //reset Counters to 100000
  await Counters.remove({}, function() {
      var counter = new Counters({_id: 'url_count', count: 100000});
      counter.save();
  });
});

module.exports = { 
  URLs, 
  Counters
};



