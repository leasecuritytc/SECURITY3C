import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { portfolioItems, siteContent } from "../db/schema";
import { defaultLandingContent, parseLandingContent, type LandingContent, type PublicPortfolioItem } from "./site-content-shared";
export { defaultLandingContent, parseLandingContent } from "./site-content-shared";
export type { LandingContent, PublicPortfolioItem } from "./site-content-shared";

export async function getPublicSiteData(): Promise<{ content: LandingContent; portfolio: PublicPortfolioItem[] }> {
  try {
    const db = getDb();
    const [contentRow, items] = await Promise.all([
      db.select().from(siteContent).where(eq(siteContent.id, "landing")).limit(1),
      db.select().from(portfolioItems).where(and(eq(portfolioItems.status, "Publicado"), isNull(portfolioItems.deletedAt))).orderBy(desc(portfolioItems.featured), asc(portfolioItems.sortOrder), desc(portfolioItems.updatedAt)).limit(30),
    ]);
    let content = defaultLandingContent;
    if (contentRow[0]?.contentJson) {
      try { content = parseLandingContent(JSON.parse(contentRow[0].contentJson)); } catch { content = defaultLandingContent; }
    }
    return {
      content,
      portfolio: items.map((item) => ({
        id: item.id,
        title: item.title,
        serviceType: item.serviceType,
        serviceMode: item.serviceMode,
        city: item.city,
        completedAt: item.completedAt,
        summary: item.summary,
        altText: item.altText,
        featured: item.featured,
        sortOrder: item.sortOrder,
        imageUrl: `/api/site-content/media?id=${encodeURIComponent(item.id)}`,
      })),
    };
  } catch {
    return { content: defaultLandingContent, portfolio: [] };
  }
}
