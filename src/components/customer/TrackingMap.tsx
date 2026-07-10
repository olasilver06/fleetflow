"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LatLng = { lat: number; lng: number };

function dotIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid #111827;box-shadow:0 0 0 2px rgba(255,255,255,0.25);"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const PICKUP_ICON = dotIcon("#2F6FED");
const DROPOFF_ICON = dotIcon("#FF7A32");
const RIDER_ICON = dotIcon("#2ECC71");

export default function TrackingMap({
  pickup,
  dropoff,
  isInTransit,
  riderId,
  riderName,
  initialRiderPosition,
}: {
  pickup: LatLng;
  dropoff: LatLng;
  isInTransit: boolean;
  riderId: string | null;
  riderName: string | null;
  initialRiderPosition: LatLng | null;
}) {
  const [riderPosition, setRiderPosition] = useState<LatLng | null>(initialRiderPosition);

  useEffect(() => {
    if (!isInTransit || !riderId) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`rider-location-${riderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "RiderLocation",
          filter: `riderId=eq.${riderId}`,
        },
        (payload) => {
          const row = payload.new as { lat: number; lng: number };
          setRiderPosition({ lat: row.lat, lng: row.lng });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isInTransit, riderId]);

  const bounds: [[number, number], [number, number]] = [
    [pickup.lat, pickup.lng],
    [dropoff.lat, dropoff.lng],
  ];

  return (
    <div>
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [40, 40] }}
        className="h-96 w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[pickup.lat, pickup.lng]} icon={PICKUP_ICON}>
          <Popup>Pickup</Popup>
        </Marker>
        <Marker position={[dropoff.lat, dropoff.lng]} icon={DROPOFF_ICON}>
          <Popup>Drop-off</Popup>
        </Marker>
        <Polyline
          positions={bounds}
          pathOptions={{ color: "#2F6FED", dashArray: "6 8", weight: 2 }}
        />
        {isInTransit && riderPosition && (
          <Marker position={[riderPosition.lat, riderPosition.lng]} icon={RIDER_ICON}>
            <Popup>{riderName ?? "Rider"}</Popup>
          </Marker>
        )}
      </MapContainer>

      {isInTransit && (
        <div className="px-4 py-3 border-t border-border flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <p className="text-text-secondary text-xs">
            {riderPosition ? "Live tracking active" : "Waiting for rider's first location update…"}
          </p>
        </div>
      )}
    </div>
  );
}
