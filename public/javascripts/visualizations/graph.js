var circle;
var state = 0; // 0 is normal, 1 is radius size sent, 2 is radius size received;
var force;
var link;

function render(data, options, openDetails, cb){
  var width = $('#d3_visualization').width(),
    height = options.height || window.innerHeight;

  var color = d3.scale.category20();

  force = d3.layout.force()
      .linkDistance(100)
      .charge(-400)
      .size([width, height]);

  // var drag = force.drag().on("dragstart", function(d) {d3.select(this).classed("fixed", d.fixed = true)});
    var drag = force.drag()
      .on("dragstart", dragstart)
      // .on("drag", dragmove)
      .on("dragend", dragend);

  //Add button to the layout
  var div = d3.select("#d3_visualization").append("div").attr("id", "d3_button_bar");

  $("#d3_button_bar").append("<input type='button' value='Normal radius' onclick='normalRadius();' />");
  $("#d3_button_bar").append("<input type='button' value='Radius by Sent' onclick='sentRadius();' />");
  $("#d3_button_bar").append("<input type='button' value='Radius by Received' onclick='receivedRadius();' />");

  var svg = d3.select("#d3_visualization").append("svg")
      .attr("id", "d3_svg")
      .attr("width", width)
      .attr("height", height);

  // console.log(JSON.stringify(data));

  if(data.total == 0){
    cb({error: "No results for this query"});
    return;
  }

  var total = data.total;
    data.nodes.forEach(function(d, i) { d.x = d.y = width / total * i; });

  var tablesByIndex = d3.map();
  var gravity = Math.sqrt(total) / 20 < 0.1 ? 0.1 : Math.sqrt(total) / 20;

  force
    .gravity(gravity)
    .nodes(data.nodes)
    .links(data.links);

  // Create the links between nodes
  link = svg.append("defs").selectAll("marker")
      .data(force.links())
      .enter().append("marker")
      .attr("id", "marker")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 3)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5");

  var path = svg.append("g").selectAll("path")
    .data(force.links())
  .enter().append("path")
    .attr("class", "link");

  var markerPath = svg.append("g").selectAll("path")
      .data(force.links())
    .enter().append("path")
      .attr("class", "link")
      .attr("marker-end", "url(#marker)")
      .attr("marker-start", "url(#marker)")
      .on("click", mouseclickLink);

  //Add the nodes
  var node = svg.selectAll(".node")
      .data(data.nodes)
    .enter().append("g")
      .attr("class", "node")
      .attr("r", "15")
      .on("mouseover", mouseover)
      .on("mouseout", mouseout)
      .on("click", mouseclick)
      .call(drag);

  //Give each node a circle
  circle = node.append("circle")
      .attr("r", 8)
      .style("fill", function(d) { return color(d.name); });
   
  //Give each node a label
  node.append("text")
      .attr("x", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    path.attr("d", function(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    });
    //http://stackoverflow.com/a/15753121/1150302
    markerPath.attr("d", function(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);

    // used to say '/2' at the end
      var endX = (d.target.x + d.source.x) / 2;
      var endY = (d.target.y + d.source.y) / 2;
      var len = dr - ((dr/2) * Math.sqrt(3));

      endX = endX + (dy * len/dr);
      endY = endY + (-dx * len/dr);

      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + endX + "," + endY;
    });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  });

  force.on("end", function(d){
    data.nodes.forEach(function(d) { d.fixed = true; });
  });

  function dragstart(d, i) {
    force.stop() // stops the force auto positioning before you start dragging
  }

  function dragmove(d, i) {
      d.px += d3.event.dx;
      d.py += d3.event.dy;
      d.x += d3.event.dx;
      d.y += d3.event.dy; 
      force.tick(); // this is the key to make it work together with updating both px,py,x,y on d !
  }

  function dragend(d, i) {
      d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
      force.tick();
      force.stop();
  }

  setInitialPositions();

//Show the tooltip on a node mouseover
  function mouseover(d, i) {
    if(state == 0){
      d3.select(this).select("circle").transition()
          .duration(750)
          .attr("r", 16);
    }

    d3.select("#tooltip")
      .style("visibility", "visible")
      .html(d.name + "<br/>"
             + "Sent " + d.sent + " out of " + total + " emails <br />"
             + "Received " + d.received + " emails")
      .style("top", function () { return (d3.event.pageY - 75)+"px"})
      .style("left", function () { return (d3.event.pageX - 60)+"px";});

  }

  //Hide the tooltip and make the node smaller again
  function mouseout(d, i) {
    d3.select("#tooltip").style("visibility", "hidden");

    if(state == 0){
      d3.select(this).select("circle").transition()
          .duration(750)
          .attr("r", 8);
    }
  }

  //click on a node
  function mouseclick(d){
    if (d3.event.defaultPrevented) return; //prevent a click event when a node is dragged
    openDetails({hashids: d.hashids, adressses:[d.name], tables: d.tables});
  }

  //For clicks on a link
  function mouseclickLink(d){
    openDetails({hashids: d.hashids, adressses:[d.name], tables: d.tables});
  }

  function setInitialPositions(){
    var n = data.nodes.length
    // Initialize the positions deterministically, for better results.
    data.nodes.forEach(function(d, i) { d.x = d.y = width / n * i; });

    // Run the layout a fixed number of times.
    // The ideal number of times scales with graph complexity.
    // Of course, don't run too long—you'll hang the page!
    force.start();
    for (var i = n; i > 0; --i) force.tick();
    force.stop();

    // Center the nodes in the middle.
    var ox = 0, oy = 0;
    data.nodes.forEach(function(d) { ox += d.x, oy += d.y; });
    ox = ox / n - width / 2, oy = oy / n - height / 2;
    data.nodes.forEach(function(d) { d.x -= ox, d.y -= oy; });

    force.alpha(-1)
  }

  cb(); // send callback, no errors
}

//Transition to the normal node size
function normalRadius(){
  circle.transition()
    .duration(750)
    .attr("r", 8);

  link.transition()
    .duration(750)
    .attr("markerWidth", "8")
    .attr("markerHeight", "8");

  state = 0;
}

//Transition the node radius to display the largest receivers
function receivedRadius(){
  circle.transition()
    .duration(750)
    .attr("r", function(d){
      if(d.received > 0) {
        return Math.sqrt(d.received * 100);
      } else {
        return Math.sqrt(1 * 100);
      }
    });

  link.transition()
    .duration(750)
    .attr("markerWidth", function(d){
      if(d.sent > 0) {
        return Math.sqrt(d.received * 100);
      } else {
        return Math.sqrt(1 * 100);
      }
    })
    .attr("markerHeight", function(d){
      if(d.sent > 0) {
        return Math.sqrt(d.received * 100);
      } else {
        return Math.sqrt(1 * 100);
      }
    });

  state = 2;
}

//Transition the node radius to display the largest senders
function sentRadius(){
  circle.transition()
    .duration(750)
    .attr("r", function(d){
      if(d.sent > 0) {
        return Math.sqrt(d.sent * 100);
      } else {
        return Math.sqrt(1 * 100);
      }
    });

  link.transition()
    .duration(750)
    .attr("markerWidth", function(d){
      if(d.sent > 0) {
        return Math.sqrt(d.sent * 100);
      } else {
        return Math.sqrt(1 * 100);
      }
    })
    .attr("markerHeight", function(d){
      if(d.sent > 0) {
        return Math.sqrt(d.sent * 100);
      } else {
        return Math.sqrt(1 * 100);
      }
    });
  state = 1;
}