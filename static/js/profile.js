/***
* Creates a D3 altitude profile
* Method: draw
* Parameters: none
***/
pv.profile.draw = function(){
    
    pv.profile.profileDrawing = true;
    
    if (!pv.profile.state){
        return;
    }
    
    if (pv.scene3D.profileTool.profiles.length === 0){
        return;
    }

    $("#profileProgressbar").html("Loading");
    
    this.pointSize = $("#profilePointSizeSlider").slider("value");    
    
    var latestRequest = null;
    
    if(latestRequest){
        latestRequest.cancel();
    }
   
    latestRequest = pv.scene3D.pointcloud.getPointsInProfile(pv.scene3D.profileTool.profiles[0], $("#profilePointLODSlider").slider( "value" ), {
        "onProgress": function(event){

        var request = event.request;
            var ppoints = event.points;
            var segments = ppoints.segments;

            if (segments.length < 1){
                return false;
            }

            var data = [];
            var distance = 0;
            var totalDistance = 0;
            var minX = Math.max();
            var minY = Math.max();
            var minZ = Math.max();
            var maxX = 0;
            var maxY = 0;
            var maxZ = 0;

            // Get the same color map as Three
            var minRange = pv.utils.toGeo(new THREE.Vector3(0, pv.scene3D.pointcloud.material.heightMin, 0));
            var maxRange = pv.utils.toGeo(new THREE.Vector3(0, pv.scene3D.pointcloud.material.heightMax, 0));
            var heightRange = maxRange.z - minRange.z;
            var colorRange = [];
            var colorDomain = [];

            // Read the altitude gradient used in 3D scene
            for (var c=0; c<pv.scene3D.pointcloud.material.gradient.length; c++){
                colorDomain.push(minRange.z + heightRange * pv.scene3D.pointcloud.material.gradient[c][0]);
                colorRange.push('#' + pv.scene3D.pointcloud.material.gradient[c][1].getHexString());
            }

            // Altitude color map scale
            var colorRamp = d3.scale.linear()
              .domain(colorDomain)
              .range(colorRange);
              
            pv.profile.nPointsInProfile = 0; 

            // Iterate the profile's segments
            for(var i = 0; i < segments.length; i++){
                var segment = segments[i];
                var segStartGeo = pv.utils.toGeo(segment.start);
                var segEndGeo = pv.utils.toGeo(segment.end);
                var xOA = segEndGeo.x - segStartGeo.x;
                var yOA = segEndGeo.y - segStartGeo.y;
                var segmentLength = Math.sqrt(xOA * xOA + yOA * yOA);
                var points = segment.points;

                // Iterate the segments' points
                for(var j = 0; j < points.numPoints; j++){
                    pv.profile.nPointsInProfile += 1;
                    var p = pv.utils.toGeo(points.position[j]);
                    // get min/max values            
                    if (p.x < minX) { minX = p.x;}

                    if (p.y < minY) { minY = p.y;}

                    if (p.z < minZ) { minZ = p.z;}

                    if (p.x > maxX) { maxX = p.x;}

                    if (p.y < maxY) { maxY = p.y;}

                    if (p.z < maxZ) { maxZ = p.z;}

                    var xOB = p.x - segStartGeo.x;
                    var yOB = p.y - segStartGeo.y;
                    var hypo = Math.sqrt(xOB * xOB + yOB * yOB);
                    var cosAlpha = (xOA * xOB + yOA * yOB)/(Math.sqrt(xOA * xOA + yOA * yOA) * hypo);
                    var alpha = Math.acos(cosAlpha);
                    var dist = hypo * cosAlpha + totalDistance;
                    if (!isNaN(dist)) {
                        data.push({
                            'distance': dist,
                            'x': p.x,
                            'y': p.y,
                            'altitude': p.z,
                            'color': 'rgb(' + points.color[j][0] * 100 + '%,' + points.color[j][1] * 100 + '%,' + points.color[j][2] * 100 + '%)',
                            'intensity': 'rgb(' + points.intensity[j] + '%,' + points.intensity[j] + '%,' + points.intensity[j] + '%)',
                            'intensityCode': points.intensity[j],
                            'heightColor': colorRamp(p.z),
                            'classificationCode': points.classification[j]
                        });
                    }
                }

                // Increment distance from the profile start point
                totalDistance += segmentLength;
            }

            var output = {
                'data': data,
                'minX': minX,
                'minY': minY,
                'minZ': minZ,
                'maxX': maxX,
                'maxY': maxY,
                'maxZ': maxZ
            };            
            // stop profile request after fetching a certain number of points
            if(request.pointsServed > pv.params.profileMaxServedPOints){
                request.cancel();
            }

            pv.profile.data = output.data;
            
        },
        "onCancel": function(){
            console.log("canceled");
        },
        "onFinish": function(event){
            
            var containerWidth = $('#profileContainer').width();
            var containerHeight = $('#profileContainer').height();
            pv.profile.margin = {top: 25, right: 10, bottom: 20, left: 40};
            var margin = pv.profile.margin;
            var width = containerWidth - (margin.left + margin.right);
            var height = containerHeight - (margin.top + margin.bottom);

            // Create the x/y scale functions
            // TODO: same x/y scale

            if (pv.profile.data.length === 0){
                return;
            }

            // X scale
            pv.profile.scaleX = d3.scale.linear()
                .range([5, width -5]);
            pv.profile.scaleX.domain([d3.min(pv.profile.data, function(d) { return d.distance; }), d3.max(pv.profile.data, function(d) { return d.distance; })]);

            // Y scale
            pv.profile.scaleY = d3.scale.linear()
                .range([height -5, 5]);
            pv.profile.scaleY.domain([d3.min(pv.profile.data, function(d) { return d.altitude; }), d3.max(pv.profile.data, function(d) { return d.altitude; })]);

            pv.profile.zoom = d3.behavior.zoom()
                .x(pv.profile.scaleX)
                .y(pv.profile.scaleY)
                .scaleExtent([0,8])
                .size([width, height])
                .on("zoom",  function(){

                    var t = pv.profile.zoom.translate();
                    var tx = t[0];
                    var ty = t[1];

                    tx = Math.min(tx, 0);
                    tx = Math.max(tx, width - output.maxX);
                    pv.profile.zoom.translate([tx, ty]);

                    svg.select(".x.axis").call(xAxis);
                    svg.select(".y.axis").call(yAxis);

                    pv.profile.canvas.clearRect(0, 0, width, height);
                    pv.profile.drawPoints(pv.profile.data);

                });

            // Axis and other large elements are created as svg elements
            d3.selectAll("svg").remove();

            svg = d3.select("div#profileContainer").append("svg")
                .call(pv.profile.zoom)
                .attr("width", (width + margin.left + margin.right).toString())
                .attr("height", (height + margin.top + margin.bottom).toString())
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .on("mousemove", pv.profile.pointHighlight);
           
            // Create x axis
            var xAxis = d3.svg.axis()
                .scale(pv.profile.scaleX)
                .orient("bottom")
                .ticks(10, "m");

            // Create y axis
            var yAxis = d3.svg.axis()
                .scale(pv.profile.scaleY)
                .orient("left")
                .ticks(10, "m");

            // Append axis to the chart
            svg.append("g")
                .attr("class", "x axis")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);
                
            if(navigator.userAgent.indexOf("Firefox") == -1 ) {
                svg.select(".y.axis").attr("transform", "translate("+ (margin.left).toString() + "," + margin.top.toString() + ")");
                svg.select(".x.axis").attr("transform", "translate(" + margin.left.toString() + "," + (height + margin.top).toString() + ")");
            } else {
                svg.select(".x.axis").attr("transform", "translate( 0 ," + height.toString() + ")");
            }

            // Points are plotted using canvas for better performance
            pv.profile.canvas = d3.select("#profileCanvas")
                .attr("width", width)
                .attr("height", height)
                .call(pv.profile.zoom)
                .node().getContext("2d");

            // Everything ready, show the containers;
            pv.map2D.updateMapSize(true);

            $("#profileProgressbar").html(pv.profile.nPointsInProfile.toString() + " points in profile");
            
            pv.profile.drawPoints(pv.profile.data);
            pv.profile.profileDrawing = false;
            
            $("#profileContainer").slideDown(300);
            
            var thePoints = pv.scene3D.profileTool.profiles[pv.scene3D.profileTool.profiles.length - 1].points;

            pv.map2D.updateToolLayer(thePoints);
    
            
            console.log(event);
            
            var request = event.request;
        
            console.log("finished loading profile data!");
            console.log("pointsServed: " + request.pointsServed);
        }
    });
};

