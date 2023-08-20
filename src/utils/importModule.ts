/* eslint-disable @typescript-eslint/no-explicit-any */
import getAllMetadata from "./getAllMetadata";
import ModuleMetadata from "../types/ModuleMetadata";
import { Constructor } from "../types";
import InversifySugar from "./InversifySugar";
import messagesMap from "./messagesMap";
import ExportedProviderRef from "../types/ExportedProviderRef";
import createExportedProviderRef from "./createExportedProviderRef";
import processImports from "./processImports";
import { MODULE_IS_BINDED_KEY, MODULE_METADATA_KEYS } from "./constants";
import { bindProviderToContainer, bindProviderToModule } from "./bindProvider";

export default function importModule(
  Module: Constructor,
  isRoot = false
): ExportedProviderRef[] {
  const metadata = getAllMetadata<ModuleMetadata>(
    Module.prototype,
    MODULE_METADATA_KEYS
  );
  const exportedProviders: ExportedProviderRef[] = [];

  if (metadata.isModule) {
    if (isRoot) {
      importRootModule(Module);
    } else {
      exportedProviders.push(...importChildModule(Module));
    }

    Reflect.defineMetadata(MODULE_IS_BINDED_KEY, true, Module.prototype);
  } else {
    console.warn(messagesMap.notAModuleImported(Module.name));
  }

  return exportedProviders;
}

/**
 * @description This function is used to import a root module.
 * @param Module
 * @returns
 */
function importRootModule(Module: Constructor) {
  const metadata = getAllMetadata<ModuleMetadata>(
    Module.prototype,
    MODULE_METADATA_KEYS
  );

  if (!metadata.isBinded) {
    for (const provider of metadata.providers) {
      bindProviderToContainer(provider, InversifySugar.globalContainer);
    }

    for (const provider of metadata.globalProviders) {
      bindProviderToContainer(provider, InversifySugar.globalContainer);
    }

    processImports(metadata.container, metadata.imports);
  }
}

/**
 * @description This function is used to import a child module.
 * @param Module
 */
function importChildModule(Module: Constructor) {
  const metadata = getAllMetadata<ModuleMetadata>(
    Module.prototype,
    MODULE_METADATA_KEYS
  );
  const exportedProviderRefs: ExportedProviderRef[] = [];

  if (!metadata.isBinded) {
    for (const provider of metadata.providers) {
      bindProviderToModule(provider, Module);
    }

    for (const provider of metadata.globalProviders) {
      bindProviderToContainer(provider, InversifySugar.globalContainer);
    }

    processImports(metadata.container, metadata.imports);
  }

  for (const exportedProvider of metadata.exports) {
    exportedProviderRefs.push(
      ...createExportedProviderRef(Module, exportedProvider)
    );
  }

  InversifySugar.onModuleImported(metadata.container, metadata, Module);

  return exportedProviderRefs;
}
