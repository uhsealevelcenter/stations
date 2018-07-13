$.ajaxSetup({
  cache: false
});
document.getElementById("defaultTab").click();
// var url = "test.json";

/*var pdata = (function () {
var pdata = null;
$.ajax({
'async': false,
'global': false,
'url': url,
'dataType': "json",
'success': function (data) {
pdata = data;
}
});
return pdata;
})();
*/

// var pdata;
// $.getJSON(url, function(json) {
//   pdata = json;
// });
//
// a = pdata;
// console.log(a);

// function getParameterByName(name, url) {
//   if (!url) {
//     url = window.location.href;
//   }
//   name = name.replace(/[\[\]]/g, "\\$&");
//   var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
//     results = regex.exec(url);
//   if (!results) return null;
//   if (!results[2]) return '';
//   return decodeURIComponent(results[2].replace(/\+/g, " "));
// }

var stn = null;
var URL_pre = ""
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
      $("#datumgraphic").empty().append("<a href=" + URL_pre + "fd" + stn + "/d" + stn + ".png><img class='img-responsive' src=" + URL_pre + "fd" + stn + "/d" + stn + ".png /></a><p align='center'>[click image to view full size]</p>");

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
  $.get(URL_pre+"fd" + stn + '/p' + stn + '_' + date + '.png')
  .done(function() {
    $("#predcal").empty().append("<img class='img-responsive' src="+ URL_pre+"fd" + stn + '/p' + stn + '_' + date + '.png />');
    $("#predtable").load(URL_pre+"fd" + stn + '/t' + stn + '_' + date + '.txt');
  }).fail(function() {
    $("#predcal").empty().append("The data for the selected time period doesn't exist");
    $("#predtable").empty().append("The data for the selected time period doesn't exist")
  })

  $("#plot-btn").attr("action", URL_pre+"fd" + stn + '/p' + stn + '_' + date + '.pdf');
  $("#text-btn").attr("action", URL_pre+"fd" + stn + '/t' + stn + '_' + date + '.txt');
};

$("#button1").button();

//    $('select2 option[stn=stn]').attr('selected','selected');
$('select2').attr('selected', 'selected');

$(".tab-list").fadeIn(500);
// prepare the form when the DOM is ready
$(document).ready(function() {
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
  $('#selectbox').load('selectbox.html', function() {
    // $("select2").select2();
    $('select').trigger('change.select2');
    if (!stn) {
      datatype = '001';
    }

    $('#selectbox').on('select2:select', function(e) {
      var data = e.params.data;
      stn = data.id;
      loadtabs(stn, getCurrentDate());
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
