'use strict';

$( document ).ready( function () {

	var posUser = null;
    var posRif = null;
	var marker = null;
	var busS = null;
	var startMarker = null;
	
    var foursquare_route_point = [];
    var bike_sharing = [];
	var busMarker = [];
	var stopMarker_4sq = [];
	var foursquare_venues = [];
	var stopMarker = [];
	var foursquareMarker = [];
	var routeBS = null;
    var target;

	// parallax effects
	$('body').scrollspy({ target: '#my-navbar' });

    $(".navbar-collapse ul li a[href^='#']").on('click', function(e) {
        target = this.hash;
       e.preventDefault();
       $('html, body').animate({
           scrollTop: $(this.hash).offset().top 
         }, 300, function(){
           window.location.hash = target;
         });
    });
    
    function getSpinner(idelement) {
        var h_spinner = '<div class="spinner" id="' + idelement + '_SPINNER">' +
                        '   <div class="bounce1"></div>' +
                        '   <div class="bounce2"></div>' +
                        '   <div class="bounce3"></div>' +
                        '</div>';
        return h_spinner;
    };
	
	opencityREST.initialize(opencityConfig.url_rest, _initREST);
	
	// ****************************************************
	// Foursquare API
	// **************************************************** 

	function _init4SQ() {
		// console.log('Forsquare API ready ...');
		$('#foursquare_search').html('Go2 #top');
		opencity4SQ.explore(opencityConfig.city, 'topPicks', _viewVenues);
	};

	$('#category4sq').on('click', 'a', function () {
		var section = $(this).data('section');
		opencity4SQ.explore(opencityConfig.city, section, _viewVenues);
	});

	$('#foursquare_venues').on('click', 'a', function () {
		var action = $(this).data('action');
		var lat = $(this).data('lat');
		var lng = $(this).data('lng');

		if (action === 'info_route_4sq') {
            var element = $(this).data('element');
            var idstation = $(this).data('station');
            var spinner = $(this).data('spinner');
			$('#' + element).empty();
            $('#' + spinner).show();
            console.log('View Info point route');
			opencityREST.getRouteByDestination (opencityConfig.accuracy, 
												posUser.lat, 
								  				posUser.lng, 
								  				idstation, 
								  				element, 
								  				_viewRoutePoint);
            // $('#' + spinner).hide();
		} else if (action === 'info_route_4sq_marker') {
			map.setView(new L.LatLng(lat,lng), opencityConfig.maxzoom);
		} else if (action === 'view_point_go2') {
            var element = $(this).data('element');
            var descr = $(this).data('route');
            addMarker(foursquare_route_point, 
				  new L.LatLng(lat, lng), 
				  element, 
				  descr, 
				  'foursquare_route', 
				  false);
            map.setView(new L.LatLng(lat,lng), opencityConfig.maxzoom);
        }
	});

	$('#category4sq').on('click', 'li', function () {
		$('#foursquare_search').html('Go2 ' + $(this).text());
	});
    
    // controllo se l'informazione è stata già inviata
    function isRouting(idelement, route) {
        var b = false;
        
        // controllo se l'informazione è stata già inviata
        var st = $('#' + idelement).text();
        
        b = st.search(route) > -1;
        
        return b;
    };

    // Aggiunge i punti di routing
	function _viewRoutePoint(route, route_type, lat, lng, idelement) {
		console.log('callback to element ' + idelement + 
			  		' route --> ' + route + 
			  		' type --> ' + route_type +
			  		' lat,lng --> ' + lat + ',' + lng);

		var im = '';
        var am = '<a href="#map" data-lat="' + lat + '" data-lng="' + lng + 
                 '" data-action="view_point_go2" data-element="' + idelement + '_INFOROUTE"' + 
                 '" data-route="' + route + '">';
        
		if (route_type === 'bus') {
			im = am + '<img src="images/marker/bus_24.png"></img></a>'; 
		} else if (route_type === 'walk') {
			im = am + '<img src="images/marker/walk.png"></img></a>';
		} else if (route_type === 'info') {
            im = am += '<span class="glyphicon glyphicon-info-sign"></span></a>';   
        }

		var list = '<li class="list-group-item list-group-item-success">' + im + ' ' + route + '</li>';
		
        if (!isRouting(idelement, route)) {
            $('#' + idelement).append(list);
        };
	};

	function _viewVenues(venues) {

		var i = 0;

		if (typeof venues !== 'undefined') {

			$('#foursquare_venues').empty();

			venues.items.forEach( function (item) {

				var v = item.venue;
				var vId = v.id;
				var latv = v.location.lat;
				var lngv = v.location.lng;
				var namev = v.name;
				var linkv = v.url;
				var address = '';

				var idStopList = vId + '_STOPLIST';
				var idStopListRoute = idStopList + '_ROUTE';
				var idTips = vId + '_TIPS';
                var idSpinner = vId + '_SPINNER';

				if (typeof v.location.formattedAddress[0] !== 'undefined') 
					address += v.location.formattedAddress[0];

				if (typeof v.location.formattedAddress[1] !== 'undefined') 
					address += ' ' + v.location.formattedAddress[1];

				var content = '<div class="panel-heading">' + 
	    					  '	<h3 class="panel-heading">' + namev + '</h3>' +
	    					  '</div>' +
	    					  '<div class="panel-body">' +
	    					  '	<p class="list-group-item-text">' + address + '</p>' +
	    					  ' <div id="' + idTips +'"></div>' +
	    					  ' <h4> La fermata più vicina a ' + opencityConfig.accuracy + ' mt </h4>' +
                              // getSpinner(idSpinner) +
	    					  ' <ul class="list-group" id="' + idStopList + '"></ul>' +
	    					  ' <ul class="list-group" id="' + idStopListRoute + '"></ul>' +
	    					  '</div>';

				var hc = '<div class="panel panel-default" id="' + vId + '">' + 
					  	 	content + 
					  	 '</div>';

				$('#foursquare_venues').append(hc);
				
				$('#' + idStopList).empty();
				$('#' + idTips).empty();
				$('#' + idStopListRoute).empty();
                // $('#' + idSpinner).hide();

				addMarker(foursquare_venues, 
					  	  new L.LatLng(latv, lngv), 
					  	  namev, 
					  	  '<b>' + namev + '</b> ' + address, 
					  	  'foursquare', 
					  	  false);

				// leggi l'ultimo consiglio da foursquare
				opencity4SQ.tips(vId, _getTips);

				// carica la fermata più vicina al venues
				opencityREST.getFirstFermataByDistance(opencityConfig.accuracy, latv, lngv, idStopList, _getNearStop);

				i++;
			});
		}
	};

	function _getNearStop(nearstation, idelement) {

		if (typeof nearstation !== 'undefined') {

			var idfermata = nearstation.IdFermata;
			var descr = nearstation.DescrizioneFermata;
			var dist = nearstation.DistanzaMetri;
			var lat = nearstation.PosizioneFermata.Latitudine;
			var lng = nearstation.PosizioneFermata.Longitudine;

			var idE = idelement + '_ROUTE';
            var idSpinner = idelement + '_SPINNER';
            var info = '<a href="#' + idE + '" data-action="info_route_4sq" data-element="' + idE + 
                       '" data-station="' + idfermata + '" data-spinner="' + idSpinner + '" data-lat="' + lat + 
                       '" data-lng="' + lng + '"><span class="glyphicon glyphicon-info-sign"></span></a>';
			var marker = '<a href="#map" data-action="info_route_4sq_marker" data-station="' + idfermata + 
                         '" data-lat="' + lat + '" data-lng="' + lng + 
                         '"><span class="glyphicon glyphicon-map-marker"></span></a>';
			var l = ''; 
			var i = 0; 
			var n = _.size(nearstation.ListaLinee);

			if (typeof nearstation.ListaLinee !== 'undefined' || 
                _.size(nearstation.ListaLinee) > 0 || 
                nearstation.ListaLinee != null) {
				while (nearstation.ListaLinee[i]) {
					l += '<span class="badge">' + nearstation.ListaLinee[i].IdLinea + '</span>  ';
					i++;
				};

				l += '<span class="badge">Linee</span>  ';
			};

			var list = '<li class="list-group-item list-group-item-info">' + descr + ' ' + info + ' ' + 
                       marker + ' distante ' + dist + ' mt' + l + '</li>';
			$('#' + idelement).append(list);
            
			addMarker(stopMarker_4sq, 
					  new L.LatLng(lat, lng), 
					  descr, 
					  '<b>' + descr + '</b><br /> Linee ' + l, 
					  'flag_4sq', 
					  false);

		};

	};

	function _getTips(tips, venuesID) {
		var idElement = '#' + venuesID + '_TIPS';

		if (typeof tips !== 'undefined') {

			tips.forEach( function (tip) {
				
				var d = moment.unix(tip.createdAt).format('DD/MM/YYYY HH:mm');
				var img = '';
				var u = tip.user.firstName;

				if (typeof tip.user.lastName !== 'undefined')
					u += ' ' + tip.user.lastName;

				if (typeof tip.photourl === 'undefined') {
					img = 'images/foursquare-logomark_64.png';
				} else {
					img = tip.photourl;
				};

				var nlikes = ' <span class="glyphicon glyphicon-heart"></span> ' + tip.likes.count;

				var content = '<a class="pull-left" href="' + tip.canonicalUrl +'" target="_blank">' +
							  '   <img class="media-object thumb img-thumbnail" src="' + img + '" alt="foursquare">' +
	  						  '</a>' +
	  						  '<div class="media-body">' +
	  						  '	<h4 class="media-heading tip">' + u + ', ' + d + ' ' + nlikes + '</h4>' +
	  						  '	<p class="tip">' + tip.text + '</p>' +
	  						  '</div>'
				var h = '<div class="media">' + content + '</div>';

				$(idElement).append(h);

			});
		}
	};
	
	// ****************************************************
	// Initialization Map
	// **************************************************** 
	var map = L.map( 'map', {
		    minzoom: opencityConfig.minzoom,
		    zoom: opencityConfig.maxzoom
	});

	L.tileLayer( 'http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
		    attribution: '&copy; <a href="http://osm.org/copyright" title="OpenStreetMap" target="_blank">OpenStreetMap</a> contributors | Tiles Courtesy of <a href="http://www.mapquest.com/" title="MapQuest" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png" width="16" height="16">',
		    subdomains: ['otile1','otile2','otile3','otile4']
	}).addTo( map );

    // ****************************************************
	// Events Map
	// ****************************************************

    map.on('click', function(e) {
    	// console.log('click at ' + e.latlng); // e is an event object (MouseEvent in this case)
	});

	map.on('moveend', function() {
    	// console.log('move end'); // e is an event object (MouseEvent in this case)
	});
	
	// ****************************************************
	// Reload data
	// ****************************************************

	function refreshMap(latlng) {
		// console.log('Refresh Map at latitude ' + latlng.lat + ' and longitude ' + latlng.lng );
		opencityREST.getFermateByDistance(opencityConfig.accuracy, latlng.lat, latlng.lng, _viewFermate);
        // bike sharing
        openDATABari.initialize('bike', latlng.lat, latlng.lng, _viewBikeSharing);
		bestFit();
	};

	// ****************************************************
	// Get Position Device
	// ****************************************************
	getLocation();

	function bestFit() {

		if (_.size(busMarker) > 0 && _.size(stopMarker) > 0) {

			var a = _.union(busMarker, stopMarker);
			var b = _.map(a, function (item) {
				return item.marker;
			});

			var group = new L.featureGroup(b);
	 		map.fitBounds(group.getBounds());

 		} else {
 			map.setZoom(opencityConfig.maxzoom);
 		}
	};

	function getLocation() {
		var options_position = {
                watch: true,
                locate: true,
                enableHighAccuracy: true,
                maxZoom: opencityConfig.maxzoom,
                setView: true
    	};

    	map.locate(options_position);
	};
	
	function removeMarker() {
		if (marker) {
            map.removeLayer(marker);
            marker = null;
        }
	};

	// geolocalizzazione OK
	function _onLocationFound(location) {

		if (opencityConfig.test) {
			setPositionDefault();
		} else {
			posUser = location.latlng;
			if (!marker)
	        	marker = L.userMarker(location.latlng, { 
	        		pulsing:true
	        	}).addTo(map);
	        marker.setLatLng(location.latlng);
	        //marker.setAccuracy(location.accuracy);
	        marker.setAccuracy(opencityConfig.accuracy);
	        refreshMap(location.latlng);
	    }
	};
	map.on('locationfound', _onLocationFound);

	function setPositionDefault() {
		var pos = L.latLng(opencityConfig.lat, opencityConfig.lng);

		// console.log('start position default at ' + JSON.stringify(pos));

		if (!marker)
        	marker = L.userMarker(pos, {pulsing:true}).addTo(map);

        marker.setLatLng(pos);
        marker.setAccuracy(opencityConfig.accuracy);
        map.setView(pos, opencityConfig.maxzoom);
    	posUser = pos;
    	refreshMap(pos);
	};

	// geolocalizzazione error
	function _onLocationError(e) {
     	// console.log('error geolocation: ' + e.message);
    	setPositionDefault();
	};
	map.on('locationerror', _onLocationError);

	// ****************************************************
	// Drawing Map
	// ****************************************************

	function isExistBus(array, title) {

		// console.log('searching marker by title ' + title);
 
		var b = _.find(array, function(item){ 
			return item.key == title; 
		});

		return b;
	
	};

	function changeDescriptionMarker(array, title, newcontent) {
		var bs = isExistBus(array, title);

		if (typeof bs !== 'undefined') {
			// console.log('marker founded removed it!');
			bs.marker.setPopupContent(newcontent);
			add = false;
		} 
	};

	function deleteMarker(array, title) {

		var bs = isExistBus(array, title);
		if (!bs) {
			array.pop(bs);
			map.removeLayer(bs);
		}
	};

	function addMarker(array, pos, title, content, icon, reset, callback) {

		// var pos = L.latLng(lat, lng);
		var add = true;
		var bs = isExistBus(array, title);

		// cancella il marker
		if (typeof bs !== 'undefined') {
			// console.log('marker founded removed it!');
			if (reset) {
				deleteMarker(array, title);
				add = true;
			} else {
				bs.marker.setLatLng(pos);
				bs.marker.update();
				add = false;
			}
		} else {
			add = true;
			// console.log('new marker');
		}
		
		if (add) {
			// non esiste crea uno nuovo

	  		if (icon === 'flag') {

	  			var myIcon = L.icon({
				    //iconUrl: 'images/marker/station_24.png',
                    iconUrl: 'images/marker-icon-grey.png',
				    //iconSize: [24, 24]
                    iconSize: [24, 41]
				});

	  		} else if (icon === 'bus') {
	  			var myIcon = L.icon({
				    iconUrl: 'images/marker/bus_24.png',
				    iconSize: [24, 24]
				});
	  		} else if (icon === 'flag_4sq') {
	  			var myIcon = L.icon({
				    // iconUrl: 'images/marker/station_4sq.png',
                    iconUrl: 'images/marker-icon-blue.png',
				    //iconSize: [24, 24]
                    iconSize: [24, 41]
				});

	  		} else if (icon === 'foursquare') {
	  			var myIcon = L.icon({
				    iconUrl: 'images/marker/foursquare.png',
				    iconSize: [24, 29]
				});

	  		} else if (icon === 'bike') {
	  			var myIcon = L.icon({
				    //iconUrl: 'images/marker/bike_small.png',
                    iconUrl: 'images/marker-icon-red_bike.png',
				    //iconSize: [25, 15]
                    iconSize: [25, 41]
				});
	  		} else if (icon === 'foursquare_route') {
                var myIcon = L.icon({
				    iconUrl: 'images/marker-icon-yellow.png',
				    iconSize: [25, 41]
				});
            }

			var option_marker = {
				icon: myIcon,
				title: title
			};

			var marker = L.marker(pos, option_marker).addTo(map).bindPopup(content);
			
			var ba = {
				key: title,
				marker: marker
			};

			array.push(ba);

			// console.log('array of ' + _.size(array));

			if (typeof callback === 'function') {
				callback(marker);
			}

		}
	};

	// ****************************************************
	// API REST Data 
	// ****************************************************
	function _initREST(corse) {
		// console.log('*** Init REST API SERVER ' + url);
		$('#map_name').html('HELLO BARI!! Oggi ' + moment().format('DD/MM/YYYY') + ' ci sono ' + corse + ' corse #catchthebus');
		opencity4SQ.initialize(opencityConfig.clientID_4sq, opencityConfig.clientSECRET_4sq, _init4SQ);

	};

	// restituisce la distanza in minuti del prossimo bus
	function getDistanceTime(t, idelement, busstop, nextbusstop) {

		var s  = moment();
    	var e = moment(t);
    	var st = ''
    	var d = s.diff(e, 'minutes');
    	var hc = '';

    	// console.log ('Distance by time start from ' + start + ' to ' + end + ' difference ' + d)

    	$(idelement).empty();

    	if (d > 0) {
    		st = 'partito da ' + d;
    		if (d === 1) {
    			st += ' minuto';
    		} else {
    			st += ' minuti';
    		}

    		hc = '<span class="label label-danger timetable">' + st + '</span>';
    	} else if (d < 0) {
    		st = 'in arrivo tra ' + d + ' minuti';
    		hc = '<span class="label label-info timetable">' + st + '</span>';
    		if (typeof busstop !== 'undefined' && typeof nextbusstop !== 'undefined') {
    			st = 'in arrivo tra ' + d + ' minuti alla fermata di ' + nextbusstop.DescrizioneFermata;
    			if (busstop === nextbusstop.IdFermata) {
	    			hc = '<span class="label label-warning timetable">' + st + '</span>';
	    		}
	    	}
    	} else if (d == 0) {
    		st = 'bus in arrivo tra meno di 1 minuto';
    		hc = '<span class="label label-warning timetable">' + st + '</span>';
    	}

    	// console.log(st);

    	$(idelement).html(hc);

	};

	// crea il contenuto del marker sulla mappa
	function getContentMarkerBus(linea, idcorsa, ora, velocita) {

		var content_marker = '<p class="marker">Linea: ' + linea + '<br />' +
							     'Corsa: ' + idcorsa + '<br />' +
							     'Ora di Arrivo: ' + ora + '<br />' + 
							     'Velocità: ' + velocita + ' Km/h</p>';

		return content_marker;

	};

	// visualizza orario palina realtime
	function _viewTimeR(response, station) {
		
		if (typeof response !== 'undefined') {
			if (_.size(response.PrevisioniLinee) > 0) {
				var i = 0;

				// console.log('Orari palina ' + JSON.stringify(response));

				while (response.PrevisioniLinee[i]) {
					// console.log('Orario palina +++ ' + JSON.stringify(response.PrevisioniLinee[i]));
					// addBusTimeTable(response.PrevisioniLinee[i], type, idElement, station);
					
					var idcorsa = response.PrevisioniLinee[i].IdCorsa;
					var linea = opencityREST.convert_name_linea(response.PrevisioniLinee[i].IdLinea);
					var dir = response.PrevisioniLinee[i].DirezioneLinea;

					var idElement = '#' + station + '_' + linea + '_' + dir + '_TIMETABLE';
					
					var title = 'Corsa ' + idcorsa;
					
					// var d = opencityREST.convertDate(response.PrevisioniLinee[i].OrarioArrivo);
					var idcorsa_r = idcorsa + '_R';
					var idcorsa_w = idcorsa + '_W';
					var idcorsa_next = idcorsa + '_NEXT';
					
					var idcorsa_html = '#' + idcorsa_r;
					var title_link = '', content = '';
					var d = opencityREST.convertDate(response.PrevisioniLinee[i].OrarioArrivo);

					var n = '<a href="#' + idcorsa_next + '" data-action="info_next" data-dir="' + dir + '" data-line="' + linea + '" data-station="' + station + '" data-run="' + idcorsa + '" data-lat="' + latR + '" data-lng="' + lngR + '"><span class="glyphicon glyphicon-bullhorn"></span></a>';

					if (response.PrevisioniLinee[i].TipoPrevisione == 'T') {
						content = '<span class="glyphicon glyphicon-time"></span> ' + d;

						title_link = title + ' ' + n;			  

					} else {

						var latR = response.PrevisioniLinee[i].UltimeCoordinateMezzo.Latitudine;
						var lngR = response.PrevisioniLinee[i].UltimeCoordinateMezzo.Longitudine;
						var vkm = response.PrevisioniLinee[i].UltimeCoordinateMezzo.VelocitaKmh;

						var ht = '<span class="glyphicon glyphicon-map-marker"></span>';
						var vt = '<span class="glyphicon glyphicon-road"></span> ' + response.PrevisioniLinee[i].UltimeCoordinateMezzo.VelocitaKmh + ' Km/h' ;
						content = vt;
						var content_marker = getContentMarkerBus(linea, idcorsa, d, vkm);
						
						title_link = title + ' ' + n + ' <a href="#map" data-action="info_run" data-line="' + linea + '" data-station="' + station + '" data-run="' + idcorsa + '" data-lat="' + latR + '" data-lng="' + lngR + '">' + ht + '</a>';

						var titleMarker = getTitleBusMarker(linea, idcorsa);

						addMarker(busMarker,
								  new L.LatLng(latR, lngR),
								  titleMarker,
								  content_marker,
								  'bus',
								  false);
					}
				

					if ( $('#'+ idcorsa).length) { 
						$(idcorsa_html).html(content);
					} else {

						// orari realtime
						var rh = '<span class="timetable" id="' + idcorsa_r + '">' + content + '</span>';

						// prossima fermata
						var badge = '<span class="badge timetable">' + ' ' + rh + '</span>';
						// messaggio di arrivo alla fermata
						var wh = '<span class="timetable" id="' + idcorsa_w + '" ></span>';

						var html_c = '<li class="list-group-item timetable" id="' + idcorsa + '">' +  
								  	 	badge + 
								  	 	title_link + ' ' +
								  	 	wh +
								  	 '	<ul class="list-group" id="' + idcorsa_next + '"></ul>' +
							 	  	 '</li>';

						// console.log('aggiungo orari palina all\'elemento ' + idElement)		  	 

						$(idElement).append(html_c);

					};

					if (response.PrevisioniLinee[i].TipoPrevisione == 'M') {
						getDistanceTime(response.PrevisioniLinee[i].UltimeCoordinateMezzo.DataOraAcquisizioneIt, 
						     		    '#' + idcorsa_w);
					};

					i++;
				};
			}
		}
	};

	function _setNextStop_decription(d, idelement) {
		$('#' + idelement).html(d);
	};

	function _setNextStop_distance(distance, idelement) {
		$('#' + idelement).html(' distante circa ' + distance + ' mt');
	};

	function _viewNextStops(ns, idrun, idfermata) {
		var idelement = '#' + idrun + '_NEXT';
		
		if (typeof ns !== 'undefined') {
			$(idelement).empty();
			var i = 0;

			while (ns[i]) {

				var idF = idrun + '_' + ns[i].Progressivo + '_NEXT_F';
				var idT = idrun + '_' + ns[i].Progressivo + '_NEXT_T';

				console.log(' element html ' + idF);

				console.log('next stop ' + ns[i].IdFermata);
				var l = '<li class="list-group-item"><span id="' + idF + '"></span>  <span class="label label-info">' + moment(ns[i].Orario).format('HH:mm') + '</span> <span id="' + idT + '_' + '"></span></li>';
				
				$(idelement).append(l);

				opencityREST.getFermate_detail(ns[i].IdFermata, idF, _setNextStop_decription);

				opencityREST.getFermate_distance(ns[i].IdFermata, idfermata, idT, _setNextStop_distance);

				i++;
				
			};
		}
	};

	$('#bus_stations').on('click', 'a', function () {

		var action = $(this).data('action');
		var lat = $(this).data('lat');
		var lng = $(this).data('lng');
		var station = $(this).data('station');
			
		if (action === 'info_line') {
			console.log('Information about line');
			var linea = $(this).data('busline');
			var station = $(this).data('busstop');
			var dir = $(this).data('dir');
		
		} else if (action === 'info_run') {
			console.log('Information about run');
			var station = $(this).data('station');
			var idrun = $(this).data('run');
			map.setView(new L.LatLng(lat,lng), opencityConfig.maxzoom);

		} else if (action === 'info_next') {
			console.log('Information about next stop');
			var idrun = $(this).data('run');
			var dir = $(this).data('dir');
			var linea = $(this).data('line');
			opencityREST.getFermateLineeTeoricoBy(linea, station, dir, idrun, _viewNextStops);
		}

	});

	function getTitleBusMarker(busline, idrun) {
		var b = busline + ' [' + idrun + ']';
		return b;
	};

	function addFermata(item) {

		var idF =  item.IdFermata;
		var latF = item.PosizioneFermata.Latitudine;
		var lngF = item.PosizioneFermata.Longitudine;

		var head_fermata = '<div class="panel-heading"><h3 class="panel-title">' + 
                           item.DescrizioneFermata + '</h3></div>';
        
        var body_fermata = '';
        var d;
        
        if (typeof posRif === 'undefined' || posRif == null) {
            d = item.DistanzaMetri;    
        } else {
            var d = opencityREST.getDistanceFromLatLonInKm_str(posRif.lat,
                                                               posRif.lng,
                                                               item.PosizioneFermata.Latitudine,
                                                               item.PosizioneFermata.Longitudine)
        };
        
        body_fermata = '<div class="panel-body"><p>distante ' + d + ' mt</p></div>';

		var li_fl = '';
		var ul_fl = '';

		if (_.size(item.ListaLinee) > 0) {
			var i = 0;

			while (item.ListaLinee[i]) {
				var idlinea = opencityREST.convert_name_linea(item.ListaLinee[i].IdLinea);
				var dir = item.ListaLinee[i].Direzione;

				// console.log('Direzione :' + dir);

				var idL = idF + '_' + idlinea + '_' + dir;
				var idL_t = idL + '_TIMETABLE';
				
				// aggiungi icona della direzione
				var sD = '';
				if (dir == 'A') {
					sD = '<span class="glyphicon glyphicon-arrow-up"></span>';
				} else if (dir == 'R') {
					sD = '<span class="glyphicon glyphicon-arrow-down"></span>';
				};
				
				li_fl += '<a href="#' + idL_t + '" class="list-group-item" data-action="info_line" data-busline="' + idlinea + '" ' +
							 'data-busstop="' + idF + '" ' +
							 'data-lat="' + latF + '" ' +
							 'data-lng="' + lngF + '" ' +
							 'data-dir="' + dir + '" ' +
							 'id="' + idL + '" >' +
							 '<h4 class="list-group-item-heading">Linea ' + item.ListaLinee[i].IdLinea + ' ' + sD + '</h4>' +
							 '	  <ul class="list-group" id="' + idL_t + '"></ul>' +
							 '</a>';
				i++;
			};

			ul_fl = '<ul class="list-group" id=>' + li_fl + '</ul>';

			// console.log('create element for time table ' + idL_t);	
		};

		var hc = '<div class="panel panel-default" id="' + idF + '">' + head_fermata + body_fermata + ul_fl + '</div>';

		if (!$('#' + item.IdFermata).length) {
			// console.log('element ' + '#' + item.IdFermata);
			$('#bus_stations').append(hc);
		};	

		// aggiungi fermate sulla mappa
		addMarker(stopMarker, 
				  new L.LatLng(latF, lngF),
				  item.DescrizioneFermata,
				  item.DescrizioneFermata + ' <b>' + item.DistanzaMetri + '</b> mt',
				  'flag',
				  true, 
				  _startRoute);

		// leggi gli orari teorici e reali della fermata
		opencityREST.getTimeTable(idF, _viewTimeR);

	};

	function isPositionChanged(idfermata) {
		if ( $('#' + idfermata).length) {
			console.log('position don\'t changed');
		} else {
			$('#bus_stations').empty();
			$('#bus_station_name').empty();
		}
	}

	// visualizza le fermate sulla mappa
	function _viewFermate(response) {
        
        if (typeof response === 'undefined' ||  (_.size(response) === 0)) {
			// prendio la fermata più vicina
			opencityREST.getNearestFermata(posUser.lat, posUser.lng, function (stations) {
                
                console.log('Stazione più vicina ' + JSON.stringify(stations));
                
                if (typeof stations !== 'undefined') {
                    
					isPositionChanged(stations.IdFermata);
                    
                    posRif = posUser;
                    
                    console.log('Utente fuori città ' + JSON.stringify(posUser));
                    
                    // prendo le fermate più vicine alle coordinate della fermata più vicina alla posizione del device
                    opencityREST.getFermateByDistance(opencityConfig.accuracy, 
                                                      stations.PosizioneFermata.Latitudine,          
                                                      stations.PosizioneFermata.Longitudine,
                                                      _viewFermate);
					
				}
			});
		} else {
            
            console.log('Coordinate utente ' + JSON.stringify(posUser));
            
            var d = opencityREST.getDistanceFromLatLonInKm(posUser.lat,
                                                           posUser.lng,
                                                           response[0].PosizioneFermata.Latitudine,
                                                           response[0].PosizioneFermata.Longitudine);
            
            if (d <= opencityConfig.accuracy) {
                // la posizione dell'utente è nei pressi della prima fermata della città
                posRif = null; 
                d = opencityConfig.accuracy;
            };
            
            var title_catch = 'Le prime fermate raggiungibile entro ' + d + ' mt #catchthebus';
            $('#bus_stations_name').html(title_catch); 
            
			var i = 0;
			isPositionChanged(response[0].IdFermata);
			while (response[i]) {
				addFermata(response[i]);
				i++;
			}
		}

	};

	function _startRoute(marker) {
		startMarker = marker;
	};
    
    // **************************************************************
    // Bike sharing 
    // **************************************************************
    
    $('#bike_sharing').on('click', 'a', function () {
        
        var action = $(this).data('action');
        var lat = $(this).data('lat');
        var lng = $(this).data('lng');
        var element = $(this).data('element');
        
        if (action === 'view_bikesharing') {
            console.log('bike sharing station clicked to ' + lat + ',' + lng);    
        } else if (action === 'view_bikesharing_route') {
            console.log('bike sharing route'); 
            opencityREST.getRouteByLatLng(opencityConfig.accuracy, 
                                          posUser.lat, 
                                          posUser.lng, 
                                          lat, 
                                          lng, 
                                          element, 
                                          _viewRoutePoint)   
        }
             
    });
    
    function _viewBikeSharing(bikes) {
        var i = 0;
        
        // console.log(JSON.stringify(bikes));
        $('#bike_sharing').empty();
        while (bikes[i]) {
            var idElement = 'BIKE_SHARING_' + bikes[i]._id;
            var idElement_route = idElement + '_ROUTE';
            var source = bikes[i]._source;
            var lat = source.Lat;
            var lng = source.Long;
            var title = source.Denominazione;
            var d = opencityREST.getDistanceFromLatLonInKm_str(posUser.lat,
                                                               posUser.lng,
                                                              lat,
                                                              lng);
            
            // console.log('bike sharing source ' + JSON.stringify(source));
            
            var info_route = '<a href="#' + idElement_route + '" ' +
                             '   data-lat="' + lat + '" ' +
                             '   data-lng="' + lng + '" ' +
                             '   data-action="view_bikesharing_route"' +
                             '   data-element="' + idElement_route + '">' +
                             '  <span class="glyphicon glyphicon-info-sign"></span></a>';
            
            var map_info = '<a href="#map" ' +
                             '   data-lat="' + lat + '" ' +
                             '   data-lng="' + lng + '" ' +
                             '   data-action="view_bikesharing"' +
                             '   data-element="' + idElement_route + '">' +
                             '  <span class="glyphicon glyphicon-map-marker"></span> ' + d + '</a>';
            
            var bike_info = '<img src="images/marker/bike_small.png"> ' + source['Numero Bici'] + '</img>';
            var route_info = '<ul class="list-group" id="' + idElement_route + '"></ul>';
            
            var list_element = '<li class="list-group-item"><h3>' + title +  
                               info_route + '  ' + map_info + '  ' + bike_info + '</h3>' +
                               '<p>' + route_info + '</p>' +
                               '</li>';
            
            i++;
            
            $('#bike_sharing').append(list_element);
            
            var descr_marker = '<b>' + title + '</b><br />Numero di bici: ' + source['Numero Bici'] + 
                               '<br />Distante dalla tua posizione: ' + d
            
            // aggiungi marker
            addMarker(bike_sharing, 
                      new L.LatLng(lat, lng), 
                      title, 
                      descr_marker, 
                      'bike', 
                      false);
        };
    };
    
    //***************************************************
    // Address routing
    //***************************************************
    
    function getRouteDestination(latS, lngS, destination) {
        
        // controllo se è stata inserita la destinazione
        if (destination.length > 0) {
            opencityMQ.getLatLng(destination, opencityConfig.city, function (lat, lng, errorMsg, error) {
                console.log('End coordinate ' + lat + ',' + lng);
                if (error) {
                    $('#error_address').html('Ci sono degli errori, prova a scrivere più ' +
                                             'attentamente il luogo di destinazione');
                } else {
                    var idelement = 'address_route';
                    opencityREST.getRouteByLatLng(opencityConfig.accuracy, 
                                                  latS, 
                                                  lngS, 
                                                  lat, 
                                                  lng, 
                                                  idelement, 
                                                  _viewRoutePoint);   
                }
            });        
        } else {
            $('#error_address').html('Devi inserire la destinazione.');     
        };
    };
    
    function geRouteOrigin(origin, destination) {
       
        var latS = posUser.lat;
        var lngS = posUser.lng;
        
        opencityMQ.getLatLng(origin, opencityConfig.city, function (lat, lng, errorMsg, error) {
            if (error) {
                $('#error_address').html(errorMsg + '<br />Utilizzerò le coordinate attuali.');    
            } else {
                latS = lat;
                lngS = lng;
            }

            console.log('Start  coordinate ' + latS + ',' + lngS);
            getRouteDestination(latS, lngS, destination);

        });            

    };
    
    $('#address_route').on('click', 'a', function () {
		var action = $(this).data('action');
		var lat = $(this).data('lat');
		var lng = $(this).data('lng');

        if (action === 'view_point_go2') {
            var element = $(this).data('element');
            var descr = $(this).data('route');
            addMarker(foursquare_route_point, 
				  new L.LatLng(lat, lng), 
				  element, 
				  descr, 
				  'foursquare_route', 
				  false);
            
        }
        
        map.setView(new L.LatLng(lat,lng), opencityConfig.maxzoom);
	});
    
    $('#search_address').click(function () {
        
        $('#error_address').empty();
        $('#address_route').empty();
        
        var origin = $('#search_start').val();
        var destination = $('#search_end').val();
        
        // controllo se è stata inserita la partenza
        if (origin.length > 0) {
            geRouteOrigin(origin, destination); 
        } else {
            getRouteDestination(posUser.lat, posUser.lng, destination);
        }
        
    });
    
});