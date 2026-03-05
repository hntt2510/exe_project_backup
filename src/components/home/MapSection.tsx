import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCultureItemsByProvince, getProvinces } from '../../services/api';
import type { CultureItem, Province } from '../../types';
import { Loader2, MapPin, X } from 'lucide-react';
import '../../styles/components/mapSection.scss';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Marker dùng icon kiểu Ion "location-outline" (SVG inline)
const ionLocationIcon = L.divIcon({
  className: 'map-section__marker-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
  html: `
    <svg viewBox="0 0 512 512" width="28" height="28" aria-hidden="true" focusable="false">
      <path
        d="M256 48c-79.5 0-144 64.5-144 144 0 108.2 144 272 144 272s144-163.8 144-272c0-79.5-64.5-144-144-144zm0 208a64 64 0 1 1 0-128 64 64 0 0 1 0 128z"
        fill="none"
        stroke="#b91c1c"
        stroke-width="28"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
});

// Vietnamese flag icon for Hoàng Sa & Trường Sa (dùng ảnh cờ thật)
const vietnamFlagIcon = L.icon({
  iconUrl: '/geo/Flag_of_Vietnam.svg.png',
  iconSize: [80, 47],
  iconAnchor: [20, 13],
  popupAnchor: [0, -13],
  className: 'map-section__flag-icon',
});

// Sovereignty territories of Vietnam
const SOVEREIGNTY_TERRITORIES = [
  { lat: 16.132720, lng: 111.996356 },
  { lat: 9.530963, lng: 112.906921 },
];

const normalizeName = (name: string): string => {
  const withSpaces = name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');

  const base = withSpaces
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return base.replace(/^(tinh|thanh pho|tp)\s+/, '').trim();
};

const buildProvinceNameSet = (items: Province[]) => {
  const set = new Set<string>();
  items.forEach((p) => {
    if (p.name) set.add(normalizeName(p.name));
    if (p.slug) set.add(normalizeName(p.slug));
  });
  return set;
};

const buildProvinceMap = (items: Province[]) => {
  const map = new Map<string, Province>();
  items.forEach((p) => {
    if (p.name) map.set(normalizeName(p.name), p);
    if (p.slug) map.set(normalizeName(p.slug), p);
  });
  return map;
};

const markerImageBySlug: Record<string, string> = {
  kontum: '/geo/marker-kontum.png',
  gialai: '/geo/marker-gialai.png',
  lamdong: '/geo/marker-lamdong.jpg',
  daknong: '/geo/marker-daknong.jpg',
  daklak: '/geo/marker-daklak.jpg',
};

const getMarkerImageUrl = (province?: Province) => {
  if (!province) return undefined;
  const slugKey = province.slug ? normalizeName(province.slug) : '';
  const nameKey = province.name ? normalizeName(province.name) : '';
  return markerImageBySlug[slugKey] || markerImageBySlug[nameKey];
};

const createProvinceMarkerIcon = (province?: Province) => {
  const overrideImage = getMarkerImageUrl(province);
  const thumbnail = overrideImage || province?.thumbnailUrl;
  if (!thumbnail) return ionLocationIcon;

  return L.divIcon({
    className: 'map-section__marker-icon map-section__marker-icon--image',
    iconSize: [46, 46],
    iconAnchor: [23, 46],
    popupAnchor: [0, -46],
    html: `<span class="map-section__marker-image" style="background-image:url('${thumbnail}')"></span>`,
  });
};

const cultureItemsCache = new Map<number, CultureItem[]>();

function debounce<T extends (...args: any[]) => void>(fn: T, wait: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// === Base Map Definitions ===
const BASE_MAPS = [
  { id: 'esriSatellite', label: '🛰 Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; Esri', maxZoom: 19 },
  { id: 'osm', label: '🗺 OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 },
  { id: 'cartoLight', label: '☀️ Carto Light', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '&copy; CARTO', maxZoom: 20 },
  { id: 'cartoDark', label: '🌙 Carto Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: '&copy; CARTO', maxZoom: 20 },
  { id: 'stamenTerrain', label: '🏔 Terrain', url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png', attribution: '&copy; Stadia Maps &copy; Stamen', maxZoom: 18 },
  { id: 'stamenToner', label: '⬛ Toner', url: 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png', attribution: '&copy; Stadia Maps &copy; Stamen', maxZoom: 20 },
  { id: 'esriStreet', label: '🏙 Esri Street', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri', maxZoom: 18 },
  { id: 'esriTopo', label: '🗻 Esri Topo', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri', maxZoom: 18 },
];

export default function MapSection() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markerLayerRef = useRef<L.FeatureGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const provinceNameToIdRef = useRef<Map<string, number>>(new Map());
  const provinceIdToNameRef = useRef<Map<number, string>>(new Map());

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [hoveredProvinceId, setHoveredProvinceId] = useState<number | null>(null);
  const [cultureItems, setCultureItems] = useState<CultureItem[]>([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [geoJsonData, setGeoJsonData] = useState<any | null>(null);
  const [activeBaseMap, setActiveBaseMap] = useState('esriSatellite');

  const activeProvinceId = selectedProvinceId ?? hoveredProvinceId;

  const activeProvinceName = useMemo(() => {
    if (!activeProvinceId) return '';
    return provinceIdToNameRef.current.get(activeProvinceId) || '';
  }, [activeProvinceId]);

  const provinceNameSet = useMemo(() => buildProvinceNameSet(provinces), [provinces]);
  const provinceByName = useMemo(() => buildProvinceMap(provinces), [provinces]);

  // Load provinces for mapping (name -> id)
  useEffect(() => {
    let mounted = true;
    getProvinces()
      .then((data) => {
        if (!mounted) return;
        setProvinces(data);

        const nameToId = new Map<string, number>();
        const idToName = new Map<number, string>();

        data.forEach((p) => {
          nameToId.set(normalizeName(p.name), p.id);
          idToName.set(p.id, p.name);
        });

        provinceNameToIdRef.current = nameToId;
        provinceIdToNameRef.current = idToName;
      })
      .catch(() => {
        // Không block map, chỉ khiến panel không map được provinceId
      });

    return () => {
      mounted = false;
    };
  }, []);

  const fetchCultureItems = useCallback(async (provinceId: number) => {
    setPanelError(null);
    setPanelLoading(true);

    if (cultureItemsCache.has(provinceId)) {
      setCultureItems(cultureItemsCache.get(provinceId)!);
      setPanelLoading(false);
      return;
    }

    try {
      const items = await getCultureItemsByProvince(provinceId);
      cultureItemsCache.set(provinceId, items);
      setCultureItems(items);
    } catch (e) {
      setCultureItems([]);
      setPanelError('Không thể tải dữ liệu văn hoá');
    } finally {
      setPanelLoading(false);
    }
  }, []);

  const debouncedHoverFetch = useMemo(() => debounce(fetchCultureItems, 200), [fetchCultureItems]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Fix case layout chưa ổn định khiến tile bị “co nhỏ”
    const ro = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    ro.observe(mapRef.current);

    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      try {
        // Center vùng Tây Nguyên (xem rõ 5 tỉnh)
        const center: [number, number] = [13.4, 108.0];

        // Create map
        const map = L.map(mapRef.current, {
          center,
          zoom: 7,
          zoomControl: true,
          minZoom: 5,
          maxZoom: 18,
        });

        // Base tile layer (default: Esri Satellite)
        const defaultMap = BASE_MAPS.find(m => m.id === 'esriSatellite')!;
        const tileLayer = L.tileLayer(defaultMap.url, { attribution: defaultMap.attribution, maxZoom: defaultMap.maxZoom });
        tileLayer.addTo(map);
        tileLayerRef.current = tileLayer;

        mapInstanceRef.current = map;

        // Debug: click vào map để lấy tọa độ
        map.on('click', function (e: L.LeafletMouseEvent) {
          console.log('Lat:', e.latlng.lat);
          console.log('Lng:', e.latlng.lng);
        });

        // Invalidate size để đảm bảo map render đúng
        setTimeout(() => {
          map.invalidateSize();
        }, 100);

        setIsMapLoaded(true);

        // Load GeoJSON sau khi map đã hiển thị (ưu tiên file “chuẩn” của bạn)
        setTimeout(() => {
          const geoJsonUrlCandidates = ['/geo/geo-vietnam.geojson', '/geo/vietnam.geojson'];

          const loadFirstAvailableGeoJson = async () => {
            let lastError: unknown = null;

            for (const url of geoJsonUrlCandidates) {
              try {
                const response = await fetch(url);
                const text = await response.text();

                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                  throw new Error(`File GeoJSON không tồn tại: ${url}`);
                }
                if (!response.ok) {
                  throw new Error(`Không thể tải file GeoJSON: ${response.status} ${response.statusText}`);
                }
                return JSON.parse(text);
              } catch (e) {
                lastError = e;
              }
            }

            throw lastError || new Error('Không thể tải GeoJSON từ các đường dẫn đã thử.');
          };

          loadFirstAvailableGeoJson()
            .then((data) => {
              setGeoJsonData(data);
            })
            .catch((err) => {
              console.error('Failed to load GeoJSON:', err);
              setMapError(
                err.message ||
                'Không thể tải dữ liệu bản đồ. Vui lòng đặt file geo-vietnam.geojson hoặc vietnam.geojson vào thư mục public/geo/'
              );
            });
        }, 300);
      } catch (err) {
        console.error('Failed to initialize map:', err);
        setMapError('Không thể khởi tạo bản đồ. Vui lòng thử lại.');
        setIsMapLoaded(true);
      }
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      ro.disconnect();
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        mapInstanceRef.current = null;
      }
      if (tileLayerRef.current) {
        tileLayerRef.current = null;
      }
      if (geoJsonLayerRef.current) {
        try {
          geoJsonLayerRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        geoJsonLayerRef.current = null;
      }
      if (markerLayerRef.current) {
        try {
          markerLayerRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        markerLayerRef.current = null;
      }
    };
  }, [debouncedHoverFetch, fetchCultureItems]);

  // Handler switch base map
  const handleBaseMapChange = useCallback((mapId: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const config = BASE_MAPS.find(m => m.id === mapId);
    if (!config) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const newTile = L.tileLayer(config.url, { attribution: config.attribution, maxZoom: config.maxZoom });
    newTile.addTo(map);
    // Đưa tile xuống dưới cùng (dưới markers)
    newTile.bringToBack();
    tileLayerRef.current = newTile;
    setActiveBaseMap(mapId);
  }, []);

  const renderProvinceMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !geoJsonData || provinceNameSet.size === 0) return;

    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.remove();
      geoJsonLayerRef.current = null;
    }
    if (markerLayerRef.current) {
      markerLayerRef.current.remove();
      markerLayerRef.current = null;
    }

    const markerLayer = L.featureGroup();
    const geoJsonLayer = L.geoJSON(geoJsonData as any, {
      // Ẩn polygon, chỉ dùng để lấy bounds tính vị trí marker
      style: () => ({
        fillOpacity: 0,
        color: 'transparent',
        weight: 0,
        opacity: 0,
      }),
      onEachFeature: (feature: any, layer: L.Layer) => {
        const props = feature?.properties || {};
        const rawName = props.NAME_1 || props.name || props.NAME || 'Unknown';
        const normalized = normalizeName(String(rawName));

        if (!provinceNameSet.has(normalized)) return;

        const provinceId = provinceNameToIdRef.current.get(normalized);
        if (!provinceId || !mapInstanceRef.current) return;

        let centerPoint: L.LatLng | null = null;
        const anyLayer = layer as any;
        if (anyLayer.getBounds) {
          centerPoint = anyLayer.getBounds().getCenter();
        }
        if (!centerPoint) return;

        const province = provinceByName.get(normalized);
        const icon = createProvinceMarkerIcon(province);
        const marker = L.marker(centerPoint, { icon }).addTo(markerLayer);

        marker.bindTooltip(String(rawName) || 'Unknown', {
          permanent: false,
          direction: 'top',
          className: 'province-tooltip',
        });

        marker.on('mouseover', () => {
          if (selectedProvinceId) return;
          setHoveredProvinceId(provinceId);
          debouncedHoverFetch(provinceId);
          marker.setZIndexOffset(1000);
        });

        marker.on('mouseout', () => {
          if (selectedProvinceId) return;
          setHoveredProvinceId(null);
          marker.setZIndexOffset(0);
        });

        marker.on('click', () => {
          setSelectedProvinceId(provinceId);
          setHoveredProvinceId(null);
          fetchCultureItems(provinceId);
          marker.setZIndexOffset(1500);
        });
      },
    });

    // Add Vietnamese flag markers for Hoàng Sa & Trường Sa
    SOVEREIGNTY_TERRITORIES.forEach(({ lat, lng }) => {
      L.marker([lat, lng], { icon: vietnamFlagIcon, interactive: false }).addTo(markerLayer);
    });

    geoJsonLayer.addTo(mapInstanceRef.current);
    markerLayer.addTo(mapInstanceRef.current);
    geoJsonLayerRef.current = geoJsonLayer;
    markerLayerRef.current = markerLayer;

    const bounds = markerLayer.getBounds();
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [40, 40],
      });
    }

    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 100);
  }, [geoJsonData, provinceNameSet, debouncedHoverFetch, fetchCultureItems, selectedProvinceId]);

  useEffect(() => {
    renderProvinceMarkers();
  }, [renderProvinceMarkers]);

  // Khi click lock tỉnh, panel luôn hiển thị theo selectedProvinceId
  useEffect(() => {
    if (selectedProvinceId) {
      fetchCultureItems(selectedProvinceId);
    }
  }, [fetchCultureItems, selectedProvinceId]);

  return (
    <section className="map-section">
      <div className="map-section__container">
        <h2 className="map-section__title">BẢN ĐỒ TÂY NGUYÊN</h2>
        <p className="map-section__subtitle">
          {provinces.length > 0
            ? `Hover hoặc click vào ${provinces.length} tỉnh thành để xem danh sách văn hoá`
            : 'Hover hoặc click vào tỉnh thành để xem danh sách văn hoá'}
        </p>

        <div className="map-section__content">
          <div className="map-section__map-wrapper">
            {mapError && (
              <div className="map-section__error">
                <p>{mapError}</p>
              </div>
            )}

            {/* Base Map Switcher */}
            <div className="map-section__basemap-switcher">
              {BASE_MAPS.map((bm) => (
                <button
                  key={bm.id}
                  className={`map-section__basemap-btn${activeBaseMap === bm.id ? ' map-section__basemap-btn--active' : ''}`}
                  onClick={() => handleBaseMapChange(bm.id)}
                  title={bm.label}
                >
                  {bm.label}
                </button>
              ))}
            </div>

            <div ref={mapRef} className="map-section__map" />
            {!isMapLoaded && (
              <div className="map-section__loading">
                <Loader2 className="map-section__spinner" />
                <p>Đang tải bản đồ...</p>
              </div>
            )}
          </div>

          {/* Panel bên phải (desktop) */}
          <div className="map-section__panel">
            <div className="map-section__panel-header">
              <h3 className="map-section__panel-title">
                {activeProvinceId ? `Văn hoá ${activeProvinceName || ''}` : 'Văn hoá Tây Nguyên'}
              </h3>

              {selectedProvinceId && (
                <button
                  className="map-section__panel-close"
                  onClick={() => {
                    setSelectedProvinceId(null);
                    setCultureItems([]);
                    setPanelError(null);
                    setPanelLoading(false);
                  }}
                  aria-label="Bỏ chọn tỉnh"
                  title="Bỏ chọn"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="map-section__panel-content">
              {!activeProvinceId ? (
                <div className="map-section__panel-empty">
                  <MapPin size={48} className="map-section__panel-empty-icon" />
                  <p>Hover hoặc click vào tỉnh để xem văn hoá</p>
                </div>
              ) : panelLoading ? (
                <div className="map-section__panel-loading">
                  <Loader2 className="map-section__spinner" />
                  <p>Đang tải...</p>
                </div>
              ) : panelError ? (
                <div className="map-section__panel-error">
                  <p>{panelError}</p>
                </div>
              ) : cultureItems.length === 0 ? (
                <div className="map-section__panel-empty">
                  <p>Chưa có dữ liệu văn hoá</p>
                </div>
              ) : (
                <div className="map-section__panel-list">
                  {cultureItems.map((item) => (
                    <div key={item.id} className="map-section__panel-item">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="map-section__panel-item-image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="map-section__panel-item-image map-section__panel-item-image--placeholder" />
                      )}
                      <div className="map-section__panel-item-content">
                        <div className="map-section__panel-item-title">{item.title}</div>
                        <div className="map-section__panel-item-description">{item.description}</div>
                        <div className="map-section__panel-item-category">{item.category}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}