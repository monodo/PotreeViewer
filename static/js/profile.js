
pv.profile.draw = function () {

    // pv.scene3D.profileTool.profiles[0].setWidth(30);

    lineVertices = pv.scene3D.profileTool.profiles[0].points;
    if (lineVertices.length <= 2){
        return;
    }
    var maxOctreeDepth = 10;
    points = pv.scene3D.pointcloud.getPointsInProfile(pv.scene3D.profileTool.profiles[0], maxOctreeDepth);
    console.log(points);
    // console.log(pv.scene3D.profileTool.profiles[0]);
    // console.log(points);
    
    // lineVertices = pv.scene3D.profileTool.profiles[0].points;
    // for (i=0; i<lineVertices.length; i++){
        // p = lineVertices[i];
        // console.log(p.x, p.y, p.z);
    // }
    // console.log(points);
    // console.log(points[0]);
    // console.log(points.length);
    
    var data = [];
    for (i=0; i<points.length; i++){
        data.push([points[i].x, points[i].z])
    }
    console.log(data);

    var chart = new Dygraph(
        "profileContainer",
        data,
        {   
            // colors: colorTheme,
            // ylabel: this.yLabelText,
            // xlabel: this.xLabelText,
            // xLabelHeight: 35,
            legend: 'always',
            gridLineColor: '#F0F0F5',
            labels: [ "Distance", "Altitude"],
            // valueRange: [this.minZValue,this.maxZValue],
            // axes: {
                // x: {
                    // valueFormatter : function(d) {
                       // return d + 'm' ;
                    // },
                    // axisLabelColor:'#FFFFFF',
                    // axisLineColor:'#FFFFFF'
                // },
                // y: {
                    // valueFormatter: function(d) {
                        // return d + 'm';
                    // },
                    // axisLabelColor: '#FFFFFF',
                    // axisLineColor: '#FFFFFF'
                // }
            // },
            // highlightCallback: (function(e, x, pts, row) {
                // this.showMarker(row);
            // }).createDelegate(this),
            // unhighlightCallback: (function(e, x, pts, row) {
                // this.marker && this.marker.destroy();
            // }).createDelegate(this), 
            // zoomCallback: (function(e, x, pts, row) {
                // this.lockScale(this.scaleLocked, true);
            // }).createDelegate(this),                 
            plotter:function(e) {
                    var ctx = e.drawingContext;
                    ctx.color = '#FF0000'; //e.color
                    ctx.fillStyle = '#FF0000';
                    for (var i = 1; i < e.points.length; i++) {
                      var p = e.points[i];
                      ctx.fillRect(p.canvasx, p.canvasy, 3,3);
                    }
                }
        }
    );

}