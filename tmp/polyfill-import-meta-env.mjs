import { register } from "node:module";
import { pathToFileURL } from "node:url";
register("data:text/javascript," + encodeURIComponent(`
  export async function resolve(specifier, context, nextResolve) {
    return nextResolve(specifier, context);
  }
  export async function load(url, context, nextLoad) {
    const result = await nextLoad(url, context);
    if (result.format === "module" && typeof result.source === "string" && result.source.includes("import.meta.env")) {
      result.source = "if(!import.meta.env){import.meta.env={}};\\n" + result.source;
    }
    return result;
  }
`), pathToFileURL("./"));
