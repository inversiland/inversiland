import bindScope from "../../src/binding/bindScope";
import { InversifySugar } from "../../src";
import { Container } from "@carlossalasamper/inversify";

class ClassA {}

describe("bindScope", () => {
  const container = new Container();

  beforeEach(() => {
    InversifySugar.reset();
    container?.unbindAll();
  });

  it("Should call binding.inTransientScope() when scope is Transient.", () => {
    const binding = container.bind(ClassA).toSelf();
    const inTransientScope = jest.spyOn(binding, "inTransientScope");

    bindScope(binding, "Transient");

    expect(inTransientScope).toHaveBeenCalled();
  });

  it("Should call binding.inRequestScope() when scope is Request.", () => {
    const binding = container.bind(ClassA).toSelf();
    const inRequestScope = jest.spyOn(binding, "inRequestScope");

    bindScope(binding, "Request");

    expect(inRequestScope).toHaveBeenCalled();
  });

  it("Should call binding.inSingletonScope() when scope is Singleton.", () => {
    const binding = container.bind(ClassA).toSelf();
    const inSingletonScope = jest.spyOn(binding, "inSingletonScope");

    bindScope(binding, "Singleton");

    expect(inSingletonScope).toHaveBeenCalled();
  });
});