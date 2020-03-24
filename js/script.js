//#region infrastructure
let APIKEY = "J5zdAxwbIEccf5BOhHRo8MJngz8jMLwH";

function saveToLS(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
function readFromLS(key) {
    return JSON.parse(localStorage.getItem(key));
}
function useXHR(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300)
            callback(JSON.parse(xhr.response));
        else
            callback(undefined);
    };
    xhr.open('GET', url);
    xhr.send();
}
function showApiError() {
    document.getElementById("err").innerHTML = "API Limit Reached!";
}
//#endregion infrastructure

//#region onload
document.addEventListener("DOMContentLoaded", function() {
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
    let elem = document.getElementsByClassName("animated")[0];
    elem.removeAttribute('hidden');
    elem.classList.add('show');
    elem.classList.add('fadeInDown');
    setTimeout(function() {
        elem.classList.remove('fadeInDown');
    }, 500);
}
function hideMenu() {
    let elem = document.getElementsByClassName("animated")[0];
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
            let position = {};
            position.longitude = returnedPosition.coords.longitude;
            position.latitude = returnedPosition.coords.latitude;
            getCityByLocation(position);
        });
    }
}
function getCityByLocation(position) {
    let url = "https://cors-anywhere.herokuapp.com/https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey="+APIKEY+"&q=" + position.latitude + "," + position.longitude;
    useXHR(url, function(data) {
        if (data == undefined) {
            showApiError();
            return;
        }
        loadResultsByCity(data.EnglishName);
    });
}
function loadResultsByCity(city) {
    document.getElementById("searchtext").value = city;
    loadAutoCompleteResults(true);
}
//#endregion geolocation

//#region autocomplete
function loadAutoCompleteResults(loadFirstResult) {
    let val = document.getElementById("searchtext").value;
    if (val.length < 3)
        return;

    let url = "https://cors-anywhere.herokuapp.com/https://dataservice.accuweather.com/locations/v1/cities/autocomplete?apikey="+APIKEY+"&q=" + val;
    useXHR(url, function(data) {
        if (data == undefined) {
            showApiError();
            return;
        }
        showAutoCompleteResults(data, loadFirstResult == undefined ? false : loadFirstResult);
    });
}
function showAutoCompleteResults(data, loadFirstResult) {
    let results = document.getElementById("results-weather");
    results.innerHTML = "";
    data.forEach(function (item, i) {
        setResultItemHtml(results, item);
    });
    if (loadFirstResult)
        document.getElementsByClassName("resultItem")[0].click();
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
    let str = '<div class="resultItem col" data-key="' + city.Key + '" data-name="' + city.LocalizedName + '" data-country="' + city.Country.LocalizedName + '" onclick="loadCityWeather()">';
    str += '<p class="card-text">' + city.LocalizedName + ', ' + city.Country.LocalizedName + '</p>';
    str += '</div>';
    return str;
}
//#endregion autocomplete

