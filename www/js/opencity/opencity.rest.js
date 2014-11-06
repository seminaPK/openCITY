'use strict';

var opencityREST = {

  initialize: function(url_rest, callback) {
    this.url = url_rest;

    this.getNumeroCorseGiorno(callback);
	},

  url: '', 
  _data_busstops: null,
  _data_buslines: null,
  average_velocity: 25,
  last_stop: null,

  getLinee: function (callback) {

    if (this._data_buslines == null) {
      var url = this.url + 'rete/Linee/';
      opencityREST.makeJSONrequest(url, function (response) {
        opencityREST._data_buslines = response;
        if (typeof callback === 'function') {
          callback(response);
        }
      });
    } else {
      if (typeof callback === 'function') {
        callback(opencityREST._data_buslines);
      }
    }
  },

  convert_name_linea: function (idlinea) {
      var l = '';
      if (idlinea.toString().indexOf('/') == -1) {
          l = idlinea;
      } else {
          l = idlinea.toString().replace('/', 'barrato');    
      };

      return l;
  },

  getMezziLinea: function(busline, station, callback) {

    var l = this.convert_name_linea(busline);    

    var url = this.url + 'MezziLinea/' + l + '/';

    this.makeJSONrequest(url, function (response) {
      if (typeof callback === 'function') {
        callback(response, busline, station);
      } 
    }); 
  },

  getServizioGiornaliero: function (linea, callback) {
    var url = this.url + 'ServizioGiornaliero/' + this.convert_name_linea(linea) + '/';
    this.makeJSONrequest(url, callback);
  },

  getServizioGiornalieroFermata: function (linea, fermata, callback) {
    var url = this.url + 'ServizioGiornaliero/' + this.convert_name_linea(linea) + '/' + fermata + '/';
    this.makeJSONrequest(url, callback);
  },

  getFermateLinea: function (linea, callback) {
    var url = this.url + 'rete/FermateLinea/' + this.convert_name_linea(linea) + '/';
    this.makeJSONrequest(url, callback);
  },

  convertDate: function(dateStr) {
    var d = moment(dateStr);
    // console.log('create date: ' + d.format('HH:MM'));
    return d.format('HH:MM');
  }, 

  sortByTime: function(array) {
      return _.sortBy(array, function (element) {
          return opencityREST.convertDate(element.OrarioArrivo)
      });
  },

  getDescriptionStop: function (array, busstop) {

    var d = _.find(array, function (item) {
      return item.IdFermata === busstop;
    });

    return d;
  },

  getTimeTable: function (station, callback) {
    var url = this.url + 'OrariPalina/' + station + '/';

    this.makeJSONrequest(url, function (response) {
      if (typeof callback === 'function') {
        callback(response, station);
      }
    });     
  },

  getTimeTableT: function (station, callback) {
    var url = this.url + 'OrariPalina/' + station + '/teorico/';

    this.makeJSONrequest(url, function (response) {
      if (typeof callback === 'function') {
        callback(response, station);
      }
    });     
  },

  // restituisco tutte le fermate
  getFermate: function (callback) {

    // console.log('*** load fermate ***');
    if (this._data_busstops == null) {
      // console.log('load fermate null ***');
      var url = opencityREST.url + 'rete/Fermate/';
      this.makeJSONrequest(url, function (response) {
        // console.log('load fermate get 1 ' + JSON.stringify(response));
        opencityREST._data_busstops = response;
        if (typeof callback === 'function') {
          callback(response);
        };  
      });
    } else {
      if (typeof callback === 'function') {
        callback(opencityREST._data_busstops);
      }
    }
  },

  getFermata: function(idfermata, callback) {
    var url = this.url + 'rete/Fermate/' + idfermata + '/' ;
    this.makeJSONrequest(url, callback);
  },  

  getFermate_detail: function(idfermata, idelement, callback) {
    this.getFermata(idfermata, function (f) {
      //console.log(JSON.stringify(f));
      if (typeof callback === 'function') {
        callback(f[0].DescrizioneFermata, idelement);
      }
    });
  },

  getFermate_distance: function(idfermataS, idfermataD, idelement, callback) {

    this.getFermata(idfermataS, function (fS) { 

      // console.log('Fermata Start' + JSON.stringify(fS));

      opencityREST.getFermata(idfermataD, function (fD) { 

        // console.log('Fermata End' + JSON.stringify(fD));

        // distanza in metri
        var d = opencityREST.getDistanceFromLatLonInKm(fS[0].PosizioneFermata.Latitudine, 
                                                       fS[0].PosizioneFermata.Longitudine,
                                                       fD[0].PosizioneFermata.Latitudine, 
                                                       fD[0].PosizioneFermata.Longitudine);
        // tempo di percorrenza medio
        var t = Math.ceil((d / opencityREST.average_velocity) * 60);

        if (typeof callback === 'function') {
          callback(d,t, idelement);
        }
      });
    });
  },

  getNearestFermata: function (lat, lng, callback) {

    this.getFermate(function (response) {

      var busS = _.sortBy(response, function (item) {
        return opencityREST.getDistanceFromLatLonInKm(Number(lat), 
                                                      Number(lng), 
                                                      Number(item.PosizioneFermata.Latitudine), 
                                                      Number(item.PosizioneFermata.Longitudine));
      });

      if (typeof busS !== 'undefined') {
        var f = _.first(busS, 1);
          if (typeof f !== 'undefined') {
              if (typeof callback === 'function') {
                // console.log('nearest bus stop ' + JSON.stringify(f));
                callback(f[0]);
              }    
          }
      }
    });
  },

  getRouteByDestination: function (accuracy, latS, lngS, idfermataD, idelement, callback) {

    var isRoute = false;
    console.log('trovo percorso di routing da ' + latS + ', ' + lngS + ' fino a ' + idfermataD);
    this.last_stop = null;
      
    this.getFermata(idfermataD, function (f) {
        var d = opencityREST.getDistanceFromLatLonInKm(latS, 
                                       lngS,
                                       f[0].PosizioneFermata.Latitudine,
                                       f[0].PosizioneFermata.Longitudine); 
        
        if (d <= 500) {
            var point_descr = 'la tua destinazione è a ' + d + ' mt ' +
                              'non ti consiglio di aspettare un bus, potresti raggiungerla a piedi.';
            if (typeof callback === 'function') {
                callback(point_descr, 
                         'walk', 
                         f[0].PosizioneFermata.Latitudine, 
                         f[0].PosizioneFermata.Longitudine, 
                         idelement);
              }
        } else {
            
            opencityREST.getFermateByDistance(accuracy, latS, lngS, function (fermateS) {
              // console.log('trovate n.' + _.size(fermateS) + ' per il routing');
              if (typeof fermateS !== 'undefined' && _.size(fermateS) > 0) {
                execRoute('start', fermateS, idfermataD, function (point_descr, point_note, lat, lng) {
                  if (typeof callback === 'function') {
                    callback(point_descr, point_note, lat, lng, idelement);
                  }
                });
              } else {
                console.log('sei troppo lontano dalla prima fermata.');  
                  opencityREST.getNearestFermata(latS, lngS, function (fermata) {
                    var point_descr = 'Sei troppo lontano dalla città, vai fino alla prima fermata vicino a te ' +
                                      fermata.DescrizioneFermata + ' a ' +
                                      opencityREST.getDistanceFromLatLonInKm_str(latS,
                                                                                 lngS,
                                                                                 fermata.PosizioneFermata.Latitudine,
                                                                                 fermata.PosizioneFermata.Longitudine) +
                                      ' e riproviamoci';
                    if (typeof callback === 'function') {
                        callback(point_descr, 
                                 'info', 
                                 fermata.PosizioneFermata.Latitudine, 
                                 fermata.PosizioneFermata.Longitudine, 
                                 idelement);
                    }  
                  });
              };
            });
            
        }
    });
      
    function getTimeRoute(latS, lngS, latD, lngD) {
      var d = opencityREST.getDistanceFromLatLonInKm(latS, lngS, latD, lngD);
      var t = Math.ceil((d / 25000) * 60) + ' minuti';
      return t;
    };

    // controllo se la fermata di partenza e destinazione sono sulla stessa linea
    function getSameBusLine(fermateS, idfermataD, callback) {
        var idlinea = null;
        var fS;
        var i = 0;
        
        while (fermateS[i]) {
            if (fermateS[i] !== null) {
                var fermataS = fermateS[i]; // prendo la fermata di partenza
                if (fermateS[i].ListaLinee !== null) {
                    var lineeS = fermateS[i].ListaLinee; // prendo le linee della fermata di partenza
                    var j = 0;
                    // console.log('Linee della fermata di partenza ' + JSON.stringify(lineeS));
                    while (lineeS[j]) {
                        var idl = lineeS[j].IdLinea;
                        // console.log('Linea ' + lineeS[j].IdLinea);
                        opencityREST.getTimeTable(idfermataD, function (oraripalinaD) {
                          var l = _.find(oraripalinaD, function(item) {
                              return item.IdLinea == idl;
                          });
                          if (typeof l !== 'undefined') {
                              // console.log('trovata linea ');
                              idlinea = idl;
                              fS = fermataS;
                          } else {
                              // console.log('non ho trovato linea.');
                              idlinea = null;
                              fS = null;
                          }                            
                      });
                      j++;
                    }
                }
            }
        i++;
            
        if (i == _.size(fermateS)-1) {
            if (typeof callback === 'function') {
              // console.log('first callback linea ' + idlinea + ' ' + JSON.stringify(fS))
              callback(idlinea, fS);
            }
        };
      };   
    };

    // prendo la fermata della linea della fermata di partenza più vicina a quella di destinazione
    function getNearBusStation(lineeS, idfermataD, callback) {
      var fermataD;
      var nfs;
      var i = 0;
      var idlineaS;
        
      // console.log('controllo la fermata di partenza più vicina fermata di destinazione ' + idfermataD);
      opencityREST.getFermata(idfermataD, function (fD) {
          // prendo la fermata di destinazione
          fermataD = fD[0];
          // console.log('controllo n.' + _.size(lineeS) + ' linee.');
          while (lineeS[i]) {
            idlineaS = lineeS[i].IdLinea;
            // console.log(i + ') provo per la linea ' + idlineaS);
              
            opencityREST.getFermateLineeTeorico(idlineaS, function (fermatelineeT) {
              var k = 0;
              var list_f = '';

              // creo la lista della fermate da controllare
              while (fermatelineeT[k]) {
                list_f += fermatelineeT[k].IdFermata;
                if (k < _.size(fermatelineeT) - 1) {
                  list_f += ',';
                } 
                k++;
              };
              // console.log('Ottengo informazioni per le fermate ' + list_f);

              // leggo la prima fermata più vicina
              opencityREST.getFermata(list_f, function (f) {

                // console.log('Fermate trovate *** ' + JSON.stringify(f));

                var nf = _.first(_.sortBy(f, function (item) {
                        return opencityREST.getDistanceFromLatLonInKm(item.PosizioneFermata.Latitudine,
                                                                      item.PosizioneFermata.Longitudine,
                                                                      fermataD.PosizioneFermata.Latitudine,
                                                                      fermataD.PosizioneFermata.Longitudine);
                }),1);

                if (typeof nf !== 'undefined') {
                    // console.log('La fermata più vicina è ' + JSON.stringify(nf));
                    if (typeof nfs === 'undefined' || nfs == null) {
                      // console.log('prima fermata');
                      nfs = nf[0];
                    } else {
                      // console.log('confronto fermate');
                      var d1 = opencityREST.getDistanceFromLatLonInKm(nfS.PosizioneFermata.Latitudine,
                                                                      nfS.PosizioneFermata.Longitudine,
                                                                      fermataD.PosizioneFermata.Latitudine,
                                                                      fermataD.PosizioneFermata.Longitudine);

                      var d2 = opencityREST.getDistanceFromLatLonInKm(nf[0].PosizioneFermata.Latitudine,
                                                                      nf[0].PosizioneFermata.Longitudine,
                                                                      fermataD.PosizioneFermata.Latitudine,
                                                                      fermataD.PosizioneFermata.Longitudine);

                      if (d2 < d1) {
                        // console.log('trovata nuova fermata a ' + d2 + ' mt --> ' + JSON.stringify(nf));
                        nfs = nf[0];
                      };
                   };
                   if (i == _.size(lineeS)) {
                        if (typeof callback === 'function') {
                            // console.log('valore *** ' + JSON.stringify(nfs));
                            callback(nfs, idlineaS, fermataD);
                        }
                   }
                }
              });
            });
            i++;
        };
      });
    };

    // esegue il routing 
    function execRoute(point, fermateS, idfermataD, callback) {
      
      // console.log('fermata di destinazione ' + idfermataD);

      // ----------------------------
      // controllo se partenza e destinazione sono sulla stessa linea
      getSameBusLine(fermateS, idfermataD, function (idLinea, fermataS) {
          // ----------------------------
          if (!idLinea==null) {
            // ho trovato la linea in comune tra fermata di partenza e destinazione
            // controllo se la distanza tra partenza e destinazione è maggiore del raggio di default

            // console.log('trovata linea ' + idLinea + ' object ' + JSON.stringify(fermataS));

            if (point == 'start') {
              var descr_route = 'raggiungi a piedi la fermata ' + fermataS.DescrizioneFermata + 
                                ' a circa ' + fermataS.DistanzaMetri + ' mt' + 
                                ' e prendi la linea ' + idLinea;

              var lat = fermataS.PosizioneFermata.Latitudine;
              var lng = fermataS.PosizioneFermata.Longitudine;

              if (typeof callback === 'function') {
                callback(descr_route, 'walk', lat, lng);  
              };
            };

            var descr_route = 'prendi la linea ' + idLinea + 
                              ' e raggiungerai la destinazione alla fermata ' + 
                              fermataD.DescrizioneFermata + 
                              ' dopo circa ' + getTimeRoute(fermataS.PosizioneFermata.Latitudine,
                                                            fermataS.PosizioneFermata.Longitudine,
                                                            fermataD.PosizioneFermata.Latitudine,
                                                            fermataD.PosizioneFermata.Longitudine);

            if (typeof callback === 'function') {
              callback(descr_route, 
                       'bus', 
                       fermataD.PosizioneFermata.Latitudine, 
                       fermataD.PosizioneFermata.Longitudine);  
            };
          } else {

            // console.log('non ho trovato linea, rielaboro ricerca ...');

            // non è stata trovata la linea che porta direttamente alla fermata di destionazione
            // ripeti la ricerca spostandoti sulla fermata di partenza più vicina a quella di destinazione
            // cerca la prossima fermata di partenza tra le linee della fermata di partenza

            // -------------------------------------
            // prendo la fermata più vicina alle coordinate di partenza
            var new_fermataS = _.first(fermateS,1);
            // console.log('non ho trovato linea, nuova fermata ' + JSON.stringify(new_fermataS));  
              
            var descr_route = 'raggiungi a la fermata più vicina a te ' + new_fermataS[0].DescrizioneFermata + 
                              ' a circa ' + new_fermataS[0].DistanzaMetri + ' mt';
            var lat = new_fermataS[0].PosizioneFermata.Latitudine;
            var lng = new_fermataS[0].PosizioneFermata.Longitudine;
            if (typeof callback === 'function') {
              callback(descr_route, 'walk', lat, lng);  
            };

            // -------------------------------------
            // trovo la fermata delle linee della nuova fermata di partenza più vicina a quella di destinazione
            var lineeS = new_fermataS[0].ListaLinee; // linee della nuova fermata di partenza

            getNearBusStation(lineeS, idfermataD, function (new_fS, idlineaS, fermataD) {
                
              if (typeof new_fS !== 'undefined') {
                // -------------------------------------
                // ho trovato la fermata pù vicina alla destinazione
                var descr_route = ' prendi la linea ' + idlineaS + 
                                  ' e continua fino alla fermata ' + new_fS.DescrizioneFermata;
                var lat = new_fS.PosizioneFermata.Latitudine;
                var lng = new_fS.PosizioneFermata.Longitudine;

                if (typeof callback === 'function') {
                    callback(descr_route, 'bus', lat, lng);  
                };

                // controllo se nella nuova fermata di destinazione esiste la linea della fermata di destinazione
                if (IsExistBusLine(idlineaS, idfermataD)) {

                    // console.log('esiste una linea in comune');
                    // esiste una linea che si interseca la destinazione
                    var descr_route = 'scendi e prendi la linea ' + idlineaS + ' dalla stessa fermata ' +         
                                      new_fS.DescrizioneFermata
                    if (typeof callback === 'function') {
                      callback(descr_route, 'bus', lat, lng);  
                    };

                } else {

                    // console.log('le linee non si intersecano');
                    // non esistono linee della partenza e destinazioni che si intersecano
                    // bisogna raggiungere la destinazione a piedi
                    var d = opencityREST.getDistanceFromLatLonInKm (lat,
                                                                    lng,
                                                                    fermataD.PosizioneFermata.Latitudine,
                                                                    fermataD.PosizioneFermata.Longitudine);
                    if (d > 500) {
                        var descr_route = 'devi scendere dal bus e prendere una fermata diversa distante circa ' + d + 
                                          ' mt, potresti fare una bella passeggiata, oppure prendere un bus, ' +
                                          'alcuni suggerimenti.'; 
                        if (typeof callback === 'function') {
                          callback(descr_route, 
                                   'walk', 
                                   fermataD.PosizioneFermata.Latitudine, 
                                   fermataD.PosizioneFermata.Longitudine);  
                        };
                        // prendi la fermata più vicina alla nuova fermata di partenza partendo dalla fermata di 
                        // destinazione
                        getChangeBusStop(lat, lng, fermataD, function (startS, idlinea, fermataD, distance) {
                            
                            if (startS != null) {
                                
                                var descr_route = 'Puoi prendere dalla fermata ' + startS.DescrizioneFermata + 
                                                  ' a ' + distance + ' mt' +
                                                  ' e prendi la linea ' + idlinea + 
                                                  ' fino a ' + fermataD.DescrizioneFermata;
                                
                                console.log('**** start change bus **** ' + descr_route);
                                
                                if (typeof callback === 'function') {
                                    callback(descr_route, 
                                             'bus', 
                                             startS.PosizioneFermata.Latitudine, 
                                             startS.PosizioneFermata.Longitudine);  
                                };
                            } else {
                                var descr_route = 'in questo momento non posso aiutarti. Sorry!';
                                // console.log(descr_route);
                                if (typeof callback === 'function') {
                                    callback(descr_route, 'bus', 0, 0);  
                                };
                            }
                        });
                        
                    } else {
                        var descr_route = 'puoi scendere e fare una breve passeggiata' ;
                        
                        if (d <= 250) {
                            descr_route += ' di pochi metri';    
                        } else {
                            descr_route += ' di ' + d + ' mt'; 
                        };
                        
                        if (typeof callback === 'function') {
                          callback(descr_route, 
                                   'walk', 
                                   fermataD.PosizioneFermata.Latitudine, 
                                   fermataD.PosizioneFermata.Longitudine);  
                        };
                    }
                }

            } else {
                console.log('+++ non ho trovato la fermata più vicina alla destinazione');
            }   
           });
        }
      });
    };
    
    function getChangeBusStop(lat, lng, fermataD, callback) {
        
        var lat;
        var lng;
        var idfermata;
        var idlinea;
        var distance;
            
        // trovo tra tutte le fremate delle linee della fermata di destinazione quella più vicina alle coordinate
        
        // console.log('scendi a piedi e controlla la fermata ' + JSON.stringify(fermataD));
        console.log('*** Calculate change bus - Start ***');
        
        opencityREST.getTimeTable(fermataD.IdFermata, function(oraripalina) {
            var i = 0;
            var nMax = _.size(oraripalina.PrevisioniLinee); 
            console.log('Trovati n.' + nMax + ' orari palina');
            if (nMax > 0) {
                while (oraripalina.PrevisioniLinee[i]) {
                    var idl = oraripalina.PrevisioniLinee[i].IdLinea;
                    console.log('comincio dalla linea ' + idl);
                    opencityREST.getFermateLineeTeorico(idl, function(fermatelineeteorico) {

                        if (typeof opencityREST.last_stop === 'undefined' || opencityREST.last_stop === null) { 
                            console.log('Ultima fermata null');
                        }
                            
                        // costruisci una stringa per leggere tutte le fermate in una sola chiamata
                        var k = 0;
                        var list_f = '';

                        // creo la lista della fermate da controllare
                        while (fermatelineeteorico[k]) {
                            if (list_f.search(fermatelineeteorico[k].IdFermata) === -1) {
                                list_f += fermatelineeteorico[k].IdFermata;
                                if (k < _.size(fermatelineeteorico) - 1) {
                                    list_f += ',';
                                } 
                            }
                            k++;
                        };

                        // console.log('trovo le fermate ' + list_f);

                        opencityREST.getFermata(list_f, function (f) { 

                            var nf = _.first(_.sortBy(f, function (item) {
                                return opencityREST.getDistanceFromLatLonInKm(item.PosizioneFermata.Latitudine,
                                                                              item.PosizioneFermata.Longitudine,
                                                                              lat,
                                                                              lng);
                            }),1);

                            console.log('La fermata più vicina è ++ ' + JSON.stringify(nf));

                            if (typeof nf !== 'undefined') {
                                
                                // console.log('confronto fermate ++ ');
                                d1 = 0;
                                if (typeof opencityREST.last_stop !== 'undefined' && opencityREST.last_stop != null) {
                                    console.log('Ultima fermata più vicina ' + JSON.stringify(opencityREST.last_stop));
                                    var d1 = opencityREST.getDistanceFromLatLonInKm(
                                        opencityREST.last_stop.PosizioneFermata.Latitudine,
                                        opencityREST.last_stop.PosizioneFermata.Longitudine,
                                        lat,
                                        lng);
                                };

                                var d2 = opencityREST.getDistanceFromLatLonInKm(nf[0].PosizioneFermata.Latitudine,
                                                                                nf[0].PosizioneFermata.Longitudine,
                                                                                lat,
                                                                                lng);


                                if (d2 < d1 || d1 === 0) {
                                    console.log('*** fermata più vicina --- tra distanza ' + d1 + ' e distanza ' + d2);
                                    opencityREST.last_stop = nf[0];
                                    idlinea = idl; 
                                    distance = d2;  
                                } else {
                                    distance = d1;   
                                }

                                if (i == nMax) {
                                    console.log('fine ciclo *** ');
                                    if (typeof callback === 'function') {
                                        console.log('**** callback change bus ' + 
                                                    JSON.stringify(opencityREST.last_stop) + 
                                                    ' distance ' + distance);
                                        callback(opencityREST.last_stop, idlinea, fermataD, distance);
                                    }
                                }
                            };
                        });
                    });
                    i++;
                }
            } else {
                if (i == nMax) {
                    if (typeof callback === 'function') {
                        console.log('++++ callback change bus ' + 
                                    JSON.stringify(opencityREST.last_stop) + 
                                    ' distance ' + distance);
                        callback(null, null, fermataD, 0);
                    }
                }   
            }
        });
    };
      
    function IsExistBusLine(idlinea, idfermata) {
      opencityREST.getTimeTable(idfermata, function (orariopalina) {
        var o = _.find(orariopalina, function (item) {
          return item.IdLinea == idlinea;
        });
        return (typeof o !== 'undefined');
      });
    };
  },

  getRouteByLatLng: function (accuracy, latS, lngS, latD, lngD, idelement, callback) {

    var d = this.getDistanceFromLatLonInKm(latS, 
                                       lngS,
                                       latD,
                                       lngD);
      
    if (d <= accuracy) {
        var point_descr = 'la tua destinazione è a ' + d + ' mt.' +
                          'non mi sembra il caso di aspettare un bus, puoi raggiungerla a piedi.';
        if (typeof callback === 'function') {
            callback(point_descr, 'walk', latD, lngD, idelement);
          }       
    } else {
        // prendo la fermata di destinazione
        this.getFermateByDistance(accuracy, latD, lngD, function (fermataD) {
          // prendo tutte le fermate vicine alle coordinate
          // fermata di destinazione
          if (typeof fermataD !== 'undefined') {
            var firstFermataD = _.first(fermataD, 1);
            var idFermataD = firstFermataD[0].IdFermata;  
            // console.log('view routing from ' + latS + ',' + lngS + ' to Destination ' + idFermataD);
            // prendo le fermate dalle coordinate di partenza
            opencityREST.getRouteByDestination(accuracy, latS, lngS, idFermataD, idelement, callback);
          }
        });   
    }
    
  },

    // numero massimo di corse al giorno
  getNumeroCorseGiorno: function (callback) {
    var url = this.url + 'NumCorseGiorno';
    this.makeJSONrequest(url, function (corsegiorno) {
      if (typeof callback === 'function') {
        callback(corsegiorno);
      }
    });
  },

    // leggo la prima fermate in base alle coordinate geografiche
  getFirstFermataByDistance: function (accuracy, lat, lng, idelement, callback) {
    this.getFermateByDistance(accuracy, lat, lng, function(fn) {
      var f = _.first(fn, 1);
      if (typeof callback === 'function') {
        callback(f[0], idelement);
      }
    });
  },  

  getFermateByDistance: function (accuracy, lat, lng, callback) {
    var url = this.url + 'rete/FermateVicine/' + lat + '/' + lng + '/' + accuracy + '/';
    this.makeJSONrequest(url, callback);
  },

  getDistanceFromLatLonInKm_str: function(lat1, lng1, lat2, lng2) {
    var dStr = '';  
    var d = this.getDistanceFromLatLonInKm(lat1, lng1, lat2, lng2);

    if (d <= 2000) {
      dStr = d + ' mt';
    } else {
      dStr = Math.ceil(d/1000) + ' Km';
    };

    return dStr;

  },

  getDistanceFromLatLonInKm: function (lat1, lng1, lat2, lng2) {
          
    var R = 6371; // Radius of the earth in km
    var dStr = '';
    
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lng2-lng1); 
    
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
    
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = Math.ceil((R * c) * 1000); // Distance in mt
    
    // console.log('Distance beetween ' + lat1 + ',' + lng1 + ' - ' + lat2 + ',' + lng2 + ' are ' + d);

    return d;
    
    function deg2rad(deg) {
        return deg * (Math.PI/180)
    }

  },

  getFermateByLimit: function (lat, lng, limit, callback) {
    this.getFermate(function (response) {
      var b = _.initial(response, _.size(response)-limit);
      if (typeof callback === 'function') {
        callback(b);
      }
    });
  },

  getFermateLineeTeoricoBy: function (linea, idfermata, direzione, idrun, callback) {

    this.getServizioGiornalieroFermata(linea, idfermata, function (f) {

      //console.log('corse Linee Teorico per la linea ' + linea + ' n.' + _.size(f));
      //console.log('Trovo la corsa ' + idrun + ' direzione ' + direzione + ' nell\'array ' + JSON.stringify(f));
      
      if (typeof f !== 'undefined') {
        var s = _.find(f, function (item) {
          return item.IdCorsa == idrun;
        });

        if (typeof s !== 'undefined') {
          opencityREST.getServizioGiornaliero(linea, function (flt) {
            
            var ns = _.filter(flt, function (item) {
              return item.Direzione == s.Direzione && 
                     item.Progressivo > s.Progressivo && 
                     item.IdCorsa == s.IdCorsa;
            });

            if (typeof ns !== 'undefined') {
              //console.log('Prossime Fermate Linee Teorico per la linea ' + linea + ' n.' + _.size(ns));
              if (typeof callback === 'function') {
                callback(ns, idrun, idfermata);
              }
            } 
          }); 
        }   
      }
    });
  },

  getFermateLineeTeorico: function (linea, callback) {
    var url = this.url + 'rete/FermateLineaTeoriche/' + this.convert_name_linea(linea) + '/';
    // console.log('GET Fermate Linee ' + url);
    this.makeJSONrequest(url, callback);
  },

  GETCorsRequest: function(url, callback) {
      
      var error = false;
      var errorMsg = '';

      console.log('GET CORS Request ' + url);

      var createCORSRequest = function(method, url) {
        var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {
          // Most browsers.
          xhr.open(method, url, true);
        } else if (typeof XDomainRequest != "undefined") {
          // IE8 & IE9
          xhr = new XDomainRequest();
          xhr.open(method, url);
        } else {
          // CORS not supported.
          xhr = null;
        }
        return xhr;
      };

      var xhr = createCORSRequest('GET', url);

      if (!xhr) {
        console.log('CORS not supported');
        return;
      };

      // Response handlers.
      xhr.onload = function() {
        var text = xhr.responseText;
        var title = getTitle(text);
        errorMsg = '';
        error=false;
        console.log(JSON.stringify(xhr));
        if (typeof callback === 'function') {
          callback(xhr.response, error, errorMsg)
        }
      };

      xhr.onerror = function() {
      	error = true;
        errorMsg = 'Woops, there was an error making the request.';
        if (typeof callback === 'function') {
          if (error) console.log('Error CORS Request : ' + errorMsg);
          callback(xhr.response, error, errorMsg)
        }
      };

      xhr.setRequestHeader('Access-Control-Allow-Origin', '*');

      xhr.send();
    },

    makeJSONrequest: function (url, callback) {

      // console.log('get JSON data from url ' + url);

      $.getJSON(url, function (result) {
          if (typeof callback === 'function')
          	callback(result);
      });

    },

    // JQuery CORS request
    makeAJAXrequest: function(url, callback) {

        $.ajax({

          // The 'type' property sets the HTTP method.
          // A value of 'PUT' or 'DELETE' will trigger a preflight request.
          type: 'GET',

          // The URL to make the request to.
          url: url,

          // The 'contentType' property sets the 'Content-Type' header.
          // The JQuery default for this property is
          // 'application/x-www-form-urlencoded; charset=UTF-8', which does not trigger
          // a preflight. If you set this value to anything other than
          // application/x-www-form-urlencoded, multipart/form-data, or text/plain,
          // you will trigger a preflight request.
          contentType: 'text/plain',

          xhrFields: {
            // The 'xhrFields' property sets additional fields on the XMLHttpRequest.
            // This can be used to set the 'withCredentials' property.
            // Set the value to 'true' if you'd like to pass cookies to the server.
            // If this is enabled, your server must respond with the header
            // 'Access-Control-Allow-Credentials: true'.
            withCredentials: false
          },

          headers: {
            // Set any custom headers here.
            // If you set any non-simple headers, your server must include these
            // headers in the 'Access-Control-Allow-Headers' response header.
            'Access-Control-Allow-Origin': '*'
          },

          success: function(data) {
            // Here's where you handle a successful response.
            console.log('Success ---> ' + JSON.stringify(data));

            if (typeof callback === 'function') {
                callback(data);
            }

          },

          error: function() {
            // Here's where you handle an error response.
            // Note that if the error was due to a CORS issue,
            // this function will still fire, but there won't be any additional
            // information about the error.
            console.log('Error to get request from opendata ');
          }
        });
    }
	
}