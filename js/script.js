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
    
    loadResultsByCity("Tel Aviv");
    loadFavorites();
});
//#endregion onload

//#region pagenavigation
function toggleMenu() {
	if (document.getElementsByClassName("animated")[0].classList.contains('show'))
        hideMenu();
    else
        showMenu();
}
function showMenu() {
    var elem = document.getElementsByClassName("animated")[0];
    elem.removeAttribute('hidden');
    elem.classList.add('show');
    elem.classList.add('fadeInDown');
    setTimeout(function() {
        elem.classList.remove('fadeInDown');
    }, 500);
}
function hideMenu() {
    var elem = document.getElementsByClassName("animated")[0];
    elem.classList.add('fadeOutUp');
    setTimeout(function() {
        elem.setAttribute('hidden', 'true');
        elem.classList.remove('show');
        elem.classList.remove('fadeOutUp');
    }, 500);
}
function showPage(name) {
    hideAllPages();
    if (document.getElementsByClassName("animated")[0].classList.contains('show'))
        hideMenu();

    document.getElementsByClassName(name)[0].setAttribute('style', 'display:block;');
}
function hideAllPages() {
    document.getElementsByClassName("favorites")[0].setAttribute('style', 'display:none;');
    document.getElementsByClassName("results")[0].setAttribute('style', 'display:none;');
}
//#endregion pagenavigation

//#region geolocation
function getGeoLocation() {
    showPage('results');

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(returnedPosition) {
            var position = {};
            position.longitude = returnedPosition.coords.longitude;
            position.latitude = returnedPosition.coords.latitude;
            getCityByLocation(position);
        });
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
    setTimeout(function() {
        if (document.getElementsByClassName("resultItem") != undefined)
            document.getElementsByClassName("resultItem")[0].click();
    }, 500);
}
//#endregion geolocation

//#region autocomplete
function loadAutoCompleteResults() {
    var val = document.getElementById("searchtext").value;
    if (val.length < 3) return false;

    var savedResults = readFromLS("searchResData");
    if (savedResults != null) {
        showAutoCompleteResults(savedResults);
    }
    else {
        var url = "https://cors-anywhere.herokuapp.com/https://dataservice.accuweather.com/locations/v1/cities/autocomplete?apikey="+APIKEY+"&q=" + val;
        useXHR(url, function(data) {
            if (data == undefined) {
                //alert("api limit reached");
                return;
            }
            saveToLS("searchResData", data);
            showAutoCompleteResults(data);
        });
    }
}
function showAutoCompleteResults(data) {
    var results = document.getElementById("results-weather");
    results.innerHTML = "";
    data.forEach(function (item, i) {
        setResultItemHtml(results, item);
    });
}
function showAutoCompleteDiv() {
    document.getElementById("results-weather").setAttribute("style", "display: block;");
}
function hideAutoCompleteDiv() {
    setTimeout(function() {
        document.getElementById("results-weather").setAttribute("style", "display: none;");
    }, 200);
}
function setResultItemHtml(container, city) {
    container.innerHTML += getResultItemHtml(city);
}
function getResultItemHtml(city) {
    var str = '<div class="resultItem col" data-key="' + city.Key + '" data-name="' + city.LocalizedName + '" data-country="' + city.Country.LocalizedName + '" onclick="loadCityWeather()">';
    str += '<p class="card-text">' + city.LocalizedName + ', ' + city.Country.LocalizedName + '</p>';
    str += '</div>';
    return str;
}
//#endregion autocomplete

