'use strict';

var opencityMQ = {
    HOST_URL: 'http://open.mapquestapi.com',
    getUrlBySearch: function(query) {
        var q = query.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '+');
        var u = this.HOST_URL + 
               '/nominatim/v1/search.php?format=json&addressdetails=1&limit=3&countrycodes=it&q=' + q;
        return u;
    },
    getLatLng: function(query, city, callback) {
        
        var url = this.getUrlBySearch(query + ' ' + city);
        this.makeJSONrequest(url, function (response) {
            console.log(JSON.stringify(response));
            var q = _.first(_.filter(response, function (item) {
                return item.address.city === city;    
            }),1);  
            
            console.log('*** Element n.' + _.size(q));
            
            if (typeof q !== 'undefined' && _.size(q) > 0) {
                if (typeof callback === 'function') {
                    callback(q[0].lat, q[0].lon, '', false);    
                }           
            } else {
                if (typeof callback === 'function') {
                    callback(0, 0, 'non ho trovato nessun luogo', true);    
                }
            }
        });
    },
    makeJSONrequest: function (url, callback) {

      console.log('get JSON data from url ' + url);

      $.getJSON(url, function (result) {
          if (typeof callback === 'function')
          	callback(result);
      });

    }
}

/*

{"place_id":"15378898",
 "licence":"Data © OpenStreetMap contributors, ODbL 1.0. http://www.openstreetmap.org/copyright","osm_type":"node",
 "osm_id":"1412486620",
 "boundingbox":["41.1274843","41.1374843","16.7610488","16.7710488"],
 "lat":"41.1324843",
 "lon":"16.7660488",
 "display_name":"Aeroporto, Parcheggio FM2 Aeroporto, San Paolo, Bari, BA, Puglia, 70128, Italia",
 "class":"railway",
 "type":"station",
 "importance":0.101,
 "icon":"http://open.mapquestapi.com/nominatim/v1/images/mapicons/transport_train_station2.p.20.png",
 "address":{
     "station":"Aeroporto",
     "road":"Parcheggio FM2 Aeroporto",
     "suburb":"San Paolo",
     "city":"Bari",
     "county":"BA",
     "state":"Puglia",
     "postcode":"70128",
     "country":"Italia","country_code":"it"
 }

*/