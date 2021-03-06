function draw_map() {
  var h = $("#map-container").width();
  var offSet=8;
  $("#map").css("width", (h-offSet));
  var states = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "15"]
  var map = L.map('map').setView([24, -100], 5);

  var transition = (function () {
      var json = null;
      $.ajax({
          'async': false,
          'global': false,
          'url': "Data/salen.json",
          'dataType': "json",
          'success': function (data) {
              json = data;
          }
      });
      return json;
  })(); 
  var cve_estados = (function () {
      var json = null;
      $.ajax({
          'async': false,
          'global': false,
          'url': "Data/cve_estados.json",
          'dataType': "json",
          'success': function (data) {
              json = data;
          }
      });
      return json;
  })(); 
  var resumen = (function () {
      var json = null;
      $.ajax({
          'async': false,
          'global': false,
          'url': "Data/resumen.json",
          'dataType': "json",
          'success': function (data) {
              json = data;
          }
      });
      return json;
  })();
  var salen_total = (function () {
      var json = null;
      $.ajax({
          'async': false,
          'global': false,
          'url': "Data/salen_total.json",
          'dataType': "json",
          'success': function (data) {
              json = data;
          }
      });
      return json;
  })();  
  var json = (function () {
      var json = null;
      $.ajax({
          'async': false,
          'global': false,
          'url': "Data/Resultados.geojson",
          'dataType': "json",
          'success': function (data) {
              json = data;
          }
      });
      return json;
  })(); 
  
  L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
    maxZoom: 18,
    minZoom: 5,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> ' +
      'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'examples.map-20v6611k'
  }).addTo(map);


  // control that shows state info on hover
  var info = L.control();

  info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    //this.setAttribute('',);
    return this._div;
  };

  info.update = function (props) {
    this._div.innerHTML = '<h4>Turismo en Mexico</h4>' +  (props ?
      '<b>' + props.NOM_ENT + '</b><br />' +  
      'Salieron: ' + resumen[parseInt(props.CVE_ENT)-1].Salen + '</b><br />' +
      'Llegaron: ' + resumen[parseInt(props.CVE_ENT)-1].Entran
      : 'Escoge un estado');
  };

  info.addTo(map);

  function selectScale(id, out_flag, state_id) {
    out_flag = typeof out_flag !== 'undefined' ? out_flag : true;
    state_id = typeof state_id !== 'undefined' ? state_id : "10";

    if(out_flag){
      return transition[parseInt(state_id)-1][id]
    }
    else{
      return salen_total[id]
    }
  }

  // get color depending on population density value
  function getColor(d) {
    return d > .25  ? '#800026' :
           d > .20  ? '#BD0026' :
           d > .15  ? '#E31A1C' :
           d > .10  ? '#FC4E2A' :
           d > .05  ? '#FD8D3C' :
           d > .02  ? '#FEB24C' :
           d > .01  ? '#FED976' :
                      '#FFEDA0';
  }

  function style(feature, state_id, out_flag) {
    if (state_id === "-1"){
      return {
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7,
        fillColor: getColor(selectScale(feature.properties.CVE_ENT, out_flag = false, state_id = -1))
      };
    }
    return {
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7,
      fillColor: getColor(selectScale(feature.properties.CVE_ENT, out_flag = out_flag, state_id = state_id))
    };
  }

  function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
      weight: 2,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToFront();
    }

    info.update(layer.feature.properties);
  }

  var geojson;

  function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
  }

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: (function (e) {
        updateMap(first = false, state_id = feature.properties.CVE_ENT);
      })
    });
  }

  function updateMap(first, state_id) {
    first = typeof first !== 'undefined' ? first : false;
    state_id = typeof state_id !== 'undefined' ? state_id : "-1";
    $('#bar_bar_chart svg').remove();
    if(state_id == "-1"){
      createchart("Data/salen_total.tsv");
      $("#chart-bar-header").text("Totales")
    } else {
      $("#chart-bar-header").text("Estado: " + cve_estados[state_id])
      createchart( "Data/out_state_" + String(parseInt(state_id) - 1) + ".tsv" );
    }  
    if(!first){
      map.removeLayer( geojson )
    }

    function tempStyle(feature){
      return(style(feature, state_id = state_id))
    }
    
    geojson = L.geoJson(json, {
      style: tempStyle,
      onEachFeature: onEachFeature
    })

    geojson.addTo(map);

  }

  function onMapClick(e) {
    updateMap()
  }

  updateMap(first = true)

  /*geojson = L.geoJson(statesData, {
    style: style,
    onEachFeature: onEachFeature
  });*/

  var legend = L.control({position: 'bottomleft'});

  legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
      grades = [0,0.01, .02, .05, .10, .15, .20, .25],
      labels = [],
      from, to;

    for (var i = 0; i < grades.length; i++) {
      from = grades[i];
      to = grades[i + 1];

      labels.push(
        '<i style="background:' + getColor(from + .001) + '"></i> ' +
        100*from + '%' + (to ? '&ndash;' + 100*to + '%' : '+'));
    }

    div.innerHTML = labels.join('<br>');
    return div;
  };

  legend.addTo(map);
  map.on('click', onMapClick);
}

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

