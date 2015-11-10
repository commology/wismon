$(function() {
  Chart.defaults.global.responsive = true;

  $(document).tooltip({
    open: function (event, ui) {
      ui.tooltip.css('max-width', '400px');
    }
  });

  AmCharts.ready(function() {
  });
});

function capitalize(str) {
  var s = str.toUpperCase();
  return s.substring(0, 1) + str.substring(1);
}

function loadCentre(id, isIcon) {
  if (id) {
    $.ajax({
      url: 'centre/' + id,
      cache: false
    })
    .done(function(node) {
      $('#' + id).html(node);
      $.Metro.initAccordions();
      $('#' + id).draggable();
    });
  }
  else {
  }
}

function loadCentres() {
  // load each centre
  $('div.centre').each(function(index) {
    var id = $(this).attr('id');
    loadCentre(id);
  });
}

function load_monjson(id) {
  var dt = $('#datatable_overall').DataTable();
  if (id) {
    $.ajax({
      url: '../json/' + id + '/latest',
      cache: false
    })
    .done(function(json) {
      console.log(json);
      dt.row.add(['A', 'V1']);
    });
  }
  else {
  }
}

function switchServiceStatus(id, service, green) {
  if(green) {
    $('#service_status_' + id + '_' + service + '_icon').removeClass('RGYlight_R');
    $('#service_status_' + id + '_' + service + '_icon').addClass('RGYlight_G');
    $('#service_status_' + id + '_' + service + '_mini').removeClass('RGYlight_R');
    $('#service_status_' + id + '_' + service + '_mini').addClass('RGYlight_G');
    $('#service_status_' + id + '_' + service + '_main').removeClass('RGYlight_R');
    $('#service_status_' + id + '_' + service + '_main').addClass('RGYlight_G');
  }
  else {
    $('#service_status_' + id + '_' + service + '_icon').removeClass('RGYlight_G');
    $('#service_status_' + id + '_' + service + '_icon').addClass('RGYlight_R');
    $('#service_status_' + id + '_' + service + '_mini').removeClass('RGYlight_G');
    $('#service_status_' + id + '_' + service + '_mini').addClass('RGYlight_R');
    $('#service_status_' + id + '_' + service + '_main').removeClass('RGYlight_G');
    $('#service_status_' + id + '_' + service + '_main').addClass('RGYlight_R');
  }
}

function loadServicesStatus(id) {
  // load services
  $.ajax({
    url: 'services/' + id,
    cache: false
  })
  .done(function(json) {
    if(json.metrics.services.catalogue.status)
      switchServiceStatus(id, 'portal', true);
    else
      switchServiceStatus(id, 'portal', false);
    
    if(json.metrics.services.oai_pmh.status)
      switchServiceStatus(id, 'oaiprovider', true);
    else
      switchServiceStatus(id, 'oaiprovider', false);
    
    if(json.metrics.services.distribution_system.status)
      switchServiceStatus(id, 'distribution', true);
    else
      switchServiceStatus(id, 'distribution', false);
  });
}

function loadHead() {
  // load head
  $.ajax({
    url: '../head',
    cache: false
  })
  .done(function(head) {
    $('head').html(head);
    $.Notify({
      caption: 'Welcome to WMO Common Dashboard !',
      content: ' ',
      timeout: 10000
    });
    $.Notify({
      caption: 'last updated at 2015-5-28 8 UTC',
      content: ' ',
      timeout: 10000
    });
  });
}

function loadTimeline() {
  // load timeline
  $.ajax({
    url: '../json/timeline.json',
    cache: false
  })
  .done(function(json) {
    json.events.forEach(function(elem) {
      var startDate = new Date(elem.start);
      var endDate = new Date(elem.end);
      elem.content = '<div title=\'' + elem.text + '\'>' + elem.title + '</div>';
      elem.start = startDate;
      elem.end = endDate;
      elem.group = elem.centre;
    });
    
    var chartTimeline = new links.Timeline(document.getElementById('timeline'));
    chartTimeline.setOptions({
      width: '100%',
      min: new Date(2014, 1, 1),
      max: new Date(2020, 1, 1),
      groupsWidth: '150px',
      groupMinHeight: 20,
      showCurrentTime: true,
      showNavigation: false,
      axisOnTop: true
    });
    chartTimeline.draw(json.events);
    chartTimeline.setVisibleChartRangeNow();
  });
}

