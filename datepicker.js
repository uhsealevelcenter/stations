
$('#datepicker').datepicker({
  format: "mm/yyyy",
  // startDate: "01/2017",
  // endDate: "02/2020",
  startView: 1,
  minViewMode: 1,
  maxViewMode: 2,
  todayHighlight: true
});

$('#datepicker').on('changeDate', function() {
  var date = $('#datepicker').datepicker('getFormattedDate').split("/")
  var formattedDate = date[1] + date[0];
  loadTide(stn, formattedDate);
  console.log("datepicker on change called");
});

function getCurrentDate() {
  var d = new Date();
  var m = ('0' + (d.getMonth() + 1).toString()).slice(-2);
  var y = d.getFullYear().toString();
  return y + m;
}

function UrlExists(url) {
  $.get(url)
  .done(function() {
    return false;
  }).fail(function() {
    return true;
  })
}
