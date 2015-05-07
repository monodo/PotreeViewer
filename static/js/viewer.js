/***
* initialize the JQuery UI objects and i18next translations
* Method: initGUI
* Parameters: none
*/
pv.ui.initGUI = function (){
    
    // Display version info
    $('#pvVersionInfo').html(pv.params.versionInfo);

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

     $("#toolbox").draggable({
        handle: "#moveDiv",
        containment: 'window',
        scroll: false
    }).draggable({ scroll: false });  

    // Map container
    $("#mapBox").resizable({
        minHeight: 15,
        stop: function(event, ui) {
            pv.map2D.map.updateSize();
        }
    }).draggable({
        handle: "#dragMap",
        containment: 'window',
        scroll: false
    }).draggable({ scroll: false });   

    // Handle mapbox size on windows resize
    $(window).resize(function(e) {
            if (e.target == window){
                if (!$("#profileContainer").is(":visible")) {
                    pv.map2D.updateMapSize(false); 
                } else {
                    $("#mapBox").css("height", "70%");
                    pv.map2D.updateMapSize(true); 
                }
            }
    });
    
    // Map layers selector
        // Point size type
    $("#layerSelector").selectmenu({
        select: function( event, data ) {
            if (pv.params.mapconfig.mapServiceType == 'WMS') {
                pv.map2D.baseLayer.setSource(
                    new ol.source.ImageWMS({
                        attributions: [pv.map2D.attributions],
                        url: pv.params.mapconfig.mapServiceUrl,
                        params: {'LAYERS': data.item.value},
                        serverType: /** @type {ol.source.wms.ServerType} */ ('mapserver')
                    })
                );
            } else {

                pv.map2D.WMTSOptions.layer = data.item.value;
                var imageFormat = data.item.element[0].getAttribute('imageFormat');
                pv.map2D.WMTSOptions.format = imageFormat;

                pv.map2D.baseLayer = new ol.layer.Tile({
                    opacity: 1,
                    source: new ol.source.WMTS(pv.map2D.WMTSOptions)
                });

                var layersCollection = pv.map2D.map.getLayers();
                layersCollection.removeAt(0);
                layersCollection.insertAt(0, pv.map2D.baseLayer);

            }
        }
    }).selectmenu("menuWidget").addClass("menuOverflow");

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
        $("#mapBox").slideUp(300);
        $("#showMapButton").show();
    });        

    // Close the profile container
    $("#closeProfileContainer").click(function(){
        $("#profileContainer").slideUp(300);
        $("#showProfileButton").show(300);
        pv.map2D.updateMapSize(false); 
    });
    
    // Reset the profile zoom-pan
    $("#resetProfileZoom").click(function(){
        pv.profile.resetPanZoom();
    });
    
    $("#profileZoomIn").click(function(){
        pv.profile.manualZoom(1);
    });
    
    $("#profileZoomOut").click(function(){
        pv.profile.manualZoom(-1);
    });
    
    // Show the profile
    $("#showProfileButton").button({   
        text: false,
        icons: {
            primary: 'ui-icon-triangle-1-nw'
        }
    }).click(function() {
            $("#profileContainer").slideDown(300);
            $("#showProfileButton").hide(300);
            pv.map2D.updateMapSize(true);
    });
    
    $("#showProfileButton").hide();
    // Show - Hide the mapbox
    $("#showMapButton").button().click(function() {
        if ($("#mapBox").is(":visible")) {
            $("#mapBox").slideUp(300);
            $("#showMapButton").blur();
            $("#showMapButton").hide();
        } else {
            if (!$("#profileContainer").is(":visible")) {
                pv.map2D.updateMapSize(false); 
            } else {
                pv.map2D.updateMapSize(true); 
            }
            $("#mapBox").slideDown(300);
            $("#showMapButton").hide();
        }
    });
    
    $("#showMapButton").addClass('showMapButton');

    if (!pv.params.isPointCloudGeoreferenced) {
        $("#showMapButton").hide();
    }

    // Max point number
     $("#pointNumberSlider").slider({
        min: pv.params.pointCountTargetMin,
        max: pv.params.pointCountTargetMax,
        step: pv.params.pointCountTargetStep,
        value: pv.params.pointCountTarget,
        slide: function( event, ui ) {
            $("#pointNumber").val(ui.value);
            pv.params.pointCountTarget = ui.value;
            if (pv.scene3D.profileTool.profiles.length > 0) {
                pv.profile.draw();
            }
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

    // Point material type
    $("#pointMaterialSelect").selectmenu({
        select: function(event, data) {
            pv.params.pointColorType = parseInt(data.item.value);
            if (pv.scene3D.profileTool.profiles.length > 0) {
                pv.profile.draw();
            }
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
    $("#pointMaterialSelect").selectmenu("refresh");

    // Point quality select
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

    $("#pointQualitySelect").selectmenu("refresh");

    // Point clip type
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

    // Show/Hide skybox
    $("#chkSkybox").button({
        label: null,
        icons: {
            primary: 'ui-icon-circle-check'
        },
        text: false
    });
    
    $('#chkSkybox').bind('change', function(){
        if($(this).is(':checked')){
            $('#chkSkybox').button("option", "label", i18n.t("nav.hide"));
            pv.params.showSkybox = true;
        } else {
            $('#chkSkybox').button("option", "label", i18n.t("nav.show"));
            pv.params.showSkybox = false;
            this.blur();
        }
    });

    // Show/Hide bounding box
    $("#chkBBox").button({
        text: false,
        icons: {
            primary: 'ui-icon-circle-check'
        }
    });
    $('#chkBBox').bind('change', function(){
        if($(this).is(':checked')){
            $('#chkBBox').button("option", "label", i18n.t("nav.hide"));
            pv.params.showBoundingBox = true;
        } else {
            $('#chkBBox').button("option", "label", i18n.t("nav.show"));
            pv.params.showBoundingBox = false;
            this.blur();
        }
    });        

    // Show/Hide coordinates
    $("#chkCoordinates").button({
        text: false,
        icons: {
            primary: 'ui-icon-circle-check'
        }
    });
    $('#chkCoordinates').bind('change', function(){
        if($(this).is(':checked')){
            $('#chkCoordinates').button("option", "label", i18n.t("nav.hide"));
            pv.params.showCoordinates = true;
        } else {
            $('#chkCoordinates').button("option", "label", i18n.t("nav.show"));
            pv.params.showCoordinates = false;
            this.blur();
        }
    });

    // Show/Hide point number
    $("#chkPointNumber").button({
        text: false,
        icons: {
            primary: 'ui-icon-circle-check'
        }
    });
    $('#chkPointNumber').bind('change', function(){
        if($(this).is(':checked')){
            $('#chkPointNumber').button("option", "label", i18n.t("nav.hide"));
            pv.params.showPointNumber = true;

        } else {
            $('#chkPointNumber').button("option", "label", i18n.t("nav.show"));
            pv.params.showPointNumber = false;
            this.blur();
        }
    });

    // First Person navigation control
    $("#radioFPSControl").button();
    $('#radioFPSControl').bind('change', function(){
        if($(this).is(':checked')){
            pv.utils.useFPSControls();
            pv.scene3D.controls.moveSpeed = $("#moveSpeedSlider").slider( "value" ) * 100;
            $("#moveSpeedCursor").show();
            $('#renderArea').focus();
        }
    });

    // Orbit navigation control
    $("#radioOrbitControl").button();
    $('#radioOrbitControl').bind('change', function(){
        if($(this).is(':checked')){
            pv.utils.useOrbitControls();
        }
    });

    // Earth navigation control
    $("#radioEarthControl").button();
    $('#radioEarthControl').bind('change', function(){
        if($(this).is(':checked')){
            pv.utils.useEarthControls();
        }
    });

    $("#radioFlyMode").buttonset();
    
    // Keep navigation above ground (Orbit control only)
    $("#chkDEM").button({
        label: null,
        icons: {
            primary: 'ui-icon-circle-check'
        },
        text: false
    });

    // Reset zoom/pan
    $("#btnFocus").button()
        .bind('click', function(){
            Potree.utils.topView(pv.scene3D.camera, pv.scene3D.controls, pv.scene3D.pointcloud);
            $("#btnFocus").blur();
    });

    // Flip YZ
    $("#btnFlipYZ" )
        .bind('click', function(){
            pv.utils.flipYZ();
            $("#btnFlipYZ").blur();
    });

    $('#chkDEM').bind('change', function(){
        if($(this).is(':checked')){
            pv.scene3D.pointcloud.generateDEM = true;
            if (pv.scene3D.orbitControls){ 
                pv.scene3D.orbitControls.addEventListener("proposeTransform", pv.utils.demCollisionHandler);
            }
            if(pv.scene3D.earthControls){
                pv.scene3D.earthControls.addEventListener("proposeTransform", pv.utils.demCollisionHandler);
            }
            if(pv.scene3D.fpControls) {
                pv.scene3D.fpControls.addEventListener("proposeTransform", pv.utils.demCollisionHandler);
            }
        } else {
            pv.scene3D.pointcloud.generateDEM = false;
            this.blur();
            pv.scene3D.orbitControls.removeEventListener("proposeTransform", pv.utils.demCollisionHandler);
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
            pv.scene3D.controls.moveSpeed = ui.value * 100;
            pv.scene3D.controls.zoomSpeed = ui.value;
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
            if (pv.scene3D.profileTool.profiles.length > 0) {
                pv.profile.draw();
            }
        }
    });

    // Profile's points width
    $("#profilePointSizeSlider").slider({
        min: pv.params.profilePointSizeMin,
        max: pv.params.profilePointSizeMax,
        step: pv.params.profilePointSizeStep,
        value: pv.params.profilePointSize,
        slide: function( event, ui ) {
            $("#profilePointSize").val(ui.value);
            if (pv.scene3D.profileTool.profiles.length > 0) {
                pv.profile.draw();
            }
        }
    });

    // Octree depth for profile
    $("#profilePointLODSlider").slider({
        min: 1,
        max: pv.params.profilePointMaxLOD,
        step: 1,
        value: pv.params.profilePointLOD,
        slide: function( event, ui ) {
            $("#profilePointLOD").val(ui.value);
            if (pv.scene3D.profileTool.profiles.length > 0) {
                pv.profile.draw();
            }
        }
    });
    
    // Rotate/Resize/Translate buttons
    $("#btnRotate").button()
        .bind('click', function(){
            transformationTool.rotate();
            $("#btnRotate").blur();
    });

    $("#btnResize").button()
        .bind('click', function(){
            transformationTool.scale();
            $("#btnResize").blur();
    });

    $("#btnTranslate").button()
        .bind('click', function(){
            transformationTool.translate();
            $("#btnTranslate").blur();
    });  

    // Top/Front/Left view buttons
    $("#btnTopView").button()
        .bind('click', function(){
            Potree.utils.topView(pv.scene3D.camera, pv.scene3D.controls, pv.scene3D.pointcloud);
            $("#btnTopView").blur();
    });

    $("#btnFrontView").button()
        .bind('click', function(){
            Potree.utils.frontView(pv.scene3D.camera, pv.scene3D.controls, pv.scene3D.pointcloud);
            $("#btnFrontView").blur();
    });

    $("#btnLeftView").button()
        .bind('click', function(){
            Potree.utils.leftView(pv.scene3D.camera, pv.scene3D.controls, pv.scene3D.pointcloud);
            $("#btnLeftView").blur();
    });        

    // ***Tools***

    // Tools' buttons
    $( "#radioDistanceMeasure" ).button();
    $( "#radioAngleMeasure" ).button();   
    $( "#radioAreaMeasure" ).button();
    $( "#radioVolumeMeasure" ).button();
    $( "#radioClip" ).button();

    //Set up tools radio button change behaviour
    $("#toolsDiv").buttonset().change(function () {
        pv.utils.disableControls();
        $('#transformationTools').hide();
        // Area Measure
        if($('#radioAreaMeasure').is(':checked')){
            pv.scene3D.measuringTool.startInsertion({showDistances: false, showAngles: false, showArea: true, closed: true});
        }

        // Measure volume
        if($('#radioVolumeMeasure').is(':checked')){
            pv.scene3D.volumeTool.startInsertion(); 
            console.log("ici");
            $('#transformationTools').show();
        } 

        // Clip toolLayer
        if($('#radioClip').is(':checked')){
            pv.scene3D.volumeTool.startInsertion({clip: true});
             $('#transformationTools').show();
        } 
        
        // Angle measure
        if($('#radioAngleMeasure').is(':checked')){
            pv.scene3D.measuringTool.startInsertion({showDistances: false, showAngles: true, showArea: false, closed: true, maxMarkers: 3});
        }

        // Distance measure
        if($('#radioDistanceMeasure').is(':checked')){
            pv.scene3D.measuringTool.startInsertion({showDistances: true, showArea: false, closed: false});
        }

        // Profile
        if($('#radioProfile').is(':checked')){ 
            $('#profileWidthCursor').show();
            pv.scene3D.profileTool.startInsertion({width: $("#profileWidthSlider").slider( "value" )});

        } else {
            $('#profileWidthCursor').hide();
            $('#profilePointSizeCursor').hide();
            $("#profileContainer").slideUp(300);
        }
    });

    // ***UI parameters***
    // Reset UI to default
    $("#btnResetUI").button({
        icons: {
            primary: 'ui-icon-arrowrefresh-1-s'
        },
        text: false
    }).bind('click', function(){
        pv.ui.resetUIToDefault();
    });

    $("#mapBox").hide();
    $("#profileContainer").hide();
    $("#profileWidthCursor").hide();
    $('#transformationTools').hide();

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
* Reset UI to default settings as defined in config/config.js
* Method: resetUIToDefault
* Parameters: none
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
    $("#pointMaterialSelect").val(pv.params.defaultPointMaterial);
    $("#pointQualitySelect").val(pv.params.pointQuality);
    $("#pointClipSelect").val(pv.params.clipMode);

    $("#chkSkybox").prop("checked", pv.params.showSkyBox);
    $("#chkSkybox").change();
    
    $("#chkBBox").prop("checked", pv.params.BoundingBox);
    $("#chkBBox").change();

    $("#chkCoordinates").prop("checked", pv.params.showCoordinates);
    $("#chkCoordinates").change();
    
    $("#profileWidth").val(pv.params.profileWidth).change();
    $("#profilePointSize").val(pv.params.profilePointSize).change();
    $("#profilePointLOD").val(pv.params.profilePointLOD).change();
};

/***
* translate the UI
* Method: translate
* Parameters: none
***/
pv.ui.translate = function() {

    $("#toolboxTabs").i18n();
    $("#pointSizeTypeSelect").selectmenu( "refresh" );
    $("#pointMaterialSelect").selectmenu( "refresh" );
    $("#pointQualitySelect").selectmenu( "refresh" );
    $("#pointClipSelect").selectmenu( "refresh" );

};

/***
* Uncheck tools button
* Method: clearTools
* Parameters: none
***/
pv.ui.clearTools = function(){

    $("#toolsDiv").find("input:radio").prop("checked", false).end()
        .buttonset("refresh");

}