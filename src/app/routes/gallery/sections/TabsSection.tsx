import { useTranslation } from "react-i18next";
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "../../../../ui";

export function TabsSection() {
  const { t } = useTranslation();

  return (
    <TabsRoot defaultValue="preview" className="sm:max-w-md">
      <TabsList>
        <TabsTrigger value="preview">{t("gallery.tabs.preview")}</TabsTrigger>
        <TabsTrigger value="assistant">{t("gallery.tabs.assistant")}</TabsTrigger>
      </TabsList>
      <TabsContent value="preview">
        <p className="font-body text-sm text-ink-muted">{t("gallery.tabs.previewBody")}</p>
      </TabsContent>
      <TabsContent value="assistant">
        <p className="font-body text-sm text-ink-muted">{t("gallery.tabs.assistantBody")}</p>
      </TabsContent>
    </TabsRoot>
  );
}
