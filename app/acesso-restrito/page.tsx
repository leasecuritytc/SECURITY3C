import type { Metadata } from "next";
import Link from "next/link";
import { SecurityDashboardV2 } from "../security-dashboard-v2";
import { chatGPTSignOutPath, isAuthorizedAdmin, requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Área restrita",
  description: "Gestão comercial, técnica e financeira da Security3C.",
};

export default async function RestrictedArea() {
  const user = await requireChatGPTUser("/acesso-restrito");

  if (!isAuthorizedAdmin(user)) {
    return (
      <main className="access-state">
        <section className="access-state-card">
          <img src="/securitytc-logo.png" alt="Security3C Soluções Inteligentes" />
          <span className="access-kicker">Área restrita</span>
          <h1>Esta conta não possui acesso</h1>
          <p>Entre com a conta administrativa autorizada para abrir o painel da Security3C.</p>
          <div className="access-state-actions">
            <a className="landing-button landing-button-primary" href={chatGPTSignOutPath("/login")} target="_top">Trocar de conta</a>
            <Link className="landing-button landing-button-ghost" href="/">Voltar ao site</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <SecurityDashboardV2
      userName={user.fullName?.split(" ")[0] ?? user.displayName}
      userEmail={user.email}
    />
  );
}
