import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface OrderMapProps {
  latitude: string;
  longitude: string;
  jurisdiction?: string;
  onMapClick: (lat: number, lng: number) => void;
}

// Component to handle map clicks and render marker
function MapContent({ latitude, longitude, jurisdiction, onMapClick }: OrderMapProps) {
  const isValid = latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude));
  
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  if (!isValid) {
    return null;
  }

  const position: [number, number] = [parseFloat(latitude), parseFloat(longitude)];

  return (
    <Marker position={position}>
      <Popup>
        <div className="text-sm">
          <div className="font-bold mb-1">Delivery Location</div>
          <div className="text-xs text-muted-foreground">
            {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
          </div>
          {jurisdiction && (
            <div className="text-xs mt-1">
              {jurisdiction}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export function OrderMap({ latitude, longitude, jurisdiction, onMapClick }: OrderMapProps) {
  const isValid = latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude));
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // NYC
  const center: [number, number] = isValid 
    ? [parseFloat(latitude), parseFloat(longitude)]
    : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={isValid ? 13 : 10}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      key={`${center[0]}-${center[1]}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapContent 
        latitude={latitude} 
        longitude={longitude} 
        jurisdiction={jurisdiction} 
        onMapClick={onMapClick} 
      />
    </MapContainer>
  );
}