/***
* Dummy redraw function
* Method: pv.profile.redraw
* Parameters: none
***/
pv.profile.redraw = function(){
    pv.profile.draw();
};

/***
* Highlight point on mouseover
* Method: pointHighlight
* Parameters: event
***/
pv.profile.pointHighlight = function(){
    
    var adaptedPointSize = pv.profile.adaptPointSize();
    var canvas = pv.profile.canvas;
    
    // Find the hovered point if applicable
    var d = pv.profile.data;
    var sx = pv.profile.scaleX;
    var sy = pv.profile.scaleY;
    var coordinates = [0, 0];
    coordinates = d3.mouse(this);
    var xs = coordinates[0];
    var ys = coordinates[1];
    
    // Fix FF vs Chrome discrepancy
    if(navigator.userAgent.indexOf("Firefox") == -1 ) {
        xs = xs - pv.profile.margin.left;
        ys = ys - pv.profile.margin.top;
    }
    var hP = [];
    var tol = adaptedPointSize;

    for (var i=0; i<d.length;i++){
        if(sx(d[i].distance) < xs + tol && sx(d[i].distance) > xs - tol && sy(d[i].altitude) < ys + tol && sy(d[i].altitude) > ys -tol){
            hP.push(d[i]); 
        }
    }

    if(hP.length > 0){
        var p = hP[0];
        this.hoveredPoint = hP[0];
        if(navigator.userAgent.indexOf("Firefox") == -1 ) {
            cx = pv.profile.scaleX(p.distance) + pv.profile.margin.left;
            cy = pv.profile.scaleY(p.altitude) + pv.profile.margin.top;
        } else {
            cx = pv.profile.scaleX(p.distance);
            cy = pv.profile.scaleY(p.altitude);
        }
        var svg = d3.select("svg");
        d3.selectAll("rect").remove();
        var rectangle = svg.append("rect")
            .attr("x", cx)
            .attr("y", cy)
            .attr("id", p.id)
            .attr("width", adaptedPointSize)
            .attr("height", adaptedPointSize)
            .style("fill", 'yellow');

        var html = 'x: ' + Math.round(10 * p.x) / 10 + ' y: ' + Math.round(10 * p.y) / 10 + ' z: ' + Math.round( 10 * p.altitude) / 10 + '  -  ';
        html += i18n.t('tools.classification') + ': ' + p.classificationCode + '  -  ';
        html += i18n.t('tools.intensity') + ': ' + p.intensityCode;
        $('#profileInfo').css('color', 'yellow');
        $('#profileInfo').html(html);

    } else {
        d3.selectAll("rect").remove();
        $('#profileInfo').html("");
    }
};

