/**
 * 位置情報関連ユーティリティ
 */

/**
 * Nominatim逆ジオコーディングAPI（OpenStreetMap）
 * 緯度経度から郵便番号を取得する
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{ postalCode: string | null; address: string | null }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "TripVote/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    const address = data.address;
    const postalCode = address?.postcode || null;
    const displayName = data.display_name || null;

    return { postalCode, address: displayName };
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return { postalCode: null, address: null };
  }
}

/**
 * ブラウザのGeolocation APIで現在位置を取得
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

/**
 * 現在位置を取得して郵便番号に変換
 */
export async function getCurrentLocationAsPostalCode(): Promise<{
  postalCode: string | null;
  coordinates: string;
  address: string | null;
}> {
  const position = await getCurrentPosition();
  const { latitude, longitude } = position.coords;
  const coordinates = `${latitude}, ${longitude}`;

  const { postalCode, address } = await reverseGeocode(latitude, longitude);

  return {
    postalCode,
    coordinates,
    address,
  };
}
