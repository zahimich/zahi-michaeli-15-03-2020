//#region infrastructure
var APIKEY = "JAu7BrmMTMVV70LIaGcaTTRXeYlgNtlQ";

function saveToLS(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
function readFromLS(key) {
    return JSON.parse(localStorage.getItem(key));
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
//#endregion infrastructure

//#region onload
document.addEventListener("DOMContentLoaded", function() {
    //localStorage.clear();
    //localStorage.removeItem("searchResData");
    //localStorage.removeItem("favorites");

    getGeoLocation();
    loadFavorites();
});
//#endregion onload

//#region pagenavigation
function toggleMenu() {
    var elem = document.getElementById("navbarHeader");
	if (elem.classList.contains('show')) {
        elem.classList.add('fadeOutUp');
        setTimeout(function() {
            elem.setAttribute('hidden', 'true');
            elem.classList.remove('show');
            elem.classList.remove('fadeOutUp');
        }, 1000);
		return;
	}
    elem.removeAttribute('hidden');
	elem.classList.add('show');
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
//#endregion pagenavigation

//#region geolocation
function getGeoLocation() {
    if (navigator.geolocation) {
        var savedPosition = readFromLS("geolocation");
        if (savedPosition != null) {
            getCityByLocation(savedPosition);
        }
        else {
            navigator.geolocation.getCurrentPosition(function(position) {
                var position = {};
                position.longitude = position.coords.longitude;
                position.latitude = position.coords.latitude;
                saveToLS("geolocation", position);
                getCityByLocation(position);
            });
        }
    }
}
function getCityByLocation(position) {
    var savedCity = readFromLS("savedCity");
    if (savedCity != null) {
        loadResultsByCity(savedCity.EnglishName);
    }
    else {
        var url = "https://cors-anywhere.herokuapp.com/https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey="+APIKEY+"&q=" + position.latitude + "," + position.longitude;
        useXHR(url, function(data) {
            saveToLS("savedCity", data);
            loadResultsByCity(data.EnglishName);
        });
    }
}
function loadResultsByCity(city) {
    document.getElementById("searchtext").value = city;
    loadAutoCompleteResults();
}
//#endregion geolocation

//#region autocomplete
function loadAutoCompleteResults() {
    var val = document.getElementById("searchtext").value;
    if (val.length < 3) return false;

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
        setItemHtml(results, item, false);
    });
}
//#endregion autocomplete

//#region favorites
function addToFavorites() {
    var favorite = buildFavoritesItem(event.target);

    var favorites = readFromLS("favorites");
    if (favorites == null) {
        favorites = [];
    }
    favorites.push(favorite);
    saveToLS("favorites", favorites);

    loadFavorites();
    loadAutoCompleteResults();
}
function buildFavoritesItem(sender) {
    var favorite = {};
    favorite.Key = sender.attributes["data-key"].value;
    favorite.LocalizedName = sender.attributes["data-name"].value;
    favorite.Country = { LocalizedName : sender.attributes["data-country"].value };
    return favorite;
}
function removeFromFavorites() {
    var keyToRemove = event.target.attributes["data-key"].value;
    var favorites = readFromLS("favorites");
    if (favorites == null) {
        favorites = [];
    }
    else {
        var filtered = favorites.filter(function(item, index, arr){ 
            return item.Key != keyToRemove;
        });
        favorites = filtered;
    }
    saveToLS("favorites", favorites);
    loadFavorites();
    loadAutoCompleteResults();
}
function loadFavorites() {
    var results = document.getElementById("results-favorites");
    results.innerHTML = "";
    
    var favorites = readFromLS("favorites");
    if (favorites == null) {
        favorites = [];
        saveToLS("favorites", favorites);
    }

    favorites.forEach(function (item, i) {
        setItemHtml(results, item, true);
    });
}
function existInFavorites(key) {
    var exist = false;
    var favorites = readFromLS("favorites");
    if (favorites != null) {
        favorites.forEach(function (item, i) {
            if (key == item.Key)
                exist = true;
        });
    }
    return exist;
}
//#endregion favorites

//#region item
function setItemHtml(container, item, isFavorites) {
    var className = isFavorites ? "fav" + item.Key : item.Key;
    container.innerHTML += getItemHtml(item.LocalizedName, item.Country.LocalizedName, item.Key, isFavorites);
    getCurrentWeatherForItem(item.LocalizedName, item.Key, className);
    getForecastForItem(item.Key, className);
}
function getItemHtml(cityName, countryName, key, isFavorites) {
    var existInFavs = existInFavorites(key);

    var str = '<div class="col-md-4">';
    str += '<div class="card mb-4 box-shadow">';
    str += '<div class="card-body">';
    str += '<p class="card-text">' + cityName + ', ' + countryName + '</p>';
    str += '<p class="card-text ' + (isFavorites ? "fav" + key : key) + '"></p>';
    str += '<div class="d-flex justify-content-between align-items-center">';
    str += '<div class="btn-group">';
    if (!isFavorites && !existInFavs)
        str += '<button type="button" class="btn btn-sm btn-outline-secondary" data-key="' + key + '" data-name="' + cityName + '" data-country="' + countryName + '" onclick="addToFavorites()">Add To Favorites</button>';
    if (isFavorites || existInFavs)
        str += '<button type="button" class="btn btn-sm btn-outline-secondary" data-key="' + key + '" onclick="removeFromFavorites()">Remove From Favorites</button>';
    str += '</div>';
    str += '</div>';
    str += '</div>';
    str += '</div>';
    str += '</div>';
    return str;
}

function getCurrentWeatherForItem(cityName, cityKey, className) {
    var savedResult = readFromLS("locationData" + cityKey);
    document.getElementsByClassName(className)[0].innerHTML += "<h3>" + cityName + "</h3>";
    if (savedResult != null) {
        showCurrentWeatherForItem(savedResult, className);
    }
    else {
        var url = "https://cors-anywhere.herokuapp.com/https://dataservice.accuweather.com/currentconditions/v1/"+cityKey+"?apikey="+APIKEY+"&details=true";
        useXHR(url, function(data) {
            if (data == undefined) {
                //alert("api limit reached");
                return;
            }
            saveToLS("locationData" + cityKey, data);
            showCurrentWeatherForItem(data, className);
        });
    }
}
function showCurrentWeatherForItem(data, className) {
    data.forEach(function (item, i) {
        var str = "Weather: " + item.WeatherText + "<br />";
        str +=  "Temperature: " + item.Temperature.Metric.Value + " C<br />";

        document.getElementsByClassName(className)[0].innerHTML += str;
    });
}

function getForecastForItem(cityKey, className) {
    var savedForecast = readFromLS("forecastData" + cityKey);
    if (savedForecast != null) {
        showForecastForItem(savedForecast, className);
    }
    else {
        var url = "https://cors-anywhere.herokuapp.com/https://dataservice.accuweather.com/forecasts/v1/daily/5day/"+cityKey+"?apikey="+APIKEY+"&details=true&metric=true";
        useXHR(url, function(data) {
            if (data == undefined) {
                //alert("api limit reached");
                return;
            }
            saveToLS("forecastData" + cityKey, data);
            showForecastForItem(data, className);
        });
    }
}
function showForecastForItem(data, className) {
    data.DailyForecasts.forEach(function (item, i) {
        var dateObj = new Date(item.Date);
        var dateStr = dateObj.getDate() + "." + (dateObj.getMonth() == 12 ? 1 : dateObj.getMonth() + 1);
        var str = dateStr + ": " + item.Temperature.Minimum.Value + "-" + item.Temperature.Maximum.Value + " C<br />";
        
        document.getElementsByClassName(className)[0].innerHTML += str;
    });
}
//#endregion item
