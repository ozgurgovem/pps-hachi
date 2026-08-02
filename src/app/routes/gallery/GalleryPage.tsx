import { useEffect } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ThemeToggle } from "../../../ui";
import { ButtonsSection } from "./sections/ButtonsSection";
import { FormSection } from "./sections/FormSection";
import { OverlaysSection } from "./sections/OverlaysSection";
import { PaletteSection } from "./sections/PaletteSection";
import { StatusSection } from "./sections/StatusSection";
import { TabsSection } from "./sections/TabsSection";
import { TypographySection } from "./sections/TypographySection";

interface GallerySectionProps {
  title: string;
  children: ReactNode;
}

function GallerySection({ title, children }: GallerySectionProps) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-6">
      <h2 className="font-display text-xl font-semibold uppercase tracking-[0.04em] text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function GalleryPage() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("gallery.title")} — ${t("app.title")}`;
  }, [t]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-[0.03em] text-ink">
            {t("gallery.title")}
          </h1>
          <p className="mt-1 font-body text-sm text-ink-muted">{t("gallery.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/"
            className="font-body text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            {t("gallery.backToApp")}
          </Link>
        </div>
      </header>

      <GallerySection title={t("gallery.sections.palette")}>
        <PaletteSection />
      </GallerySection>

      <GallerySection title={t("gallery.sections.typography")}>
        <TypographySection />
      </GallerySection>

      <GallerySection title={t("gallery.sections.buttons")}>
        <ButtonsSection />
      </GallerySection>

      <GallerySection title={t("gallery.sections.form")}>
        <FormSection />
      </GallerySection>

      <GallerySection title={t("gallery.sections.tabs")}>
        <TabsSection />
      </GallerySection>

      <GallerySection title={t("gallery.sections.overlays")}>
        <OverlaysSection />
      </GallerySection>

      <GallerySection title={t("gallery.sections.status")}>
        <StatusSection />
      </GallerySection>
    </main>
  );
}
