import { injectable } from "@carlossalasamper/inversify";
import { DynamicModule, InversifySugar, module } from "../../src";
import importModule from "../../src/importing/importModule";
import createExportedProviderRef from "../../src/exporting/createExportedProviderRef";
import importDynamicModule from "../../src/importing/importDynamicModule";
import messagesMap from "../../src/messages/messagesMap";
import Module from "../../src/types/Module";

describe("createExportedProviderRef", () => {
  beforeEach(async () => {
    await InversifySugar.reset();
  });

  it("Should create a ExportedProviderRef of a NewableModule.", () => {
    @injectable()
    class TestService {}

    @module({
      providers: [TestService],
      exports: [TestService],
    })
    class TestModule {}

    importModule(TestModule);

    const exportedProviderRef = createExportedProviderRef(
      TestModule,
      TestService
    );

    expect(exportedProviderRef.module).toEqual(TestModule);
  });

  it("Should create a ExportedProviderRef of a DynamicModule.", () => {
    @injectable()
    class TestService {}

    @module({})
    class TestModule {}

    const dynamicModule: DynamicModule = {
      module: TestModule,
      providers: [TestService],
      exports: [TestService],
    };

    importDynamicModule(dynamicModule);

    const exportedProviderRef = createExportedProviderRef(
      dynamicModule,
      TestService
    );

    expect(exportedProviderRef.module).toEqual(TestModule);
  });

  it("Should throw an error if the type of the Module is unknown.", () => {
    @injectable()
    class TestService {}

    const unknownModule = {} as Module;

    expect(() => {
      createExportedProviderRef(unknownModule, TestService);
    }).toThrow(messagesMap.unknownModuleType);
  });

  it("Should throw an error when the ExportedProvider is not bound.", () => {
    @injectable()
    class TestService {}

    @module({})
    class Module {}

    expect(() => createExportedProviderRef(Module, TestService)).toThrowError(
      messagesMap.notBoundProviderExported(Module.name, TestService)
    );
  });
});