//#region favorites
function addToFavorites() {
    let favorite = buildCityItem(event.currentTarget);

    let favorites = readFromLS("favorites");
    if (favorites == null) {
        favorites = [];
    }
    favorites.push(favorite);
    saveToLS("favorites", favorites);
    loadFavorites();
    loadCityWeather();
}
function removeFromFavorites() {
    let keyToRemove = event.currentTarget.attributes["data-key"].value;
    let favorites = readFromLS("favorites");
    if (favorites == null) {
        favorites = [];
    }
    else {
        let filtered = favorites.filter(function(item, index, arr){ 
            return item.Key != keyToRemove;
        });
        favorites = filtered;
    }
    saveToLS("favorites", favorites);
    loadFavorites();
    loadCityWeather();
}
function existInFavorites(key) {
    let foundItem = null;
    let favorites = readFromLS("favorites");
    if (favorites != null) {
        debugger;
        foundItem = favorites.find(function checkAdult(item) {
            return item.Key == key;
          });
        /*favorites.forEach(function (item, i) {
            if (key == item.Key)
                exist = true;
        });*/
    }
    return foundItem;
}
function loadFavorites() {
    let results = document.getElementById("results-favorites");
    results.innerHTML = "";
    
    let favorites = readFromLS("favorites");
    if (favorites == null) {
        favorites = [];
        saveToLS("favorites", favorites);
    }

    if (favorites.length == 0)
        results.innerHTML = "<p style='margin: auto;'>No favorites saved yet.</p>";

    favorites.forEach(function (item, i) {
        setFavoritesItemHtml(results, item);
    });
}
function setFavoritesItemHtml(container, city) {
    container.innerHTML += getFavoritesItemHtml(city);
}
function getFavoritesItemHtml(city) {
    let str = '<div class="resultItem col-md-3" data-key="' + city.Key + '" data-name="' + city.LocalizedName + '" data-country="' + city.Country.LocalizedName + '" onclick="loadCityWeather()">';
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
    let city = buildCityItem(event.currentTarget);
    document.getElementById("results-city").innerHTML = getCityWeatherHtml(city);
    getCurrentWeatherForItem(city);
    hideAutoCompleteDiv();
}
function buildCityItem(sender) {
    let city = {};
    city.Key = sender.attributes["data-key"].value;
    city.LocalizedName = sender.attributes["data-name"].value;
    city.Country = { LocalizedName : sender.attributes["data-country"].value };
    return city;
}
function getCityWeatherHtml(city) {
    let existInFavs = existInFavorites(city.Key);

    let str = '<div class="col-md-12">';
    str += '<div class="card mb-12 box-shadow">';
    str += '<div class="card-body text-center">';
    str += '<p class="card-text"><h2>' + city.LocalizedName + '</h2>' + city.Country.LocalizedName + '</p>';
    str += '<p class="card-text">';
    
    str += '<div class="btn-group">';
    if (existInFavs)
        str += '<button type="button" class="btn btn-sm btn-outline-secondary" data-key="' + city.Key + '" data-name="' + city.LocalizedName + '" data-country="' + city.Country.LocalizedName + '" onclick="removeFromFavorites()">Remove From Favorites</button>';
    else
        str += '<button type="button" class="btn btn-sm btn-outline-secondary" data-key="' + city.Key + '" data-name="' + city.LocalizedName + '" data-country="' + city.Country.LocalizedName + '" onclick="addToFavorites()">Add To Favorites</button>';
    str += '</div>';

    str += '</p>';
    str += '<div class="card-text ' + city.Key + '"><div class="spinner-border"></div></div>';
    str += '<div class="card-text fc' + city.Key + '"><div class="spinner-border"></div></div>';
    str += '</div>';
    str += '</div>';
    str += '</div>';
    return str;
}

function getCurrentWeatherForItem(city) {
    let url = "https://cors-anywhere.herokuapp.com/https://dataservice.accuweather.com/currentconditions/v1/"+city.Key+"?apikey="+APIKEY+"&details=true";
        useXHR(url, function(data) {
            if (data == undefined) {
                showApiError();
                return;
            }
            showCurrentWeatherForItem(data, city);
        });
}
function showCurrentWeatherForItem(data, city) {
    let units = getCurrentUnits();
    if (data.length > 0) {
        let item = data[0];
        let str = "Current Weather Conditions:<h4>" + (units == "C" ? item.Temperature.Metric.Value : item.Temperature.Imperial.Value) + " " + units + " " + item.WeatherText + "</h4><br />";
        document.getElementsByClassName(city.Key)[0].innerHTML = str;
        getForecastForItem(city);
    }
}

function getForecastForItem(city) {
    let units = getCurrentUnits();
    let url = "https://cors-anywhere.herokuapp.com/https://dataservice.accuweather.com/forecasts/v1/daily/5day/"+city.Key+"?apikey="+APIKEY+"&details=true&metric=" + (units == "C");
        useXHR(url, function(data) {
            if (data == undefined) {
                showApiError();
                return;
            }
            showForecastForItem(data, city);
        });
}
function showForecastForItem(data, city) {
    let units = getCurrentUnits();

    let str = '<div class="row">';
    str += '<div class="col">';
    str += '5 Day Forcast:';
    str += '</div>';
    str += '</div>';
    str += '<div class="row">';
    data.DailyForecasts.forEach(function (item, i) {
        let dateObj = new Date(item.Date);
        let dateStr = dateObj.toString().substring(0,3) + " " + dateObj.getDate() + "." + (dateObj.getMonth() == 12 ? 1 : dateObj.getMonth() + 1);
        
        str += '<div class="col">';
        str += '<div class="card box-shadow">';
        str += '<div class="card-body text-center">';
        str += '<p class="card-text"><h5>' + dateStr + "</h5>" + item.Temperature.Minimum.Value + "-" + item.Temperature.Maximum.Value + " " + units + '</p>';
        str += '</div>';
        str += '</div>';
        str += '</div>';
    });
    str += '</div>';

    document.getElementsByClassName("fc" + city.Key)[0].innerHTML = str;
}
//#endregion weather

//#region units
function getCurrentUnits() {
    let savedUnits = readFromLS("units");
    if (savedUnits == null) {
        savedUnits = "C";
        saveToLS("units", savedUnits);
    }
    return savedUnits;
}
function toggleUnits() {
    let units = getCurrentUnits();
    if (units == "C")
        units = "F";
    else
        units = "C";
    saveToLS("units", units);
    loadAutoCompleteResults(true);
}
//#endregion units
