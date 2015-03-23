/**
    * Set up global viewer parameters here
*/

pv.params = {
    'near': 10,
    'far': 1000000,
    'fov': 80,
    'skyboxPath': 'static/libs/potree/resources/textures/skybox/',
    'autoclear': false,
    'orthocam': {
        'left': -1,
        'right': 1,
        'top': 1,
        'bottom': -1,
        'near': -100,
        'far': 1000
    },
    'constrolMoveSpeedFactor': 250,
    'constrolMoveSpeedFactorMin': 40,
    'constrolMoveSpeedFactorMax': 1000,
    'constrolMoveSpeedFactorStep': 1,
    'cameraPosition': {
        'x': 0,
        'y': 25,
        'z': 0
    },
    'cameraLookAt': {
        'x': 480,
        'y': 797,
        'z': -219
    },
    'cameraRotationOrder': 'ZYX',
    'pointSize': 1,
    'pointSizeMin': 0,
    'pointSizeMax': 2,
    'pointSizeStep': 0.1,
    'pointSizeType': Potree.PointSizeType.ADAPTIVE,
    'pointShape': Potree.PointShape.SQUARE,
    'pointQuality': 'Normal',
    'pointCountTarget': 0.1,
    'pointCountTargetMin': 0.1,
    'pointCountTargetMax': 20,
    'pointCountTargetStep': 0.1,
    'pointColorType': Potree.PointColorType.RGB,
    'pointCountTargetFactor': 1000000,
    'showOctree': false,
    'material': 'RGB',
    'interpolate': false,
    'circles': false,
    'showCoordinates': false,
    'showSkyBox': false,
    'showProgressBar': true,
    'opacity': 1,
    'opacityMin': 0.1,
    'opacityMax': 1,
    'opacityStep': 0.1,
    'pointCloudPath': 'static/libs/potree/resources/pointclouds/vol_total/cloud.js',
    'isPointCloudGeoreferenced': true,
    'stats': false,
    'BoundingBox': false,
    'isFlipYZ': false,
    'showFlipYZ': false,
    'updateMatrixWorld': true,
    'defaultZoomLevel': 1,
    'profileWidth': 3,
    'profileWidthMin': 0.1,
    'profileWidthMax': 500,
    'profileWidthStep': 0.1,
    'clipMode': Potree.ClipMode.HIGHLIGHT_INSIDE, 
    'defaultLanguage': 'en',
    'availableLanguages': {
        'fr': 'Fr',
        'en': 'En', 
        'de': 'De'},
    'pointSizeTypes': {
        'Fixed': 0,
        'Attenuated': 1,
        'Adaptive': 2
    }, 
    'defaultPointSizeType': 2
};
