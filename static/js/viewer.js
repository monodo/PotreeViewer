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
        pv.ui.initGUI();
    });

    var grid = Potree.utils.createGrid(5, 5, 2);
    pv.scene3D.scene.add(grid);

    pv.scene3D.measuringTool = new Potree.MeasuringTool(pv.scene3D.scenePointCloud, pv.scene3D.camera, pv.scene3D.renderer);
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
 * create a dat.GUI widget that lets the user modify certain values
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
        getAsync: false
        }, function(t) { 
        // Start translation once everything is loaded
        pv.ui.translate();
    });

    pv.ui.lblCoordinates = $("#lblCoordinates");

    // Potree Viewer Jquery initialization

    // Toolbox tabs
    $( "#toolboxTabs" ).tabs({
        active: 0
    });

    $("#toolboxTabs").keydown(function(e){
         e.preventDefault();
    });
    
    // Map
    $("#mapBox").resizable({
        minHeight: 15,
        stop: function(event, ui) {
            pv.map2D.map.updateSize();
        }
    }); 

    // Language selector 
    $( "#languageSelect" ).selectmenu({
        select: function( event, data ) {
            var value = data.item.value;
            i18n.setLng(value);
            pv.ui.translate();
        }
    });

    var i = 0;
    var defaultOption;
    $.each(pv.params.availableLanguages, function(val, text) {
        i +=1 ;
        if (i == 1) {
            var defaultOption = new Option(text, val);
        }
        $( "#languageSelect" ).append(new Option(text, val));
    });
    $( "#languageSelect" ).val(defaultOption);

    // pv.scene3D.scene selector 
    $( "#sceneSelect" ).selectmenu({
        select: function( event, data ) {
            var value = data.item.value;
            // do something
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
    });        

    // Close the profile container
    $("#closeProfileContainer").click(function(){
        $("#profileContainer").slideUp(600);
    });

    // Show the mapbox
    $( "#showMapButton" ).button().click(function() {
        if ($("#mapBox").is(":visible")) {
            $("#mapBox").slideUp(600);
            $("#showMapButton").blur();
        }
        else {
            $("#mapBox").slideDown(600);
        }
    });

    if (!pv.params.isPointCloudGeoreferenced) {
        $( "#showMapButton" ).hide();
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
    
    $("#pointNumberSlider .ui-slider-handle").unbind('keydown');

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

    $("#pointSizeSlider .ui-slider-handle").unbind('keydown');
    
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

    $("#pointOpacitySlider .ui-slider-handle").unbind('keydown');
    
    $("#pointOpacity").change(function() {
        $("#pointOpacitySlider").slider("value", parseInt(this.value));
    });

    // Select menus

    // Point size type
    $("#pointSizeTypeSelect").selectmenu({
        select: function( event, data ) {
            var value = data.item.value;
            if(value === "Fixed"){
               pv.params.pointSizeType = Potree.PointSizeType.FIXED;
            }else if(value === "Attenuated"){
                pv.params.pointSizeType = Potree.PointSizeType.ATTENUATED;
            }else if(value === "Adaptive"){
                pv.params.pointSizeType = Potree.PointSizeType.ADAPTIVE;
            }
        }
    });

    $("#pointMaterialSelect").selectmenu({
        select: function(event, data) {
            var value = data.item.value;
            if(value === "RGB"){
                pv.params.pointColorType = Potree.PointColorType.RGB;
            }else if(value === "Color"){
                pv.params.pointColorType = Potree.PointColorType.COLOR;
            }else if(value === "Height"){
                pv.params.pointColorType = Potree.PointColorType.HEIGHT;
            }else if(value === "Intensity"){
                pv.params.pointColorType = Potree.PointColorType.INTENSITY;
            }else if(value === "Intensity Gradient"){
                pv.params.pointColorType = Potree.PointColorType.INTENSITY_GRADIENT;
            }else if(value === "Classification"){
                pv.params.pointColorType = Potree.PointColorType.CLASSIFICATION;
            }else if(value === "Return Number"){
                pv.params.pointColorType = Potree.PointColorType.RETURN_NUMBER;
            }else if(value === "Source"){
                pv.params.pointColorType = Potree.PointColorType.SOURCE;
            }else if(value === "Octree Depth"){
                pv.params.pointColorType = Potree.PointColorType.OCTREE_DEPTH;
            }else if(value === "Point Index"){
                pv.params.pointColorType = Potree.PointColorType.POINT_INDEX;
            }
        }
    });

    $("#pointQualitySelect").selectmenu({
        select: function(event, data) {
            pv.params.quality = data.item.value;
        }
    });

    $("#pointClipSelect").selectmenu({
        select: function(event, data) {
            var value = data.item.value;
            if(value === "No Clipping"){
                pv.params.clipMode = Potree.ClipMode.DISABLED;
            }else if(value === "Clip Outside"){
                pv.params.clipMode = Potree.ClipMode.CLIP_OUTSIDE;
            }else if(value === "Highlight Inside"){
               pv.params. clipMode = Potree.ClipMode.HIGHLIGHT_INSIDE;
            }
        }
    });

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

    $("#moveSpeedSlider .ui-slider-handle").unbind('keydown');
    
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

    $("#profileWidthSlider .ui-slider-handle").unbind('keydown');

    $("#radioOrbitControl").button();
    $('#radioOrbitControl').bind('change', function(){
        if($(this).is(':checked')){
            pv.utils.useOrbitControls();
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
            });

        } else {
            $("#profileContainer").slideUp(600);
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
    
    pv.ui.resetUIToDefault ();

};

pv.ui.resetUIToDefault = function (){


    $("#toolboxTabs" );
    
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

    // to be finalized - event managment issue...
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

    $("select").selectmenu("refresh");
};
// set here all translation operations

pv.ui.translate = function() {

    $("#toolboxTabs").i18n();

};