var map = "/data/ContinenteConcelhos.geojson"; //world view

var width = 1000;
var height = 400;

margin = { top: 20, right: 20, bottom: 20, left:40 };


function init() {
  generate_map();
}
  
function generate_map() {
  var projection = d3
  .geoMercator()
  .scale(height / 2)
  .rotate([0, 0])
  .center([0, 0])
  .translate([width / 2, height / 2]);

  var path = d3.geoPath().projection(projection);
  
  d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .selectAll("path")
    //.data(topojson.feature(topology, topology.objects.countries).features)
    .join("path")
    .attr("class", "Concelho")
    .attr("d", path)
    .on("mouseover", handleMouseOver)
    .on("mouseleave", handleMouseLeave)
    /*.attr("id", function (d, i) {
      return d.properties.name;
    })
    .append("title")
    .text(function (d) {
      return d.properties.name;
    })*/;
}

function handleMouseOver(event, d) {
  geo_map = d3.select("div#map").select("svg");

  geo_map
    .selectAll("path")
    .filter(function (c) {
      if (d.country == c.properties.name) {
        return c;
      } 
    })
    .style("fill", "red");
}

function handleMouseLeave(event, d) {
  d3.select("div#map")
    .select("svg")
    .selectAll("path");
}

function addZoom() {
  d3.select("#map")
    .selectAll("svg")
    .call(d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed));
}

function zoomed({transform}) {
  d3.select("#map")
    .selectAll("svg")
    .selectAll("path")
    .attr("transform", transform);
}

 