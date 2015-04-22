pv.map2D.initMapView = function () {

    // base layers' attributions
    pv.map2D.attributions = new ol.Attribution({
        html: pv.params.mapconfig.attributionsHtml
    });

    // From their CRS, get the projection system of the pointcloud and the 2D map
    pv.map2D.mapProjection = ol.proj.get(pv.params.mapconfig.mapCRS);
    pv.map2D.mapProjection.setExtent(pv.params.mapconfig.projectionExtent);
    pv.map2D.pointCloudProjection = ol.proj.get(pv.params.mapconfig.pointCloudCRS);

    // extent of the point cloud (with altitude)
    var pointCloudExtentMin = pv.params.mapconfig.pointCloudExtentMin;
    var pointCloudExtentMax = pv.params.mapconfig.pointCloudExtentMax;

    // point cloud extent in map CRS
    var minWebCloud = ol.proj.transform([pointCloudExtentMin[0],pointCloudExtentMin[1]], pv.map2D.pointCloudProjection, pv.map2D.mapProjection );
    var maxWebCloud = ol.proj.transform([pointCloudExtentMax[0],pointCloudExtentMax[1]], pv.map2D.pointCloudProjection, pv.map2D.mapProjection );

    var pointCloudExtent = [minWebCloud[0], minWebCloud[1], maxWebCloud[0], maxWebCloud[1]];
    var pointCloudCenter = [(maxWebCloud[0] + minWebCloud[0]) / 2, (maxWebCloud[1] + minWebCloud[1]) / 2];

    // draw the extent as box inside the map view
    var box = new ol.geom.LineString([
        minWebCloud, [maxWebCloud[0], minWebCloud[1]], maxWebCloud, [minWebCloud[0], maxWebCloud[1]], minWebCloud
    ]);

    var feature = new ol.Feature(box);
    var featureVector = new ol.source.Vector({
        features: [feature]
    });

    var extentLayer = new ol.layer.Vector({
        source: featureVector,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#000000',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 3,
                fill: new ol.style.Fill({
                color: '#000000'
                })
            })
        })
    });

    var visibleBoundsLayer = new ol.layer.Vector({
        source: featureVector,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                  color: '#0000ff',
                  width: 2
            }),
            image: new ol.style.Circle({
                radius: 3,
                fill: new ol.style.Fill({
                    color: '#0000ff'
                })
            })
        })
    });

    pv.map2D.camFrustumFeatureVector = new ol.source.Vector({
        features: []
    });

    var camFrustumLayer = new ol.layer.Vector({
        source: pv.map2D.camFrustumFeatureVector,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#000000',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 3,
                fill: new ol.style.Fill({
                    color: '#000000'
                })
            })
        })
    });

    var extent = pv.params.mapconfig.mapExtent;
    
    if (pv.params.mapconfig.mapServiceType == 'WMTS') {

        // WMTS
        var size = ol.extent.getWidth(pv.params.mapconfig.projectionExtent) / 256;
        pv.map2D.resolutions = new Array(14);
        pv.map2D.matrixIds = new Array(14);
        for (var z = 0; z < 14; ++z) {
            pv.map2D.resolutions[z] = size / Math.pow(2, z);
            pv.map2D.matrixIds[z] = z;
        }

        pv.map2D.baseLayer = new ol.layer.Tile({
          opacity: 1,
          extent: pv.params.mapconfig.projectionExtent,
          source: new ol.source.WMTS({
            attributions: [pv.map2D.attributions],
            url: pv.params.mapconfig.mapServiceUrl,
            layer: pv.params.mapconfig.mapDefaultLayer,
            matrixSet: pv.params.mapconfig.wmtsMatrixSet,
            format: pv.params.mapconfig.mapServiceImageFormat,
            projection: pv.map2D.mapProjection,
            tileGrid: new ol.tilegrid.WMTS({
              origin: ol.extent.getTopLeft(pv.params.mapconfig.projectionExtent),
              resolutions: pv.map2D.resolutions,
              matrixIds: pv.map2D.matrixIds
            }),
            style: 'default'
          })
        });
    
    } else {
        // WMS
        pv.map2D.baseLayer = new ol.layer.Image({
            extent: extent,
            source: new ol.source.ImageWMS({
                attributions: [pv.map2D.attributions],
                url: pv.params.mapconfig.mapServiceUrl,
                params: {'LAYERS': pv.params.mapconfig.mapDefaultLayer},
                serverType: /** @type {ol.source.wms.ServerType} */ ('mapserver')
            })
        });
    }

    var mousePositionControl = new ol.control.MousePosition({
        coordinateFormat: ol.coordinate.createStringXY(4),
        projection: pv.params.mapconfig.mapCRS,
        //className: 'custom-mouse-position',
        // target: document.getElementById('mouse-position'),
        undefinedHTML: '&nbsp;'
    });

    pv.map2D.map = new ol.Map({
        controls: [
            new ol.control.ScaleLine(),
            mousePositionControl
        ],
        layers: [
            pv.map2D.baseLayer,
            extentLayer,
            visibleBoundsLayer,
            camFrustumLayer
        ],
        target: 'map',
        view: new ol.View({
            projection: pv.map2D.mapProjection,
            center: pointCloudCenter,
            extent: extent,
            zoom: pv.params.mapconfig.initialZoom
        })
    });

};
    
