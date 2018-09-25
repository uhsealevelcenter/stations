$.ajaxSetup({
  cache: false
});

var stn = null;
var URL_pre = "";
var DEF_STATION = "007";
var metaJSON = null;
var LST_URL = "LST/";

if (DEVELOPMENT)
  {
    URL_pre = SERVER_URL;
    LST_URL = DEV_LST_URL;
  }
// var tabid = getParameterByName('tabid');
// var unit = "_cm";
function loadtabs(stn, date, unit = "_cm") {
  if (!$('#unitToggle').prop("checked")) {
    unit = "_cm";
  } else {
    unit = "_ft";
  }

  $.ajax({
    url: LST_URL + 'fd' + stn + "/datumTable_" + stn + unit + ".html",
    success: function(result) {
      plotData(stn);
      loadTide(stn, date);
      $("#datumtable").html(result);
      $("#datumgraphic").empty().append("<a href=" + LST_URL + "fd" + stn + "/d" + stn + unit + ".png target='_blank'><img class='img-responsive' src=" + LST_URL + "fd" + stn + "/d" + stn + unit + ".png /></a><p align='center'>[click image to view full size]</p>");
      $("#datumgraphic").append("<p align=\"justify\">Values are with respect to the <a href=\"https://uhslc.soest.hawaii.edu/datainfo/#22e7eb0370441bb3e\">Station Datum</a>, or zero reference level for the tide gauge, as indicated in the table.</p>");
      $("#tabs").tabs("destroy");
      $("#tabs").tabs();
      // $( "#tabs" ).tabs({ active: tabid });
    },
    error: function(xhr, ajaxOptions, thrownError) {
      if (stn) {
        alert("Datum table for station " + stn + " does not exist");
        plotData(stn);
      }
    }
  });
}

function findIndexByStnID(jsonobj, stnID) {
  return jsonobj.features.findIndex(function(item, i) {
    return item.properties.uhslc_id === stnID;
  });
}

function loadTide(stn, date, unit = "_cm") {
  if (!$('#unitToggle').prop("checked")) {
    unit = "_cm";
  } else {
    unit = "_ft";
  }
  $.get(LST_URL + "fd" + stn + '/p' + stn + '_' + date + unit + '.png')
    .done(function() {
      $("#predcal").empty().append("<img class='img-responsive' src=" + LST_URL + "fd" + stn + '/p' + stn + '_' + date + unit + '.png />');
      $("#predtable").load(LST_URL + "fd" + stn + '/t' + stn + '_' + date + unit + '.txt');
    }).fail(function() {
      $("#predcal").empty().append("The data for the selected time period doesn't exist");
      $("#predtable").empty().append("The data for the selected time period doesn't exist")
    })

  $("#plot-btn").attr("action", LST_URL + "fd" + stn + '/p' + stn + '_' + date + unit + '.pdf');
  $("#text-btn").attr("action", LST_URL + "fd" + stn + '/t' + stn + '_' + date + unit + '.txt');
};

$("#button1").button();

//    $('select2 option[stn=stn]').attr('selected','selected');
$('select2').attr('selected', 'selected');

$(".tab-list").fadeIn(500);

// Display a tab based on tab anchor
// e,g ...#datumtab
if (window.location.hash)
  document.getElementById(window.location.hash.split('#')[1]).click();
else {
  document.getElementById("defaultTab").click();
}
// Control Display of Unit conversion buttons based on tabs
unitButtonsController(window.location.hash);
// adds an anchor to the URL on tab change
$("#tabs").on("tabsactivate", function(event, ui) {
  window.location.hash = ui.newPanel.attr('id');
  // NK 7/31/18
  // On tab change if the tab content is not within the view the page scrolls down a bit
  // This probably has to do something with jqeury UI used for tabs. For now, I
  // am setting the page scroll back to 0 so the page doesn't jump on tab change
  var element = document.body;
  element.scrollTop = 0
  // Control Display of Unit conversion buttons based on tabs
  unitButtonsController(window.location.hash);
});

