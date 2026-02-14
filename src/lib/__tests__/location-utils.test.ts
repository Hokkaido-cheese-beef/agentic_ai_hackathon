import { describe, it, expect, vi, beforeEach } from "vitest";
import { reverseGeocode, getCurrentPosition, getCurrentLocationAsPostalCode } from "../location-utils";

describe("location-utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("reverseGeocode", () => {
    it("should return postal code and address on success", async () => {
      const mockResponse = {
        address: {
          postcode: "150-0001",
          city: "Shibuya",
        },
        display_name: "Shibuya, Tokyo, Japan",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await reverseGeocode(35.6595, 139.7004);

      expect(result).toEqual({
        postalCode: "150-0001",
        address: "Shibuya, Tokyo, Japan",
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("nominatim.openstreetmap.org/reverse"),
        expect.objectContaining({
          headers: { "User-Agent": "TripVote/1.0" },
        })
      );
    });

    it("should return null values when postal code is missing", async () => {
      const mockResponse = {
        address: {},
        display_name: "Tokyo, Japan",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await reverseGeocode(35.6595, 139.7004);

      expect(result).toEqual({
        postalCode: null,
        address: "Tokyo, Japan",
      });
    });

    it("should handle API errors", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await reverseGeocode(35.6595, 139.7004);

      expect(result).toEqual({
        postalCode: null,
        address: null,
      });
    });

    it("should handle network errors", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await reverseGeocode(35.6595, 139.7004);

      expect(result).toEqual({
        postalCode: null,
        address: null,
      });
    });
  });

  describe("getCurrentPosition", () => {
    it("should resolve with position on success", async () => {
      const mockPosition = {
        coords: {
          latitude: 35.6595,
          longitude: 139.7004,
        },
      };

      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => {
          success(mockPosition);
        }),
      };

      Object.defineProperty(global.navigator, "geolocation", {
        writable: true,
        value: mockGeolocation,
      });

      const result = await getCurrentPosition();

      expect(result).toEqual(mockPosition);
    });

    it("should reject when geolocation is not supported", async () => {
      Object.defineProperty(global.navigator, "geolocation", {
        writable: true,
        value: undefined,
      });

      await expect(getCurrentPosition()).rejects.toThrow("Geolocation is not supported");
    });

    it("should reject on geolocation error", async () => {
      const mockError = new Error("Position unavailable");

      const mockGeolocation = {
        getCurrentPosition: vi.fn((_success, error) => {
          error(mockError);
        }),
      };

      Object.defineProperty(global.navigator, "geolocation", {
        writable: true,
        value: mockGeolocation,
      });

      await expect(getCurrentPosition()).rejects.toThrow("Position unavailable");
    });
  });

  describe("getCurrentLocationAsPostalCode", () => {
    it("should return postal code from current location", async () => {
      const mockPosition = {
        coords: {
          latitude: 35.6595,
          longitude: 139.7004,
        },
      };

      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => {
          success(mockPosition);
        }),
      };

      Object.defineProperty(global.navigator, "geolocation", {
        writable: true,
        value: mockGeolocation,
      });

      const mockResponse = {
        address: {
          postcode: "150-0001",
        },
        display_name: "Shibuya, Tokyo, Japan",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getCurrentLocationAsPostalCode();

      expect(result).toEqual({
        postalCode: "150-0001",
        coordinates: "35.6595, 139.7004",
        address: "Shibuya, Tokyo, Japan",
      });
    });

    it("should return coordinates when postal code is unavailable", async () => {
      const mockPosition = {
        coords: {
          latitude: 35.6595,
          longitude: 139.7004,
        },
      };

      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => {
          success(mockPosition);
        }),
      };

      Object.defineProperty(global.navigator, "geolocation", {
        writable: true,
        value: mockGeolocation,
      });

      const mockResponse = {
        address: {},
        display_name: null,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getCurrentLocationAsPostalCode();

      expect(result).toEqual({
        postalCode: null,
        coordinates: "35.6595, 139.7004",
        address: null,
      });
    });
  });
});
