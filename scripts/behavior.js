function init() {
  map();
}
  
function map() {
  var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 600 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select("div#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);  
}



 