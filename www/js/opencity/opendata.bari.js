'use strict';

var openDATABari = {
    url: 'http://opendata.comune.bari.it/api/data/',
	url_artisti: 'aa5e48aa-4be9-472b-9d26-e7e7f90d8a78/_search',
	url_bike_sharing: '3f1e27a5-df7e-44ea-a296-6833e3f81b20/_search',
	url_ass_culturali: '927c03f4-e93a-47fb-87bd-e665e859bceb/_search',
	url_guide_tour: 'be5c4893-3c73-4888-95ac-3fb70b4b566c/_search',
    
    initialize: function (type, lat, lng, callback) {
        if (type === 'bike') {
            openDATABari.get_BikeSharing(lat, lng, callback);    
        } else if (type === 'arts') {
            
        } else if (type === 'cultur') {
            
        } else if (type === 'guide') {
            
        }
    },
    
    makeJSONrequest: function (url, callback) {

      // console.log('get JSON data from url ' + url);

      $.getJSON(url, function (result) {
          if (typeof callback === 'function')
          	callback(result);
      });

    },
    
    get_BikeSharing: function (lat, lng, callback) {
        var u = this.url + this.url_bike_sharing;
        
        this.makeJSONrequest(u, function (bikesharing) {
            if (typeof callback === 'function') {
                var bk = _.sortBy(bikesharing.hits.hits, function (item) {
                    return opencityREST.getDistanceFromLatLonInKm(item._source.Lat,
                                                                  item._source.Long,
                                                                  lat,
                                                                  lng);
                });
                callback(bk);    
            }
        });
    }
}