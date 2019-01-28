
const { domain } = require('../../environment');
const SERVER = `${domain.protocol}://${domain.host}`;

const {URLs,Counters} = require('./schema');
const parseUrl = require('url').parse;
const validUrl = require('valid-url');
const shortid = require('shortid');

/**
 * Lookup for existent, active shortened URLs by hash.
 * 'null' will be returned when no matches were found.
 * @param {string} hash
 * @returns {object}
 */
async function getHash(hash) {
  let source = await URLs.findOne({ active: true, hash });
  return source;
}

/**
 * Lookup on counter document for value of count where the id are equals to "url_count"
 * @returns {Number} count 
 */
const idCounter = async () => {
  const {count} = await Counters.findById({_id: 'url_count'});

  return count;
}

/**
 * Lookup for Schema Id and increment in one the number of visits.
 * new option is set as true to return the new modified document.
 * @param {string} _id
 * @returns {object} 
 */
const newVisit = async (_id) => {
  const visits = await URLs.findOneAndUpdate(
    { _id }, 
    { $inc: { visits: 1 } }, 
    { new: true }
    );
    if (!visits){
      throw new Error('Error saving new visit, couldn\'t retrieve number of visits');
    }
  return visits;
}

/**
 * Lookup for existent active complete URL searched by URL.
 * 'null' will be returned when no matches were found.
 * @param {string} url
 * @returns {object}
 */
async function getUrl(url) {
  let source = await URLs.findOne({ active: true, url });
  return source;
}

const deleteURL = async (hash, removeToken) => {
  const updateField = {
    removedAt: Date.now(),
    active: false,
  }
  const deletedInfo = await URLs.findOneAndUpdate({hash,removeToken,active:true},updateField, { new: true});
  return deletedInfo;
}

/**
 * Generate an unique hash-ish- for an URL.
 * TODO: Deprecated the use of UUIDs.
 * TODO: Implement a shortening algorithm
 * @param {Number} id
 * @returns {string} hash
 */
function generateHash(id) {
  if(typeof id !== "number"){
    throw new Error('generateHash parameter isn\'t a Number');
  }
// Set of valid web characters  
  const codingPatern = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
  let hash='';
  let index;
  while (id > 0) {
    index = id % codingPatern.length;
    hash = codingPatern.charAt(index) + hash;
    id = Math.floor(id / codingPatern.length);
  } 
  
  return hash ;
}

/**
 * Generate a random token that will allow URLs to be (logical) removed
 * @returns {string} shortid
 */
function generateRemoveToken() {
  return shortid.generate();
}

/**
 * Create an instance of a shortened URL in the DB.
 * Parse the URL destructuring into base components (Protocol, Host, Path).
 * An Error will be thrown if the URL is not valid or saving fails.
 * @param {string} url
 * @param {string} hash
 * @returns {object}
 */
async function shorten(url, hash) {

  if (!isValid(url)) {
    throw new Error('Invalid URL');
  }

  // Get URL components for metrics sake
  const urlComponents = parseUrl(url);
  const protocol = urlComponents.protocol || '';
  const domain = `${urlComponents.host || ''}${urlComponents.auth || ''}`;
  const path = `${urlComponents.path || ''}${urlComponents.hash || ''}`;

  // Generate a token that will alow an URL to be removed (logical)
  const removeToken = generateRemoveToken();

  //check if the url is already on DB
  const existingUrl = await this.getUrl(url);
  if (existingUrl){
    return {
      url: existingUrl.url,
      shorten: `${SERVER}/${existingUrl.hash}`,
      hash: existingUrl.hash,
      removeUrl: `${SERVER}/${existingUrl.hash}/remove/${existingUrl.removeToken}`
    };
  }else {
// If it has not been shortened before, save it 
    const shortUrl = new URLs({
      url,
      protocol,
      domain,
      path,
      hash,
      isCustom: false,
      removeToken,
      active: true,
    });
    try {
      const savedUrl = await shortUrl.save();
      return {
        url: savedUrl.url,
        shorten: `${SERVER}/${savedUrl.hash}`,
        hash: savedUrl.hash,
        removeUrl: `${SERVER}/${savedUrl.hash}/remove/${savedUrl.removeToken}`
      };
    }catch(e){
      throw new Error('Error while saving URL');

    }

  }

}

/**
 * Validate URI
 * @param {any} url
 * @returns {boolean}
 */
function isValid(url) {
  return validUrl.isUri(url);
}

module.exports = {
  shorten,
  getHash,
  newVisit,
  idCounter,
  deleteURL,
  getUrl,
  generateHash,
  generateRemoveToken,
  isValid
}
