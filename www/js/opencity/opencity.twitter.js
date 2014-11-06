
var opencityTwitter = {

	range_km: 10,
	hashtag: 'openbus',
	link_twitter: 'https://twitter.com/hashtag/' + this.hashtag + '?src=tren',
	auth_header: 'Authorization: OAuth oauth_consumer_key="U0AXGhtU7mkaTvFLLmpTdc44A", oauth_nonce="8bb46b140d3170ac248cc601134074a7", oauth_signature="L23IuT5x%2FTtqj38zy7p9y%2Fuv%2FZY%3D", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1413741252", oauth_token="68381149-Ou6q5bttkBnZQMy515KPkgRCSl79XURnh9wlhEvcQ", oauth_version="1.0"',
	base_uri: 'https://api.twitter.com/1.1/geo/search.json',
	oauth_header: '%2522%26oauth_consumer_key%3DU0AXGhtU7mkaTvFLLmpTdc44A%26oauth_nonce%3D0c4d65e091df3f648269b2fc83810600%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1413744420%26oauth_token%3D68381149-Ou6q5bttkBnZQMy515KPkgRCSl79XURnh9wlhEvcQ%26oauth_version%3D1.0%26q%3D',
	initialize: function (range, ht, callback) {

		this.range_km = range;
		this.hashtag = ht;

		if (typeof callback === 'function') {
			callback();
		}
	},
	getTweet_byLatLng: function (lat, lng, range, callback) {

		var r, h;

		if (typeof opencityTwitter.range_km === 'undefined')
			r = 10;
		else
			r = opencityTwitter.range_km;

		if (typeof opencityTwitter.hashtag === 'undefined')
			h = 'openbus'
		else
			h = opencityTwitter.hashtag;

		var geo = 'q=%23' + h + '&geocode=%22' + lat + '%2C' + lng + '%2C' + r + 'km%22';

		var url = this.base_uri + '?' + geo + '&' + this.oauth_header;

		this.makeJSONrequest(url, callback);
	}, 

	makeJSONrequest: function (url, callback) {

      console.log('get JSON data from url ' + url);

      $.getJSON(url, function (result) {
          if (typeof callback === 'function')
          	callback(result);
      });

    }
}