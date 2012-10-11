(function() {
  var GMap;

  var currentMap;

  var companyOfficesMarkers;
  var nOffices = 0;
  var infoWindows;
  var currentInfoWindow;

  var countyCircles;
  var nCountyCircles = 0;
  var countyLabels;
  var countyZoomLevel = 11; //PROVVISORIO - dovrei prendere il nro appropriato da county.map_zoom_level

  GMap = (function() {

    function GMap(container) {

      // Initialize Google Map
      var defaultOptions;
      defaultOptions = {
        panControl: false,
        zoomControl: true,
        zoomControlOptions: {
          style: google.maps.ZoomControlStyle.SMALL
        },
        mapTypeControl: true,
        scaleControl: false,
        streetViewControl: false,
        overviewMapControl: false,
        minZoom: 7,
        zoom: 8,
        scrollwheel: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        center: new google.maps.LatLng(39.232253, -105.08606)
      };
      currentMap = new google.maps.Map(container, defaultOptions);
      google.maps.event.addListener(currentMap, 'zoom_changed', function() {
          refreshMap(container)
      });
      drawCountyCircles(container);
    }

    GMap.init = function(container) {
      console.log("Initialize Gmap");
      return new GMap(container);
    };

    return GMap;

  })();

  function refreshMap(container) {
    var zoomLevel = currentMap.getZoom();
    if (zoomLevel <= 8) {
      clearCompanyOffices();
      clearCountyCircles();
      drawCountyCircles(container);
    } else {
      clearCountyCircles();
      clearCompanyOffices();
      drawCompanyOffices(container);
    }
    refreshTags(container);
    refreshFilterMenus(container);
  }

  function refreshFilterMenus(container) {
    var srcParams = searchParams();
    $.getJSON($(container).data("employees_types_url"), srcParams, function(data) {
      var rangeLinks = "";
      $.each(data, function(i, employeeRange) {
        rangeLinks += "<li";
        if (employeeRange.id == srcParams.employee_id)
          rangeLinks += " class='active'";
        rangeLinks += "><a href='#' class='btn-employee' data-employee_id='"+employeeRange.id+"'>"+employeeRange.name+"</a></li>";
      });
      $('#employee-filter-menu').html(rangeLinks);
      setEmployeeMenuListener();
    });
    $.getJSON($(container).data("investments_types_url"), srcParams, function(data) {
      var investmentLinks = "";
      $.each(data, function(i, investmentRange) {
        investmentLinks += "<li";
        if (investmentRange.id == srcParams.investment_id)
          investmentLinks += " class='active'";
        investmentLinks += "><a href='#' class='btn-investment' data-investment_id='"+investmentRange.id+"'>"+investmentRange.name+"</a></li>";
      });
      $('#investment-filter-menu').html(investmentLinks);
      setInvestmentMenuListener();
    });
    $.getJSON($(container).data("categories_url"), srcParams, function(data) {
      var categoryLinks = "";
      $.each(data, function(i, category) {
        categoryLinks += "<li";
        if (category.id == srcParams.category_id)
          categoryLinks += " class='active'";
        categoryLinks += "><a href='#' class='btn-category' data-category_id='"+category.id+"'>"+category.name+"</a></li>";
      });
      $('#category-filter-menu').html(categoryLinks);
      setCategoryMenuListener();
    });
  }

  function refreshTags(container) {
    var srcParams = searchParams();
    $.getJSON($(container).data("tags_url"), srcParams, function(data) {
      var tagLinks = "";
      $.each(data, function(i, tag) {
        if (tag.code == srcParams.tag_code) {
          tagLinks += "<a href='#' rel='2' data-tag_code=''><i class='icon-remove-sign'/></a>\n";
          tagLinks += "<a href='#' rel='"+tag.companies_count+"' data-tag_code='"+ tag.code +"' class ='selected-tag'>"+tag.code+"</a>\n";
        } else
          tagLinks += "<a href='#' rel='"+tag.companies_count+"' data-tag_code='"+ tag.code +"' >"+tag.code+"</a>\n";
      });
      $('#tag-cloud').html(tagLinks);
      configureTagCloud();
    });
  }

  function configureTagCloud() {
    var tagCloudLink = $('#tag-cloud a');
    tagCloudLink.tagcloud({
      size: {
        start: 14,
        end: 18,
        unit: 'pt'
      },
      color: {
        start: '#777',
        end: '#222'
      }
    });
    tagCloudLink.click(function() {
      //highlight
      tagCloudLink.removeClass('selected-tag');
      $(this).addClass('selected-tag');

      var tag_code = $(this).data("tag_code");
      $('#search_params').data("tag_code", tag_code);
      $('.gmap').each(function() {
        refreshMap(this);
      });
    });
  }

  function clearCompanyOffices() {
    for (var i=0; i<nOffices; i++) {
      companyOfficesMarkers[i].setMap(null);
    }
  }

  function clearCountyCircles() {
    for (var i=0; i<nCountyCircles; i++) {
      countyCircles[i].setMap(null);
    }
  }

  function closeCurrentInfoWindow() {
    if (currentInfoWindow) {
      currentInfoWindow.close();
    }
  }

  function drawCompanyOffices(container) {
    $.getJSON($(container).data("offices_url"), searchParams(), function(data) {

      var thumbTemplate = ''
        +'<li id="thumb__MARKER_NUMBER__" class="span2 custom-thumbnail-li">'
        +'<div class="company-marker">'
        +'<img src="http://chart.apis.google.com/chart?chst=d_map_pin_letter&chs=24x32&chld=__MARKER_NUMBER__|c8c626|000000">'
        +'</div>'
        +'<div class="thumbnail custom-thumbnail">'
        +'<img src="__COMPANY_LOGO_URL__" alt="">'
        +'<h3>__COMPANY_NAME__</h3>'
        //+'<p>Thumbnail caption...</p>'
        +'</div>'
        +'</li>';

      var thumbsHtml = '<ul class="thumbnails">';

      companyOfficesMarkers = new Array();
      infoWindows = new Array();
      nOffices = 0;
      $.each(data, function(i, company) {
        var html = ''
          +'<div class="content well">'
          //+'<img src="'+office.image_url+'" alt="" />'
          +'<h1>'+company.name+'</h1>'
          +'<p><a href="'+company.homepage_url+'" target="_blank">'+company.homepage_url+'</a></p>';
        var field = company.facebook;
        if (field != null) html += '<p><b>Facebook: </b><a href="'+field+'" target="_blank">'+field+'</a></p>'
        field = company.twitter;
        if (field != null) html += '<p><b>Twitter: </b><a href="'+field+'" target="_blank">'+field+'</a></p>'
        field = company.founded_year;
        if (field != null) html += '<p><b>Year founded: </b>'+field+'</p>';
        field = company.number_of_employees;
        if (field != null) html += '<p><b>Number of employees: </b>'+field+'</p>';
        field = company.tags_list;
        if (field != null && field != '') html += '<p><b>Tags: </b>'+field+'</p>';
        field = company.description;
        if (field != null) html += '<p>'+field+'</p>';
        field = company.hiring;
        if (field != null) html += '<div class="hiring-'+field+'">&#160</div>';
        html += '</div>';
        var infowindow = new google.maps.InfoWindow({
          content: html
        });

        var imageUrl = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chs=24x32&chld='
          +(i+1)+'|c8c626|000000';
        var markerImage = new google.maps.MarkerImage(
          imageUrl, new google.maps.Size(24, 32));

        var marker = new google.maps.Marker({
          position: new google.maps.LatLng(company.latitude, company.longitude),
          //draggable: false,
          title: company.name,
          icon: markerImage,
          map: currentMap
        });
        //console.log("marker");
        //console.log(marker);
        google.maps.event.addListener(marker, 'click', function() {
          closeCurrentInfoWindow();
          infowindow.open(currentMap,marker);
          currentInfoWindow = infowindow;
        });

        companyOfficesMarkers[nOffices] = marker;
        infoWindows[nOffices] = infowindow;
        nOffices++;

        //company thumbnail
        var thumbHtml = thumbTemplate.replace(/__MARKER_NUMBER__/g,i+1);
        thumbHtml = thumbHtml.replace('__COMPANY_LOGO_URL__',company.image_url);
        thumbHtml = thumbHtml.replace('__COMPANY_NAME__',company.name);
        thumbsHtml = thumbsHtml+thumbHtml;
      });
      //console.log(companyOfficesMarkers);
      //console.log(infoWindows);

      //show company list
      $('.gmap').each(function() {
        $(this).css('width', '80%');
      });
      thumbsHtml = thumbsHtml+'</ul>';
      var companyList = $('#company-list');
      companyList.show();
      companyList.html(thumbsHtml);

      //open infowindow when company thumbnail is clicked
      $.each(companyOfficesMarkers, function(i, marker) {
        var thumb = $('#thumb'+(i+1));
        thumb.click(function() {
          $('#company-list li').removeClass('custom-thumbnail-li-selected');
          $(this).addClass('custom-thumbnail-li-selected');
          //console.log(i);
          closeCurrentInfoWindow();
          infoWindows[i].open(currentMap,marker);
          currentInfoWindow = infoWindows[i];
        });
      });
    });

  }

  function drawCountyCircles(container) {
    $('h1').html('Tech Companies by County <small>(click, filter or pick to learn more)</small>');
    $("#search_params").data("current_county_id", "");
    // County circles
    $.getJSON($(container).data("counties_url"), searchParams(), function(data) {

      //hide company list
      $('#company-list').hide();
      $('.gmap').each(function() {
        $(this).css('width', '100%');
      });

      countyCircles = new Array();
      nCountyCircles = 0;
      countyLabels = new Array();
      var colors = ["#bdc4ca", "#9da9a0", "#cdc9b6", "#8ca5b6", "#e7db59", "#fbd5b5", "#eeb949", "#b8b8d3"];
      $.each(data, function(i, county) {
        if (county.offices_numbers == 0) return;
        //var circlePosition = new google.maps.LatLng(county.offices_avg_latitude, county.offices_avg_longitude);
        var circlePosition = new google.maps.LatLng(county.latitude, county.longitude);
        var multiplier = county.offices_percentage;
        if (multiplier<5) {
          multiplier *= 2;
        }
        if (multiplier>20) {
          multiplier /= 1.5;
        }
        var radius = 1500*multiplier;
        var color = colors[getRandomInt(1,8)-1];
        var circleOptions = {
          strokeColor: '#ffffff',
          strokeOpacity: 0.6,
          strokeWeight: 2,
          fillColor: color,
          fillOpacity: 0.6,
          map: currentMap,
          center: circlePosition,
          radius: radius
        };
        countyCircles[nCountyCircles] = new google.maps.Circle(circleOptions);
        google.maps.event.addListener(countyCircles[nCountyCircles], 'click', function() {
          removeCountyLabel(nCountyCircles);
          onCountySelected(county, circlePosition);
        });
        google.maps.event.addListener(countyCircles[nCountyCircles], 'mouseover', function() {
          drawCountyLabel(nCountyCircles, county, circlePosition);
        });
        //remove countyLabel when moouse goes out of the circle
        google.maps.event.addListener(countyCircles[nCountyCircles], 'mouseout', function() {
          removeCountyLabel(nCountyCircles);
        });
        nCountyCircles++;
      });
    });
  }

  /**
   * Returns a random integer between min and max
   * Using Math.round() will give you a non-uniform distribution!
   */
  function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function removeCountyLabel(i) {
    countyLabels[i].setMap(null);
  }

  function onCountySelected(county, circlePosition) {
    $('h1').html('Tech Companies in '+county.name);
    $("#search_params").data("current_county_id", county.id);
    //currentMap.setZoom(currentMap.getZoom()+1);
    currentMap.setCenter(circlePosition);
    currentMap.setZoom(countyZoomLevel);
  }

  function drawCountyLabel(i, county, position) {
    var dummyMarkerImage = new google.maps.MarkerImage(
      '/assets/1x1-pixel.png', new google.maps.Size(1, 1));
    var percentage = Math.round(county.offices_percentage*100)/100;
    countyLabels[i] = new MarkerWithLabel({
      icon: dummyMarkerImage,
      position: position,
      map: currentMap,
      labelContent: county.name+'<br/>'+county.offices_numbers+' ('+percentage+'%)',
      labelAnchor: new google.maps.Point(40, 0),
      labelClass: "labels"
    });
    google.maps.event.addListener(countyLabels[i], 'click', function() {
      removeCountyLabel(i);
      onCountySelected(county, position);
    });
  }

  function searchParams() {
    var srcParamsEl = $('#search_params');
    search_params = {
        from_year: srcParamsEl.data("from_year"),
        to_year: srcParamsEl.data("to_year"),
        tag_code: srcParamsEl.data("tag_code"),
        current_county_id: srcParamsEl.data("current_county_id"),
        hiring: srcParamsEl.data("hiring") ,
        employee_id: srcParamsEl.data("employee_id"),
        investment_id: srcParamsEl.data("investment_id"),
        category_id: srcParamsEl.data("category_id")
    }
    return search_params;
  }

  $(function() {
    var srcParamsEl = $('#search_params');
    $( "#years_slider" ).slider({
        range: true,
        min: 1950,
        max: 2012,
        values: [ 1950, 2012 ],
        slide: function( event, ui ) {
            $( "#years_range" ).html(ui.values[ 0 ] + " - " + ui.values[ 1 ] );
        },
        stop: function( event, ui ) {
          srcParamsEl.data("from_year", ui.values[ 0 ])
          srcParamsEl.data("to_year", ui.values[ 1])
          return $('.gmap').each(function() {
              return refreshMap(this);
          });
        }
    });
    $( "#years_range" ).html( $( "#years_slider" ).slider( "values", 0 ) +
        " - " + $( "#years_slider" ).slider( "values", 1 ) );

    return $('.gmap').each(function() {
        return GMap.init(this);
    });
  });

  $(function () {
    configureTagCloud();

    var searchParams = $('#search_params');
    $('.bottom_filters a.btn-hiring').click(function(e){
        e.preventDefault();
        if($(this).is('.active')) {
          $(this).removeClass("active");
          searchParams.data("hiring", "");
        } else {
          $(this).addClass("active");
          searchParams.data("hiring", true);
        }
        $('.gmap').each(function() {
          refreshMap(this);
        });
    });

    setEmployeeMenuListener();
    setInvestmentMenuListener();
  });

  function setEmployeeMenuListener() {
    var searchParams = $('#search_params');
    $('#employee-filter-menu a.btn-employee').click(function(e){
      e.preventDefault();
      if($(this).parent().is('.active')) {
        $(this).parent().removeClass("active");
        $('.bottom_filters .btn-employee-group a.btn-primary').removeClass("active");
        searchParams.data("employee_id", "");
      } else {
        $('.bottom_filters .btn-employee-group a.btn-primary').addClass("active");
        $('#employee-filter-menu li').removeClass("active");
        $(this).parent().addClass("active");
        searchParams.data("employee_id", $(this).data("employee_id"));
      }
      $('.gmap').each(function() {
        refreshMap(this);
      });
    });
  }

  function setInvestmentMenuListener() {
    var searchParams = $('#search_params');
    $('#investment-filter-menu a.btn-investment').click(function(e){
      e.preventDefault();
      if($(this).parent().is('.active')) {
        $(this).parent().removeClass("active");
        $('.bottom_filters .btn-investment-group a.btn-primary').removeClass("active");
        searchParams.data("investment_id", "");
      } else {
        $('.bottom_filters .btn-investment-group a.btn-primary').addClass("active");
        $('#investment-filter-menu li').removeClass("active");
        $(this).parent().addClass("active");
        searchParams.data("investment_id", $(this).data("investment_id"));
      }
      $('.gmap').each(function() {
        refreshMap(this);
      });
    });
  }

  function setCategoryMenuListener() {
    var searchParams = $('#search_params');
    $('#category-filter-menu a.btn-category').click(function(e){
      e.preventDefault();
      if($(this).parent().is('.active')) {
        $(this).parent().removeClass("active");
        $('.bottom_filters .btn-category-group a.btn-primary').removeClass("active");
        searchParams.data("category_id", "");
      } else {
        $('.bottom_filters .btn-category-group a.btn-primary').addClass("active");
        $('#category-filter-menu li').removeClass("active");
        $(this).parent().addClass("active");
        searchParams.data("category_id", $(this).data("category_id"));
      }
      $('.gmap').each(function() {
        refreshMap(this);
      });
    });
  }

}).call(this);