function unloadTimeline() {
  $('#timeline').html('');
}

function toggleTimeline() {
  if ($('#timeline').html() != '')
    unloadTimeline();
  else
    loadTimeline();
}

function load_mdstat() {
  $.ajax({
    url: '../oai/digest',
    cache: false
  })
  .done(function(node) {
    $('#MDStat').html(node);
  });
}

function setAutoZIndex(id) {
  $(id).mouseover(function () {
    $(this).attr('prev_z_index', $(this).css('z-index'));
    $(this).css('z-index', 9999);
  });
  $(id).mouseout(function () {
    if ($(this).attr('prev_z_index') == undefined)
      $(this).css('z-index', 99);
    else
      $(this).css('z-index', $(this).attr('prev_z_index'));
    $(this).removeAttr('prev_z_index');
  });
}

function showChart(rootID, chartID) {
  var root = $(rootID);
  var chart = $(chartID);
  
  var x = root.offset().left + root.width() + 50;
  var y = root.offset().top;
  
  chart.offset({ left: 0, top: 0 });
  chart.toggle(false);
  chart.offset({ left: x, top: y });
  chart.toggle(true);
}

function hideChart(chartID) {
  var chart = $(chartID);
  chart.offset({ left: 0, top: 0 });
  chart.toggle(false);
}

function renderChartLine(centreID, datasetName) {
  var chart = new AmCharts.AmSerialChart();
  chart.pathToImages = '/monitor/test/amcharts/images/';
  chart.dataProvider = JSON.parse($('#chart_' + centreID + '_' + datasetName).attr('dataset'));
  chart.categoryField = 'key';
  
  var categoryAxis = chart.categoryAxis;
  // categoryAxis.dataDateFormat = 'YYYY-MM-DD';
  categoryAxis.autoGridCount = false;
  categoryAxis.gridCound = 5;
  categoryAxis.parseDates = true;
  categoryAxis.minPeriod = 'hh';
  categoryAxis.dashLength = 1;
  categoryAxis.gridAlpha = 0.2;
  categoryAxis.minorGridEnabled = true;
  
  var valueAxis = new AmCharts.ValueAxis();
  valueAxis.autoGridCount = false;
  valueAxis.gridCount = 5;
  valueAxis.axisAlpha = 0.2;
  valueAxis.dashLength = 1;
  chart.addValueAxis(valueAxis);
  
  var graph = new AmCharts.AmGraph();
  graph.valueField = 'val';
  graph.animationPlayed = true;
  graph.type = 'line';
  graph.bullet = 'circle';
  graph.bulletBorderColor = '#C9E1FF';
  graph.bulletBorderThickness = 1;
  graph.bulletBorderAlpha = 1;
  graph.lineColor = '#98C7FF';
  graph.balloonText = "<span style=''>[[val]]</span>";
  graph.hideBulletCount = 20;
  graph.lineThickness = 2;
  chart.addGraph(graph);
  
  var chartCursor = new AmCharts.ChartCursor();
  chartCursor.cursorPosition = 'mouse';
  chartCursor.cursorColor = '#666666';
  chartCursor.cursorAlpha = 0.5;
  chart.addChartCursor(chartCursor);
  
  var chartScrollbar = new AmCharts.ChartScrollbar();
  chartScrollbar.graph = graph;
  chartScrollbar.scrollbarHeight = 20;
  chartScrollbar.color = 'black';
  chartScrollbar.autoGridCount = true;
  chart.addChartScrollbar(chartScrollbar);
  
  chart.write('chart_' + centreID + '_' + datasetName);
}

function showChartLine(centreID, title, datasetName, content) {
  $.Dialog({
    model: false,
    shadow: true,
    overlay: true,
    overlayClickClose: false,
    flat: true,
    draggable: true,
    icon: '<span class="icon-stats"></span>',
    title: title,
    padding: 5,
    onShow: function() {
      $.Dialog.content(content);
      renderChartLine(centreID, datasetName);
    }
  });
}