//    SECOND MAP

// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
// ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

function draw_map2() {
  var h = $("#map-container2").width();
  var offSet=8;
  $("#map2").css("width", (h-offSet));
  var states = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "15"]
  var map = L.map('map2').setView([24, -100], 5);

  var transition = (function () {
      var json = null;
      $.ajax({
          'async': false,
          'global': false,
          'url': "Data/entran.json",
          'dataType': "json",
          'success': function (data) {
              json = data;
          }
      });
      return json;
  })();
  var cve_estados = (function () {
      var json = null;
      $.ajax({
          'async': false,
          'global': false,
          'url': "Data/cve_estados.json",
          'dataType': "json",
          'success': function (data) {
              json = data;
          }
      });
      return json;
  })();
  var resumen = (function () {
      var json = null;
      $.ajax({
          'async': false,
          'global': false,
          'url': "Data/resumen.json",
          'dataType': "json",
          'success': function (data) {
              json = data;
          }
      });
      return json;
  })();
  var entran_total = (function () {
      var json = null;
      $.ajax({
          'async': false,
          'global': false,
          'url': "Data/entran_total.json",
          'dataType': "json",
          'success': function (data) {
              json = data;
          }
      });
      return json;
  })(); 
  var json = (function () {
      var json = null;
      $.ajax({
          'async': false,
          'global': false,
          'url': "Data/Resultados.geojson",
          'dataType': "json",
          'success': function (data) {
              json = data;
          }
      });
      return json;
  })();

  L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
    maxZoom: 18,
    minZoom: 5,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> ' +
      'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'examples.map-20v6611k'
  }).addTo(map);


  // control that shows state info on hover
  var info = L.control();

  info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    //this.setAttribute('',);
    return this._div;
  };

  info.update = function (props) {
    this._div.innerHTML = '<h4>Turismo en Mexico</h4>' +  (props ?
      '<b>' + props.NOM_ENT + '</b><br />' +
      'Salieron: ' + resumen[parseInt(props.CVE_ENT)-1].Salen + '</b><br />' +
      'Llegaron: ' + resumen[parseInt(props.CVE_ENT)-1].Entran
      : 'Escoge un estado');
  };

  info.addTo(map);

  function selectScale(id, out_flag, state_id) {
    out_flag = typeof out_flag !== 'undefined' ? out_flag : true;
    state_id = typeof state_id !== 'undefined' ? state_id : "10";

    if(out_flag){

      return transition[parseInt(id)-1][state_id]
    } else {
      return entran_total[id]
    }
  }

  // get color depending on population density value
  function getColor(d) {
    return d > .25  ? "#084594" :
           d > .20  ? "#2171b5" :
           d > .15  ? "#4292c6" :
           d > .10  ? "#6baed6" :
           d > .05  ? "#9ecae1" :
           d > .02  ? "#c6dbef" :
           d > .01  ? "#deebf7" :
                      "#f7fbff";

  }
  function style(feature, state_id, out_flag) {
    if (state_id === "-1"){
      return {
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7,
        fillColor: getColor(selectScale(feature.properties.CVE_ENT, out_flag = false, state_id = false))
      };
    }
    return {
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7,
      fillColor: getColor(selectScale(feature.properties.CVE_ENT, out_flag = out_flag, state_id = state_id))
    };
  }

  function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
      weight: 2,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToFront();
    }

    info.update(layer.feature.properties);
  }

  var geojson;

  function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
  }

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: (function (e) {
        updateMap(first = false, state_id = feature.properties.CVE_ENT);

        })
    });
  }

  function updateMap(first, state_id) {
    first = typeof first !== 'undefined' ? first : false;
    state_id = typeof state_id !== 'undefined' ? state_id : "-1";
    
    $('#bar_bar_chart2 svg').remove();
    if(state_id == "-1"){
      $("#chart-bar-header2").text("Totales")
      createchart2("Data/entran_total.tsv");
    } else {
      $("#chart-bar-header2").text("Estado: " + cve_estados[state_id])
      createchart2( "Data/in_state_" + String(parseInt(state_id) - 1) + ".tsv" );
    }
    if(!first){
      map.removeLayer( geojson )
    }
    function tempStyle(feature){
      return(style(feature, state_id = state_id))
    }

    geojson = L.geoJson(json, {
      style: tempStyle,
      onEachFeature: onEachFeature
    })

    geojson.addTo(map);

  }

  function onMapClick(e) {
    updateMap()
  }

  updateMap(first = true)

  /*geojson = L.geoJson(statesData, {
    style: style,
    onEachFeature: onEachFeature
  });*/

  var legend = L.control({position: 'bottomleft'});

  legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
      grades = [0,0.01, .02, .05, .10, .15, .20, .25],
      labels = [],
      from, to;

    for (var i = 0; i < grades.length; i++) {
      from = grades[i];
      to = grades[i + 1];

      labels.push(
        '<i style="background:' + getColor(from + .001) + '"></i> ' +
        100*from + '%' + (to ? '&ndash;' + 100*to + '%' : '+'));
    }

    div.innerHTML = labels.join('<br>');
    return div;
  };

  legend.addTo(map);
  map.on('click', onMapClick);
}
function draw_map3() {
  var h = $("#map-container3").width();
  var offSet=8;
  $("#map3").css("width", (h-offSet));
  var states = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "15"]
  var map = L.map('map3').setView([24, -100], 5);

  var transition = (function () {
      var json = null;
      $.ajax({
          'async': false,
          'global': false,
          'url': "Data/entran.json",
          'dataType': "json",
          'success': function (data) {
              json = data;
          }
      });
      return json;
  })();
  var cve_estados = (function () {
      var json = null;
      $.ajax({
          'async': false,
          'global': false,
          'url': "Data/cve_estados.json",
          'dataType': "json",
          'success': function (data) {
              json = data;
          }
      });
      return json;
  })();
  var resumen = (function () {
      var json = null;
      $.ajax({
          'async': false,
          'global': false,
          'url': "Data/resumen.json",
          'dataType': "json",
          'success': function (data) {
              json = data;
          }
      });
      return json;
  })();
  var entran_total = (function () {
      var json = null;
      $.ajax({
          'async': false,
          'global': false,
          'url': "Data/entran_total.json",
          'dataType': "json",
          'success': function (data) {
              json = data;
          }
      });
      return json;
  })(); 
  var json = (function () {
      var json = null;
      $.ajax({
          'async': false,
          'global': false,
          'url': "Data/Resultados.geojson",
          'dataType': "json",
          'success': function (data) {
              json = data;
          }
      });
      return json;
  })();

  L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
    maxZoom: 18,
    minZoom: 5,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> ' +
      'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'examples.map-20v6611k'
  }).addTo(map);


  // control that shows state info on hover
  var info = L.control();

  info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    //this.setAttribute('',);
    return this._div;
  };

  info.update = function (props) {
    this._div.innerHTML = '<h4>Análisis de Sentimiento</h4>' +  (props ?
      '<b>' + props.NOM_ENT + '</b><br />' +
      'Salieron: ' + resumen[parseInt(props.CVE_ENT)-1].Salen + '</b><br />' +
      'Llegaron: ' + resumen[parseInt(props.CVE_ENT)-1].Entran
      : 'Score de 0 a 1');
  };

  info.addTo(map);

  function selectScale(id, out_flag, state_id) {
    out_flag = typeof out_flag !== 'undefined' ? out_flag : true;
    state_id = typeof state_id !== 'undefined' ? state_id : "10";

    if(out_flag){

      return transition[parseInt(id)-1][state_id]
    } else {
      return entran_total[id]
    }
  }

  // get color depending on population density value
  function getColor(d) {
    return d > .87.5  ? "#1a9850" :
           d > .75  ? "#66bd63" :
           d > .62.5  ? "#a6d96a" :
           d > .50  ? "#d9ef8b" :
           d > .37.5  ? "#fee08b" :
           d > .25  ? "#fdae61" :
           d > .12.5  ? "#f46d43" :
                      "#d73027";

  }
  function style(feature, state_id, out_flag) {
    if (state_id === "-1"){
      return {
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7,
        fillColor: getColor(selectScale(feature.properties.CVE_ENT, out_flag = false, state_id = false))
      };
    }
    return {
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7,
      fillColor: getColor(selectScale(feature.properties.CVE_ENT, out_flag = out_flag, state_id = state_id))
    };
  }

  function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
      weight: 2,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToFront();
    }

    info.update(layer.feature.properties);
  }

  var geojson;

  function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
  }

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: (function (e) {
        updateMap(first = false, state_id = feature.properties.CVE_ENT);

        })
    });
  }

  function updateMap(first, state_id) {
    first = typeof first !== 'undefined' ? first : false;
    state_id = typeof state_id !== 'undefined' ? state_id : "-1";
    
    $('#bar_bar_chart3 svg').remove();
    if(state_id == "-1"){
      $("#chart-bar-header3").text("Totales")
      createchart2("Data/entran_total.tsv");
    } else {
      $("#chart-bar-header3").text("Estado: " + cve_estados[state_id])
      createchart2( "Data/in_state_" + String(parseInt(state_id) - 1) + ".tsv" );
    }
    if(!first){
      map.removeLayer( geojson )
    }
    function tempStyle(feature){
      return(style(feature, state_id = state_id))
    }

    geojson = L.geoJson(json, {
      style: tempStyle,
      onEachFeature: onEachFeature
    })

    geojson.addTo(map);

  }

  function onMapClick(e) {
    updateMap()
  }

  updateMap(first = true)

  /*geojson = L.geoJson(statesData, {
    style: style,
    onEachFeature: onEachFeature
  });*/

  var legend = L.control({position: 'bottomleft'});

  legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
      grades = [0,0.01, .02, .05, .10, .15, .20, .25],
      labels = [],
      from, to;

    for (var i = 0; i < grades.length; i++) {
      from = grades[i];
      to = grades[i + 1];

      labels.push(
        '<i style="background:' + getColor(from + .001) + '"></i> ' +
        100*from + '%' + (to ? '&ndash;' + 100*to + '%' : '+'));
    }

    div.innerHTML = labels.join('<br>');
    return div;
  };

  legend.addTo(map);
  map.on('click', onMapClick);
}
 // ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
 // ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====

draw_map();
draw_map2();
draw_map3();
 // ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
 // ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====


$(window).resize(function(){

  var offSet=8;

  var h = $("#map-container").width();
  $("#map").css("width", (h-offSet));

  var h2 = $("#map-container2").width();
  $("#map2").css("width", (h2-offSet));

  var h3 = $("#map-container3").width();
  $("#map3").css("width", (h3-offSet));
}).resize();