//#region favorites
function addToFavorites() {
    var favorite = buildCityItem(event.currentTarget);

    var favorites = readFromLS("favorites");
    if (favorites == null) {
        favorites = [];
    }
    favorites.push(favorite);
    saveToLS("favorites", favorites);
    loadFavorites();
    loadCityWeather();
}
function buildCityItem(sender) {
    var favorite = {};
    favorite.Key = sender.attributes["data-key"].value;
    favorite.LocalizedName = sender.attributes["data-name"].value;
    favorite.Country = { LocalizedName : sender.attributes["data-country"].value };
    return favorite;
}
function removeFromFavorites() {
    var keyToRemove = event.currentTarget.attributes["data-key"].value;
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
    loadCityWeather();
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
function loadFavorites() {
    var results = document.getElementById("results-favorites");
    results.innerHTML = "";
    
    var favorites = readFromLS("favorites");
    if (favorites == null) {
        favorites = [];
        saveToLS("favorites", favorites);
    }

    favorites.forEach(function (item, i) {
        setFavoritesItemHtml(results, item);
    });
}
function setFavoritesItemHtml(container, city) {
    container.innerHTML += getFavoritesItemHtml(city);
}
function getFavoritesItemHtml(city) {
    var str = '<div class="resultItem col-md-3" data-key="' + city.Key + '" data-name="' + city.LocalizedName + '" data-country="' + city.Country.LocalizedName + '" onclick="loadCityWeather()">';
    str += '<div class="card mb-3 box-shadow">';
    str += '<div class="card-body text-center">';
    str += '<p class="card-text"><h4>' + city.LocalizedName + '</h4>' + city.Country.LocalizedName + '</p>';
    str += '</div>';
    str += '</div>';
    str += '</div>';
    return str;
}
//#endregion favorites

//#region weather
function loadCityWeather() {
    showPage('results');
    var city = buildCityItem(event.currentTarget);
    document.getElementById("results-city").innerHTML = getCityWeatherHtml(city);
    getCurrentWeatherForItem(city);
    getForecastForItem(city);
    hideAutoCompleteDiv();
}
function getCityWeatherHtml(city) {
    var str = '<div class="col-md-12">';
    str += '<div class="card mb-12 box-shadow">';
    str += '<div class="card-body text-center">';
    str += '<p class="card-text"><h2>' + city.LocalizedName + '</h2>' + city.Country.LocalizedName + '</p>';
    str += '<p class="card-text ' + city.Key + '"></p>';
    str += '</div>';
    str += '</div>';
    str += '</div>';
    return str;
}

function getCurrentWeatherForItem(city) {
    var savedResult = readFromLS("locationData" + city.Key);
    if (savedResult != null) {
        showCurrentWeatherForItem(savedResult, city);
    }
    else {
        var url = "https://cors-anywhere.herokuapp.com/https://dataservice.accuweather.com/currentconditions/v1/"+city.Key+"?apikey="+APIKEY+"&details=true";
        useXHR(url, function(data) {
            if (data == undefined) {
                //alert("api limit reached");
                return;
            }
            saveToLS("locationData" + city.Key, data);
            showCurrentWeatherForItem(data, city);
        });
    }
}
function showCurrentWeatherForItem(data, city) {
    var existInFavs = existInFavorites(city.Key);
    var units = getCurrentUnits();
    data.forEach(function (item, i) {
        var str = "<h3>" + (units == "C" ? item.Temperature.Metric.Value : item.Temperature.Imperial.Value) + " " + units + " " + item.WeatherText + "</h3><br />";

        str += '<div class="btn-group">';
        if (existInFavs)
            str += '<button type="button" class="btn btn-sm btn-outline-secondary" data-key="' + city.Key + '" data-name="' + city.LocalizedName + '" data-country="' + city.Country.LocalizedName + '" onclick="removeFromFavorites()">Remove From Favorites</button>';
        else
            str += '<button type="button" class="btn btn-sm btn-outline-secondary" data-key="' + city.Key + '" data-name="' + city.LocalizedName + '" data-country="' + city.Country.LocalizedName + '" onclick="addToFavorites()">Add To Favorites</button>';
        str += '</div>';

        document.getElementsByClassName(city.Key)[0].innerHTML += str;
    });
}

function getForecastForItem(city) {
    var units = getCurrentUnits();
    var savedForecast = readFromLS("forecastData" + city.Key);
    if (savedForecast != null) {
        showForecastForItem(savedForecast, city);
    }
    else {
        var url = "https://cors-anywhere.herokuapp.com/https://dataservice.accuweather.com/forecasts/v1/daily/5day/"+city.Key+"?apikey="+APIKEY+"&details=true&metric=" + (units == "C");
        useXHR(url, function(data) {
            if (data == undefined) {
                //alert("api limit reached");
                return;
            }
            saveToLS("forecastData" + city.Key, data);
            showForecastForItem(data, city);
        });
    }
}
function showForecastForItem(data, city) {
    var units = getCurrentUnits();

    var str = '<div class="row">';
    data.DailyForecasts.forEach(function (item, i) {
        var dateObj = new Date(item.Date);
        var dateStr = dateObj.getDate() + "." + (dateObj.getMonth() == 12 ? 1 : dateObj.getMonth() + 1);

        str += '<div class="col">';
        str += '<div class="card box-shadow">';
        str += '<div class="card-body text-center">';
        str += '<p class="card-text"><h3>' + dateStr + "</h3>" + item.Temperature.Minimum.Value + "-" + item.Temperature.Maximum.Value + " " + units + '</p>';
        str += '</div>';
        str += '</div>';
        str += '</div>';
    });
    str += '</div>';

    document.getElementsByClassName(city.Key)[0].innerHTML += str;
}
//#endregion weather

//#region units
function getCurrentUnits() {
    var savedUnits = readFromLS("units");
    if (savedUnits == null) {
        savedUnits = "C";
        saveToLS("units", savedUnits);
    }
    return savedUnits;
}
function toggleUnits() {
    var units = getCurrentUnits();
    if (units == "C")
        units = "F";
    else
        units = "C";
    saveToLS("units", units);
    loadAutoCompleteResults();
}
//#endregion units