function submitJSON(url, json) {
  $.ajax({
    type: 'POST',
    url: url,
    data: json,
    dataType: 'json'
  });
}

function showMap(centres) {
  var map = AmCharts.makeChart("mapchart", {
    "type": "map",
    "theme": "light",
    "path": "../ammap",
    "dataProvider": {
      "map": "worldLow",
      "getAreasFromMap": true,
      "images": centres,
    },
    "dragMap": false,
    "areasSettings": {
      "autoZoom": false,
      "color": "#98C7FF",
      "rollOverColor": "#C9E1FF"
    },
    "zoomControl": {
      "panControlEnabled": false,
      "zoomControlEnabled": false
    },
    "export": {
      "enabled": true
    }
  });

  map.addListener("positionChanged", updateMarkers);
}

function updateMarkers(event) {
  var map = event.chart;
  for (var i in map.dataProvider.images) {
    var image = map.dataProvider.images[i];
    //if (image.externalElement == undefined)
      image.externalElement = createMarker(image);
    image.externalElement.style.top = map.latitudeToY(image.latitude) + "px";
    image.externalElement.style.left = map.longitudeToX(image.longitude) + "px";
    //moveTile(image.id);
  }
}

function createMarker(image) {
  var marker = document.createElement('div');
  marker.title = image.title;
  marker.id = image.id;
  marker.style.position = 'absolute';
  marker.className = 'icon-target-2 map_marker';
  $(marker).on('click', function(e) {showTile(this.id);});

  var pie_tl = document.createElement('div');
  pie_tl.id = 'service_status_' + image.id.toLowerCase() + '_' + 'portal' + '_icon';
  pie_tl.style.position = 'absolute';
  pie_tl.className = 'icon-target-2 map_marker map_marker_pie_tl';
  marker.appendChild(pie_tl);

  var pie_tr = document.createElement('div');
  pie_tr.id = 'service_status_' + image.id.toLowerCase() + '_' + 'oaiprovider' + '_icon';
  pie_tr.style.position = 'absolute';
  pie_tr.className = 'icon-target-2 map_marker map_marker_pie_tr';
  marker.appendChild(pie_tr);

  var pie_bl = document.createElement('div');
  pie_bl.id = 'service_status_' + image.id.toLowerCase() + '_' + 'distribution' + '_icon';
  pie_bl.style.position = 'absolute';
  pie_bl.className = 'icon-target-2 map_marker map_marker_pie_bl';
  marker.appendChild(pie_bl);

  var pie_br = document.createElement('div');
  pie_br.id = 'service_status_' + image.id.toLowerCase() + '_' + 'hidden' + '_icon'
  pie_br.style.position = 'absolute';
  pie_br.className = 'icon-target-2 map_marker map_marker_pie_br map_marker_pie_G';
  marker.appendChild(pie_br);

  if (image.chart.chartDiv.hasChildNodes()) {
    for (var i = 2; i < image.chart.chartDiv.childNodes.length; i++) {
      if (image.chart.chartDiv.childNodes[i].title == image.title) {
        image.chart.chartDiv.removeChild(image.chart.chartDiv.childNodes[i]);
      }
    }
  }

  image.chart.chartDiv.appendChild(marker);
  loadServicesStatus(image.id.toLowerCase());
  return marker;
}

function moveTile(id) {
  var iconID = id;
  var tileID = id.toLowerCase();
  var iconElem = $('#' + iconID);
  var tileElem = $('#' + tileID);
  var tileOffset = iconElem.offset();
  tileElem.offset(tileOffset);
}

function showTile(id) {
  var iconID = id;
  var tileID = id.toLowerCase();
  var iconElem = $('#' + iconID);
  var tileElem = $('#' + tileID);
  var tileOffset = tileElem.offset();
  tileElem.offset(tileOffset);
  tileElem.fadeIn('fast');
}

function hideTile(id) {
  var iconID = capitalize(id);
  var tileID = id;
  var iconElem = $('#' + iconID);
  var tileElem = $('#' + tileID);
  tileElem.fadeOut('fast');
}

