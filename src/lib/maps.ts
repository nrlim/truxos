/**
 * Generate a Google Maps directions URL from origin/destination coordinate strings.
 * Coordinate strings are JSON like: {"lat": -6.2, "lng": 106.8}
 * Returns null if coordinates are invalid/missing.
 */
export function getGoogleMapsUrl(
    originCoords?: string | null,
    destinationCoords?: string | null
): string | null {
    try {
        if (!originCoords || !destinationCoords) return null;

        const org = JSON.parse(originCoords);
        const dst = JSON.parse(destinationCoords);

        if (!org.lat || !org.lng || !dst.lat || !dst.lng) return null;

        return `https://www.google.com/maps/dir/?api=1&origin=${org.lat},${org.lng}&destination=${dst.lat},${dst.lng}&travelmode=driving`;
    } catch {
        return null;
    }
}
