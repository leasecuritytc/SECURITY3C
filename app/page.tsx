import { getChatGPTUser, isAuthorizedAdmin } from "./chatgpt-auth";
import { PublicLanding } from "./public-landing";
import { getPublicSiteData } from "../lib/site-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [user, siteData] = await Promise.all([getChatGPTUser(), getPublicSiteData()]);
  return <PublicLanding canOpenDashboard={Boolean(user && isAuthorizedAdmin(user))} content={siteData.content} portfolio={siteData.portfolio} />;
}
