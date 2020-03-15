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
    loadFavorites();
});

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
    getAutoCompleteResults();
}

function getWeatherValues(locationName, locationKey, isFavorites) {
    var savedResult = readFromLS("locationData" + locationKey);
    document.getElementsByClassName(isFavorites ? "fav" + locationKey : locationKey)[0].innerHTML += "<h3>" + locationName + "</h3>";
    if (savedResult != null) {
        showWeatherValues(savedResult, locationKey, isFavorites);
    }
    else {
        var url = "https://cors-anywhere.herokuapp.com/https://dataservice.accuweather.com/currentconditions/v1/"+locationKey+"?apikey="+APIKEY+"&details=true";
        useXHR(url, function(data) {
            if (data == undefined) {
                //alert("api limit reached");
                return;
            }
            saveToLS("locationData" + locationKey, data);
            showWeatherValues(data, locationKey, isFavorites);
        });
    }
}
function showWeatherValues(data, locationKey, isFavorites) {
    //debugger;
    data.forEach(function (item, i) {
        var str = "Weather: " + item.WeatherText + "<br />";
        str +=  "Temperature: " + item.Temperature.Metric.Value + " C<br />";

        document.getElementsByClassName(isFavorites ? "fav" + locationKey : locationKey)[0].innerHTML += str;
    });
}

function getForecast(locationName, locationKey, isFavorites) {
    var savedForecast = readFromLS("forecastData" + locationKey);
    if (savedForecast != null) {
        showForecast(savedForecast, locationKey, isFavorites);
    }
    else {
        var url = "https://cors-anywhere.herokuapp.com/https://dataservice.accuweather.com/forecasts/v1/daily/5day/"+locationKey+"?apikey="+APIKEY+"&details=true&metric=true";
        useXHR(url, function(data) {
            if (data == undefined) {
                //alert("api limit reached");
                return;
            }
            saveToLS("forecastData" + locationKey, data);
            showForecast(data, locationKey, isFavorites);
        });
    }
}
function showForecast(data, locationKey, isFavorites) {
    //debugger;
    data.DailyForecasts.forEach(function (item, i) {
        var dateObj = new Date(item.Date);
        var dateStr = dateObj.getDate() + "." + (dateObj.getMonth() == 12 ? 1 : dateObj.getMonth() + 1);
        var str = dateStr + ": " + item.Temperature.Minimum.Value + "-" + item.Temperature.Maximum.Value + " C<br />";
        
        document.getElementsByClassName(isFavorites ? "fav" + locationKey : locationKey)[0].innerHTML += str;
    });
}

function getAutoCompleteResults() {
    var val = document.getElementById("searchtext").value;
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
        results.innerHTML += getItemHtml(item.LocalizedName, item.Country.LocalizedName, item.Key, false);
        getWeatherValues(item.LocalizedName, item.Key, false);
        getForecast(item.LocalizedName, item.Key, false);
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

function getItemHtml(localizedName, countryLocalizedName, key, isFavorites) {
    //debugger;
    
    var str = '<div class="col-md-4">';
    str += '<div class="card mb-4 box-shadow">';
    str += '<div class="card-body">';
    str += '<p class="card-text">' + localizedName + ', ' + countryLocalizedName + '</p>';
    str += '<p class="card-text ' + (isFavorites ? "fav" + key : key) + '"></p>';
    str += '<div class="d-flex justify-content-between align-items-center">';
    str += '<div class="btn-group">';

    var existInFavs = existInFavorites(key);
    
    if (!isFavorites && !existInFavs)
        str += '<button type="button" class="btn btn-sm btn-outline-secondary" data-key="' + key + '" data-name="' + localizedName + '" data-country="' + countryLocalizedName + '" onclick="addToFav()">Add To Favorites</button>';

    if (isFavorites || existInFavs)
        str += '<button type="button" class="btn btn-sm btn-outline-secondary" data-key="' + key + '" onclick="removeFromFav()">Remove From Favorites</button>';

    str += '</div>';
    str += '</div>';
    str += '</div>';
    str += '</div>';
    str += '</div>';
    return str;
}

function existInFavorites(key) {
    //debugger;
    var exist = false;
    var favorites = readFromLS("favorites");
    if (favorites != null) {
        favorites.forEach(function (item, i) {
            if (key == item.key)
                exist=true;
        });
    }
    return exist;
}

function toggleMenu() {
    //debugger;
    var elem = document.getElementById("navbarHeader");
	if (elem.classList.contains('show')) {
        elem.classList.add('fadeOutUp');
        setTimeout(function() {
            elem.setAttribute('hidden', 'true');
            elem.classList.remove('fadeOutUp');
            elem.classList.remove('show');
        }, 1000);
		return;
	}
	elem.classList.add('show');
    elem.removeAttribute('hidden');
    elem.classList.add('fadeInDown');
    setTimeout(function() {
        elem.classList.remove('fadeInDown');
    }, 1000);
}

function showPage(name, closeMenu) {
    document.getElementsByClassName("favorites")[0].setAttribute('style', 'display:none;');
    document.getElementsByClassName("results")[0].setAttribute('style', 'display:none;');

    document.getElementsByClassName(name)[0].setAttribute('style', 'display:block;');

    if (closeMenu)
        toggleMenu();
}

function addToFav() {
    //debugger;
    var sender = event.target;
    var favorite = {};
    favorite.key = sender.attributes["data-key"].value;
    favorite.localizedName = sender.attributes["data-name"].value;
    favorite.countryLocalizedName = sender.attributes["data-country"].value;

    var favorites = readFromLS("favorites");
    if (favorites != null) {
        favorites.push(favorite);

        saveToLS("favorites", favorites);
    }
    else {
        var favoritesArray = [];
        favoritesArray.push(favorite);

        saveToLS("favorites", favoritesArray);
    }
    loadFavorites();
    getAutoCompleteResults();
}

function removeFromFav() {
    //debugger;
    var favorites = readFromLS("favorites");
    if (favorites != null) {
        var newFavorites = [];
        favorites.forEach(function (item, i) {
            if (item.key != event.target.attributes["data-key"].value)
                newFavorites.push(item);
        });
        favorites = newFavorites;
    }
    else {
        favorites = [];
    }
    saveToLS("favorites", favorites);
    loadFavorites();
    getAutoCompleteResults();
}

function loadFavorites() {
    //localStorage.removeItem("favorites");

    //debugger;
    var results = document.getElementById("results-favorites");
    results.innerHTML = "";
    
    var favorites = readFromLS("favorites");
    if (favorites == null) {
        favorites = [];
        saveToLS("favorites", favorites);
    }

    favorites.forEach(function (item, i) {
        results.innerHTML += getItemHtml(item.localizedName, item.countryLocalizedName, item.key, true);
        getWeatherValues(item.localizedName, item.key, true);
        getForecast(item.localizedName, item.key, true);
    });
}