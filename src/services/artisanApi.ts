import { api, cachedFetch } from "./api";
import type { ApiResponse, PublicArtisan, ArtisanDetail } from "../types";

/**
 * GET /api/artisans/public
 * Fetch all public artisans (cache session - 1 lần/phiên)
 */
export const getPublicArtisans = async (): Promise<PublicArtisan[]> => {
  return cachedFetch("artisans:public", async () => {
    const res = await api.get<ApiResponse<PublicArtisan[]>>(
      "/api/artisans/public"
    );
    return res.data.data;
  });
};

/**
 * GET /api/artisans/public/{id}
 * Fetch a single public artisan by ID (cache session)
 */
export const getPublicArtisanById = async (
  id: number
): Promise<PublicArtisan> => {
  return cachedFetch(`artisan:public:${id}`, async () => {
    const res = await api.get<ApiResponse<PublicArtisan>>(
      `/api/artisans/public/${id}`
    );
    return res.data.data;
  });
};

/**
 * GET /api/artisans/public/{id}/detail
 * Fetch full artisan detail with narrative, related tours, culture items, etc. (cache session)
 */
export const getArtisanDetail = async (
  id: number
): Promise<ArtisanDetail> => {
  return cachedFetch(`artisan:detail:${id}`, async () => {
    const res = await api.get<ApiResponse<ArtisanDetail>>(
      `/api/artisans/public/${id}/detail`
    );
    return res.data.data;
  });
};
