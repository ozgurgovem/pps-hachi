import { useEffect } from "react";
import { useTranslation } from "react-i18next";

function App() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("app.title");
  }, [t]);

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <p>{t("scaffold.placeholder")}</p>
    </main>
  );
}

export default App;
