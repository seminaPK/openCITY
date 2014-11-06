var opencity4SQ = {

	initialize: function(clientID, clientSECRET, callback) {
	    this.clientID = clientID;
	    this.clientSECRET = clientSECRET;

		// controllo l'aggiornamento dei dati tra i due server API
		if (typeof callback === 'function') {
	      callback();
	    }
	},
	clientID: '',
	clientSECRET: '',
	vAPI: '&v=20140806&m=foursquare',
	get_TOKEN: function() {
		return '?client_id=' + this.clientID + '&client_secret=' + this.clientSECRET;
	},
	explore: function (city, section, callback) {
		
		var url = 'https://api.foursquare.com/v2/venues/explore' +
				  this.get_TOKEN() + 
				  '&near=' + city +
				  '&section=' + section +
				  this.vAPI;

		this.makeJSONrequest(url, function (response) {
			// console.log('json request 4sq OK');
			var venues = response.response.groups[0];
			if (typeof callback === 'function') {
				callback(venues);
			}
		});

	}, 
	tips: function (venuesID, callback) {
		
		var url = 'https://api.foursquare.com/v2/venues/' + venuesID + '/tips' +
				  this.get_TOKEN() + 
				  '&limit=3' +
				  this.vAPI;

		this.makeJSONrequest(url, function (response) {
			var tips = response.response.tips.items;
			if (typeof callback === 'function') {
				callback(tips, venuesID);
			}
		});		  
	},
	makeJSONrequest: function (url, callback) {

      // console.log('get JSON data from url ' + url);

      $.getJSON(url, function (result) {
          if (typeof callback === 'function')
          	callback(result);
      });

    }
}