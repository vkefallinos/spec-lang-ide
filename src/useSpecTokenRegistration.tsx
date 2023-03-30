import { useEffect } from "react";

export function useSpecTokenRegistration(monaco: any, isReady: any) {
  useEffect(() => {
    async function run() {
      const baseLang = await monaco.languages
        .getLanguages()
        .find((p) => p.id === "scss")
        .loader();
      // here is the monaco instance
      // do something before editor is mounted
      // const lang = merge(customTokenizer, baseLang.language);
      const lang = baseLang.language;
      monaco.languages.register({
        id: "spec",
        extensions: [".spec"],
        aliases: ["Spec", "sass", "scss"],
        mimetypes: ["text/x-spec", "text/spec"]
      });

      monaco.languages.setMonarchTokensProvider("spec", lang);
    }
    if (isReady.monaco) {
      run();
    }
  }, [isReady.monaco]);
}
