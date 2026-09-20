import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser, isAuthorizedAdmin } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Login",
  description: "Acesso ao painel administrativo da Security3C.",
};

export default async function LoginPage() {
  const user = await getChatGPTUser();
  if (user && isAuthorizedAdmin(user)) redirect("/acesso-restrito");

  return (
    <main className="login-shell">
      <Link className="login-back" href="/">← Voltar ao site</Link>
      <section className="login-card">
        <div className="login-brand">
          <img src="/securitytc-logo.png" alt="Security3C Soluções Inteligentes" />
          <div><strong>SECURITY3C</strong><span>Soluções Inteligentes</span></div>
        </div>
        <span className="access-kicker">Ambiente administrativo</span>
        <h1>Acesso restrito</h1>
        <p>{user ? "A conta conectada não está autorizada. Troque de conta para continuar." : "Entre com a conta administrativa autorizada. A validação de identidade e a permissão acontecem no servidor."}</p>
        {user ? (
          <a className="landing-button landing-button-primary login-action" href={chatGPTSignOutPath("/login")} target="_top">Trocar de conta</a>
        ) : (
          <a className="landing-button landing-button-primary login-action" href={chatGPTSignInPath("/acesso-restrito")} target="_top">Entrar com segurança</a>
        )}
        <div className="login-security-note"><span aria-hidden="true">✓</span><span>O site não armazena senhas. A autenticação é processada com segurança pela plataforma.</span></div>
      </section>
    </main>
  );
}
