$.ajaxSetup({
  cache: false
});

var stn = null;
var URL_pre = "";
var DEF_STATION = "007";
if (DEVELOPMENT)
  URL_pre = SERVER_URL;
// var tabid = getParameterByName('tabid');

function loadtabs(stn, date) {
  $.ajax({
    url: URL_pre + 'fd' + stn + "/datumTable_" + stn + ".html",
    success: function(result) {
      plotData(stn);
      loadTide(stn, date)
      $("#datumtable").html(result);
      $("#datumgraphic").empty().append("<a href=" + URL_pre + "fd" + stn + "/d" + stn + ".png target='_blank'><img class='img-responsive' src=" + URL_pre + "fd" + stn + "/d" + stn + ".png /></a><p align='center'>[click image to view full size]</p>");
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

function loadTide(stn, date) {
  $.get(URL_pre + "fd" + stn + '/p' + stn + '_' + date + '.png')
    .done(function() {
      $("#predcal").empty().append("<img class='img-responsive' src=" + URL_pre + "fd" + stn + '/p' + stn + '_' + date + '.png />');
      $("#predtable").load(URL_pre + "fd" + stn + '/t' + stn + '_' + date + '.txt');
    }).fail(function() {
      $("#predcal").empty().append("The data for the selected time period doesn't exist");
      $("#predtable").empty().append("The data for the selected time period doesn't exist")
    })

  $("#plot-btn").attr("action", URL_pre + "fd" + stn + '/p' + stn + '_' + date + '.pdf');
  $("#text-btn").attr("action", URL_pre + "fd" + stn + '/t' + stn + '_' + date + '.txt');
};

$("#button1").button();

//    $('select2 option[stn=stn]').attr('selected','selected');
$('select2').attr('selected', 'selected');

$(".tab-list").fadeIn(500);

// Display a tab based on tab anchor
// e,g ...#datumtab
if(window.location.hash)
  document.getElementById(window.location.hash.split('#')[1]).click();
else {
  document.getElementById("defaultTab").click();
}

// adds an anchor to the URL on tab change
$("#tabs").on( "tabsactivate", function(event, ui) {
 window.location.hash = ui.newPanel.attr('id');
 // NK 7/31/18
 // On tab change if the tab content is not within the view the page scrolls down a bit
 // This probably has to do something with jqeury UI used for tabs. For now, I
 // am setting the page scroll back to 0 so the page doesn't jump on tab change
 var element = document.body;
 element.scrollTop = 0
});
$('[data-toggle="tooltip"]').tooltip();
// prepare the form when the DOM is ready
$(document).ready(function() {
// Sharing the same HTML element between all tabs
$metaBox = $("#metaBox");
$metaBox.addClass("ui-tabs-panel-meta");
$metaBox.show();
// Activate the bootstrap tooltip fpr buttons
$('[data-toggle="tooltip"]').tooltip();
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
      history.pushState(null, '', window.location.pathname+"?stn="+stn+window.location.hash);
      loadtabs(stn, getCurrentDate());
    });

    var url = window.location.href;
    console.log("URL "+url);

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
      history.pushState(null, '', window.location.pathname+"?stn="+DEF_STATION+window.location.hash);
    }

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

    $(".select2").select2({
      searchInputPlaceholder: 'Search for a station...'
    });
  });
});
