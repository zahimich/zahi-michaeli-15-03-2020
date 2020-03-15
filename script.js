var APIKEY = "HZXk2uT1NjGHVJ3WQPqjspGMIESFr4dx";

function saveToLS(key, value) {
    //debugger;
    localStorage.setItem(key, JSON.stringify(value));
}

function readFromLS(key) {
    //debugger;
    return JSON.parse(localStorage.getItem(key));
}

document.addEventListener("DOMContentLoaded", function() {
    /*$("#searchtext").keyup(function () {
        console.log($("#searchtext").val());
        getAutoCompleteValues($("#searchtext").val());
    });*/

    //localStorage.removeItem("geolocation");
    //getLocation();
});

function getLocation() {
    debugger;
    if (navigator.geolocation) {
        var savedPosition = readFromLS("geolocation");
        if (savedPosition != null) {
            showLocation(savedPosition);
        }
        else {
            navigator.geolocation.getCurrentPosition(locationCallback);
        }
    }
    else {
        alert("Geolocation is not supported by this browser.");
    }
}

function locationCallback(position) {
    debugger;
    var pos = {};
    pos.longitude = position.coords.longitude;
    pos.latitude = position.coords.latitude;
    saveToLS("geolocation", pos);
    
    showLocation(pos);
}

function showLocation(position) {
    debugger;
    var res = "Latitude: " + position.latitude + ", Longitude: " + position.longitude;
    alert(res);
}

function getWeatherValues(locationName, locationKey) {
    //debugger;

    var url = "https://dataservice.accuweather.com/currentconditions/v1/"+locationKey+"?apikey="+APIKEY+"&language=en-us&details=true";

    $("."+locationKey).append("<hr><small><p><code><small>"
    + url
    + "</small></code></p></small>");
    $("."+locationKey).append("<h3>" + locationName + "</h3>");

    useXHR(url, callbackWeatherValues, locationKey);
}

function callbackWeatherValues(data, callbackValue) {
    debugger;

    $("#results-weather-json").append(JSON.stringify(data, null, 2));
    //alert(data);

    $.each(data, function (i, item) {
        var str = "Weather: " + item.WeatherText + "</br>";
        str +=  "Temperature: " + item.Temperature.Metric.Value + " C</br>";
        str +=  "RealFeel Temperature: " + item.RealFeelTemperature.Metric.Value + " C</code></br>";
        str +=  "Wind Speed & Direction: " + item.Wind.Speed.Metric.Value;
        str +=  " " + item.Wind.Speed.Metric.Unit;
        str +=  " " + item.Wind.Direction.Localized + "</br>";

        $("."+callbackValue).append(str);
    });
}

function getAutoCompleteValues(val) {
    if (val.length < 3) return false;

    debugger;

    //for dev:
    var savedResults = readFromLS("searchResData");
    if (savedResults != null) {
        showAutoCompleteValues(savedResults);
    }
    else {
        var url = "https://dataservice.accuweather.com/locations/v1/cities/autocomplete?apikey="+APIKEY+"&q=" + val;
        $("#location-query").html("<p><code><small>" + url + "</small></code></p>");
        useXHR(url, callbackAutoCompleteValues, "");
    }
}

function callbackAutoCompleteValues(data, callbackValue) {
    debugger;
    saveToLS("searchResData", data);
    showAutoCompleteValues(data);
}

function showAutoCompleteValues(data) {
    debugger;
    $("#results").html('');
    $("#results-weather").html('');
    $("#results-json").html('');
    $("#results-weather-json").html('');
    $("#results-json").html(JSON.stringify(data, null, 2));
    $.each(data, function (i, item) {
        $("#results").append(i+":" +item.LocalizedName + ", " + item.Key + ", " + item.Country.ID + "<br/>");
        $("#results-weather").append("<div class="+item.Key+"></div>");
        getWeatherValues(item.LocalizedName, item.Key);
    });
}

function useXHR(url, callback, callbackValue) {
    //debugger;
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300)
            callback(JSON.parse(xhr.response), callbackValue);
        else
            callback(undefined, callbackValue);
    };
    if ("withCredentials" in xhr) {
        xhr.open('GET', url, true);
    } 
    else if (typeof XDomainRequest != "undefined") {
        xhr = new XDomainRequest();
        xhr.open('GET', url);
    }
    //xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
    xhr.send();
}

  