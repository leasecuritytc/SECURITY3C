import { getChatGPTUser, isAuthorizedAdmin } from "./chatgpt-auth";
import { PublicLanding } from "./public-landing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  return <PublicLanding canOpenDashboard={Boolean(user && isAuthorizedAdmin(user))} />;
}
