import React, { useState } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Eye, Thermometer, MapPin } from 'lucide-react';

const CITIES = [
  { name: 'New York', temp: 18, high: 22, low: 14, humidity: 62, wind: 15, visibility: 16, condition: 'Partly Cloudy', icon: Cloud,
    forecast: [{ day: 'Tue', temp: 20, icon: Sun }, { day: 'Wed', temp: 17, icon: CloudRain }, { day: 'Thu', temp: 15, icon: CloudRain }, { day: 'Fri', temp: 19, icon: Sun }, { day: 'Sat', temp: 22, icon: Sun }] },
  { name: 'London', temp: 12, high: 15, low: 9, humidity: 78, wind: 22, visibility: 10, condition: 'Rainy', icon: CloudRain,
    forecast: [{ day: 'Tue', temp: 13, icon: CloudRain }, { day: 'Wed', temp: 11, icon: Cloud }, { day: 'Thu', temp: 14, icon: Sun }, { day: 'Fri', temp: 10, icon: CloudRain }, { day: 'Sat', temp: 12, icon: Cloud }] },
  { name: 'Tokyo', temp: 24, high: 28, low: 20, humidity: 55, wind: 8, visibility: 20, condition: 'Sunny', icon: Sun,
    forecast: [{ day: 'Tue', temp: 26, icon: Sun }, { day: 'Wed', temp: 25, icon: Cloud }, { day: 'Thu', temp: 23, icon: CloudRain }, { day: 'Fri', temp: 27, icon: Sun }, { day: 'Sat', temp: 28, icon: Sun }] },
  { name: 'Moscow', temp: -5, high: -2, low: -10, humidity: 85, wind: 18, visibility: 5, condition: 'Snowy', icon: CloudSnow,
    forecast: [{ day: 'Tue', temp: -3, icon: CloudSnow }, { day: 'Wed', temp: -7, icon: CloudSnow }, { day: 'Thu', temp: -1, icon: Cloud }, { day: 'Fri', temp: 0, icon: Cloud }, { day: 'Sat', temp: -4, icon: CloudSnow }] },
];

export default function WeatherApp({ windowId }: { windowId: string }) {
  const [cityIdx, setCityIdx] = useState(0);
  const city = CITIES[cityIdx];
  const Icon = city.icon;

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--os-window-body))]">
      {/* City selector */}
      <div className="flex gap-1 px-3 py-2 border-b border-border/10 overflow-x-auto scrollbar-os">
        {CITIES.map((c, i) => (
          <button key={c.name} onClick={() => setCityIdx(i)}
            className={`px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap transition-colors ${i === cityIdx ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted/30'}`}>
            <MapPin size={9} className="inline mr-0.5" />{c.name}
          </button>
        ))}
      </div>

      {/* Current weather */}
      <div className="flex items-center gap-6 px-6 py-6">
        <div>
          <Icon size={56} className="text-primary" />
        </div>
        <div>
          <div className="text-4xl font-bold text-foreground">{city.temp}°C</div>
          <div className="text-sm text-muted-foreground">{city.condition}</div>
          <div className="text-[11px] text-muted-foreground">H: {city.high}° L: {city.low}°</div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-4 gap-2 px-4 pb-4">
        {[
          { label: 'Humidity', value: `${city.humidity}%`, icon: Droplets },
          { label: 'Wind', value: `${city.wind} km/h`, icon: Wind },
          { label: 'Visibility', value: `${city.visibility} km`, icon: Eye },
          { label: 'Feels Like', value: `${city.temp - 2}°C`, icon: Thermometer },
        ].map(d => (
          <div key={d.label} className="bg-secondary/20 rounded-lg p-2.5 text-center">
            <d.icon size={14} className="mx-auto text-primary mb-1" />
            <div className="text-[10px] text-muted-foreground">{d.label}</div>
            <div className="text-xs font-medium text-foreground">{d.value}</div>
          </div>
        ))}
      </div>

      {/* 5-day forecast */}
      <div className="flex-1 px-4 pb-3">
        <div className="text-[10px] text-muted-foreground mb-2">5-Day Forecast</div>
        <div className="flex gap-2">
          {city.forecast.map(f => (
            <div key={f.day} className="flex-1 bg-secondary/10 rounded-lg p-2 text-center">
              <div className="text-[10px] text-muted-foreground">{f.day}</div>
              <f.icon size={18} className="mx-auto my-1.5 text-foreground" />
              <div className="text-xs font-medium text-foreground">{f.temp}°</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
