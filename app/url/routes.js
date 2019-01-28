const router = require('express').Router();
const url = require('./url');



router.get('/:hash', async (req, res, next) => {

  const source = await url.getHash(req.params.hash);
  if (!source){
    let NoHASH = new Error('Bad request,Couldn\'t find any reference for this Hash');
    NoHASH.status = 400;
    next(NoHASH);
  } else {
    let { _id } = source;  
    try{
      var updatedFile = await url.newVisit(_id);
      // Behave based on the requested format using the 'Accept' header.
      // If header is not provided or is */* redirect instead.
      const accepts = req.get('Accept');
      switch (accepts) {
        case 'text/plain':
          res.end(source.url);
          break;
        case 'application/json':
          res.json({
            url: updatedFile.url,
            visits: updatedFile.visits,
            hash: updatedFile.hash,
            removeToken: updatedFile.removeToken
          });
          break;
        default:
          res.redirect(source.url);
          break;
      }
    }catch(e){

      next(e);
    }
  
  }
});


router.post('/', async (req, res, next) => {
if (req.body.url){
  try{
    var requestId = await url.idCounter();
  } catch (e){
    e.message = "Url counter Id not found, restart the server";
    next(e);
  }

  try {
    let shortUrl = await url.shorten(req.body.url, url.generateHash(requestId));
    res.json(shortUrl);
  } catch (e) {
    if (e.message === "Invalid URL"){
      e.status = 400;
    }
    if (e.message !== "Invalid URL"){
      e.status = 500;
    }
    //e.message = "Shortener Method error,could't generate or save the short URL";

    next(e);
  }
}else{
  let NoHASH = new Error('Bad request, missing URL');
  NoHASH.status = 400;
  next(NoHASH);

}
});


router.delete('/:hash/remove/:removeToken', async (req, res, next) => {
  // TODO: Remove shortened URL if the remove token and the hash match
  
  const { hash, removeToken } = req.params;
  try{
    const deletedUrl = await url.deleteURL(hash,removeToken);
    if(deletedUrl === null){
      let notImplemented = new Error('Nothing Deleted, file does not exist');
      notImplemented.status = 404;
      return next(notImplemented);
    }
    if(deletedUrl.active === false){

      res.send({message: "File successfully deleted"});
    }
  }catch (e){

    e.message = "Something went wrong while deleting the file";
    next(e);
  }
  
  
  // if(typeof removeToken !== "string"){
  //   let notImplemented = new Error('Bad request, missing remove token');
  //   notImplemented.status = 400;
  //   return next(notImplemented);
  // }

});

module.exports = router;
