import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Wind,
  Droplets,
  Compass,
  Thermometer,
  Eye,
  Umbrella,
  Gauge,
  Sunrise,
  Sunset,
  Search,
  MapPin,
  RefreshCw,
  Star,
  Clock,
  Sparkles,
  Info,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { AppTheme } from '../types';

export interface WeatherData {
  city: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    precipitation: number;
    rain: number;
    weatherCode: number;
    cloudCover: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    uvIndex: number;
    isDay: number;
  };
  daily: Array<{
    date: string;
    weatherCode: number;
    tempMax: number;
    tempMin: number;
    precipProbMax: number;
    precipSum: number;
    uvIndexMax: number;
    windSpeedMax: number;
    sunrise: string;
    sunset: string;
  }>;
  hourly: Array<{
    time: string;
    temperature: number;
    weatherCode: number;
    precipProb: number;
    humidity: number;
    windSpeed: number;
    isDay: number;
  }>;
}

// Cidades pré-definidas para carregamento instantâneo
const PRESET_CITIES = [
  { name: 'São Paulo', admin1: 'São Paulo', country: 'Brasil', lat: -23.5505, lon: -46.6333 },
  { name: 'Rio de Janeiro', admin1: 'Rio de Janeiro', country: 'Brasil', lat: -22.9068, lon: -43.1729 },
  { name: 'Brasília', admin1: 'Distrito Federal', country: 'Brasil', lat: -15.7939, lon: -47.8828 },
  { name: 'Salvador', admin1: 'Bahia', country: 'Brasil', lat: -12.9714, lon: -38.5014 },
  { name: 'Belo Horizonte', admin1: 'Minas Gerais', country: 'Brasil', lat: -19.9208, lon: -43.9378 },
  { name: 'Curitiba', admin1: 'Paraná', country: 'Brasil', lat: -25.4284, lon: -49.2733 },
  { name: 'Fortaleza', admin1: 'Ceará', country: 'Brasil', lat: -3.7172, lon: -38.5433 },
  { name: 'Porto Alegre', admin1: 'Rio Grande do Sul', country: 'Brasil', lat: -30.0346, lon: -51.2177 },
  { name: 'Manaus', admin1: 'Amazonas', country: 'Brasil', lat: -3.1190, lon: -60.0217 },
  { name: 'Recife', admin1: 'Pernambuco', country: 'Brasil', lat: -8.0476, lon: -34.8770 },
  { name: 'Florianópolis', admin1: 'Santa Catarina', country: 'Brasil', lat: -27.5954, lon: -48.5480 },
  { name: 'Lisboa', admin1: 'Lisboa', country: 'Portugal', lat: 38.7223, lon: -9.1393 },
  { name: 'Nova York', admin1: 'Nova York', country: 'Estados Unidos', lat: 40.7128, lon: -74.0060 },
  { name: 'Londres', admin1: 'Inglaterra', country: 'Reino Unido', lat: 51.5074, lon: -0.1278 },
  { name: 'Tóquio', admin1: 'Tóquio', country: 'Japão', lat: 35.6762, lon: 139.6503 },
  { name: 'Paris', admin1: 'Île-de-France', country: 'França', lat: 48.8566, lon: 2.3522 },
];

