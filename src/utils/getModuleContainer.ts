import { Newable } from "../types";
import ModuleMetadata from "../types/ModuleMetadata";
import { MODULE_METADATA_KEYS } from "./constants";
import getAllMetadata from "./getAllMetadata";

export default function getModuleContainer(Module: Newable) {
  const metadata = getAllMetadata<ModuleMetadata>(
    Module.prototype,
    MODULE_METADATA_KEYS
  );

  return metadata.container;
}
