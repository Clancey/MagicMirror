# Weather Detail View

## Purpose

Display comprehensive weather information when a user taps on the weather module. Shows current conditions, hourly forecast, and multi-day forecast in an organized full-screen layout.

## Requirements

### Functional
- Tap weather module to open detail view
- Display current conditions: temperature, feels-like, description, humidity, wind
- Display hourly forecast: next 12 hours with temp and icon
- Display daily forecast: next 7 days with high/low and icon
- Show precipitation probability when available
- Display UV index when available

### Non-Functional
- Clear visual hierarchy between sections
- Weather icons consistent with module display
- Temperature values respect user's unit preference (°F/°C)
- Horizontal scrolling for hourly forecast if needed
- Wind speed respects user's unit preference

## Technical Design

### Data Source

The weather module broadcasts data via notification:

```javascript
// From weather.js:189
this.sendNotification("WEATHER_UPDATED", {
    currentWeather: { /* WeatherObject */ },
    forecastArray: [ /* WeatherObjects for daily */ ],
    hourlyArray: [ /* WeatherObjects for hourly */ ],
    locationName: "City Name",
    providerName: "openweathermap"
});
```

WeatherObject structure (from `weatherobject.js`):
```javascript
{
    date: Date,
    windSpeed: number,
    windFromDirection: number,
    sunrise: Date,
    sunset: Date,
    temperature: number,
    minTemperature: number,
    maxTemperature: number,
    weatherType: string,        // "snow", "rain", "cloudy", etc.
    humidity: number,
    precipitationAmount: number,
    precipitationProbability: number,
    precipitationUnits: string,
    feelsLike: number,
    uvIndex: number
}
```

### State Management

```javascript
// In MMM-TouchOverlay
this.weatherData = {
    current: null,
    hourly: [],
    forecast: [],
    location: "",
    units: config.units  // "metric" or "imperial"
};

notificationReceived(notification, payload, sender) {
    if (notification === "WEATHER_UPDATED") {
        this.weatherData = {
            current: payload.currentWeather,
            hourly: payload.hourlyArray || [],
            forecast: payload.forecastArray || [],
            location: payload.locationName,
            units: config.units
        };
    }
}
```

### Touch Handler

```javascript
handleWeatherTap(event) {
    if (!this.weatherData.current) {
        console.warn("No weather data available");
        return;
    }
    this.openOverlay("weather", this.weatherData);
}
```

### DOM Structure (rendered via inline templates)

The weather detail view is rendered using inline JavaScript template literals in `renderWeatherDetail()`. The resulting DOM structure is:

```html
<div class="weather-detail">
    <div class="weather-location">City Name</div>

    <!-- Current Conditions -->
    <section class="weather-current">
        <div class="weather-current-main">
            <span class="weather-icon wi wi-day-sunny"></span>
            <span class="weather-temp-large">72°</span>
        </div>
        <div class="weather-current-desc">Sunny</div>
        <div class="weather-current-details">
            <div class="weather-detail-item">
                <span class="label">Feels like</span>
                <span class="value">75°</span>
            </div>
            <div class="weather-detail-item">
                <span class="label">Humidity</span>
                <span class="value">45%</span>
            </div>
            <div class="weather-detail-item">
                <span class="label">Wind</span>
                <span class="value">10 mph</span>
            </div>
            <div class="weather-detail-item">
                <span class="label">UV Index</span>
                <span class="value">6</span>
            </div>
            <div class="weather-detail-item">
                <span class="label">Precip</span>
                <span class="value">20%</span>
            </div>
        </div>
    </section>

    <!-- Hourly Forecast -->
    <section class="weather-hourly">
        <h2 class="weather-section-title">Hourly</h2>
        <div class="weather-hourly-scroll">
            <div class="weather-hour">
                <span class="hour-time">1pm</span>
                <span class="hour-icon wi wi-day-sunny"></span>
                <span class="hour-temp">72°</span>
            </div>
            <!-- More hours... -->
        </div>
    </section>

    <!-- Daily Forecast -->
    <section class="weather-forecast">
        <h2 class="weather-section-title">7-Day Forecast</h2>
        <div class="weather-forecast-list">
            <div class="weather-day">
                <span class="day-name">Mon</span>
                <span class="day-icon wi wi-day-sunny"></span>
                <span class="day-high">75°</span>
                <span class="day-low">58°</span>
                <span class="day-precip">10%</span>
            </div>
            <!-- More days... -->
        </div>
    </section>
</div>
```

**Note:** No external Nunjucks templates are used. All rendering is done via inline JavaScript template literals for simplicity and to avoid template engine dependencies.

### CSS

