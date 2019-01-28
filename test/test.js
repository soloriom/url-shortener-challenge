const expect  = require("chai").expect;
const request = require("request");
const server = require("../server/server");
const { URLs } = require("../app/url/schema");

//request(server);
const postUrl = "http://localhost:3000/";
const getUrl = "http://localhost:3000/yAG";
let deleteUrl;

describe("Shortening url test", function() {
  beforeEach((done) => {
    server
    done();        
  });
  describe("Sending a valid URL for shorten it", function() {
    let requestData = {
      "url":"https://mochajs.org/#installation"
    };
    it("returns status 200", function(done) {
      request({url: postUrl, method: "POST",
      json: requestData}, (error,response,body)=>{
        expect(response.statusCode).to.equal(200);
       
        done();
      });
      
    });
    it("returns short url", function(done) {
      request({url: postUrl, method: "POST",
      json: requestData}, (error,response,body)=>{
        deleteUrl = body.removeUrl;
        expect(body.shorten).to.equal('http://localhost:3000/yAG');
       
        done();
      });
      
    });



  });

  
  describe("Sending a non valid URL", () => {
    let requestData = {
      "url":""
    };
    it("returns status 400", function(done) {
      request({url: postUrl, method: "POST",
      json: requestData}, (error,response,body)=>{
        expect(response.statusCode).to.equal(400);
       
        done();
      });
      
    });
    it("returns JSON with message and error code", function(done) {
      request({url: postUrl, method: "POST",
      json: requestData}, (error,response,body)=>{
        expect(body).to.deep.equal({
          "message": "Bad request, missing URL",
          "code": 400
      });
       
        done();
      });
      
    });



  });

  describe("Sending shortURL (Hash)", () => {
   
    it("Should returns status 200", function(done) {
      request({url: getUrl,headers:{'Accept':'text/plain'}, method: "GET"}, 
      (error,response,body)=>{
        expect(response.statusCode).to.equal(200);
       
        done();
      });
      
    });
    it("redirect to original URL", function(done) {
      request({url: getUrl,headers:{'Accept':'text/plain'}, method: "GET"}, 
      (error,response,body)=>{
        expect(body).to.equal('https://mochajs.org/#installation');
       
        done();
      });
      
    });
  });

  describe("Sending bad shortURL/HASH", () => {
   
    it("Should returns status 400", function(done) {
      request({url: 'http://localhost:3000/yAG2',headers:{'Accept':'text/plain'}, method: "GET"}, 
      (error,response,body)=>{
        expect(response.statusCode).to.equal(400);
       
        done();
      });
      
    });

  });

  describe("Delete Hash", async () => {
    
    it("Should get a 'successfully deleted' message", function(done) {
      request({url: deleteUrl, method: "DELETE"}, 
      (error,response,body)=>{
        expect(body).to.deep.equal('{"message":"File successfully deleted"}');

        done();
      });
      
    });
    it("Should returns that the element is already deleted", function(done) {
      request({url: deleteUrl, method: "DELETE"}, 
      (error,response,body)=>{
        expect(body).to.equal('{"message":"Nothing Deleted, file does not exist","code":404}');

        done();
      });   
    });

  });
  


});