// Mapeamento WMO de condições climáticas
export function getWeatherInterpretation(code: number, isDay = 1): {
  label: string;
  description: string;
  icon: 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'lightning' | 'snow' | 'fog';
  color: string;
} {
  switch (code) {
    case 0:
      return {
        label: isDay ? 'Céu Limpo' : 'Noite Estrelada',
        description: isDay ? 'Ensolarado e sem nuvens' : 'Céu aberto e limpo',
        icon: isDay ? 'sun' : 'cloud-sun',
        color: 'text-amber-500',
      };
    case 1:
      return {
        label: 'Predominantemente Limpo',
        description: 'Poucas nuvens esparsas',
        icon: 'cloud-sun',
        color: 'text-amber-400',
      };
    case 2:
      return {
        label: 'Parcialmente Nublado',
        description: 'Intervalos de sol e nuvens',
        icon: 'cloud-sun',
        color: 'text-sky-500',
      };
    case 3:
      return {
        label: 'Nublado / Encoberto',
        description: 'Céu coberto por nuvens',
        icon: 'cloud',
        color: 'text-slate-400',
      };
    case 45:
    case 48:
      return {
        label: 'Nevoeiro / Neblina',
        description: 'Visibilidade reduzida por névoa úmida',
        icon: 'fog',
        color: 'text-slate-400',
      };
    case 51:
    case 53:
    case 55:
      return {
        label: 'Chuvisco',
        description: 'Precipitação leve intermitente',
        icon: 'rain',
        color: 'text-blue-400',
      };
    case 56:
    case 57:
      return {
        label: 'Chuvisco Congelante',
        description: 'Chuvisco em baixa temperatura',
        icon: 'snow',
        color: 'text-cyan-400',
      };
    case 61:
      return {
        label: 'Chuva Fraca',
        description: 'Chuva leve contínua',
        icon: 'rain',
        color: 'text-blue-500',
      };
    case 63:
      return {
        label: 'Chuva Moderada',
        description: 'Chuva regular consistente',
        icon: 'rain',
        color: 'text-blue-600',
      };
    case 65:
      return {
        label: 'Chuva Forte',
        description: 'Precipitação intensa e contínua',
        icon: 'rain',
        color: 'text-indigo-600',
      };
    case 66:
    case 67:
      return {
        label: 'Chuva Congelante',
        description: 'Gotas de chuva em ponto de congelamento',
        icon: 'snow',
        color: 'text-cyan-500',
      };
    case 71:
    case 73:
    case 75:
      return {
        label: 'Neve',
        description: 'Precipitação de cristais de gelo',
        icon: 'snow',
        color: 'text-sky-300',
      };
    case 77:
      return {
        label: 'Grãos de Neve',
        description: 'Pequenos flocos de gelo',
        icon: 'snow',
        color: 'text-sky-200',
      };
    case 80:
    case 81:
    case 82:
      return {
        label: 'Pancadas de Chuva',
        description: 'Chuva rápida de intensidade moderada a forte',
        icon: 'rain',
        color: 'text-blue-500',
      };
    case 85:
    case 86:
      return {
        label: 'Pancadas de Neve',
        description: 'Aguaceiros de neve intermitente',
        icon: 'snow',
        color: 'text-sky-300',
      };
    case 95:
      return {
        label: 'Tempestade com Trovoadas',
        description: 'Descargas elétricas e ventos fortes',
        icon: 'lightning',
        color: 'text-purple-500',
      };
    case 96:
    case 99:
      return {
        label: 'Tempestade com Granizo',
        description: 'Trovoadas severas acompanhadas de pedras de gelo',
        icon: 'lightning',
        color: 'text-red-500',
      };
    default:
      return {
        label: 'Tempo Estável',
        description: 'Condições meteorológicas sem anomalias',
        icon: 'cloud-sun',
        color: 'text-blue-400',
      };
  }
}

// Fallback estático em caso de falha de conexão à internet
function getFallbackWeather(cityName = 'São Paulo', admin1 = 'SP', country = 'Brasil', lat = -23.5505, lon = -46.6333): WeatherData {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const daily = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    daily.push({
      date: d.toISOString().split('T')[0],
      weatherCode: i === 0 ? 1 : i % 3 === 0 ? 80 : i % 2 === 0 ? 2 : 0,
      tempMax: 26 + (i % 3) * 2 - (i % 2) * 1,
      tempMin: 18 - (i % 2) * 2,
      precipProbMax: i === 0 ? 15 : (i * 20) % 70,
      precipSum: i % 3 === 0 ? 4.5 : 0,
      uvIndexMax: 7.2,
      windSpeedMax: 16.5,
      sunrise: `${d.toISOString().split('T')[0]}T06:12`,
      sunset: `${d.toISOString().split('T')[0]}T18:05`,
    });
  }

  const hourly = [];
  const currentHour = now.getHours();
  for (let h = 0; h < 24; h++) {
    const hourDate = new Date(now.getTime() + h * 60 * 60 * 1000);
    const hNum = hourDate.getHours();
    hourly.push({
      time: hourDate.toISOString(),
      temperature: 20 + Math.sin((hNum - 6) / 4) * 6,
      weatherCode: hNum > 14 && hNum < 18 ? 80 : 1,
      precipProb: hNum > 14 && hNum < 18 ? 45 : 10,
      humidity: 65 - Math.sin((hNum - 6) / 4) * 15,
      windSpeed: 12 + Math.cos(hNum / 3) * 5,
      isDay: hNum >= 6 && hNum < 18 ? 1 : 0,
    });
  }

  return {
    city: cityName,
    admin1,
    country,
    latitude: lat,
    longitude: lon,
    timezone: 'America/Sao_Paulo',
    current: {
      time: now.toISOString(),
      temperature: 24.2,
      feelsLike: 25.1,
      humidity: 68,
      precipitation: 0,
      rain: 0,
      weatherCode: 1,
      cloudCover: 25,
      pressure: 1016.4,
      windSpeed: 14.8,
      windDirection: 140,
      uvIndex: 6.8,
      isDay: 1,
    },
    daily,
    hourly,
  };
}

