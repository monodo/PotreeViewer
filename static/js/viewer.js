/***
* Method: initialize the Three 3D scene objects
* Parameters: none
***/
pv.scene3D.initThree = function (){

    pv.ui.elRenderArea = document.getElementById("renderArea");
    var width = pv.ui.elRenderArea.clientWidth;
    var height = pv.ui.elRenderArea.clientHeight;
    var aspect = width / height;
    pv.ui.progressBar = new ProgressBar();

    pv.scene3D.clock = new THREE.Clock();
    pv.scene3D.mouse = {x: 0, y: 0};
    pv.scene3D.scene = new THREE.Scene();
    pv.scene3D.scenePointCloud = new THREE.Scene();
    pv.scene3D.sceneBG = new THREE.Scene();

    pv.scene3D.camera = new THREE.PerspectiveCamera(pv.params.fov, aspect, pv.params.near, pv.params.far);
    pv.scene3D.cameraBG = new THREE.Camera();
    pv.scene3D.camera.rotation.order = pv.params.cameraRotationOrder;

    pv.scene3D.referenceFrame = new THREE.Object3D();
    pv.scene3D.scenePointCloud.add(pv.scene3D.referenceFrame);

    pv.scene3D.renderer = new THREE.WebGLRenderer();
    pv.scene3D.renderer.setSize(width, height);
    pv.scene3D.renderer.autoClear = pv.params.autoclear;
    pv.ui.elRenderArea.appendChild(pv.scene3D.renderer.domElement);

    pv.scene3D.skybox = Potree.utils.loadSkybox(pv.params.skyboxPath);
    
    // pv.scene3D.camera and controls
    pv.scene3D.camera.position.set(pv.params.cameraPosition.x, pv.params.cameraPosition.y, pv.params.cameraPosition.z);
    pv.scene3D.camera.rotation.y = -Math.PI / 4;
    pv.scene3D.camera.rotation.x = -Math.PI / 6;
    pv.utils.useOrbitControls();

    // enable frag_depth extension for the interpolation shader, if available
    pv.scene3D.renderer.context.getExtension("EXT_frag_depth");

    // load pv.scene3D.pointcloud
    POCLoader.load(pv.params.pointCloudPath, function(geometry){
        pv.scene3D.pointcloud = new Potree.PointCloudOctree(geometry);
        pv.scene3D.pointcloud.material.pointSizeType = pv.params.pointSizeType;
        pv.scene3D.pointcloud.material.size = pv.params.pointSize;
        pv.scene3D.pointcloud.visiblePointsTarget = pv.params.pointCountTarget * 1000 * 1000;

        pv.scene3D.referenceFrame.add(pv.scene3D.pointcloud);

        pv.scene3D.referenceFrame.updateMatrixWorld(pv.params.updateMatrixWorld);
        var sg = pv.scene3D.pointcloud.boundingSphere.clone().applyMatrix4(pv.scene3D.pointcloud.matrixWorld);

        pv.scene3D.referenceFrame.position.copy(sg.center).multiplyScalar(-1);
        pv.scene3D.referenceFrame.updateMatrixWorld(pv.params.updateMatrixWorld);
        pv.scene3D.camera.zoomTo(pv.scene3D.pointcloud, pv.params.defaultZoomLevel);
        pv.utils.flipYZ();
    });

    var grid = Potree.utils.createGrid(5, 5, 2);
    pv.scene3D.scene.add(grid);

    pv.scene3D.measuringTool = new Potree.MeasuringTool(pv.scene3D.scenePointCloud, pv.scene3D.camera, pv.scene3D.renderer);
    pv.scene3D.angleTool = new Potree.AngleTool(pv.scene3D.scenePointCloud, pv.scene3D.camera, pv.scene3D.renderer);
    pv.scene3D.profileTool = new Potree.ProfileTool(pv.scene3D.scenePointCloud, pv.scene3D.camera, pv.scene3D.renderer);
    pv.scene3D.areaTool = new Potree.AreaTool(pv.scene3D.scenePointCloud, pv.scene3D.camera, pv.scene3D.renderer);
    pv.scene3D.volumeTool = new Potree.VolumeTool(pv.scene3D.scenePointCloud, pv.scene3D.camera, pv.scene3D.renderer);
    transformationTool = new Potree.TransformationTool(pv.scene3D.scenePointCloud, pv.scene3D.camera, pv.scene3D.renderer);

    var texture = Potree.utils.createBackgroundTexture(512, 512);

    texture.minFilter = texture.magFilter = THREE.NearestFilter;
    texture.minFilter = texture.magFilter = THREE.LinearFilter;

    var bg = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(2, 2, 0),
        new THREE.MeshBasicMaterial({
            map: texture
        })
    );

    bg.material.depthTest = false;
    bg.material.depthWrite = false;
    pv.scene3D.sceneBG.add(bg);

    window.addEventListener( 'keydown', pv.utils.onKeyDown, false );
    pv.scene3D.renderer.domElement.addEventListener( 'mousemove', pv.utils.onMouseMove, false );
};