// prepare the form when the DOM is ready
$(document).ready(function() {
  // Sharing the same HTML element between all tabs
  $metaBox = $("#metaBox");
  $metaBox.addClass("ui-tabs-panel-meta");
  $metaBox.show();

  // automagically resize tab content div
  $("#tabs").tabs().css({
    // 'min-height': '400px',
    'overflow': 'auto'
  });
  $(function() {
    $("#tabs").tabs();
  });
  $("#tabs").tabs({
    heightStyle: 'fill'
  });
  $('#selectbox').load(URL_pre + 'selectbox.html', function() {
    // $("select2").select2();
    // $('select').trigger('change.select2');
    $('.select2').val(DEF_STATION).trigger('change');

    $('#selectbox').on('select2:select', function(e) {
      var data = e.params.data;
      stn = data.id;
      // update the address bar when selection in the dropdown has changed
      history.pushState(null, '', window.location.pathname + "?stn=" + stn + window.location.hash);
      loadtabs(stn, getCurrentDate());
      // If request for json file with Metadata (below fails) there won't be
      // another attempt to retrive the file again. Maybe should consider
      // implementing that feature
      populateMetaDataTables(stn, metaJSON.responseJSON);
    });

    var url = window.location.href;

    // check if the url is a direct link and select the correct station in
    // the dropdown menu
    var url_pattern = url.split('?stn=');
    if (url_pattern.length > 1) {
      // adding another split based on '#' because we are adding #tidetab
      // as a default tab.
      stn = url_pattern[1].split('#')[0];
      $('.select2').val(stn).trigger('change');
    } else {
      stn = $("select").val();
      // Updated the address bar when first landing on page
      history.pushState(null, '', window.location.pathname + "?stn=" + DEF_STATION + window.location.hash);
    }

    // Request json file with Metadata
    metaJSON = $.getJSON("https://uhslc.soest.hawaii.edu/data/meta.geojson", function(data) {
        // request succeeded
        populateMetaDataTables(stn, data)
        // loadMetaDataTables(stn);
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        alert('Metadata request failed! ' + textStatus);

      })
      .always(function() {
        // request ended
      });
    loadtabs(stn, getCurrentDate());
    //        $('#datumtable').load('fd001/datumTable_001.html');
    //         $('#datumgraphic').append("<img src='fd001/d001.png' />");

    // Adding a placeholder to the select2 search field as per
    // https://github.com/select2/select2/issues/3362
    (function($) {

      var Defaults = $.fn.select2.amd.require('select2/defaults');

      $.extend(Defaults.defaults, {
        searchInputPlaceholder: ''
      });

      var SearchDropdown = $.fn.select2.amd.require('select2/dropdown/search');

      var _renderSearchDropdown = SearchDropdown.prototype.render;

      SearchDropdown.prototype.render = function(decorated) {

        // invoke parent method
        var $rendered = _renderSearchDropdown.apply(this, Array.prototype.slice.apply(arguments));

        this.$search.attr('placeholder', this.options.get('searchInputPlaceholder'));

        return $rendered;
      };

    })(window.jQuery);
    //Call date picker so that the current month is highlighted
    $('#datepicker').datepicker('update', getCurrentDate());
    $(".select2").select2({
      searchInputPlaceholder: 'Search for a station...'
    });
  });

});

function unitButtonsController(hash) {
  if (hash === "#tidecal" || hash === "#datums") {
    $('#timeToggle').disable = true;
    document.getElementById("timeToggle").disabled = true;
    document.getElementById("datumToggle").disabled = true;
  } else {
    document.getElementById("timeToggle").disabled = false;
    document.getElementById("datumToggle").disabled = false;
  }
  var x = document.getElementsByClassName("datum-tz");
  for (var i = 0; i<x.length; i++){
    if (hash === "#tidecal" || hash === "#datums") {
      x[i].style.opacity = "0.2";
    } else {
      x[i].style.opacity = "1.0";
    }

  }
}

