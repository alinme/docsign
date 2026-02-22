import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ code?: string; next?: string; state?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
    const { locale } = await params;
    const sp = await searchParams;

    if (sp.code) {
        const q = new URLSearchParams();
        q.set("code", sp.code);
        q.set("next", sp.next ?? "/");
        if (sp.state) q.set("state", sp.state);
        redirect(`/${locale}/auth/callback?${q.toString()}`);
    }

    return <LoginForm />;
}