export const WeatherTool: React.FC<{ theme?: AppTheme }> = ({ theme }) => {
  const [selectedCity, setSelectedCity] = useState(PRESET_CITIES[0]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [favorites, setFavorites] = useState<typeof PRESET_CITIES>(() => {
    try {
      const saved = localStorage.getItem('wikizero_weather_favorites');
      return saved ? JSON.parse(saved) : [PRESET_CITIES[0], PRESET_CITIES[1], PRESET_CITIES[2], PRESET_CITIES[5]];
    } catch {
      return [PRESET_CITIES[0], PRESET_CITIES[1], PRESET_CITIES[2]];
    }
  });

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Salva favoritos
  useEffect(() => {
    try {
      localStorage.setItem('wikizero_weather_favorites', JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  // Carrega previsão para a cidade selecionada
  const fetchWeather = async (cityItem: typeof PRESET_CITIES[0]) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${cityItem.lat}&longitude=${cityItem.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max&timezone=auto`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Falha ao consultar servidor meteorológico (${res.status})`);
      const data = await res.json();

      // Monta objeto estruturado
      const dailyList = (data.daily?.time || []).map((dateStr: string, idx: number) => ({
        date: dateStr,
        weatherCode: data.daily.weather_code[idx] ?? 0,
        tempMax: data.daily.temperature_2m_max[idx] ?? 0,
        tempMin: data.daily.temperature_2m_min[idx] ?? 0,
        precipProbMax: data.daily.precipitation_probability_max?.[idx] ?? 0,
        precipSum: data.daily.precipitation_sum?.[idx] ?? 0,
        uvIndexMax: data.daily.uv_index_max?.[idx] ?? 0,
        windSpeedMax: data.daily.wind_speed_10m_max?.[idx] ?? 0,
        sunrise: data.daily.sunrise?.[idx] ?? '',
        sunset: data.daily.sunset?.[idx] ?? '',
      }));

      // Próximas 24 horas a partir do horário atual
      const nowIso = new Date().toISOString();
      const hourlyTimes: string[] = data.hourly?.time || [];
      let startIndex = hourlyTimes.findIndex((t) => new Date(t).getTime() >= new Date().getTime() - 3600000);
      if (startIndex < 0) startIndex = 0;
      const hourlySlice = hourlyTimes.slice(startIndex, startIndex + 24).map((t, relIdx) => {
        const idx = startIndex + relIdx;
        const d = new Date(t);
        const hNum = d.getHours();
        return {
          time: t,
          temperature: data.hourly.temperature_2m[idx] ?? 0,
          weatherCode: data.hourly.weather_code[idx] ?? 0,
          precipProb: data.hourly.precipitation_probability[idx] ?? 0,
          humidity: data.hourly.relative_humidity_2m[idx] ?? 0,
          windSpeed: data.hourly.wind_speed_10m[idx] ?? 0,
          isDay: hNum >= 6 && hNum < 18 ? 1 : 0,
        };
      });

      setWeatherData({
        city: cityItem.name,
        admin1: cityItem.admin1,
        country: cityItem.country,
        latitude: cityItem.lat,
        longitude: cityItem.lon,
        timezone: data.timezone || 'auto',
        current: {
          time: data.current.time,
          temperature: data.current.temperature_2m,
          feelsLike: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m,
          precipitation: data.current.precipitation,
          rain: data.current.rain,
          weatherCode: data.current.weather_code,
          cloudCover: data.current.cloud_cover,
          pressure: data.current.pressure_msl,
          windSpeed: data.current.wind_speed_10m,
          windDirection: data.current.wind_direction_10m,
          uvIndex: data.current.uv_index ?? 0,
          isDay: data.current.is_day,
        },
        daily: dailyList,
        hourly: hourlySlice,
      });
    } catch (err: any) {
      console.warn('Weather fetch error, using fallback:', err);
      setErrorMsg('Não foi possível obter dados ao vivo da estação meteorológica. Exibindo estimativa climática local.');
      setWeatherData(getFallbackWeather(cityItem.name, cityItem.admin1, cityItem.country, cityItem.lat, cityItem.lon));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(selectedCity);
  }, [selectedCity]);

  // Busca de cidades via Open-Meteo Geocoding API
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!val.trim() || val.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          val.trim()
        )}&count=6&language=pt&format=json`;
        const res = await fetch(geoUrl);
        if (res.ok) {
          const data = await res.json();
          if (data && data.results) {
            setSearchResults(data.results);
          } else {
            setSearchResults([]);
          }
        }
      } catch (err) {
        console.warn('Geocoding search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectSearchResult = (resItem: any) => {
    const newCity = {
      name: resItem.name,
      admin1: resItem.admin1 || resItem.country,
      country: resItem.country || '',
      lat: resItem.latitude,
      lon: resItem.longitude,
    };
    setSelectedCity(newCity);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Geolocalização pelo navegador
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          // Tenta obter nome da localidade
          const revUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${lat.toFixed(2)},${lon.toFixed(
            2
          )}&count=1&language=pt&format=json`;
          // Se falhar ou não achar, usa Localização Atual
          const userCity = {
            name: 'Minha Localização',
            admin1: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
            country: 'Coordenadas GPS',
            lat,
            lon,
          };
          setSelectedCity(userCity);
        } catch {
          setSelectedCity({
            name: 'Localização Atual',
            admin1: 'GPS',
            country: 'Brasil',
            lat,
            lon,
          });
        }
      },
      (err) => {
        setLoading(false);
        alert('Permissão de geolocalização negada ou não disponível.');
      }
    );
  };

  // Favoritar / Desfavoritar
  const isFavorite = favorites.some(
    (f) => Math.abs(f.lat - selectedCity.lat) < 0.05 && Math.abs(f.lon - selectedCity.lon) < 0.05
  );

  const toggleFavorite = () => {
    if (isFavorite) {
      setFavorites(
        favorites.filter(
          (f) => !(Math.abs(f.lat - selectedCity.lat) < 0.05 && Math.abs(f.lon - selectedCity.lon) < 0.05)
        )
      );
    } else {
      setFavorites([selectedCity, ...favorites].slice(0, 10));
    }
  };

  // Conversor de unidades
  const formatTemp = (celsius: number) => {
    if (unit === 'F') {
      const f = (celsius * 9) / 5 + 32;
      return `${Math.round(f)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  const formatWind = (kmh: number) => {
    if (unit === 'F') {
      const mph = kmh * 0.621371;
      return `${Math.round(mph)} mph`;
    }
    return `${Math.round(kmh)} km/h`;
  };

  // Helper para renderizar ícone meteorológico
  const renderWeatherIcon = (iconType: string, size = 24, className = '') => {
    switch (iconType) {
      case 'sun':
        return <Sun size={size} className={`text-amber-500 ${className}`} />;
      case 'cloud-sun':
        return <CloudSun size={size} className={`text-sky-500 ${className}`} />;
      case 'cloud':
        return <Cloud size={size} className={`text-slate-400 ${className}`} />;
      case 'rain':
        return <CloudRain size={size} className={`text-blue-500 ${className}`} />;
      case 'lightning':
        return <CloudLightning size={size} className={`text-purple-500 ${className}`} />;
      case 'snow':
        return <CloudSnow size={size} className={`text-cyan-400 ${className}`} />;
      case 'fog':
        return <CloudFog size={size} className={`text-slate-400 ${className}`} />;
      default:
        return <Sun size={size} className={`text-amber-500 ${className}`} />;
    }
  };

  const currentWeatherInterp = weatherData
    ? getWeatherInterpretation(weatherData.current.weatherCode, weatherData.current.isDay)
    : null;

  // Direção do vento em texto
  const getWindDirectionLabel = (deg: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'L', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
    const idx = Math.round(deg / 22.5) % 16;
    return directions[idx];
  };

  // Classificação do índice UV
  const getUVLevel = (uv: number) => {
    if (uv <= 2) return { label: 'Baixo', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' };
    if (uv <= 5) return { label: 'Moderado', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' };
    if (uv <= 7) return { label: 'Alto', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/60' };
    if (uv <= 10) return { label: 'Muito Alto', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' };
    return { label: 'Extremo', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60' };
  };

  return (
    <div className="space-y-6">
      {/* Header Info Extension Banner */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <CloudSun className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Previsão do Tempo e Meteorologia ao Vivo
          </h3>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
            Extensão de Ferramenta (WikiWeatherForecastTool)
          </span>
        </div>
      </div>

      {/* Barra Superior: Busca, Favoritos e Alternância de Unidade */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Caixa de Busca com Autocomplete */}
          <div className="relative flex-1">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Buscar qualquer cidade do mundo (ex: São Paulo, Lisboa, Tóquio, Curitiba)..."
                className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <button
                onClick={handleUseMyLocation}
                title="Usar minha localização GPS atual"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition flex items-center gap-1 cursor-pointer"
              >
                <MapPin size={13} />
                <span className="hidden sm:inline">Meu GPS</span>
              </button>
            </div>

            {/* Menu Dropdown de Resultados da Busca */}
            {searchResults.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {searchResults.map((item, idx) => (
                  <button
                    key={`${item.latitude}-${item.longitude}-${idx}`}
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin size={16} className="text-blue-500 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {[item.admin1, item.country].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Controles: Atualizar, Favoritar e Seletor °C/°F */}
          <div className="flex items-center gap-2 justify-between sm:justify-start">
            {/* Botão de Favoritar Cidade */}
            <button
              onClick={toggleFavorite}
              title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              className={`p-2.5 rounded-2xl border transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                isFavorite
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
              <span className="hidden sm:inline">{isFavorite ? 'Favorita' : 'Salvar'}</span>
            </button>

            {/* Recarregar */}
            <button
              onClick={() => fetchWeather(selectedCity)}
              disabled={loading}
              title="Recarregar dados meteorológicos"
              className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-blue-500' : ''} />
            </button>

            {/* Toggle °C / °F */}
            <div className="flex items-center p-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-bold">
              <button
                onClick={() => setUnit('C')}
                className={`px-3 py-1 rounded-xl transition ${
                  unit === 'C'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                °C
              </button>
              <button
                onClick={() => setUnit('F')}
                className={`px-3 py-1 rounded-xl transition ${
                  unit === 'F'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                °F
              </button>
            </div>
          </div>
        </div>

        {/* Cidades em Destaque / Favoritas Rápidas */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Star size={12} className="text-amber-500" /> Cidades:
          </span>
          {favorites.map((city) => {
            const isCurr =
              Math.abs(city.lat - selectedCity.lat) < 0.05 && Math.abs(city.lon - selectedCity.lon) < 0.05;
            return (
              <button
                key={`${city.name}-${city.lat}`}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1 text-xs font-semibold rounded-xl whitespace-nowrap transition cursor-pointer ${
                  isCurr
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {city.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Aviso de erro ou fallback se houver */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Carregando Skeleton */}
      {loading && !weatherData && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <RefreshCw size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
          <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Consultando radares meteorológicos globais...
          </div>
          <div className="text-xs text-slate-400 mt-1">Obtendo temperatura, umidade e previsão para {selectedCity.name}</div>
        </div>
      )}

      {/* Cartão Principal do Clima Atual */}
      {weatherData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna da Esquerda: Resumo Atual em Grande Destaque */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 via-sky-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
            {/* Decorações sutis de fundo */}
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-8 bottom-4 opacity-15 pointer-events-none">
              {currentWeatherInterp && renderWeatherIcon(currentWeatherInterp.icon, 180, 'text-white')}
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-sky-200" />
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {weatherData.city}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs font-semibold text-white">
                    {[weatherData.admin1, weatherData.country].filter(Boolean).join(', ')}
                  </span>
                </div>
                <div className="text-xs font-mono bg-black/20 px-3 py-1 rounded-full text-sky-100 flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>Atualizado às {new Date(weatherData.current.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Temperatura Principal e Condição */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 my-6">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl sm:text-7xl font-extrabold tracking-tighter">
                      {formatTemp(weatherData.current.temperature)}
                    </span>
                    <span className="text-lg sm:text-xl font-medium text-sky-200">
                      Sensação {formatTemp(weatherData.current.feelsLike)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-white">
                      {currentWeatherInterp?.label}
                    </span>
                    <span className="text-xs text-sky-200">
                      • {currentWeatherInterp?.description}
                    </span>
                  </div>
                </div>

                {/* Min / Max de Hoje */}
                {weatherData.daily[0] && (
                  <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex sm:flex-col justify-around gap-4 text-center">
                    <div>
                      <div className="text-[10px] text-sky-200 uppercase font-semibold">Máxima Hoje</div>
                      <div className="text-xl font-bold text-amber-300">
                        {formatTemp(weatherData.daily[0].tempMax)}
                      </div>
                    </div>
                    <div className="h-full w-px bg-white/20 sm:w-full sm:h-px" />
                    <div>
                      <div className="text-[10px] text-sky-200 uppercase font-semibold">Mínima Hoje</div>
                      <div className="text-xl font-bold text-sky-100">
                        {formatTemp(weatherData.daily[0].tempMin)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Grade de Métricas Atmosféricas em Tempo Real */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20">
                <div className="bg-black/15 rounded-2xl p-3 border border-white/10 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/15 text-white">
                    <Droplets size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] text-sky-200 uppercase font-semibold">Umidade</div>
                    <div className="text-base font-bold">{weatherData.current.humidity}%</div>
                  </div>
                </div>

                <div className="bg-black/15 rounded-2xl p-3 border border-white/10 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/15 text-white">
                    <Wind size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] text-sky-200 uppercase font-semibold">Vento</div>
                    <div className="text-base font-bold">
                      {formatWind(weatherData.current.windSpeed)}{' '}
                      <span className="text-[11px] font-normal text-sky-200">
                        ({getWindDirectionLabel(weatherData.current.windDirection)})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/15 rounded-2xl p-3 border border-white/10 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/15 text-white">
                    <Umbrella size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] text-sky-200 uppercase font-semibold">Chuva Hoje</div>
                    <div className="text-base font-bold">
                      {weatherData.daily[0]?.precipProbMax ?? 0}%{' '}
                      <span className="text-[11px] font-normal text-sky-200">
                        ({weatherData.daily[0]?.precipSum ?? 0} mm)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/15 rounded-2xl p-3 border border-white/10 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/15 text-white">
                    <Sun size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] text-sky-200 uppercase font-semibold">Índice UV</div>
                    <div className="text-base font-bold">
                      {weatherData.current.uvIndex.toFixed(1)}{' '}
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/20">
                        {getUVLevel(weatherData.current.uvIndex).label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna da Direita: Sol, Pressão, Nuvens e Dicas Meteorológicas */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Gauge size={16} className="text-blue-500" />
                <span>Indicadores do Dia</span>
              </h3>

              <div className="space-y-4">
                {/* Nascer e Pôr do Sol */}
                {weatherData.daily[0] && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-around">
                    <div className="flex items-center gap-2.5">
                      <Sunrise size={20} className="text-amber-500" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Nascer do Sol</div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {weatherData.daily[0].sunrise ? new Date(weatherData.daily[0].sunrise).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-2.5">
                      <Sunset size={20} className="text-orange-500" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Pôr do Sol</div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {weatherData.daily[0].sunset ? new Date(weatherData.daily[0].sunset).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pressão Barométrica */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Compass size={15} className="text-indigo-500" />
                    <span>Pressão Atmosférica:</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {Math.round(weatherData.current.pressure)} hPa
                  </span>
                </div>

                {/* Cobertura de Nuvens */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Cloud size={15} className="text-sky-500" />
                    <span>Cobertura de Nuvens:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {weatherData.current.cloudCover}%
                  </span>
                </div>

                {/* Recomendação de Proteção UV */}
                <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-950 dark:text-blue-200">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <Sun size={14} className="text-amber-500" />
                    <span>Guia de Exposição Solar</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {weatherData.current.uvIndex >= 6
                      ? 'Índice UV elevado. Recomenda-se uso de protetor solar FPS 30+, óculos escuros e evitar exposição direta entre 10h e 16h.'
                      : weatherData.current.uvIndex >= 3
                      ? 'Índice UV moderado. É recomendado aplicar protetor solar se for permanecer por longos períodos sob a luz solar direta.'
                      : 'Índice UV baixo. Condições ideais e seguras para atividades ao ar livre sem necessidade de proteção solar extrema.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>Fonte: Open-Meteo & ECMWF / INMET</span>
              <span className="font-mono">{weatherData.latitude.toFixed(2)}°, {weatherData.longitude.toFixed(2)}°</span>
            </div>
          </div>
        </div>
      )}

      {/* Previsão Horária: Linha do Tempo das Próximas 24 Horas */}
      {weatherData && weatherData.hourly && weatherData.hourly.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              <span>Previsão Horária (Próximas 24 Horas)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Arraste para o lado →</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin">
            {weatherData.hourly.map((hour, idx) => {
              const d = new Date(hour.time);
              const isNow = idx === 0;
              const interp = getWeatherInterpretation(hour.weatherCode, hour.isDay);

              return (
                <div
                  key={hour.time}
                  className={`flex flex-col items-center justify-between p-3.5 rounded-2xl min-w-[88px] border transition ${
                    isNow
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-950 dark:text-blue-200 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xs font-semibold">
                    {isNow ? 'Agora' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <div className="my-2.5">
                    {renderWeatherIcon(interp.icon, 24)}
                  </div>

                  <span className="text-sm font-bold mb-1">
                    {formatTemp(hour.temperature)}
                  </span>

                  {hour.precipProb > 0 ? (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-0.5 font-bold">
                      <Droplets size={10} />
                      {hour.precipProb}%
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">-</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Previsão Estendida para os Próximos 7 Dias */}
      {weatherData && weatherData.daily && weatherData.daily.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              <span>Previsão Estendida para 7 Dias</span>
            </h3>
            <span className="text-[11px] text-slate-400">Tendência Semanal</span>
          </div>

          <div className="space-y-2.5">
            {weatherData.daily.map((day, idx) => {
              const d = new Date(day.date + 'T12:00:00');
              const isToday = idx === 0;
              const weekday = isToday
                ? 'Hoje'
                : d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
              const interp = getWeatherInterpretation(day.weatherCode, 1);

              return (
                <div
                  key={day.date}
                  className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isToday
                      ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/80 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                  }`}
                >
                  {/* Dia e Condição */}
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-2xs shrink-0">
                      {renderWeatherIcon(interp.icon, 22)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                        {weekday}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {interp.label}
                      </div>
                    </div>
                  </div>

                  {/* Probabilidade de Precipitação */}
                  <div className="flex items-center gap-2 text-xs min-w-[130px]">
                    {day.precipProbMax > 0 ? (
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold">
                        <Droplets size={13} />
                        <span>{day.precipProbMax}% de chuva</span>
                        {day.precipSum > 0 && (
                          <span className="text-[10px] text-slate-400">({day.precipSum}mm)</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Sem chuva prevista</span>
                    )}
                  </div>

                  {/* Barra Visual de Variação de Temperatura */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400 w-12 text-right">
                      {formatTemp(day.tempMin)}
                    </span>
                    <div className="w-24 sm:w-36 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500"
                        style={{
                          marginLeft: `${Math.max(0, Math.min(60, (day.tempMin - 5) * 2))}%`,
                          width: `${Math.max(20, Math.min(80, (day.tempMax - day.tempMin) * 5))}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 w-12">
                      {formatTemp(day.tempMax)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Glossário e Dicas Enciclopédicas de Meteorologia */}
      <div className="bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <Info size={14} className="text-blue-500" />
          <span>Conceitos de Meteorologia Enciclopédica</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-white mb-1">Sensação Térmica</div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Combina a temperatura real medida pelos termômetros com a umidade relativa do ar e a velocidade do vento na pele humana.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-white mb-1">Pressão Atmosférica</div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              O peso que a coluna de ar exerce sobre a superfície. Quedas repentinas de pressão barométrica geralmente indicam aproximação de frentes frias e tempestades.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-white mb-1">Índice Ultravioleta (UV)</div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Escala de risco de queimaduras solares recomendada pela Organização Mundial da Saúde (OMS). Varia de 0 a 11+.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
