var map = "/data/ContinenteConcelhos.json"; //world view
var tvotes = "/data/resultados_eleicoes.json";

var map2;
var votes;

var width = 500;
var height = 600;

list = []
margin = { top: 20, right: 20, bottom: 20, left:40 };

Promise.all([d3.json(map)]).then(function (map) {
    map2 = map;
    console.log(map2)
    generate_map();
    //generate_stacked();
    addZoom();
  });

function generate_map() {
  var projection = d3
    .geoMercator()
    .scale(6000)
    .rotate([5, 5000])
    //.translate([width / 2, height / 2]);

  map2 = map2[0];

  var geog = d3.geoPath().projection(projection);

  console.log(map2);

  svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height)

  svg.append("g")
    .selectAll("path")
    .data(topojson.feature(map2, map2.objects.Concelhos).features)
    .join("path")
    .attr("class", "Concelho")
    .attr("d", geog)
    .attr("id", (d) => {
      return d.properties.Concelho.replace(/\s+/g, '');
    })
    .on("mouseover", handleMouseOver)
    .on("mouseleave", handleMouseLeave)
    .on("click", handleClick)
    /*.attr("id", function (d, i) {
      return d.properties.name;
    })
    .append("title")
    .text(function (d) {
      return d.properties.name;
    })*/;
}

function generate_stacked() {
  votes = d3.json(tvotes);
  var svg = d3.select("#stacked")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  console.log(votes);
}

function handleMouseOver(event, d) {
  name = d.properties.Concelho.replace(/\s+/g, '');

  if(list.includes(d.properties.Concelho) != true) {
    map = d3.select("div#map").select("svg");

    map.select("#"+name)
    .style("fill", "#fa624d");
  }
}

function handleMouseLeave(event, d) {
  name = d.properties.Concelho.replace(/\s+/g, '');

  if(list.includes(d.properties.Concelho) != true) {
    map = d3.select("div#map").select("svg");

    map
    .selectAll("#"+name)
    .style("fill", null);
  } else {
    map
    .selectAll("#"+name)
    .style("fill", "steelblue");
  }
}

function handleClick(event, d) {
  name = d.properties.Concelho.replace(/\s+/g, '');

  if (list.includes(d.properties.Concelho)) {
    list.pop(d.properties.Concelho);

    d3.select("#"+name)
      .attr("fill", null);
  } else {
    list.push(d.properties.Concelho);

    d3.select("#"+name)
      .attr("fill", "steelblue");
  }
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
