"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { FileUp, PenLine, CheckCircle2, ArrowRight } from "lucide-react";

export type OpenAuthView = "login" | "signup";

const PEXELS = {
  hero: "https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1200",
  feature: "https://images.pexels.com/photos/590041/pexels-photo-590041.jpeg?auto=compress&cs=tinysrgb&w=800",
  cta: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1000",
};

type LandingContentProps = {
  onOpenAuth?: (view: OpenAuthView) => void;
};

export function LandingContent({ onOpenAuth }: LandingContentProps = {}) {
  const t = useTranslations("Landing");
  const tAuth = useTranslations("Auth");
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { rootMargin: "-10% 0px -10% 0px", threshold: 0 }
    );
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const setRef = (i: number) => (el: HTMLElement | null) => {
    sectionRefs.current[i] = el;
  };

  return (
    <div className="landing-scroll">
      {/* Hero */}
      <section
        ref={setRef(0)}
        className="landing-section relative pt-12 pb-16 sm:pt-16 sm:pb-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {t("tagline")}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                {t("heroDescription")}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                {onOpenAuth ? (
                  <Button size="lg" className="gap-2 text-base" onClick={() => onOpenAuth("signup")}>
                    {tAuth("createAccount")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="lg" className="gap-2 text-base" asChild>
                    <Link href="/auth/login">
                      {tAuth("createAccount")}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button size="lg" variant="outline" className="text-base" asChild>
                  <a href="#features">Learn more</a>
                </Button>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-border shadow-2xl">
              <Image
                src={PEXELS.hero}
                alt="Document signing"
                width={600}
                height={400}
                className="h-auto w-full object-cover transition-transform duration-700 hover:scale-105"
                unoptimized={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        ref={setRef(1)}
        className="landing-section border-t border-border bg-muted/30 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to close deals
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Upload, send, and track signatures in one place. No printing, no scanning.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileUp className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">Upload & add signers</h3>
              <p className="mt-3 text-muted-foreground">
                Drop your PDF, add signer names and emails, and place signature fields exactly where you need them.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <PenLine className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">Sign in seconds</h3>
              <p className="mt-3 text-muted-foreground">
                Signers get a link by email. They open it, sign on any device, and you get a completed document.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">Track & store</h3>
              <p className="mt-3 text-muted-foreground">
                See who signed and when. Download the final PDF. Keep an audit trail for compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section ref={setRef(2)} className="landing-section py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Simple from start to finish
              </h2>
              <ul className="mt-8 space-y-6">
                {[
                  "Create a document or pick a template, add signers, and place fields.",
                  "We send a secure link to each signer. They sign on desktop or mobile.",
                  "When everyone has signed, download the final PDF. Done.",
                ].map((text, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 relative overflow-hidden rounded-2xl border border-border shadow-xl lg:order-2">
              <Image
                src={PEXELS.feature}
                alt="Workflow"
                width={600}
                height={400}
                className="h-auto w-full object-cover"
                unoptimized={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        ref={setRef(3)}
        className="landing-section relative overflow-hidden border-t border-border bg-muted/50 py-24 sm:py-32"
      >
        <div className="absolute inset-0 h-full w-full">
          <Image
            src={PEXELS.cta}
            alt=""
            fill
            className="object-cover opacity-20"
            sizes="100vw"
            unoptimized={false}
          />
          <div className="absolute inset-0 bg-background/70" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to sign smarter?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Create your free account and send your first document in minutes.
          </p>
          <div className="mt-10">
            {onOpenAuth ? (
              <Button size="lg" className="gap-2 text-base" onClick={() => onOpenAuth("signup")}>
                {tAuth("createAccount")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="lg" className="gap-2 text-base" asChild>
                <Link href="/auth/login">
                  {tAuth("createAccount")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