function populateMetaDataTables(stnID, jsondata) {
  var metadata = jsondata.features[findIndexByStnID(jsondata, parseInt(stnID))];
  var basin = metadata.properties.rq_basin;
  var glossID = metadata.properties.gloss_id;
  var version = Object.keys(metadata.properties.rq_versions).pop();
  if(glossID == 0){
    glossID = "N/A";
  }
  $("#metaName").html(metadata.properties.name);
  $("#metaCountry").html(metadata.properties.country);
  $("#metaUHID").html(metadata.properties.uhslc_id);
  $("#glossID").html(glossID);
  // $("#metaLAT").html(metadata.features[findIndexByStnID(metadata, parseInt(stn))].geometry.coordinates[1]+', '+ metadata.features[findIndexByStnID(metadata, parseInt(stn))].geometry.coordinates[0]);
  $("#metaLAT").html(metadata.geometry.coordinates[1]);
  $("#metaLONG").html(metadata.geometry.coordinates[0]);

  // Populate #metaTable1 with links to daily data
  $("#fastD").html(
    "<a href=\"https://uhslc.soest.hawaii.edu/woce/d" + stnID + '.dat' + "\">" + ".dat" + "<\a>" +
    "<a href=\"https://uhslc.soest.hawaii.edu/data/csv/fast/daily/d" + stnID + '.csv' + "\">" + " .csv" + "<\a>" +
    "<a target=\"_blank\" href=\"https://uhslc.soest.hawaii.edu/opendap/fast/daily/d" + stnID + '.nc.html' + "\">" + " .nc" + "<\a>"
    // "<a href=\"https://uhslc.soest.hawaii.edu/woce/d" + stnID + '.nc' + "\">" + " .nc(old)" + "<\a>"
  );

  $("#researchD").html(
    "<a href=\"https://uhslc.soest.hawaii.edu/rqds/"+basin+"/daily/d" + stnID + 'a.dat' + "\">" + ".dat" + "<\a>" +
    "<a href=\"https://uhslc.soest.hawaii.edu/data/csv/rqds/"+basin+"/daily/d" + stnID + 'a.csv' + "\">" + " .csv" + "<\a>" +
    "<a target=\"_blank\" href=\"https://uhslc.soest.hawaii.edu/opendap/rqds/"+basin+"/daily/d" + stnID +version +'.nc.html' + "\">" + " .nc" + "<\a>"
    // "<a href=\"https://uhslc.soest.hawaii.edu/woce/d" + stnID + 'a.nc' + "\">" + " .nc(old)" + "<\a>"
  );

  // Populate #metaTable1 with links to hourly data
  $("#fastH").html(
    "<a href=\"https://uhslc.soest.hawaii.edu/woce/h" + stnID + '.dat' + "\">" + ".dat" + "<\a>" +
    "<a href=\"https://uhslc.soest.hawaii.edu/data/csv/fast/hourly/h" + stnID + '.csv' + "\">" + " .csv" + "<\a>" +
    "<a target=\"_blank\" href=\"https://uhslc.soest.hawaii.edu/opendap/fast/hourly/h" + stnID + '.nc.html' + "\">" + " .nc" + "<\a>"
    // "<a href=\"https://uhslc.soest.hawaii.edu/woce/d" + stnID + '.nc' + "\">" + " .nc(old)" + "<\a>"
  );

  $("#researchH").html(
    "<a href=\"https://uhslc.soest.hawaii.edu/rqds/"+basin+"/daily/d" + stnID + 'a.dat' + "\">" + ".dat" + "<\a>" +
    "<a href=\"https://uhslc.soest.hawaii.edu/data/csv/rqds/"+basin+"/hourly/h" + stnID + 'a.csv' + "\">" + " .csv" + "<\a>" +
    "<a target=\"_blank\" href=\"https://uhslc.soest.hawaii.edu/opendap/rqds/"+basin+"/hourly/h" + stnID + version +'.nc.html' + "\">" + " .nc" + "<\a>"
    // "<a href=\"https://uhslc.soest.hawaii.edu/woce/d" + stnID + 'a.nc' + "\">" + " .nc(old)" + "<\a>"
  );

  $("#metadata").html(
    "<a target=\"_blank\" href=\"https://uhslc.soest.hawaii.edu/rqds/"+basin+"/doc/qa" + stnID + version +'.dmt' + "\">" + "<strong>METADATA</strong>" + "<\a>");
}