/**
 * Method: initialize the JQuery UI objects and translations
 * Parameters: none
 */
pv.ui.initGUI = function (){

    // i18next translation initialization
    // Get the available languages defined in config.js
    var langList = [];
    for (var lkey in pv.params.availableLanguages) {
        langList.push(lkey);
    }

    i18n.init({ 
        lng: pv.params.defaultLanguage,
        resGetPath: 'static/lang/__lng__/__ns__.json',
        preload: langList,
        getAsync: true
        }, function(t) { 
        // Start translation once everything is loaded
        pv.ui.translate();
    });

    // Toolbox tabs
    $( "#toolboxTabs" ).tabs({
        active: 0
    });

    // Map
    $("#mapBox").resizable({
        minHeight: 15,
        stop: function(event, ui) {
            pv.map2D.map.updateSize();
        }
    }); 
    
    // Map layers selector
        // Point size type
    $("#layerSelector").selectmenu({
        select: function( event, data ) {

            pv.map2D.baseLayer.setSource(
                new ol.source.ImageWMS({
                url: pv.params.mapconfig.wmsUrl,
                    params: {'LAYERS': data.item.value},
                    serverType: /** @type {ol.source.wms.ServerType} */ ('mapserver')
                })
            );
        }
    });
    
    for (var key in pv.params.mapconfig.layers){
        var val = pv.params.mapconfig.layers[key];
        var option = new Option(val, key);
        if (val == pv.params.mapconfig.wmsDefaultLayer){
            option.setAttribute("selected", "selected");
        }
        $("#layerSelector").append(option);
    }

    $("#layerSelector").selectmenu( "refresh" );

    // Language selector 
    $( "#languageSelect" ).selectmenu({
        select: function( event, data ) {
            var value = data.item.value;
            i18n.setLng(value);
            pv.ui.translate();
        }
    });

    $.each(pv.params.availableLanguages, function(val, text) {
        $("#languageSelect").append(new Option(text, val));
    });
    $("#languageSelect option[value='" + pv.params.defaultLanguage + "']").prop("selected", "selected");
    $("#languageSelect").selectmenu( "refresh" );

    // pv.scene3D.scene selector 
    $( "#sceneSelect" ).selectmenu({
        select: function( event, data ) {
            var value = data.item.value;
        }
    });

    // Draggable mapBox
    $( "#mapBox" ).draggable({
        handle: "#dragMap"
    });    

    // Minimize button for the toolbox tabs
    $("#minimizeButton").click(function(){
        $("#toolboxTabs").slideToggle("fast", function(){
                if ($(this).is(":visible")) {
                    $("#minimizeButton").switchClass( "ui-icon-circle-plus", "ui-icon-circle-minus", 0);
                }
                else {
                    $("#minimizeButton").switchClass( "ui-icon-circle-minus", "ui-icon-circle-plus", 0);
                }
        });
    });

    // Minimize the mapbox
    $("#minimizeMapButton").click(function(){
        $("#mapBox").slideUp(600);
        $("#showMapButton").show();
    });        

    // Close the profile container
    $("#closeProfileContainer").click(function(){
        $("#profileContainer").slideUp(600);
    });

    // Show the mapbox
    $("#showMapButton").button().click(function() {
        if ($("#mapBox").is(":visible")) {
            $("#mapBox").slideUp(600);
            $("#showMapButton").blur();
            $("#showMapButton").hide();
        }
        else {
            $("#mapBox").slideDown(600);
            $("#showMapButton").hide();
        }
    });

    if (!pv.params.isPointCloudGeoreferenced) {
        $( "#showMapButton").hide();
    }

    // Sliders
    // Max point number
     $("#pointNumberSlider").slider({
        min: pv.params.pointCountTargetMin,
        max: pv.params.pointCountTargetMax,
        step: pv.params.pointCountTargetStep,
        value: pv.params.pointCountTarget,
        slide: function( event, ui ) {
            $("#pointNumber").val(ui.value);
            pv.params.pointCountTarget = ui.value;
        }
    });

    $("#pointNumber").change(function() {
        $("#pointNumberSlider").slider("value", parseInt(this.value));
    });

    // Point size
    $("#pointSizeSlider").slider({
        min: pv.params.pointSizeMin,
        max: pv.params.pointSizeMax,
        step: pv.params.pointSizeStep,
        value: pv.params.pointSize,
        slide: function( event, ui ) {
            $("#pointSize").val(ui.value);
            pv.params.pointSize = ui.value;
        }
    });
    
    $("#pointSize").change(function() {
        $("#pointSizeSlider").slider("value", parseInt(this.value));
    });

    // Point opacity
    $("#pointOpacitySlider").slider({
        min: pv.params.opacityMin,
        max: pv.params.opacityMax,
        step: pv.params.opacityStep,
        value: pv.params.opacity,
        slide: function( event, ui ) {
            $("#pointOpacity").val(ui.value);
            pv.params.opacity = ui.value;
        }
    });
    
    $("#pointOpacity").change(function() {
        $("#pointOpacitySlider").slider("value", parseInt(this.value));
    });

    // Select menus

    // Point size type
    $("#pointSizeTypeSelect").selectmenu({
        select: function( event, data ) {
            pv.params.pointSizeType = parseInt(data.item.value);
        }
    });
    
    for (var key in pv.params.pointSizeTypes){
        var val = pv.params.pointSizeTypes[key];
        var option = new Option(key, val);
        option.setAttribute("data-i18n", "render.qual_" + key); 
        if (val == pv.params.defaultPointSizeType){
            option.setAttribute("selected", "selected");
        }
        $("#pointSizeTypeSelect").append(option);
    }

    $("#pointSizeTypeSelect").selectmenu( "refresh" );

    $("#pointMaterialSelect").selectmenu({
        select: function(event, data) {
            pv.params.pointColorType = parseInt(data.item.value);
        }
    });

    for (var key in pv.params.pointMaterialTypes){
        var val = pv.params.pointMaterialTypes[key];
        var option = new Option(key, val);
        option.setAttribute("data-i18n", "render.mat_" + key); 
        if (val == pv.params.defaultPointMaterial){
            option.setAttribute("selected", "selected");
        }
        $("#pointMaterialSelect").append(option);
    }
    $("#pointMaterialSelect").selectmenu( "refresh" );

    $("#pointQualitySelect").selectmenu({
        select: function(event, data) {
            pv.params.quality = data.item.value;
        }
    });
        
    for (var key in pv.params.pointQualityTypes){
        var val = pv.params.pointQualityTypes[key];
        option = new Option(key, val);
        option.setAttribute("data-i18n", "render.qual_" + key.toLowerCase());
        if (val == pv.params.defaultPointQuality){
            option.setAttribute("selected", "selected");
        }
        $("#pointQualitySelect").append(option);
    }
    $("#pointQualitySelect").selectmenu( "refresh" );

    $("#pointClipSelect").selectmenu({
        select: function(event, data) {
            pv.params.clipMode = data.item.value;
        }
    });

    for (var key in pv.params.pointClipTypes){
        var val = pv.params.pointClipTypes[key];
        option = new Option(key, val);
        option.setAttribute("data-i18n", "render.clip_" + key.toLowerCase());
        if (val == parseInt(pv.params.defaultPointClip)){
            option.setAttribute("selected", "selected");
        }
        $("#pointClipSelect").append(option);
    }
    $("#pointClipSelect").selectmenu( "refresh" );

// Checkboxes
    $("#chkSkybox").button({
        label: null,
        icons: {
            primary: 'ui-icon-circle-check'
        },
        text: false
    });
    
    $('#chkSkybox').bind('change', function(){
        if($(this).is(':checked')){
            pv.params.showSkybox = true;
        } else {
            pv.params.showSkybox = false;
            this.blur();
        }
    });

    $("#chkStats").button({
        text: false,
        icons: {
            primary: 'ui-icon-circle-check'
        }
    });
    $('#chkStats').bind('change', function(){
        if($(this).is(':checked')){
            $('#chkStats').button("option", "label", "masquer");
            pv.params.showStats = true;

        } else {
            $('#chkStats').button("option", "label", "montrer");
            this.blur();
            pv.params.showStats = false;
        }
    });        

    $("#chkBBox").button({
        text: false,
        icons: {
            primary: 'ui-icon-circle-check'
        }
    });
    $('#chkBBox').bind('change', function(){
        if($(this).is(':checked')){
            $('#chkBBox').button("option", "label", "masquer");
            pv.params.showBoundingBox = true;
        } else {
            $('#chkBBox').button("option", "label", "montrer");
            pv.params.showBoundingBox = false;
            this.blur();
        }
    });        

    $("#chkCoordinates").button({
        text: false,
        icons: {
            primary: 'ui-icon-circle-check'
        }
    });
    $('#chkCoordinates').bind('change', function(){
        if($(this).is(':checked')){
            $('#chkCoordinates').button("option", "label", "masquer");
            pv.params.showCoordinates = true;

        } else {
            $('#chkCoordinates').button("option", "label", "montrer");
            pv.params.showCoordinates = false;
            this.blur();
        }
    });

    //Navigation buttons
    $("#radioFPSControl").button();
    $('#radioFPSControl').bind('change', function(){
        if($(this).is(':checked')){
            pv.utils.useFPSControls();
            $("#moveSpeedCursor").show();
        }
    });
    
    // Moving speed slider
     $("#moveSpeedSlider").slider({
        min: pv.params.constrolMoveSpeedFactorMin,
        max: pv.params.constrolMoveSpeedFactorMax,
        step: pv.params.constrolMoveSpeedFactorStep,
        value: pv.params.constrolMoveSpeedFactor,
        slide: function( event, ui ) {
            $("#moveSpeed").val(ui.value);
            pv.scene3D.controls.moveSpeed = ui.value;
            pv.scene3D.controls.zoomSpeed = ui.value / 20;
        }
    });
    
    $("#moveSpeed").change(function() {
        $("#moveSpeedSlider").slider("value", parseInt(this.value));
    });
    
    // Profile width slider
    $("#profileWidthSlider").slider({
        min: pv.params.profileWidthMin,
        max: pv.params.profileWidthMax,
        step: pv.params.profileWidthStep,
        value: pv.params.profileWidth,
        slide: function( event, ui ) {
            $("#profileWidth").val(ui.value);
            pv.scene3D.profileTool.profiles[0].setWidth(ui.value);
            pv.scene3D.profileTool.profiles[0].update();
            pv.profile.draw();
        }
    });

    $("#radioOrbitControl").button();
    $('#radioOrbitControl').bind('change', function(){
        if($(this).is(':checked')){
            pv.utils.useOrbitControls();
        }
    });
    
    $("#radioEarthControl").button();
    $('#radioEarthControl').bind('change', function(){
        if($(this).is(':checked')){
            pv.utils.useEarthControls();
        }
    });

    $("#radioFlyMode").buttonset();

    $("#btnFocus").button();
    $("#btnFocus").bind('click', function(){
        pv.scene3D.camera.zoomTo(pv.scene3D.pointcloud);
        $("#btnFocus").blur();
    });        

    $("#btnFlipYZ" ).button();
    $("#btnFlipYZ").bind('click', function(){
        pv.utils.flipYZ();
        $("#btnFlipYZ").blur();
    });

    $( "#radioDistanceMeasure" ).button();
    $('#radioDistanceMeasure').bind('change', function(){
        if($(this).is(':checked')){
            pv.utils.disableControls();
            pv.scene3D.measuringTool.setEnabled(true);
        }
    });
    
    $( "#radioAngleMeasure" ).button();
    $('#radioAngleMeasure').bind('change', function(){
        if($(this).is(':checked')){
            pv.utils.disableControls();
            pv.scene3D.angleTool.setEnabled(true);
        }
    });
    
    $( "#radioAreaMeasure" ).button();
    $('#radioAreaMeasure').bind('change', function(){
        if($(this).is(':checked')){
            pv.utils.disableControls();
            pv.scene3D.areaTool.setEnabled(true);
        }
    });

    $( "#radioVolumeMeasure" ).button();
    $('#radioVolumeMeasure').bind('change', function(){
        if($(this).is(':checked')){
            pv.utils.disableControls();
            pv.scene3D.volumeTool.startInsertion(); 
        }
    });

    $( "#radioProfile" ).button();
    $('#radioProfile').bind('change', function(){
        if($(this).is(':checked')){
            pv.utils.disableControls();
            $("#profileContainer").slideDown(600);
            pv.ui.elRenderArea.addEventListener("click", pv.profile.draw);
            $('#profileWidthCursor').show();
            pv.scene3D.profileTool.startInsertion({width: pv.scene3D.pointcloud.boundingSphere.radius / 100});
            $("#renderArea").dblclick(function(){
                pv.scene3D.profileTool.finishInsertion();
                pv.scene3D.profileTool.enabled = false;
            });
            
        } else {
            $("#profileContainer").slideUp(600);
            pv.ui.elRenderArea.removeEventListener("click", pv.profile.draw);
        }
    });

    $( "#radioClip" ).button();
    $('#radioClip').bind('change', function(){
        if($(this).is(':checked')){
            pv.utils.disableControls();
            pv.scene3D.volumeTool.startInsertion({clip: true});
        }
    });

    $("#toolsDiv").buttonset();

    $("#btnResetUI").button({
        icons: {
            primary: 'ui-icon-arrowrefresh-1-s'
        },
        text: false
    });
    $('#btnResetUI').bind('click', function(){
        pv.ui.resetUIToDefault();
    });

    $("#mapBox").hide();
    $("#profileContainer").hide();
    $("#profileWidthCursor").hide();

    // TODO: Style stats and move to dedicated place!
    pv.ui.stats = new Stats();
    pv.ui.stats.domElement.style.position = 'fixed';
    pv.ui.stats.domElement.style.top = '0px';
    pv.ui.stats.domElement.style.margin = '5px';
    document.body.appendChild(pv.ui.stats.domElement );
    
    // Prevent default keydown events
    $('#toolbox').keydown(function (event) {
        $('#renderArea').focus();
        return false;
    });
    
    $('.ui-tabs-anchor').keydown(function (event) {
        $('#renderArea').focus();
        return false;
    });
    $(".ui-slider-handle").unbind('keydown');
    $(".ui-selectmenu-button").unbind('keydown');
    $(".ui-button").unbind('keydown');
    $(".ui-widget").unbind('keydown');

    pv.ui.resetUIToDefault ();

};

