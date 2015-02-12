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

function load_gisc(id) {
  if (id) {
    $.ajax({
      url: 'gisc/' + id,
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

function load_centres() {
  // load each centre
  $('div.tiles_centre').each(function(index) {
    var id = $(this).attr('id');
    load_gisc(id);
  });
}

function load_head() {
  // load head
  $.ajax({
    url: 'head',
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
      caption: 'Let\'s try DRAG !',
      content: ' ',
      timeout: 9000
    });
    $.Notify({
      caption: 'Can you find how to show metric chart ?',
      content: ' ',
      timeout: 7000
    });
  });
}

function load_timeline() {
  // load timeline
  $.ajax({
    url: '../json/events.json?timeline=true',
    cache: false
  })
  .done(function(json) {
    json.forEach(function(elem) {
      var startDate = new Date(elem.start);
      var endDate = new Date(elem.end);
      elem.start = startDate;
      elem.end = endDate;
    });
    
    var timeline_chart = new links.Timeline(document.getElementById('timeline'));
    timeline_chart.setOptions({
      width: '600px',
      height: '200px',
      showCurrentTime: true,
      axisOnTop: true
    });
    timeline_chart.draw(json);
  });
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