/***
* Reset the profile zoom and pan
* Method: resetPanZoom
* Parameters: none
***/
pv.profile.resetPanZoom = function reset() {
    pv.profile.draw();
};

/***
* Manual zoom
* Method: manualZoom
* Parameters: increment
***/
pv.profile.manualZoom = function (increment) {

    var currentScale = pv.profile.zoom.scale();
    var nextScale = currentScale + increment;
    if (nextScale > 0) {
        pv.profile.zoom.scale([nextScale]);
        pv.profile.zoom.event(d3.select("div#profileContainer"));
    } else {
        pv.profile.zoom.scale([1]);
        pv.profile.zoom.event(d3.select("div#profileContainer"));
    }
};

/***
* Manual pan
* Method: manualPan
* Parameters: increment
***/
pv.profile.manualPan = function (increment) {
    var currentTranslate = pv.profile.zoom.translate();
    currentTranslate[0] = currentTranslate[0] + increment[0];
    currentTranslate[1] = currentTranslate[1] + increment[1];
    pv.profile.zoom.translate(currentTranslate);
    pv.profile.zoom.event(d3.select("div#profileContainer"));
};

/***
* Draw the profile points with specific colors and style settings
* Method: drawPoints
* Parameters: none
***/
pv.profile.drawPoints = function(data) {

    var adaptedPointSize = pv.profile.adaptPointSize();
    var canvas = pv.profile.canvas;
    var i = -1, n = data.length, d, cx, cy;
    while (++i < n) {
        d = data[i];
        cx = pv.profile.scaleX(d.distance);
        cy = pv.profile.scaleY(d.altitude);
        canvas.moveTo(cx, cy);
        canvas.fillRect(cx, cy, adaptedPointSize, adaptedPointSize);
        canvas.fillStyle = pv.profile.strokeColor(d);
    }
};