/**
 * update the frustum in the map window according to the pv.scene3D.camera
 */
pv.map2D.updateMapFrustum = function (){
    pv.map2D.camFrustum = new ol.geom.LineString([ [0,0], [0, 0] ]);

    var feature = new ol.Feature(pv.map2D.camFrustum);
    pv.map2D.camFrustumFeatureVector.clear();
    pv.map2D.camFrustumFeatureVector.addFeature(feature);

    var aspect = pv.scene3D.camera.aspect;
    var top = Math.tan( THREE.Math.degToRad( pv.scene3D.camera.fov * 0.5 ) ) * pv.scene3D.camera.near;
    var bottom = - top;
    var left = aspect * bottom;
    var right = aspect * top;

    var camPos = new THREE.Vector3(0, 0, 0);
    left = new THREE.Vector3(left, 0, -pv.scene3D.camera.near).multiplyScalar(3000);
    right = new THREE.Vector3(right, 0, -pv.scene3D.camera.near).multiplyScalar(3000);
    camPos.applyMatrix4(pv.scene3D.camera.matrixWorld);
    left.applyMatrix4(pv.scene3D.camera.matrixWorld);
    right.applyMatrix4(pv.scene3D.camera.matrixWorld);
    camPos = pv.utils.toGeo(camPos);
    left = pv.utils.toGeo(left);
    right = pv.utils.toGeo(right);

    camPos = ol.proj.transform([camPos.x, camPos.y], pv.map2D.pointCloudProjection, pv.map2D.mapProjection );
    left = ol.proj.transform([left.x, left.y], pv.map2D.pointCloudProjection, pv.map2D.mapProjection );
    right = ol.proj.transform([right.x, right.y], pv.map2D.pointCloudProjection, pv.map2D.mapProjection );

    pv.map2D.camFrustum.setCoordinates([camPos, left, right, camPos]);
};

/**
 * Method: update the map extent in the map window
 * Parameters: none
 */
pv.map2D.updateMapExtent = function(){
    //TODO: update the map zoom level
    var geoExtent = pv.utils.toGeo(pv.scene3D.pointcloud.getVisibleExtent());
    var geoMin = ol.proj.transform([geoExtent.min.x, geoExtent.min.y], pv.map2D.pointCloudProjection, pv.map2D.mapProjection );
    var geoMax = ol.proj.transform([geoExtent.max.x, geoExtent.max.y], pv.map2D.pointCloudProjection, pv.map2D.mapProjection );
    var currentExtent = [geoMin[0],geoMax[1], geoMax[0],geoMin[1]];
    pv.map2D.map.getView().fitExtent(currentExtent, pv.map2D.map.getSize());
 
};