/***
* Method: reset UI to default settings as defined in config/config.js fileCreatedDate
***/
pv.ui.resetUIToDefault = function (){

    $("#mapBox").hide();
    $( "#languageSelect").val(pv.params.defaultLanguage);
    $( "#languageSelect").trigger("change");
    if (pv.params.isPointCloudGeoreferenced) {
        $("#showMapButton").show();
    } else {
        $("#showMapButton").hide();
    }
    
    if (pv.params.showFlipYZ) {
        $("#btnFlipYZ").show();
    } else {
        $("#btnFlipYZ").hide();
    }
    
    // Navigation
    $("#moveSpeed").val(pv.params.constrolMoveSpeedFactor);
    $("#profileWidth").val(pv.params.profileWidth);

    $("#pointNumber").val(pv.params.pointCountTarget).change();
    $("#pointSize").val(pv.params.pointSize).change();
    $("#pointOpacity").val(pv.params.opacity).change();

    $("#pointSizeTypeSelect").val(pv.params.pointSizeType);
    $("#pointMaterialSelect").val(pv.params.material);
    $("#pointMaterialSelect").change();
    $("#pointQualitySelect").val(pv.params.pointQuality);
    $("#pointClipSelect").val(pv.params.clipMode);

    $("#chkSkybox").prop("checked", pv.params.showSkyBox);
    $("#chkSkybox").change();

    $("#chkStats").prop("checked", pv.params.stats);
    $("#chkStats").change();
    
    $("#chkBBox").prop("checked", pv.params.BoundingBox);
    $("#chkBBox").change();

    $("#chkCoordinates").prop("checked", pv.params.showCoordinates);
    $("#chkCoordinates").change();
    
    $("#profileWidth").val(pv.params.profile_width).change();

};

/***
* Method: translate the UI
* Parameters: none
***/
pv.ui.translate = function() {

    $("#toolboxTabs").i18n();
    $("#pointSizeTypeSelect").selectmenu( "refresh" );
    $("#pointMaterialSelect").selectmenu( "refresh" );
    $("#pointQualitySelect").selectmenu( "refresh" );
    $("#pointClipSelect").selectmenu( "refresh" );
};