/***
* Adapt profile points size depending on point number
* Method: adaptPointSize
* Parameters: none
***/
pv.profile.adaptPointSize = function(){
    
    var psize = pv.profile.pointSize;

    if (pv.profile.nPointsInProfile > 1000 && pv.profile.nPointsInProfile <= 5000){
        adaptedPointSize = psize * 3;
    } else if (pv.profile.nPointsInProfile > 5000 && pv.profile.nPointsInProfile <= 10000) {
        adaptedPointSize = psize * 2;
    } else if (pv.profile.nPointsInProfile > 10000) {
        adaptedPointSize = psize;
    } else {
        adaptedPointSize = psize * 4;
    }
    
    return adaptedPointSize;
};

/***
* Handle the mouseover event on the profile's points
* Method: pointHighlightEvent
* Parameters: data
***/
pv.profile.pointHighlightEvent = function (d) {

    d3.select(this)
        .style("stroke", "yellow")
        .style("stroke-width", 2);

    var html = 'x: ' + Math.round(10 * d.x) / 10 + ' y: ' + Math.round(10 * d.y) / 10 + ' z: ' + Math.round( 10 * d.altitude) / 10 + '  -  ';
    html += i18n.t('tools.classification') + ': ' + d.classificationCode + '  -  ';
    html += i18n.t('tools.intensity') + ': ' + d.intensityCode;

    $('#profileInfo').css('color', 'yellow');
    $('#profileInfo').html(html);

};

/***
* Define the points color depending on rendering colors
* Method: strokeColor
* Parameters: data
***/
pv.profile.strokeColor = function (d) {
    if (pv.params.pointColorType === Potree.PointColorType.RGB) {
        return d.color;
    } else if (pv.params.pointColorType === Potree.PointColorType.INTENSITY) {
        return d.intensity;
    } else if (pv.params.pointColorType === Potree.PointColorType.CLASSIFICATION) {
        var classif = pv.scene3D.pointcloud.material.classification;
        if (typeof classif[d.classificationCode] != 'undefined'){
            var color = 'rgb(' + classif[d.classificationCode].r * 100 + '%,';
            color += classif[d.classificationCode].g * 100 + '%,';
            color += classif[d.classificationCode].b * 100 + '%)';
            return color;
        } else {
            return 'rgb(255,255,255)';
        }
    } else if (pv.params.pointColorType === Potree.PointColorType.HEIGHT) {
        return d.heightColor;
    } else {
        return d.color;
    }
};

/***
* Keep track of the profile state
* Method: setState
* Parameter: Boolean
***/
pv.profile.setState = function(state){
    this.state = state;
};