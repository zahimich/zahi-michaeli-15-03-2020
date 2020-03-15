var APIKEY = "JAu7BrmMTMVV70LIaGcaTTRXeYlgNtlQ";

function saveToLS(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function readFromLS(key) {
    return JSON.parse(localStorage.getItem(key));
}

document.addEventListener("DOMContentLoaded", function() {
    //localStorage.clear();
    getLocation();
});

document.addEventListener('click', function (event) {
    //debugger;
	if (!event.target.classList.contains('navbar-toggler') && !event.target.classList.contains('navbar-toggler-icon')) return;
	event.preventDefault();
	//var content = document.querySelector(event.target.hash);
	//if (!content) return;
	toggleMenu();
}, false);


function getLocation() {
    if (navigator.geolocation) {
        var savedPosition = readFromLS("geolocation");
        if (savedPosition != null) {
            setDefaultLocation(savedPosition);
        }
        else {
            navigator.geolocation.getCurrentPosition(function(position) {
                var pos = {};
                pos.longitude = position.coords.longitude;
                pos.latitude = position.coords.latitude;
                saveToLS("geolocation", pos);
                setDefaultLocation(pos);
            });
        }
    }
    else {
        alert("Geolocation is not supported by this browser.");
    }
}
function setDefaultLocation(position) {
    var savedCity = readFromLS("savedCity");
    if (savedCity != null) {
        showDefaultLocation(savedCity);
    }
    else {
        var url = "https://cors-anywhere.herokuapp.com/https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey="+APIKEY+"&q=" + position.latitude + "," + position.longitude;
        useXHR(url, function(data) {
            saveToLS("savedCity", data);
            showDefaultLocation(data);
        });
    }
}
function showDefaultLocation(data) {
    var city = data.EnglishName;
    document.getElementById("searchtext").value = city;
    getAutoCompleteValues(city);
}

function getWeatherValues(locationName, locationKey) {
    var savedResult = readFromLS("locationData" + locationKey);
    document.getElementsByClassName(locationKey)[0].innerHTML += "<h3>" + locationName + "</h3>";
    if (savedResult != null) {
        showWeatherValues(savedResult, locationKey);
    }
    else {
        var url = "https://cors-anywhere.herokuapp.com/https://dataservice.accuweather.com/currentconditions/v1/"+locationKey+"?apikey="+APIKEY+"&details=true";
        useXHR(url, function(data) {
            if (data == undefined) {
                //alert("api limit reached");
                return;
            }
            saveToLS("locationData" + locationKey, data);
            showWeatherValues(data, locationKey);
        });
    }
}
function showWeatherValues(data, locationKey) {
    //debugger;
    data.forEach(function (item, i) {
        var str = "Weather: " + item.WeatherText + "<br />";
        str +=  "Temperature: " + item.Temperature.Metric.Value + " C<br />";

        document.getElementsByClassName(locationKey)[0].innerHTML += str;
    });
}

function getForecast(locationName, locationKey) {
    var savedForecast = readFromLS("forecastData" + locationKey);
    if (savedForecast != null) {
        showForecast(savedForecast, locationKey);
    }
    else {
        var url = "https://cors-anywhere.herokuapp.com/https://dataservice.accuweather.com/forecasts/v1/daily/5day/"+locationKey+"?apikey="+APIKEY+"&details=true&metric=true";
        useXHR(url, function(data) {
            if (data == undefined) {
                //alert("api limit reached");
                return;
            }
            saveToLS("forecastData" + locationKey, data);
            showForecast(data, locationKey);
        });
    }
}
function showForecast(data, locationKey) {
    //debugger;
    data.DailyForecasts.forEach(function (item, i) {
        var dateObj = new Date(item.Date);
        var dateStr = dateObj.getDate() + "." + (dateObj.getMonth() == 12 ? 1 : dateObj.getMonth() + 1);
        var str = dateStr + ": " + item.Temperature.Minimum.Value + "-" + item.Temperature.Maximum.Value + " C<br />";
        
        document.getElementsByClassName(locationKey)[0].innerHTML += str;
    });
}

function getAutoCompleteValues(val) {
    if (val.length < 3) return false;

    //localStorage.removeItem("searchResData");

    //for dev:
    var savedResults = readFromLS("searchResData");
    if (savedResults != null) {
        showAutoCompleteValues(savedResults);
    }
    else {
        var url = "https://cors-anywhere.herokuapp.com/https://dataservice.accuweather.com/locations/v1/cities/autocomplete?apikey="+APIKEY+"&q=" + val;
        useXHR(url, function(data) {
            if (data == undefined) {
                //alert("api limit reached");
                return;
            }
            saveToLS("searchResData", data);
            showAutoCompleteValues(data);
        });
    }
}
function showAutoCompleteValues(data) {
    var results = document.getElementById("results-weather");
    results.innerHTML = "";
    data.forEach(function (item, i) {
        results.innerHTML += getItemHtml(item);
        getWeatherValues(item.LocalizedName, item.Key);
        getForecast(item.LocalizedName, item.Key);
    });
}

function useXHR(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300)
            callback(JSON.parse(xhr.response));
        else
            callback(undefined);
    };
    xhr.open('GET', url);
    xhr.send();
}

function getItemHtml(item) {
    //debugger;
    var str = '<div class="col-md-4">';
    str += '<div class="card mb-4 box-shadow">';
    str += '<!--img class="card-img-top" data-src="holder.js/100px225?theme=thumb&bg=55595c&fg=eceeef&text=Thumbnail" alt="Card image cap"-->';
    str += '<div class="card-body">';
    str += '<p class="card-text">' + item.LocalizedName + '/' + item.Country.ID + ' (' + item.Key + ')</p>';
    str += '<p class="card-text ' + item.Key + '"></p>';
    str += '<div class="d-flex justify-content-between align-items-center">';
    str += '<div class="btn-group">';
    str += '<button type="button" class="btn btn-sm btn-outline-secondary">View</button>';
    str += '<button type="button" class="btn btn-sm btn-outline-secondary">Edit</button>';
    str += '</div>';
    str += '<small class="text-muted">9 mins</small>';
    str += '</div>';
    str += '</div>';
    str += '</div>';
    str += '</div>';
    return str;
}

function toggleMenu() {
	if (document.getElementById("navbarHeader").classList.contains('shown')) {
		hideElement(document.getElementById("navbarHeader"));
		return;
	}
    showElement(document.getElementById("navbarHeader"));
}

function showElement(elem) {
    //debugger;
	var getHeight = function () {
		elem.style.display = 'block'; // Make it visible
		var height = elem.scrollHeight + 'px'; // Get it's height
		elem.style.display = ''; //  Hide it again
		return height;
	};
	var height = getHeight(); // Get the natural height
	elem.classList.add('shown'); // Make the element visible
	elem.style.height = height; // Update the max-height
	// Once the transition is complete, remove the inline max-height so the content can scale responsively
	window.setTimeout(function () {
		elem.style.height = '';
	}, 350);
};

// Hide an element
function hideElement(elem) {
	elem.style.height = elem.scrollHeight + 'px';
	window.setTimeout(function () {
		elem.style.height = '0';
	}, 1);
	window.setTimeout(function () {
		elem.classList.remove('shown');
	}, 350);
};