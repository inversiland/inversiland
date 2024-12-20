import Sinon, * as sinon from "sinon";

import { interfaces } from "../../src";
import { injectable } from "../../src/annotation/injectable";
import { Binding } from "../../src/bindings/binding";
import { BindingScopeEnum } from "../../src/constants/literal_types";
import { BindingWhenOnSyntax } from "../../src/syntax/binding_when_on_syntax";

describe("BindingWhenOnSyntax", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("Should set its own properties correctly", () => {
    const ninjaIdentifier = "Ninja";

    const binding: Binding<unknown> = new Binding(
      ninjaIdentifier,
      BindingScopeEnum.Transient
    );
    const bindingWhenOnSyntax: BindingWhenOnSyntax<unknown> =
      new BindingWhenOnSyntax(binding);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const _bindingWhenOnSyntax: {
      _binding: interfaces.Binding<unknown>;
    } = bindingWhenOnSyntax as unknown as {
      _binding: interfaces.Binding<unknown>;
    };

    expect(_bindingWhenOnSyntax._binding.serviceIdentifier).toBe(
      ninjaIdentifier
    );
  });

  it("Should provide access to BindingWhenSyntax methods", () => {
    @injectable()
    class Army {}

    @injectable()
    class ZombieArmy {}

    const ninjaIdentifier = "Ninja";

    const binding: Binding<unknown> = new Binding(
      ninjaIdentifier,
      BindingScopeEnum.Transient
    );
    const bindingWhenOnSyntax: BindingWhenOnSyntax<unknown> =
      new BindingWhenOnSyntax(binding);

    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any
    const _bindingWhenOnSyntax: any = bindingWhenOnSyntax;

    // stubs for BindingWhenSyntax methods
    const whenStub: sinon.SinonStub = sinon
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .stub(_bindingWhenOnSyntax._bindingWhenSyntax, "when")
      .returns(null);
    const whenTargetNamedStub: sinon.SinonStub = sinon
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .stub(_bindingWhenOnSyntax._bindingWhenSyntax, "whenTargetNamed")
      .returns(null);
    const whenTargetTaggedStub: sinon.SinonStub = sinon
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .stub(_bindingWhenOnSyntax._bindingWhenSyntax, "whenTargetTagged")
      .returns(null);
    const whenInjectedIntoStub: sinon.SinonStub = sinon
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .stub(_bindingWhenOnSyntax._bindingWhenSyntax, "whenInjectedInto")
      .returns(null);
    const whenParentNamedStub: sinon.SinonStub = sinon
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .stub(_bindingWhenOnSyntax._bindingWhenSyntax, "whenParentNamed")
      .returns(null);
    const whenParentTaggedStub: sinon.SinonStub = sinon
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .stub(_bindingWhenOnSyntax._bindingWhenSyntax, "whenParentTagged")
      .returns(null);

    const whenAnyAncestorIsStub: sinon.SinonStub = sinon
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .stub(_bindingWhenOnSyntax._bindingWhenSyntax, "whenAnyAncestorIs")
      .returns(null);

    const whenNoAncestorIsStub: sinon.SinonStub = sinon
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .stub(_bindingWhenOnSyntax._bindingWhenSyntax, "whenNoAncestorIs")
      .returns(null);

    const whenAnyAncestorNamedStub: sinon.SinonStub = sinon
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .stub(_bindingWhenOnSyntax._bindingWhenSyntax, "whenAnyAncestorNamed")
      .returns(null);

    const whenNoAncestorNamedStub: sinon.SinonStub = sinon
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .stub(_bindingWhenOnSyntax._bindingWhenSyntax, "whenNoAncestorNamed")
      .returns(null);

    const whenNoAncestorTaggedStub: sinon.SinonStub = sinon
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .stub(_bindingWhenOnSyntax._bindingWhenSyntax, "whenNoAncestorTagged")
      .returns(null);

    const whenAnyAncestorTaggedStub: sinon.SinonStub = sinon
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .stub(_bindingWhenOnSyntax._bindingWhenSyntax, "whenAnyAncestorTagged")
      .returns(null);

    const whenAnyAncestorMatchesStub: sinon.SinonStub = sinon
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .stub(_bindingWhenOnSyntax._bindingWhenSyntax, "whenAnyAncestorMatches")
      .returns(null);

    const whenNoAncestorMatchesStub: sinon.SinonStub = sinon
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .stub(_bindingWhenOnSyntax._bindingWhenSyntax, "whenNoAncestorMatches")
      .returns(null);

    // invoke BindingWhenOnSyntax methods
    bindingWhenOnSyntax.when((_request: interfaces.Request) => true);
    bindingWhenOnSyntax.whenTargetNamed("test");
    bindingWhenOnSyntax.whenTargetTagged("test", true);
    bindingWhenOnSyntax.whenInjectedInto("army");
    bindingWhenOnSyntax.whenInjectedInto(Army);
    bindingWhenOnSyntax.whenParentNamed("test");
    bindingWhenOnSyntax.whenParentTagged("test", true);
    bindingWhenOnSyntax.whenAnyAncestorIs(Army);
    bindingWhenOnSyntax.whenNoAncestorIs(ZombieArmy);
    bindingWhenOnSyntax.whenAnyAncestorNamed("test");
    bindingWhenOnSyntax.whenAnyAncestorTagged("test", true);
    bindingWhenOnSyntax.whenNoAncestorNamed("test");
    bindingWhenOnSyntax.whenNoAncestorTagged("test", true);
    bindingWhenOnSyntax.whenAnyAncestorMatches(
      (_request: interfaces.Request) => true
    );
    bindingWhenOnSyntax.whenNoAncestorMatches(
      (_request: interfaces.Request) => true
    );

    // assert invoked BindingWhenSyntax methods
    expect(whenStub.callCount).toBe(1);
    expect(whenTargetNamedStub.callCount).toBe(1);
    expect(whenTargetTaggedStub.callCount).toBe(1);
    expect(whenInjectedIntoStub.callCount).toBe(2);
    expect(whenParentNamedStub.callCount).toBe(1);
    expect(whenParentTaggedStub.callCount).toBe(1);
    expect(whenAnyAncestorIsStub.callCount).toBe(1);
    expect(whenNoAncestorIsStub.callCount).toBe(1);
    expect(whenAnyAncestorNamedStub.callCount).toBe(1);
    expect(whenAnyAncestorTaggedStub.callCount).toBe(1);
    expect(whenNoAncestorNamedStub.callCount).toBe(1);
    expect(whenNoAncestorTaggedStub.callCount).toBe(1);
    expect(whenAnyAncestorMatchesStub.callCount).toBe(1);
    expect(whenNoAncestorMatchesStub.callCount).toBe(1);
  });

  it("Should provide access to BindingOnSyntax methods", () => {
    const ninjaIdentifier = "Ninja";

    const binding: Binding<unknown> = new Binding(
      ninjaIdentifier,
      BindingScopeEnum.Transient
    );
    const bindingWhenOnSyntax: BindingWhenOnSyntax<unknown> =
      new BindingWhenOnSyntax(binding);

    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any
    const _bindingWhenOnSyntax: any = bindingWhenOnSyntax;

    const onActivationStub: Sinon.SinonStub = sinon
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .stub(_bindingWhenOnSyntax._bindingOnSyntax, "onActivation")
      .returns(null);

    // invoke BindingWhenOnSyntax methods
    bindingWhenOnSyntax.onActivation(
      (_context: interfaces.Context, ninja: unknown) => ninja
    );

    // assert invoked BindingWhenSyntax methods
    expect(onActivationStub.callCount).toBe(1);
  });
});
