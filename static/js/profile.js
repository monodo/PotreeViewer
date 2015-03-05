
pv.profile.draw = function () {

    lineVertices = pv.scene3D.profileTool.profiles[0].points;
    if (lineVertices.length <= 2){
        return;
    }
    var maxOctreeDepth = 10;
    points = pv.scene3D.pointcloud.getPointsInProfile(pv.scene3D.profileTool.profiles[0], maxOctreeDepth);
    
    var data = [];
    for (i=0; i<points.length; i++){
        data.push([points[i].x, points[i].y])
    }

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