```css
.weather-detail {
    max-width: 600px;
    width: 100%;
}

.weather-location {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 16px;
}

/* Current Conditions */
.weather-current {
    text-align: center;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 24px;
}

.weather-current-main {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-bottom: 8px;
}

.weather-icon {
    font-size: 64px;
}

.weather-temp-large {
    font-size: 72px;
    font-weight: 300;
}

.weather-current-desc {
    font-size: 20px;
    margin-bottom: 16px;
    text-transform: capitalize;
}

.weather-current-details {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 24px;
}

.weather-detail-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.weather-detail-item .label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
}

.weather-detail-item .value {
    font-size: 18px;
}

/* Hourly Forecast */
.weather-hourly {
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 24px;
}

.weather-section-title {
    font-size: 14px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 16px;
}

.weather-hourly-scroll {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 8px;
    -webkit-overflow-scrolling: touch;
}

.weather-hour {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 60px;
}

.hour-time {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 8px;
}

.hour-icon {
    font-size: 24px;
    margin-bottom: 8px;
}

.hour-temp {
    font-size: 16px;
}

/* Daily Forecast */
.weather-forecast-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.weather-day {
    display: grid;
    grid-template-columns: 80px 32px 48px 48px 48px;
    align-items: center;
    gap: 8px;
}

.day-name {
    font-size: 16px;
}

.day-icon {
    font-size: 20px;
}

.day-high {
    font-size: 16px;
    text-align: right;
}

.day-low {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    text-align: right;
}

.day-precip {
    font-size: 14px;
    color: #6cb4ee;
    text-align: right;
}
```

## Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `MMM-TouchOverlay.js` | Add weather data listener, handler, render method (inline templates) |
| `MMM-TouchOverlay.css` | Add weather detail styles |

**Note**: Uses inline JavaScript template literals in `renderWeatherDetail()` instead of Nunjucks templates.

### Weather Icon Mapping

Use the existing weather-icons font. Map `weatherType` to icon class:

```javascript
getWeatherIcon(weatherType) {
    const iconMap = {
        "day-sunny": "day-sunny",
        "day-cloudy": "day-cloudy",
        "cloudy": "cloudy",
        "rain": "rain",
        "snow": "snow",
        "thunderstorm": "thunderstorm",
        "fog": "fog",
        // ... etc
    };
    return iconMap[weatherType] || "na";
}
```

### Unit Conversion

Respect the user's config units:

```javascript
formatTemp(temp) {
    if (this.weatherData.units === "imperial") {
        return Math.round(temp);  // Already Fahrenheit from provider
    }
    return Math.round(temp);  // Celsius
}

formatWind(speed) {
    if (this.weatherData.units === "imperial") {
        return `${Math.round(speed)} mph`;
    }
    // Note: MagicMirror's weather module uses m/s for metric by default.
    // Users can configure windUnits in weather module if km/h is preferred.
    return `${Math.round(speed)} m/s`;
}
```

### Render Method

```javascript
renderWeatherDetail() {
    const { current, hourly, forecast, location, units } = this.weatherData;

    return {
        location,
        currentTemp: this.formatTemp(current.temperature),
        feelsLike: this.formatTemp(current.feelsLike),
        weatherDesc: current.weatherType,
        weatherIcon: this.getWeatherIcon(current.weatherType),
        humidity: current.humidity,
        windSpeed: this.formatWind(current.windSpeed),
        windUnit: units === "imperial" ? "mph" : "m/s",  // MagicMirror default: m/s for metric
        uvIndex: current.uvIndex,
        precipProb: current.precipitationProbability,
        hourly: hourly.slice(0, 12).map(h => ({
            time: moment(h.date).format("ha"),
            temp: this.formatTemp(h.temperature),
            icon: this.getWeatherIcon(h.weatherType)
        })),
        forecast: forecast.slice(0, 7).map(d => ({
            name: moment(d.date).format("ddd"),
            high: this.formatTemp(d.maxTemperature),
            low: this.formatTemp(d.minTemperature),
            icon: this.getWeatherIcon(d.weatherType),
            precip: d.precipitationProbability
        }))
    };
}
```

## Acceptance Criteria

1. [ ] Tapping weather module opens weather detail overlay
2. [ ] Current temperature displayed prominently
3. [ ] Feels-like temperature shown
4. [ ] Humidity percentage shown
5. [ ] Wind speed shown with appropriate units
6. [ ] Weather icon matches current conditions
7. [ ] Hourly forecast shows next 12 hours
8. [ ] Hourly forecast is horizontally scrollable
9. [ ] Daily forecast shows 7 days
10. [ ] Daily forecast shows high/low temperatures
11. [ ] Precipitation probability shown when available
12. [ ] UV index shown when available
13. [ ] Temperature units match user configuration

## Open Questions

1. What if hourly data is not available from the weather provider?
2. Should sunrise/sunset times be displayed?
3. Should there be a refresh button to fetch updated data?
