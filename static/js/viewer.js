pv.initThree = function (){
    var fov = 75;
    var width = elRenderArea.clientWidth;
    var height = elRenderArea.clientHeight;
    var aspect = width / height;
    var near = 0.1;
    var far = 1000000;

    scene = new THREE.Scene();
    scenePointCloud = new THREE.Scene();
    sceneBG = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    cameraBG = new THREE.Camera();
    camera.rotation.order = 'ZYX';
    
    referenceFrame = new THREE.Object3D();
    scenePointCloud.add(referenceFrame);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    renderer.autoClear = false;
    elRenderArea.appendChild(renderer.domElement);
    
    skybox = Potree.utils.loadSkybox("static/libs/potree/resources/textures/skybox/");

    // camera and controls
    camera.position.set(-304, 372, 318);
    camera.rotation.y = -Math.PI / 4;
    camera.rotation.x = -Math.PI / 6;
    useOrbitControls();
    
    // enable frag_depth extension for the interpolation shader, if available
    renderer.context.getExtension("EXT_frag_depth");
    
    // load pointcloud
    POCLoader.load(pv.params.pointCloudPath, function(geometry){
        pointcloud = new Potree.PointCloudOctree(geometry);
        
        pointcloud.material.pointSizeType = Potree.PointSizeType.ADAPTIVE;
        pointcloud.material.size = pv.params.pointSize;
        pointcloud.visiblePointsTarget = pv.params.pointCountTarget * 1000 * 1000;
        
        referenceFrame.add(pointcloud);
        
        referenceFrame.updateMatrixWorld(true);
        var sg = pointcloud.boundingSphere.clone().applyMatrix4(pointcloud.matrixWorld);
        
        referenceFrame.position.copy(sg.center).multiplyScalar(-1);
        referenceFrame.updateMatrixWorld(true);
        
        camera.zoomTo(pointcloud, 1);
        
        flipYZ();
        
        pv.ui.initGUI();
    });
    
    var grid = Potree.utils.createGrid(5, 5, 2);
    scene.add(grid);
    
    measuringTool = new Potree.MeasuringTool(scenePointCloud, camera, renderer);
    profileTool = new Potree.ProfileTool(scenePointCloud, camera, renderer);
    areaTool = new Potree.AreaTool(scenePointCloud, camera, renderer);
    volumeTool = new Potree.VolumeTool(scenePointCloud, camera, renderer);
    transformationTool = new Potree.TransformationTool(scenePointCloud, camera, renderer);

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
    sceneBG.add(bg);

    window.addEventListener( 'keydown', onKeyDown, false );
    renderer.domElement.addEventListener( 'mousemove', onMouseMove, false );
};

/**
 * create a dat.GUI widget that lets the user modify certain values
 */
pv.ui.initGUI = function (){

    // i18next translation initialization
    
    // Get the available languages defined in config.js
    var langList = []
    for (key in pv.params.availableLanguages) {
        langList.push(key);
    }

    i18n.init({ 
        lng: pv.params.defaultLanguage,
        resGetPath: 'static/lang/__lng__/__ns__.json',
        preload: langList
        }, function(t) { 
        // Start translation once everything is loaded
        pv.translate()

    });

    // Potree Viewer Jquery initialization
    $(function() {
        
        // Toolbox tabs
        $( "#toolboxTabs" ).tabs({
            active: 0
        });
        
        $("#toolboxTabs").keydown(function(e){
            $("#renderArea").focus();
        });
        
        // Map
        $("#mapBox").resizable({
            minHeight: 15,
            stop: function(event, ui) {
                pv.map.updateSize();
            }
        }); 
        
        // Language selector 
        $( "#languageSelect" ).selectmenu({
            select: function( event, data ) {
                var value = data.item.value;
                i18n.setLng(value);
                pv.translate();
            }
        });
        
        var i = 0;
        var defaultOption;
        $.each(pv.params.availableLanguages, function(val, text) {
            i +=1 ;
            if (i == 1) {
                var defaultOption = new Option(text, val)
            }
            $( "#languageSelect" ).append(new Option(text, val));
        });
        $( "#languageSelect" ).val(defaultOption)
        
        // Scene selector 
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
            min: 0.5,
            max: 12,
            step: 0.5,
            value: 0.5,
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
            min: 1,
            max: 5,
            step: 1,
            value: 1,
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
            min: 0.1,
            max: 1,
            step: 0.1,
            value: 1,
            slide: function( event, ui ) {
                $("#pointOpacity").val(ui.value);
                pv.params.opacity = 1.1 - ui.value;
            }
        });

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
            text: false,
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
                useFPSControls();
            }
        });
        
        $("#radioOrbitControl").button();
        $('#radioOrbitControl').bind('change', function(){
            if($(this).is(':checked')){
                useOrbitControls();
            }
        });
        
        $("#radioFlyMode").buttonset();
        
        $("#btnFocus").button();
        $("#btnFocus").bind('click', function(){
            camera.zoomTo(pointcloud);
        });        
        
        $("#btnFlipYZ" ).button();
        $("#btnFlipYZ").bind('click', function(){
            flipYZ();
        });
        
        $( "#radioDistanceMeasure" ).button();
        $('#radioDistanceMeasure').bind('change', function(){
            if($(this).is(':checked')){
                measuringTool.setEnabled(true);
            }
        });
        
        $( "#radioAreaMeasure" ).button();
        $('#radioAreaMeasure').bind('change', function(){
            if($(this).is(':checked')){
                areaTool.setEnabled(true);
            }
        });

        $( "#radioVolumeMeasure" ).button();
        $('#radioVolumeMeasure').bind('change', function(){
            if($(this).is(':checked')){
                volumeTool.startInsertion(); 
            }
        });
        
        $( "#radioProfile" ).button();
        $('#radioProfile').bind('change', function(){
            if($(this).is(':checked')){
                $("#profileContainer").slideDown(600);
                profileTool.startInsertion({width: pointcloud.boundingSphere.radius / 100});
            } else {
                $("#profileContainer").slideUp(600);
            }
        });
        
        $( "#radioClip" ).button();
        $('#radioClip').bind('change', function(){
            if($(this).is(':checked')){
                volumeTool.startInsertion({clip: true});
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

    });
    
    $("#mapBox").hide();
    $("#profileContainer").hide();
    
    // TODO: Style this and move to dedicated place!
    // stats
    stats = new Stats();
    stats.domElement.style.position = 'fixed';
    stats.domElement.style.top = '0px';
    stats.domElement.style.margin = '5px';
    
    document.body.appendChild( stats.domElement );
}

pv.ui.resetUIToDefault = function (){

    $("#toolboxTabs" )
    
    $("#mapBox").hide();
    $( "#languageSelect").val(pv.params.defaultLanguage);
    $( "#languageSelect").trigger("change");
    if (pv.params.isPointCloudGeoreferenced) {
        $("#showMapButton").show();
    } else {
        $("#showMapButton").hide();
    }
    
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
    
    $("select").selectmenu("refresh");
;
}