import * as sinon from "sinon";

import { interfaces } from "../../src";
import { inject } from "../../src/annotation/inject";
import { injectable } from "../../src/annotation/injectable";
import { multiInject } from "../../src/annotation/multi_inject";
import { named } from "../../src/annotation/named";
import { postConstruct } from "../../src/annotation/post_construct";
import { preDestroy } from "../../src/annotation/pre_destroy";
import { tagged } from "../../src/annotation/tagged";
import { targetName } from "../../src/annotation/target_name";
import * as ERROR_MSGS from "../../src/constants/error_msgs";
import {
  BindingTypeEnum,
  TargetTypeEnum,
} from "../../src/constants/literal_types";
import { Container } from "../../src/container/container";
import { MetadataReader } from "../../src/planning/metadata_reader";
import { getBindingDictionary, plan } from "../../src/planning/planner";
import { resolveInstance } from "../../src/resolution/instantiation";
import { resolve } from "../../src/resolution/resolver";

function resolveTyped<T>(context: interfaces.Context): T {
  return resolve(context) as T;
}

describe("resolver", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("Should be able to resolve BindingType.Instance bindings", () => {
    const ninjaId = "Ninja";
    const shurikenId = "Shuriken";
    const katanaId = "Katana";
    const katanaHandlerId = "KatanaHandler";
    const katanaBladeId = "KatanaBlade";

    @injectable()
    class KatanaBlade {}

    @injectable()
    class KatanaHandler {}

    interface Sword {
      handler: KatanaHandler;
      blade: KatanaBlade;
    }

    @injectable()
    class Katana implements Sword {
      public handler: KatanaHandler;
      public blade: KatanaBlade;
      constructor(
        @inject(katanaHandlerId) @targetName("handler") handler: KatanaHandler,
        @inject(katanaBladeId) @targetName("blade") blade: KatanaBlade
      ) {
        this.handler = handler;
        this.blade = blade;
      }
    }

    @injectable()
    class Shuriken {}

    interface Warrior {
      katana: Katana;
      shuriken: Shuriken;
    }

    @injectable()
    class Ninja implements Warrior {
      public katana: Katana;
      public shuriken: Shuriken;
      constructor(
        @inject(katanaId) @targetName("katana") katana: Katana,
        @inject(shurikenId) @targetName("shuriken") shuriken: Shuriken
      ) {
        this.katana = katana;
        this.shuriken = shuriken;
      }
    }

    const container: Container = new Container();
    container.bind<Ninja>(ninjaId).to(Ninja);
    container.bind<Shuriken>(shurikenId).to(Shuriken);
    container.bind<Katana>(katanaId).to(Katana);
    container.bind<KatanaBlade>(katanaBladeId).to(KatanaBlade);
    container.bind<KatanaHandler>(katanaHandlerId).to(KatanaHandler);

    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );
    const ninja: Ninja = resolveTyped<Ninja>(context);

    expect(ninja instanceof Ninja).toBe(true);
    expect(ninja.katana instanceof Katana).toBe(true);
    expect(ninja.katana.handler instanceof KatanaHandler).toBe(true);
    expect(ninja.katana.blade instanceof KatanaBlade).toBe(true);
    expect(ninja.shuriken instanceof Shuriken).toBe(true);
  });

  it("Should store singleton type bindings in cache", () => {
    const ninjaId = "Ninja";
    const shurikenId = "Shuriken";
    const katanaId = "Katana";
    const katanaHandlerId = "KatanaHandler";
    const katanaBladeId = "KatanaBlade";

    @injectable()
    class KatanaBlade {}

    @injectable()
    class KatanaHandler {}

    interface Sword {
      handler: KatanaHandler;
      blade: KatanaBlade;
    }

    @injectable()
    class Katana implements Sword {
      public handler: KatanaHandler;
      public blade: KatanaBlade;
      constructor(
        @inject(katanaHandlerId) @targetName("handler") handler: KatanaHandler,
        @inject(katanaBladeId) @targetName("blade") blade: KatanaBlade
      ) {
        this.handler = handler;
        this.blade = blade;
      }
    }

    @injectable()
    class Shuriken {}

    interface Warrior {
      katana: Katana;
      shuriken: Shuriken;
    }

    @injectable()
    class Ninja implements Warrior {
      public katana: Katana;
      public shuriken: Shuriken;
      constructor(
        @inject(katanaId) @targetName("katana") katana: Katana,
        @inject(shurikenId) @targetName("shuriken") shuriken: Shuriken
      ) {
        this.katana = katana;
        this.shuriken = shuriken;
      }
    }

    const container: Container = new Container();
    container.bind<Ninja>(ninjaId).to(Ninja);
    container.bind<Shuriken>(shurikenId).to(Shuriken);
    container.bind<Katana>(katanaId).to(Katana).inSingletonScope();
    container.bind<KatanaBlade>(katanaBladeId).to(KatanaBlade);
    container
      .bind<KatanaHandler>(katanaHandlerId)
      .to(KatanaHandler)
      .inSingletonScope();

    const bindingDictionary: interfaces.Lookup<interfaces.Binding> =
      getBindingDictionary(container);
    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );

    const katanaBinding: interfaces.Binding<unknown> | undefined =
      bindingDictionary.get(katanaId)[0];
    expect(katanaBinding?.state.cache === null).toBe(true);
    expect(katanaBinding?.state.activated).toBe(false);

    const ninja: Ninja = resolveTyped<Ninja>(context);
    expect(ninja instanceof Ninja).toBe(true);

    const ninja2: Ninja = resolveTyped<Ninja>(context);
    expect(ninja2 instanceof Ninja).toBe(true);

    expect(katanaBinding?.state.cache instanceof Katana).toBe(true);
    expect(katanaBinding?.state.activated).toBe(true);
  });

  it("Should throw when an invalid BindingType is detected", () => {
    @injectable()
    class Katana {}

    @injectable()
    class Shuriken {}

    interface Warrior {
      katana: Katana;
      shuriken: Shuriken;
    }

    @injectable()
    class Ninja implements Warrior {
      public katana: Katana;
      public shuriken: Shuriken;
      constructor(
        @inject("Katana") @targetName("katana") katana: Katana,
        @inject("Shuriken") @targetName("shuriken") shuriken: Shuriken
      ) {
        this.katana = katana;
        this.shuriken = shuriken;
      }
    }

    // container and bindings
    const ninjaId = "Ninja";
    const container: Container = new Container();
    container.bind<Ninja>(ninjaId); // IMPORTANT! (Invalid binding)

    // context and plan
    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );

    const throwFunction: () => void = () => {
      resolveTyped(context);
    };

    expect(context.plan.rootRequest.bindings[0]?.type).toBe(
      BindingTypeEnum.Invalid
    );
    expect(throwFunction).toThrow(
      `${ERROR_MSGS.INVALID_BINDING_TYPE} ${ninjaId}`
    );
  });

  it("Should be able to resolve BindingType.ConstantValue bindings", () => {
    @injectable()
    class KatanaBlade {}

    @injectable()
    class KatanaHandler {}

    interface Sword {
      handler: KatanaHandler;
      blade: KatanaBlade;
    }

    @injectable()
    class Katana implements Sword {
      public handler: KatanaHandler;
      public blade: KatanaBlade;
      constructor(handler: KatanaHandler, blade: KatanaBlade) {
        this.handler = handler;
        this.blade = blade;
      }
    }

    @injectable()
    class Shuriken {}

    interface Warrior {
      katana: Katana;
      shuriken: Shuriken;
    }

    @injectable()
    class Ninja implements Warrior {
      public katana: Katana;
      public shuriken: Shuriken;
      constructor(
        @inject("Katana") @targetName("katana") katana: Katana,
        @inject("Shuriken") @targetName("shuriken") shuriken: Shuriken
      ) {
        this.katana = katana;
        this.shuriken = shuriken;
      }
    }

    const ninjaId = "Ninja";
    const shurikenId = "Shuriken";
    const katanaId = "Katana";

    const container: Container = new Container();
    container.bind<Ninja>(ninjaId).to(Ninja);
    container.bind<Shuriken>(shurikenId).to(Shuriken);
    container
      .bind<Katana>(katanaId)
      .toConstantValue(new Katana(new KatanaHandler(), new KatanaBlade()));

    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );

    const katanaBinding: interfaces.Binding | undefined =
      getBindingDictionary(container).get(katanaId)[0];
    expect(katanaBinding?.state.activated).toBe(false);

    const ninja: Ninja = resolveTyped<Ninja>(context);

    expect(katanaBinding?.state.activated).toBe(true);

    expect(ninja instanceof Ninja).toBe(true);
    expect(ninja.katana instanceof Katana).toBe(true);
    expect(ninja.katana.handler instanceof KatanaHandler).toBe(true);
    expect(ninja.katana.blade instanceof KatanaBlade).toBe(true);
    expect(ninja.shuriken instanceof Shuriken).toBe(true);
  });

  it("Should be able to resolve BindingType.DynamicValue bindings", () => {
    @injectable()
    class UseDate {
      public currentDate: Date;
      constructor(@inject("Date") currentDate: Date) {
        this.currentDate = currentDate;
      }
      public doSomething() {
        return this.currentDate;
      }
    }

    const container: Container = new Container();
    container.bind<UseDate>("UseDate").to(UseDate);
    container
      .bind<Date>("Date")
      .toDynamicValue((_context: interfaces.Context) => new Date());

    const subject1: UseDate = container.get<UseDate>("UseDate");
    const subject2: UseDate = container.get<UseDate>("UseDate");
    expect(subject1.doSomething() === subject2.doSomething()).toBe(false);

    container.unbind("Date");
    container.bind<Date>("Date").toConstantValue(new Date());

    const subject3: UseDate = container.get<UseDate>("UseDate");
    const subject4: UseDate = container.get<UseDate>("UseDate");
    expect(subject3.doSomething() === subject4.doSomething()).toBe(true);
  });

  it("Should be able to resolve BindingType.Constructor bindings", () => {
    const ninjaId = "Ninja";
    const newableKatanaId = "Newable<Katana>";

    @injectable()
    class Katana {}

    @injectable()
    class Ninja {
      public katana: Katana;
      constructor(@inject(newableKatanaId) katana: interfaces.Newable<Katana>) {
        this.katana = new katana();
      }
    }

    const container: Container = new Container();
    container.bind<Ninja>(ninjaId).to(Ninja);
    container
      .bind<interfaces.Newable<Katana>>(newableKatanaId)
      .toConstructor<Katana>(Katana);

    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );
    const ninja: Ninja = resolveTyped<Ninja>(context);

    expect(ninja instanceof Ninja).toBe(true);
    expect(ninja.katana instanceof Katana).toBe(true);
  });

  it("Should be able to resolve BindingType.Factory bindings", () => {
    const ninjaId = "Ninja";
    const shurikenId = "Shuriken";
    const swordFactoryId = "Factory<Sword>";
    const katanaId = "Katana";
    const handlerId = "Handler";
    const bladeId = "Blade";

    @injectable()
    class KatanaBlade {}

    @injectable()
    class KatanaHandler {}

    interface Sword {
      handler: KatanaHandler;
      blade: KatanaBlade;
    }

    type SwordFactory = () => Sword;

    @injectable()
    class Katana implements Sword {
      public handler: KatanaHandler;
      public blade: KatanaBlade;
      constructor(
        @inject(handlerId) @targetName("handler") handler: KatanaHandler,
        @inject(bladeId) @targetName("blade") blade: KatanaBlade
      ) {
        this.handler = handler;
        this.blade = blade;
      }
    }

    @injectable()
    class Shuriken {}

    interface Warrior {
      katana: Katana;
      shuriken: Shuriken;
    }

    @injectable()
    class Ninja implements Warrior {
      public katana: Katana;
      public shuriken: Shuriken;
      constructor(
        @inject(swordFactoryId)
        @targetName("makeKatana")
        makeKatana: SwordFactory,
        @inject(shurikenId) @targetName("shuriken") shuriken: Shuriken
      ) {
        this.katana = makeKatana();
        this.shuriken = shuriken;
      }
    }

    const container: Container = new Container();
    container.bind<Ninja>(ninjaId).to(Ninja);
    container.bind<Shuriken>(shurikenId).to(Shuriken);
    container.bind<Katana>(katanaId).to(Katana);
    container.bind<KatanaBlade>(bladeId).to(KatanaBlade);
    container.bind<KatanaHandler>(handlerId).to(KatanaHandler);

    container
      .bind<interfaces.Factory<Katana>>(swordFactoryId)
      .toFactory<Katana>(
        (theContext: interfaces.Context) => () =>
          theContext.container.get<Katana>(katanaId)
      );

    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );

    const ninja: Ninja = resolveTyped<Ninja>(context);

    expect(ninja instanceof Ninja).toBe(true);
    expect(ninja.katana instanceof Katana).toBe(true);
    expect(ninja.katana.handler instanceof KatanaHandler).toBe(true);
    expect(ninja.katana.blade instanceof KatanaBlade).toBe(true);
    expect(ninja.shuriken instanceof Shuriken).toBe(true);
  });

  it("Should be able to resolve bindings with auto factory", () => {
    const ninjaId = "Ninja";
    const shurikenId = "Shuriken";
    const katanaFactoryId = "Factory<Sword>";
    const katanaId = "Katana";
    const katanaHandlerId = "KatanaHandler";
    const katanaBladeId = "KatanaBlade";

    @injectable()
    class KatanaBlade {}

    @injectable()
    class KatanaHandler {}

    interface Sword {
      handler: KatanaHandler;
      blade: KatanaBlade;
    }

    type SwordFactory = () => Sword;

    @injectable()
    class Katana implements Sword {
      public handler: KatanaHandler;
      public blade: KatanaBlade;
      constructor(
        @inject(katanaHandlerId) @targetName("handler") handler: KatanaHandler,
        @inject(katanaBladeId) @targetName("blade") blade: KatanaBlade
      ) {
        this.handler = handler;
        this.blade = blade;
      }
    }

    @injectable()
    class Shuriken {}

    interface Warrior {
      katana: Katana;
      shuriken: Shuriken;
    }

    @injectable()
    class Ninja implements Warrior {
      public katana: Katana;
      public shuriken: Shuriken;
      constructor(
        @inject(katanaFactoryId)
        @targetName("makeKatana")
        makeKatana: SwordFactory,
        @inject(shurikenId) @targetName("shuriken") shuriken: Shuriken
      ) {
        this.katana = makeKatana(); // IMPORTANT!
        this.shuriken = shuriken;
      }
    }

    const container: Container = new Container();
    container.bind<Ninja>(ninjaId).to(Ninja);
    container.bind<Shuriken>(shurikenId).to(Shuriken);
    container.bind<Katana>(katanaId).to(Katana);
    container.bind<KatanaBlade>(katanaBladeId).to(KatanaBlade);
    container.bind<KatanaHandler>(katanaHandlerId).to(KatanaHandler);
    container
      .bind<interfaces.Factory<Katana>>(katanaFactoryId)
      .toAutoFactory<Katana>(katanaId);

    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );
    const ninja: Ninja = resolveTyped<Ninja>(context);

    expect(ninja instanceof Ninja).toBe(true);
    expect(ninja.katana instanceof Katana).toBe(true);
    expect(ninja.katana.handler instanceof KatanaHandler).toBe(true);
    expect(ninja.katana.blade instanceof KatanaBlade).toBe(true);
    expect(ninja.shuriken instanceof Shuriken).toBe(true);
  });

  it("Should be able to resolve BindingType.Provider bindings", (done) => {
    type SwordProvider = () => Promise<Sword>;

    const ninjaId = "Ninja";
    const shurikenId = "Shuriken";
    const swordProviderId = "Provider<Sword>";
    const swordId = "Sword";
    const handlerId = "Handler";
    const bladeId = "Blade";

    @injectable()
    class KatanaBlade {}

    @injectable()
    class KatanaHandler {}

    interface Sword {
      handler: KatanaHandler;
      blade: KatanaBlade;
    }

    @injectable()
    class Katana implements Sword {
      public handler: KatanaHandler;
      public blade: KatanaBlade;
      constructor(
        @inject(handlerId) @targetName("handler") handler: KatanaHandler,
        @inject(bladeId) @targetName("handler") blade: KatanaBlade
      ) {
        this.handler = handler;
        this.blade = blade;
      }
    }

    @injectable()
    class Shuriken {}

    interface Warrior {
      katana: Katana | null;
      katanaProvider: SwordProvider;
      shuriken: Shuriken;
    }

    @injectable()
    class Ninja implements Warrior {
      public katana: Katana | null;
      public katanaProvider: SwordProvider;
      public shuriken: Shuriken;
      constructor(
        @inject(swordProviderId)
        @targetName("katanaProvider")
        katanaProvider: SwordProvider,
        @inject(shurikenId) @targetName("shuriken") shuriken: Shuriken
      ) {
        this.katana = null;
        this.katanaProvider = katanaProvider;
        this.shuriken = shuriken;
      }
    }

    const container: Container = new Container();
    container.bind<Warrior>(ninjaId).to(Ninja);
    container.bind<Shuriken>(shurikenId).to(Shuriken);
    container.bind<Sword>(swordId).to(Katana);
    container.bind<KatanaBlade>(bladeId).to(KatanaBlade);
    container.bind<KatanaHandler>(handlerId).to(KatanaHandler);

    container.bind<SwordProvider>(swordProviderId).toProvider<Sword>(
      (theContext: interfaces.Context) => () =>
        new Promise<Sword>((resolveFunc: (value: Sword) => void) => {
          // Using setTimeout to simulate complex initialization
          setTimeout(() => {
            resolveFunc(theContext.container.get<Sword>(swordId));
          }, 100);
        })
    );

    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );

    const ninja: Ninja = resolveTyped<Warrior>(context);

    expect(ninja instanceof Ninja).toBe(true);
    expect(ninja.shuriken instanceof Shuriken).toBe(true);

    ninja.katanaProvider().then((katana: Sword) => {
      ninja.katana = katana;
      expect(ninja.katana instanceof Katana).toBe(true);
      expect(ninja.katana.handler instanceof KatanaHandler).toBe(true);
      expect(ninja.katana.blade instanceof KatanaBlade).toBe(true);
      done();
    });
  });

  it("Should be able to resolve plans with constraints on tagged targets", () => {
    @injectable()
    class Katana {}

    @injectable()
    class Shuriken {}

    interface Warrior {
      katana: unknown;
      shuriken: unknown;
    }

    @injectable()
    class Ninja implements Warrior {
      public katana: unknown;
      public shuriken: unknown;
      constructor(
        @inject("Weapon")
        @targetName("katana")
        @tagged("canThrow", false)
        katana: unknown,
        @inject("Weapon")
        @targetName("shuriken")
        @tagged("canThrow", true)
        shuriken: unknown
      ) {
        this.katana = katana;
        this.shuriken = shuriken;
      }
    }

    const ninjaId = "Ninja";
    const weaponId = "Weapon";

    const container: Container = new Container();
    container.bind<Ninja>(ninjaId).to(Ninja);
    container.bind(weaponId).to(Katana).whenTargetTagged("canThrow", false);
    container.bind(weaponId).to(Shuriken).whenTargetTagged("canThrow", true);

    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );

    const ninja: Ninja = resolveTyped<Ninja>(context);

    expect(ninja instanceof Ninja).toBe(true);
    expect(ninja.katana instanceof Katana).toBe(true);
    expect(ninja.shuriken instanceof Shuriken).toBe(true);
  });

  it("Should be able to resolve plans with constraints on named targets", () => {
    @injectable()
    class Katana {}

    @injectable()
    class Shuriken {}

    interface Warrior {
      katana: unknown;
      shuriken: unknown;
    }

    @injectable()
    class Ninja implements Warrior {
      public katana: unknown;
      public shuriken: unknown;
      constructor(
        @inject("Weapon")
        @targetName("katana")
        @named("strong")
        katana: unknown,
        @inject("Weapon")
        @targetName("shuriken")
        @named("weak")
        shuriken: unknown
      ) {
        this.katana = katana;
        this.shuriken = shuriken;
      }
    }

    const ninjaId = "Ninja";
    const weaponId = "Weapon";

    const container: Container = new Container();
    container.bind<Ninja>(ninjaId).to(Ninja);
    container.bind(weaponId).to(Katana).whenTargetNamed("strong");
    container.bind(weaponId).to(Shuriken).whenTargetNamed("weak");

    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );

    const ninja: Ninja = resolveTyped<Ninja>(context);

    expect(ninja instanceof Ninja).toBe(true);
    expect(ninja.katana instanceof Katana).toBe(true);
    expect(ninja.shuriken instanceof Shuriken).toBe(true);
  });

  it("Should be able to resolve plans with custom contextual constraints", () => {
    @injectable()
    class Katana {}

    @injectable()
    class Shuriken {}

    interface Warrior {
      katana: unknown;
      shuriken: unknown;
    }

    @injectable()
    class Ninja implements Warrior {
      public katana: unknown;
      public shuriken: unknown;
      constructor(
        @inject("Weapon") @targetName("katana") katana: unknown,
        @inject("Weapon") @targetName("shuriken") shuriken: unknown
      ) {
        this.katana = katana;
        this.shuriken = shuriken;
      }
    }

    const ninjaId = "Ninja";
    const weaponId = "Weapon";

    const container: Container = new Container();
    container.bind<Ninja>(ninjaId).to(Ninja);

    container
      .bind(weaponId)
      .to(Katana)
      .when((request: interfaces.Request) =>
        request.target.name.equals("katana")
      );

    container
      .bind(weaponId)
      .to(Shuriken)
      .when((request: interfaces.Request) =>
        request.target.name.equals("shuriken")
      );

    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );

    const ninja: Ninja = resolveTyped<Ninja>(context);

    expect(ninja instanceof Ninja).toBe(true);
    expect(ninja.katana instanceof Katana).toBe(true);
    expect(ninja.shuriken instanceof Shuriken).toBe(true);
  });

  it("Should be able to resolve plans with multi-injections", () => {
    interface Weapon {
      name: string;
    }

    @injectable()
    class Katana implements Weapon {
      public name = "Katana";
    }

    @injectable()
    class Shuriken implements Weapon {
      public name = "Shuriken";
    }

    interface Warrior {
      katana: Weapon;
      shuriken: Weapon;
    }

    @injectable()
    class Ninja implements Warrior {
      public katana: Weapon;
      public shuriken: Weapon;
      constructor(
        @multiInject("Weapon") @targetName("weapons") weapons: Weapon[]
      ) {
        this.katana = weapons[0] as Weapon;
        this.shuriken = weapons[1] as Weapon;
      }
    }

    const ninjaId = "Ninja";
    const weaponId = "Weapon";

    const container: Container = new Container();
    container.bind<Ninja>(ninjaId).to(Ninja);
    container.bind<Weapon>(weaponId).to(Katana);
    container.bind<Weapon>(weaponId).to(Shuriken);

    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );

    const ninja: Ninja = resolveTyped<Ninja>(context);

    expect(ninja instanceof Ninja).toBe(true);
    expect(ninja.katana instanceof Katana).toBe(true);
    expect(ninja.shuriken instanceof Shuriken).toBe(true);

    // if only one value is bound to weaponId
    const container2: Container = new Container();
    container2.bind<Ninja>(ninjaId).to(Ninja);
    container2.bind<Weapon>(weaponId).to(Katana);

    const context2: interfaces.Context = plan(
      new MetadataReader(),
      container2,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );

    const ninja2: Ninja = resolveTyped<Ninja>(context2);

    expect(ninja2 instanceof Ninja).toBe(true);
    expect(ninja2.katana instanceof Katana).toBe(true);
  });

  it("Should be able to resolve plans with async multi-injections", async () => {
    interface Weapon {
      name: string;
    }

    @injectable()
    class Katana implements Weapon {
      public name = "Katana";
    }

    @injectable()
    class Shuriken implements Weapon {
      public name = "Shuriken";
    }

    interface Warrior {
      katana: Weapon;
      shuriken: Weapon;
    }

    @injectable()
    class Ninja implements Warrior {
      public katana: Weapon;
      public shuriken: Weapon;
      constructor(@multiInject("Weapon") weapons: Weapon[]) {
        this.katana = weapons[0] as Weapon;
        this.shuriken = weapons[1] as Weapon;
      }
    }

    const ninjaId = "Ninja";
    const weaponId = "Weapon";

    const container: Container = new Container();
    container.bind<Ninja>(ninjaId).to(Ninja);
    container
      .bind<Weapon>(weaponId)
      .toDynamicValue(async (_: interfaces.Context) =>
        Promise.resolve(new Katana())
      );
    container.bind<Weapon>(weaponId).to(Shuriken);

    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );

    const ninja: Ninja = await resolveTyped<Promise<Ninja>>(context);

    expect(ninja instanceof Ninja).toBe(true);
    expect(ninja.katana instanceof Katana).toBe(true);
    expect(ninja.shuriken instanceof Shuriken).toBe(true);

    // if only one value is bound to weaponId
    const container2: Container = new Container();
    container2.bind<Ninja>(ninjaId).to(Ninja);
    container2
      .bind<Weapon>(weaponId)
      .toDynamicValue((_: interfaces.Context) => new Katana());

    const context2: interfaces.Context = plan(
      new MetadataReader(),
      container2,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );

    const ninja2: Ninja = await resolveTyped<Promise<Ninja>>(context2);

    expect(ninja2 instanceof Ninja).toBe(true);
    expect(ninja2.katana instanceof Katana).toBe(true);
    expect(ninja2.shuriken).toBeUndefined();
  });

  it("Should be able to resolve plans with async and non async injections", async () => {
    const syncPropertyId = "syncProperty";
    const asyncPropertyId = "asyncProperty";
    const syncCtorId = "syncCtor";
    const asyncCtorId = "asyncCtor";
    @injectable()
    class CrazyInjectable {
      @inject(syncPropertyId)
      public syncProperty!: string;
      @inject(asyncPropertyId)
      public asyncProperty!: string;

      constructor(
        @inject(syncCtorId) public readonly syncCtor: string,
        @inject(asyncCtorId) public readonly asyncCtor: string
      ) {}
    }
    const crazyInjectableId = "crazy";
    const container: Container = new Container();
    container.bind<CrazyInjectable>(crazyInjectableId).to(CrazyInjectable);
    container.bind<string>(syncCtorId).toConstantValue("syncCtor");
    container
      .bind<string>(asyncCtorId)
      .toDynamicValue(async (_: interfaces.Context) =>
        Promise.resolve("asyncCtor")
      );
    container.bind<string>(syncPropertyId).toConstantValue("syncProperty");
    container
      .bind<string>(asyncPropertyId)
      .toDynamicValue(async (_: interfaces.Context) =>
        Promise.resolve("asyncProperty")
      );
    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      crazyInjectableId
    );
    const crazyInjectable: CrazyInjectable = await resolveTyped<
      Promise<CrazyInjectable>
    >(context);
    expect(crazyInjectable.syncCtor).toBe("syncCtor");
    expect(crazyInjectable.asyncCtor).toBe("asyncCtor");
    expect(crazyInjectable.syncProperty).toBe("syncProperty");
    expect(crazyInjectable.asyncProperty).toBe("asyncProperty");
  });

  it("Should be able to resolve plans with activation handlers", () => {
    interface Sword {
      use(): void;
    }

    @injectable()
    class Katana implements Sword {
      public use() {
        return "Used Katana!";
      }
    }

    interface Warrior {
      katana: Katana;
    }

    @injectable()
    class Ninja implements Warrior {
      public katana: Katana;
      constructor(@inject("Katana") katana: Katana) {
        this.katana = katana;
      }
    }

    const ninjaId = "Ninja";
    const katanaId = "Katana";

    const container: Container = new Container();
    container.bind<Ninja>(ninjaId).to(Ninja);

    // This is a global for unit testing but remember
    // that it is not a good idea to use globals
    const timeTracker: string[] = [];

    container
      .bind<Katana>(katanaId)
      .to(Katana)
      .onActivation((_theContext: interfaces.Context, katana: Katana) => {
        const handler: ProxyHandler<() => string> = {
          apply(target: () => string, thisArgument: Katana, argumentsList: []) {
            timeTracker.push(
              `Starting ${target.name} ${new Date().getTime().toString()}`
            );
            const result: string = target.apply(thisArgument, argumentsList);
            timeTracker.push(
              `Finished ${target.name} ${new Date().getTime().toString()}`
            );
            return result;
          },
        };

        katana.use = new Proxy(katana.use, handler);
        return katana;
      });

    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );

    const ninja: Ninja = resolveTyped<Ninja>(context);

    expect(ninja.katana.use()).toBe("Used Katana!");
    expect(Array.isArray(timeTracker)).toBe(true);
    expect(timeTracker.length).toBe(2);
  });

  it("Should be able to resolve BindingType.Function bindings", () => {
    const ninjaId = "Ninja";
    const shurikenId = "Shuriken";
    const katanaFactoryId = "KatanaFactory";

    type KatanaFactory = () => Katana;

    @injectable()
    class KatanaBlade {}

    @injectable()
    class KatanaHandler {}

    interface Sword {
      handler: KatanaHandler;
      blade: KatanaBlade;
    }

    @injectable()
    class Katana implements Sword {
      public handler: KatanaHandler;
      public blade: KatanaBlade;
      constructor(handler: KatanaHandler, blade: KatanaBlade) {
        this.handler = handler;
        this.blade = blade;
      }
    }

    @injectable()
    class Shuriken {}

    interface Warrior {
      katanaFactory: KatanaFactory;
      shuriken: Shuriken;
    }

    @injectable()
    class Ninja implements Warrior {
      constructor(
        @inject(katanaFactoryId)
        @targetName("katana")
        public katanaFactory: KatanaFactory,
        @inject(shurikenId) @targetName("shuriken") public shuriken: Shuriken
      ) {}
    }

    const container: Container = new Container();
    container.bind<Ninja>(ninjaId).to(Ninja);
    container.bind<Shuriken>(shurikenId).to(Shuriken);

    const katanaFactoryInstance: () => Katana = function () {
      return new Katana(new KatanaHandler(), new KatanaBlade());
    };

    container
      .bind<KatanaFactory>(katanaFactoryId)
      .toFunction(katanaFactoryInstance);

    const katanaFactoryBinding: interfaces.Binding | undefined =
      getBindingDictionary(container).get(katanaFactoryId)[0];
    expect(katanaFactoryBinding?.state.activated).toBe(false);

    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );

    const ninja: Ninja = resolveTyped<Ninja>(context);

    expect(ninja instanceof Ninja).toBe(true);
    expect(typeof ninja.katanaFactory === "function").toBe(true);
    expect(ninja.katanaFactory() instanceof Katana).toBe(true);
    expect(ninja.katanaFactory().handler instanceof KatanaHandler).toBe(true);
    expect(ninja.katanaFactory().blade instanceof KatanaBlade).toBe(true);
    expect(ninja.shuriken instanceof Shuriken).toBe(true);
    expect(katanaFactoryBinding?.state.activated).toBe(true);

    expect(katanaFactoryBinding?.state.activated).toBe(true);
  });

  it("Should run the @PostConstruct method", () => {
    interface Sword {
      use(): string;
    }

    @injectable()
    class Katana implements Sword {
      private useMessage!: string;

      @postConstruct()
      public postConstruct() {
        this.useMessage = "Used Katana!";
      }

      public use() {
        return this.useMessage;
      }
    }

    interface Warrior {
      katana: Katana;
    }

    @injectable()
    class Ninja implements Warrior {
      public katana: Katana;
      constructor(@inject("Katana") katana: Katana) {
        this.katana = katana;
      }
    }
    const ninjaId = "Ninja";
    const katanaId = "Katana";

    const container: Container = new Container();
    container.bind<Ninja>(ninjaId).to(Ninja);

    container.bind<Katana>(katanaId).to(Katana);

    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );

    const ninja: Ninja = resolveTyped<Ninja>(context);

    expect(ninja.katana.use()).toBe("Used Katana!");
  });

  it("Should throw an error if the @postConstruct method throws an error", () => {
    @injectable()
    class Katana {
      @postConstruct()
      public postConstruct() {
        throw new Error("Original Message");
      }
    }

    expect(() =>
      resolveInstance({} as interfaces.Binding<unknown>, Katana, [], () => null)
    ).toThrow("@postConstruct error in class Katana: Original Message");
  });

  it("Should run the @PostConstruct method of parent class", () => {
    interface Weapon {
      use(): string;
    }

    @injectable()
    abstract class Sword implements Weapon {
      protected useMessage!: string;

      @postConstruct()
      public postConstruct() {
        this.useMessage = "Used Weapon!";
      }

      public abstract use(): string;
    }

    @injectable()
    class Katana extends Sword {
      public use() {
        return this.useMessage;
      }
    }

    interface Warrior {
      katana: Katana;
    }

    @injectable()
    class Ninja implements Warrior {
      public katana: Katana;
      constructor(@inject("Katana") katana: Katana) {
        this.katana = katana;
      }
    }
    const ninjaId = "Ninja";
    const katanaId = "Katana";

    const container: Container = new Container();
    container.bind<Ninja>(ninjaId).to(Ninja);

    container.bind<Katana>(katanaId).to(Katana);

    const context: interfaces.Context = plan(
      new MetadataReader(),
      container,
      false,
      TargetTypeEnum.Variable,
      ninjaId
    );

    const ninja: Ninja = resolveTyped<Ninja>(context);

    expect(ninja.katana.use()).toBe("Used Weapon!");
  });

  it("Should run the @PostConstruct method once in the singleton scope", () => {
    let timesCalled = 0;
    @injectable()
    class Katana {
      @postConstruct()
      public postConstruct() {
        timesCalled++;
      }
    }

    @injectable()
    class Ninja {
      public katana: Katana;
      constructor(@inject("Katana") katana: Katana) {
        this.katana = katana;
      }
    }

    @injectable()
    class Samurai {
      public katana: Katana;
      constructor(@inject("Katana") katana: Katana) {
        this.katana = katana;
      }
    }
    const ninjaId = "Ninja";
    const samuraiId = "Samurai";
    const katanaId = "Katana";

    const container: Container = new Container();
    container.bind<Ninja>(ninjaId).to(Ninja);
    container.bind<Samurai>(samuraiId).to(Samurai);
    container.bind<Katana>(katanaId).to(Katana).inSingletonScope();
    container.get(ninjaId);
    container.get(samuraiId);
    expect(timesCalled).toBe(1);
  });

  it("Should support async when default scope is singleton", async () => {
    const container: Container = new Container({ defaultScope: "Singleton" });
    container.bind("a").toDynamicValue(async () => Math.random());

    const object1: unknown = await container.getAsync("a");
    const object2: unknown = await container.getAsync("a");

    expect(object1).toBe(object2);
  });

  it("Should return different values if default singleton scope is overriden by bind", async () => {
    const container: Container = new Container({ defaultScope: "Singleton" });
    container
      .bind("a")
      .toDynamicValue(async () => Math.random())
      .inTransientScope();

    const object1: unknown = await container.getAsync("a");
    const object2: unknown = await container.getAsync("a");

    expect(object1).not.toEqual(object2);
  });

  it("Should only call parent async singleton once within child containers", async () => {
    const parent: Container = new Container();
    parent
      .bind<Date>("Parent")
      .toDynamicValue(async () => Promise.resolve(new Date()))
      .inSingletonScope();
    const child: Container = parent.createChild();
    const [subject1, subject2]: [Date, Date] = await Promise.all([
      child.getAsync<Date>("Parent"),
      child.getAsync<Date>("Parent"),
    ]);

    expect(subject1 === subject2).toBe(true);
  });

  it("should not deactivate a non activated constant value", () => {
    const container: Container = new Container();
    container
      .bind<string>("ConstantValue")
      .toConstantValue("Constant")
      .onDeactivation(sinon.mock().never());
    container.unbind("ConstantValue");
  });

  it("Should return resolved instance to onDeactivation when binding is async", async () => {
    @injectable()
    class Destroyable {}

    const container: Container = new Container();
    let deactivatedDestroyable: Destroyable | null = null;
    container
      .bind<Destroyable>("Destroyable")
      .toDynamicValue(async () => Promise.resolve(new Destroyable()))
      .inSingletonScope()
      .onDeactivation(
        async (instance: Destroyable) =>
          new Promise((resolve: () => void) => {
            deactivatedDestroyable = instance;
            resolve();
          })
      );

    await container.getAsync("Destroyable");

    await container.unbindAsync("Destroyable");

    expect(deactivatedDestroyable).toBeInstanceOf(Destroyable);

    // with BindingInWhenOnSyntax
    const container2: Container = new Container({ defaultScope: "Singleton" });
    let deactivatedDestroyable2: Destroyable | null = null;
    container2
      .bind<Destroyable>("Destroyable")
      .toDynamicValue(async () => Promise.resolve(new Destroyable()))
      .onDeactivation(
        async (instance: Destroyable) =>
          new Promise((resolve: () => void) => {
            deactivatedDestroyable2 = instance;
            resolve();
          })
      );

    await container2.getAsync("Destroyable");

    await container2.unbindAsync("Destroyable");

    expect(deactivatedDestroyable2).toBeInstanceOf(Destroyable);
  });

  it("Should wait on deactivation promise before returning unbindAsync()", async () => {
    let resolved = false;

    @injectable()
    class Destroyable {}

    const container: Container = new Container();
    container
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inSingletonScope()
      .onDeactivation(
        async () =>
          new Promise((resolve: () => void) => {
            resolve();

            resolved = true;
          })
      );

    container.get("Destroyable");

    await container.unbindAsync("Destroyable");

    expect(resolved).toBe(true);
  });

  it("Should wait on predestroy promise before returning unbindAsync()", async () => {
    let resolved = false;

    @injectable()
    class Destroyable {
      @preDestroy()
      public async myPreDestroyMethod() {
        return new Promise((resolve: (value: unknown) => void) => {
          resolve({});

          resolved = true;
        });
      }
    }

    const container: Container = new Container();
    container
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inSingletonScope();

    container.get("Destroyable");

    await container.unbindAsync("Destroyable");

    expect(resolved).toBe(true);
  });

  it("Should wait on deactivation promise before returning unbindAllAsync()", async () => {
    let resolved = false;

    @injectable()
    class Destroyable {}

    const container: Container = new Container();
    container
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inSingletonScope()
      .onDeactivation(
        async () =>
          new Promise((resolve: () => void) => {
            resolve();

            resolved = true;
          })
      );

    container.get("Destroyable");

    await container.unbindAllAsync();

    expect(resolved).toBe(true);
  });

  it("Should wait on predestroy promise before returning unbindAllAsync()", async () => {
    let resolved = false;

    @injectable()
    class Destroyable {
      @preDestroy()
      public async myPreDestroyMethod() {
        return new Promise((resolve: (value: unknown) => void) => {
          resolve({});

          resolved = true;
        });
      }
    }

    const container: Container = new Container();
    container
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inSingletonScope();

    container.get("Destroyable");

    await container.unbindAllAsync();

    expect(resolved).toBe(true);
  });

  it("Should call bind.cache.then on unbind w/ PromiseLike binding", async () => {
    const bindStub: sinon.SinonStub = sinon.stub().callsFake(() => {
      return {
        serviceIdentifier: "PromiseLike",
      };
    });

    const stub: sinon.SinonStub = sinon
      .stub()
      .callsFake((bindResolve: (value: unknown) => void) => {
        bindResolve(bindStub());
      });

    @injectable()
    class PromiseLike {
      public then() {
        return {
          then: stub,
        };
      }
    }

    const container: Container = new Container();

    container.bind("PromiseLike").toConstantValue(new PromiseLike());

    void container.getAsync("PromiseLike");

    container.unbindAll();

    sinon.assert.calledOnce(stub);
    sinon.assert.calledOnce(bindStub);
  });

  it("Should not allow transient construction with async preDestroy", async () => {
    @injectable()
    class Destroyable {
      @preDestroy()
      public async myPreDestroyMethod() {
        return Promise.resolve();
      }
    }

    const container: Container = new Container();
    container
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inTransientScope();

    expect(() => container.get("Destroyable")).toThrow(
      "@preDestroy error in class Destroyable: Class cannot be instantiated in transient scope."
    );
  });

  it("Should not allow transient construction with async deactivation", async () => {
    @injectable()
    class Destroyable {}

    const container: Container = new Container();
    container
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inTransientScope()
      .onDeactivation(async () => Promise.resolve());

    expect(() => container.get("Destroyable")).toThrow(
      "onDeactivation() error in class Destroyable: Class cannot be instantiated in transient scope."
    );
  });

  it("Should not allow request construction with preDestroy", async () => {
    @injectable()
    class Destroyable {
      @preDestroy()
      public myPreDestroyMethod() {
        return;
      }
    }

    const container: Container = new Container();
    container.bind<Destroyable>("Destroyable").to(Destroyable).inRequestScope();

    expect(() => container.get("Destroyable")).toThrow(
      "@preDestroy error in class Destroyable: Class cannot be instantiated in request scope."
    );
  });

  it("Should not allow request construction with deactivation", async () => {
    @injectable()
    class Destroyable {}

    const container: Container = new Container();
    container
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inRequestScope()
      .onDeactivation(() => {
        //
      });

    expect(() => container.get("Destroyable")).toThrow(
      "onDeactivation() error in class Destroyable: Class cannot be instantiated in request scope."
    );
  });

  it("Should force a class with an async deactivation to use the async unbindAll api", async () => {
    @injectable()
    class Destroyable {}

    const container: Container = new Container();
    container
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inSingletonScope()
      .onDeactivation(async () => Promise.resolve());

    container.get("Destroyable");

    expect(() => container.unbindAll()).toThrow(
      "Attempting to unbind dependency with asynchronous destruction (@preDestroy or onDeactivation)"
    );
  });

  it("Should force a class with an async pre destroy to use the async unbindAll api", async () => {
    @injectable()
    class Destroyable {
      @preDestroy()
      public async myPreDestroyMethod() {
        return Promise.resolve();
      }
    }

    const container: Container = new Container();
    container
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inSingletonScope();

    container.get("Destroyable");

    expect(() => container.unbindAll()).toThrow(
      "Attempting to unbind dependency with asynchronous destruction (@preDestroy or onDeactivation)"
    );
  });

  it("Should force a class with an async deactivation to use the async unbind api", async () => {
    @injectable()
    class Destroyable {}

    const container: Container = new Container();
    container
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inSingletonScope()
      .onDeactivation(async () => Promise.resolve());

    container.get("Destroyable");

    expect(() => container.unbind("Destroyable")).toThrow(
      "Attempting to unbind dependency with asynchronous destruction (@preDestroy or onDeactivation)"
    );
  });

  it("Should throw deactivation error when errors in deactivation ( sync )", () => {
    @injectable()
    class Destroyable {}
    const errorMessage = "the error message";
    const container: Container = new Container();
    container
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inSingletonScope()
      .onDeactivation(() => {
        throw new Error(errorMessage);
      });

    container.get("Destroyable");

    const expectedErrorMessage: string = ERROR_MSGS.ON_DEACTIVATION_ERROR(
      "Destroyable",
      errorMessage
    );

    expect(() => container.unbind("Destroyable")).toThrow(expectedErrorMessage);
  });

  it("Should throw deactivation error when errors in deactivation ( async )", async () => {
    @injectable()
    class Destroyable {}
    const errorMessage = "the error message";
    const container: Container = new Container();
    container
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inSingletonScope()
      .onDeactivation(async () => Promise.reject(new Error(errorMessage)));

    container.get("Destroyable");

    const expectedErrorMessage: string = ERROR_MSGS.ON_DEACTIVATION_ERROR(
      "Destroyable",
      errorMessage
    );

    let error: unknown;
    try {
      await container.unbindAsync("Destroyable");
    } catch (e: unknown) {
      error = e;
    }
    expect((error as Error).message).toBe(expectedErrorMessage);
  });

  it("Should invoke destroy in order (all async): child container, parent container, binding, class", async () => {
    let roll = 1;
    let binding: number | null = null;
    let klass: number | null = null;
    let parent: number | null = null;
    let child: number | null = null;

    @injectable()
    class Destroyable {
      @preDestroy()
      public async myPreDestroyMethod() {
        return new Promise((resolve: (value: unknown) => void) => {
          klass = roll;
          roll += 1;
          resolve({});
        });
      }
    }

    const container: Container = new Container();
    container.onDeactivation("Destroyable", async () => {
      return new Promise((resolve: () => void) => {
        parent = roll;
        roll += 1;
        resolve();
      });
    });

    const childContainer: Container = container.createChild();
    childContainer
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inSingletonScope()
      .onDeactivation(
        async () =>
          new Promise((resolve: () => void) => {
            binding = roll;
            roll += 1;
            resolve();
          })
      );
    childContainer.onDeactivation("Destroyable", async () => {
      return new Promise((resolve: () => void) => {
        child = roll;
        roll += 1;
        resolve();
      });
    });

    childContainer.get("Destroyable");
    await childContainer.unbindAsync("Destroyable");

    expect(roll).toBe(5);
    expect(child).toBe(1);
    expect(parent).toBe(2);
    expect(binding).toBe(3);
    expect(klass).toBe(4);
  });

  it("Should invoke destroy in order (sync + async): child container, parent container, binding, class", async () => {
    let roll = 1;
    let binding: number | null = null;
    let klass: number | null = null;
    let parent: number | null = null;
    let child: number | null = null;

    @injectable()
    class Destroyable {
      @preDestroy()
      public async myPreDestroyMethod() {
        return new Promise((resolve: (value: unknown) => void) => {
          klass = roll;
          roll += 1;
          resolve({});
        });
      }
    }

    const container: Container = new Container();
    container.onDeactivation("Destroyable", () => {
      parent = roll;
      roll += 1;
    });

    const childContainer: Container = container.createChild();
    childContainer
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inSingletonScope()
      .onDeactivation(() => {
        binding = roll;
        roll += 1;
      });
    childContainer.onDeactivation("Destroyable", async () => {
      return new Promise((resolve: () => void) => {
        child = roll;
        roll += 1;
        resolve();
      });
    });

    childContainer.get("Destroyable");
    await childContainer.unbindAsync("Destroyable");

    expect(roll).toBe(5);
    expect(child).toBe(1);
    expect(parent).toBe(2);
    expect(binding).toBe(3);
    expect(klass).toBe(4);
  });

  it("Should invoke destroy in order (all sync): child container, parent container, binding, class", () => {
    let roll = 1;
    let binding: number | null = null;
    let klass: number | null = null;
    let parent: number | null = null;
    let child: number | null = null;

    @injectable()
    class Destroyable {
      @preDestroy()
      public myPreDestroyMethod() {
        klass = roll;
        roll += 1;
      }
    }

    const container: Container = new Container();
    container.onDeactivation("Destroyable", () => {
      parent = roll;
      roll += 1;
    });

    const childContainer: Container = container.createChild();
    childContainer
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inSingletonScope()
      .onDeactivation(() => {
        binding = roll;
        roll += 1;
      });
    childContainer.onDeactivation("Destroyable", () => {
      child = roll;
      roll += 1;
    });

    childContainer.get("Destroyable");
    childContainer.unbind("Destroyable");

    expect(roll).toBe(5);
    expect(child).toBe(1);
    expect(parent).toBe(2);
    expect(binding).toBe(3);
    expect(klass).toBe(4);
  });

  it("Should invoke destroy in order (async): child container, parent container, binding, class", async () => {
    let roll = 1;
    let binding: number | null = null;
    let klass: number | null = null;
    let parent: number | null = null;
    let child: number | null = null;

    @injectable()
    class Destroyable {
      @preDestroy()
      public async myPreDestroyMethod() {
        klass = roll;
        roll += 1;
      }
    }

    const container: Container = new Container();
    container.onDeactivation("Destroyable", async () => {
      parent = roll;
      roll += 1;
    });

    const childContainer: Container = container.createChild();
    childContainer
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inSingletonScope()
      .onDeactivation(() => {
        binding = roll;
        roll += 1;
      });
    childContainer.onDeactivation("Destroyable", () => {
      child = roll;
      roll += 1;
    });

    childContainer.get("Destroyable");
    await childContainer.unbindAsync("Destroyable");

    expect(roll).toBe(5);
    expect(child).toBe(1);
    expect(parent).toBe(2);
    expect(binding).toBe(3);
    expect(klass).toBe(4);
  });

  it("Should force a class with an async pre destroy to use the async unbind api", async () => {
    @injectable()
    class Destroyable {
      @preDestroy()
      public async myPreDestroyMethod() {
        return Promise.resolve();
      }
    }

    const container: Container = new Container();
    container
      .bind<Destroyable>("Destroyable")
      .to(Destroyable)
      .inSingletonScope();

    container.get("Destroyable");

    expect(() => container.unbind("Destroyable")).toThrow(
      "Attempting to unbind dependency with asynchronous destruction (@preDestroy or onDeactivation)"
    );
  });

  it("Should force a class with an async onActivation to use the async api", async () => {
    @injectable()
    class Constructable {}

    const container: Container = new Container();
    container
      .bind<Constructable>("Constructable")
      .to(Constructable)
      .inSingletonScope()
      .onActivation(async () => Promise.resolve());

    expect(() => container.get("Constructable")).toThrow(
      `You are attempting to construct 'Constructable' in a synchronous way but it has asynchronous dependencies.`
    );
  });

  it("Should force a class with an async post construct to use the async api", async () => {
    @injectable()
    class Constructable {
      @postConstruct()
      public async myPostConstructMethod() {
        return Promise.resolve();
      }
    }

    const container: Container = new Container();
    container.bind<Constructable>("Constructable").to(Constructable);

    expect(() => container.get("Constructable")).toThrow(
      `You are attempting to construct 'Constructable' in a synchronous way but it has asynchronous dependencies.`
    );
  });

  it("Should return resolved instance to onActivation when binding is async", async () => {
    @injectable()
    class Constructable {}
    let activated: Constructable | null = null;
    const container: Container = new Container();
    container
      .bind<Constructable>("Constructable")
      .toDynamicValue(async () => Promise.resolve(new Constructable()))
      .inSingletonScope()
      .onActivation(
        async (_context: interfaces.Context, c: Constructable) =>
          new Promise((resolve: (value: Constructable) => void) => {
            activated = c;
            resolve(c);
          })
      );

    await container.getAsync("Constructable");
    expect(activated).toBeInstanceOf(Constructable);
  });

  it("Should not allow sync get if an async activation was added to container", async () => {
    const container: Container = new Container();
    container.bind("foo").toConstantValue("bar");

    container.onActivation("foo", async () => Promise.resolve("baz"));

    expect(() => container.get("foo")).toThrow(
      `You are attempting to construct 'foo' in a synchronous way but it has asynchronous dependencies.`
    );
  });

  it("Should allow onActivation (sync) of a previously binded sync object (without activation)", async () => {
    const container: Container = new Container();
    container.bind("foo").toConstantValue("bar");

    container.onActivation("foo", () => "baz");

    const result: unknown = container.get("foo");

    expect(result).toBe("baz");
  });

  it("Should allow onActivation to replace objects in async autoBindInjectable chain", async () => {
    class Level1 {}

    @injectable()
    class Level2 {
      public level1: Level1;

      constructor(@inject(Level1) l1: Level1) {
        this.level1 = l1;
      }
    }

    @injectable()
    class Level3 {
      public level2: Level2;

      constructor(@inject(Level2) l2: Level2) {
        this.level2 = l2;
      }
    }

    const constructedLevel2: Level2 = new Level2(new Level1());

    const container: Container = new Container({
      autoBindInjectable: true,
      defaultScope: "Singleton",
    });
    container
      .bind(Level1)
      .toDynamicValue(async () => Promise.resolve(new Level1()));
    container.onActivation(Level2, async () =>
      Promise.resolve(constructedLevel2)
    );

    const level2: Level2 = await container.getAsync(Level2);

    expect(level2).toBe(constructedLevel2);

    const level3: Level3 = await container.getAsync(Level3);

    expect(level3.level2).toBe(constructedLevel2);
  });

  it("Should allow onActivation (async) of a previously binded sync object (without activation)", async () => {
    const container: Container = new Container();
    container.bind("foo").toConstantValue("bar");

    container.onActivation("foo", async () => Promise.resolve("baz"));

    const result: unknown = await container.getAsync("foo");

    expect(result).toBe("baz");
  });

  it("Should allow onActivation (sync) of a previously binded async object (without activation)", async () => {
    const container: Container = new Container();
    container.bind("foo").toDynamicValue(async () => Promise.resolve("bar"));

    container.onActivation("foo", () => "baz");

    const result: unknown = await container.getAsync("foo");

    expect(result).toBe("baz");
  });

  it("Should allow onActivation (async) of a previously binded async object (without activation)", async () => {
    const container: Container = new Container();
    container.bind("foo").toDynamicValue(async () => Promise.resolve("bar"));

    container.onActivation("foo", async () => Promise.resolve("baz"));

    const result: unknown = await container.getAsync("foo");

    expect(result).toBe("baz");
  });

  it("Should allow onActivation (sync) of a previously binded sync object (with activation)", async () => {
    const container: Container = new Container();
    container
      .bind("foo")
      .toConstantValue("bar")
      .onActivation(() => "bum");

    container.onActivation(
      "foo",
      (_context: interfaces.Context, previous: unknown) => `${previous}baz`
    );

    const result: unknown = container.get("foo");

    expect(result).toBe("bumbaz");
  });

  it("Should allow onActivation (async) of a previously binded sync object (with activation)", async () => {
    const container: Container = new Container();
    container
      .bind("foo")
      .toConstantValue("bar")
      .onActivation(() => "bum");

    container.onActivation(
      "foo",
      async (_context: interfaces.Context, previous: unknown) =>
        Promise.resolve(`${previous}baz`)
    );

    const result: unknown = await container.getAsync("foo");

    expect(result).toBe("bumbaz");
  });

  it("Should allow onActivation (sync) of a previously binded async object (with activation)", async () => {
    const container: Container = new Container();
    container
      .bind("foo")
      .toDynamicValue(async () => Promise.resolve("bar"))
      .onActivation(() => "bum");

    container.onActivation(
      "foo",
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      (_context: interfaces.Context, previous: unknown) => `${previous}baz`
    );

    const result: unknown = await container.getAsync("foo");

    expect(result).toBe("bumbaz");
  });

  it("Should allow onActivation (async) of a previously binded async object (with activation)", async () => {
    const container: Container = new Container();
    container
      .bind("foo")
      .toDynamicValue(async () => Promise.resolve("bar"))
      .onActivation(() => "bum");

    container.onActivation(
      "foo",
      async (_context: interfaces.Context, previous: unknown) =>
        Promise.resolve(`${previous}baz`)
    );

    const result: unknown = await container.getAsync("foo");

    expect(result).toBe("bumbaz");
  });

  it("Should allow onActivation (sync) of parent (async) through autobind tree", async () => {
    class Parent {}

    @injectable()
    class Child {
      public parent: Parent;

      constructor(@inject(Parent) parent: Parent) {
        this.parent = parent;
      }
    }

    const container: Container = new Container({ autoBindInjectable: true });
    container
      .bind<Parent>(Parent)
      .toDynamicValue(async () => Promise.resolve(new Parent()));

    const constructed: Parent = new Parent();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    constructed.foo = "bar";

    container.onActivation(Parent, () => constructed);

    const result: Child = await container.getAsync(Child);

    expect(result.parent).toBe(constructed);
  });

  it("Should allow onActivation (sync) of child (async) through autobind tree", async () => {
    class Parent {}

    @injectable()
    class Child {
      public parent: Parent;

      constructor(@inject(Parent) parent: Parent) {
        this.parent = parent;
      }
    }

    const container: Container = new Container({ autoBindInjectable: true });
    container
      .bind<Parent>(Parent)
      .toDynamicValue(async () => Promise.resolve(new Parent()));

    const constructed: Child = new Child(new Parent());

    container.onActivation(Child, () => constructed);

    const result: Child = await container.getAsync(Child);

    expect(result).toBe(constructed);
  });

  it("Should allow onActivation (async) of parent (async) through autobind tree", async () => {
    class Parent {}

    @injectable()
    class Child {
      public parent: Parent;

      constructor(@inject(Parent) parent: Parent) {
        this.parent = parent;
      }
    }

    const container: Container = new Container({ autoBindInjectable: true });
    container
      .bind<Parent>(Parent)
      .toDynamicValue(async () => Promise.resolve(new Parent()));

    const constructed: Parent = new Parent();

    container.onActivation(Parent, async () => Promise.resolve(constructed));

    const result: Child = await container.getAsync(Child);

    expect(result.parent).toBe(constructed);
  });

  it("Should allow onActivation (async) of child (async) through autobind tree", async () => {
    class Parent {}

    @injectable()
    class Child {
      public parent: Parent;

      constructor(@inject(Parent) parent: Parent) {
        this.parent = parent;
      }
    }

    const container: Container = new Container({ autoBindInjectable: true });
    container
      .bind<Parent>(Parent)
      .toDynamicValue(async () => Promise.resolve(new Parent()));

    const constructed: Child = new Child(new Parent());

    container.onActivation(Child, async () => Promise.resolve(constructed));

    const result: Child = await container.getAsync(Child);

    expect(result).toBe(constructed);
  });

  it("Should allow onActivation of child on parent container", async () => {
    class Parent {}

    @injectable()
    class Child {
      public parent: Parent;

      constructor(@inject(Parent) parent: Parent) {
        this.parent = parent;
      }
    }

    const container: Container = new Container({ autoBindInjectable: true });
    container
      .bind<Parent>(Parent)
      .toDynamicValue(async () => Promise.resolve(new Parent()));

    const constructed: Child = new Child(new Parent());

    container.onActivation(Child, async () => Promise.resolve(constructed));

    const child: Container = container.createChild();

    const result: Child = await child.getAsync(Child);

    expect(result).toBe(constructed);
  });

  it("Should allow onActivation of parent on parent container", async () => {
    class Parent {}

    @injectable()
    class Child {
      public parent: Parent;

      constructor(@inject(Parent) parent: Parent) {
        this.parent = parent;
      }
    }

    const container: Container = new Container({ autoBindInjectable: true });
    container
      .bind<Parent>(Parent)
      .toDynamicValue(async () => Promise.resolve(new Parent()));

    const constructed: Parent = new Parent();

    container.onActivation(Parent, async () => Promise.resolve(constructed));

    const child: Container = container.createChild();

    const result: Child = await child.getAsync(Child);

    expect(result.parent).toBe(constructed);
  });

  it("Should allow onActivation of child from child container", async () => {
    class Parent {}

    @injectable()
    class Child {
      public parent: Parent;

      constructor(@inject(Parent) parent: Parent) {
        this.parent = parent;
      }
    }

    const container: Container = new Container({ autoBindInjectable: true });
    container
      .bind<Parent>(Parent)
      .toDynamicValue(async () => Promise.resolve(new Parent()));

    const constructed: Child = new Child(new Parent());

    const child: Container = container.createChild();
    child.onActivation(Child, async () => Promise.resolve(constructed));

    const result: Child = await child.getAsync(Child);

    expect(result).toBe(constructed);
  });

  it("Should priortize onActivation of parent container over child container", () => {
    const container: Container = new Container();
    container.onActivation(
      "foo",
      (_context: interfaces.Context, previous: unknown) => `${previous}baz`
    );
    container.onActivation(
      "foo",
      (_context: interfaces.Context, previous: unknown) => `${previous}1`
    );

    const child: Container = container.createChild();

    child
      .bind<string>("foo")
      .toConstantValue("bar")
      .onActivation(
        (_context: interfaces.Context, previous: string) => `${previous}bah`
      );
    child.onActivation(
      "foo",
      (_context: interfaces.Context, previous: unknown) => `${previous}bum`
    );
    child.onActivation(
      "foo",
      (_context: interfaces.Context, previous: unknown) => `${previous}2`
    );

    const result: unknown = child.get("foo");

    expect(result).toBe("barbahbaz1bum2");
  });

  it("Should priortize async onActivation of parent container over child container (async)", async () => {
    const container: Container = new Container();
    container.onActivation(
      "foo",
      async (_context: interfaces.Context, previous: unknown) =>
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `${previous}baz`
    );
    container.onActivation(
      "foo",
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      async (_context: interfaces.Context, previous: unknown) => `${previous}1`
    );

    const child: Container = container.createChild();

    child
      .bind<string>("foo")
      .toConstantValue("bar")
      .onActivation(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        (_context: interfaces.Context, previous: unknown) => `${previous}bah`
      );
    child.onActivation(
      "foo",
      async (_context: interfaces.Context, previous: unknown) =>
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `${previous}bum`
    );
    child.onActivation(
      "foo",
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      async (_context: interfaces.Context, previous: unknown) => `${previous}2`
    );

    const result: unknown = await child.getAsync("foo");

    expect(result).toBe("barbahbaz1bum2");
  });

  it("Should not allow onActivation of parent on child container", async () => {
    class Parent {}

    @injectable()
    class Child {
      public parent: Parent;

      constructor(@inject(Parent) parent: Parent) {
        this.parent = parent;
      }
    }

    const container: Container = new Container({ autoBindInjectable: true });
    container
      .bind<Parent>(Parent)
      .toDynamicValue(async () => Promise.resolve(new Parent()))
      .inSingletonScope();

    const constructed: Parent = new Parent();

    const child: Container = container.createChild();
    child.onActivation(Parent, async () => Promise.resolve(constructed));

    const result: Child = await child.getAsync(Child);

    expect(result.parent).not.toBe(constructed);
  });

  it("Should wait until onActivation promise resolves before returning object", async () => {
    let resolved = false;

    @injectable()
    class Constructable {}

    const container: Container = new Container();
    container
      .bind<Constructable>("Constructable")
      .to(Constructable)
      .inSingletonScope()
      .onActivation(
        async (_context: interfaces.Context, c: Constructable) =>
          new Promise((resolve: (value: Constructable) => void) => {
            resolved = true;
            resolve(c);
          })
      );

    const result: unknown = await container.getAsync("Constructable");

    expect(result).toBeInstanceOf(Constructable);
    expect(resolved).toBe(true);
  });

  it("Should wait until postConstruct promise resolves before returning object", async () => {
    let resolved = false;

    @injectable()
    class Constructable {
      @postConstruct()
      public async myPostConstructMethod() {
        return new Promise((resolve: (value: unknown) => void) => {
          resolved = true;
          resolve({});
        });
      }
    }

    const container: Container = new Container();
    container.bind<Constructable>("Constructable").to(Constructable);

    const result: unknown = await container.getAsync("Constructable");

    expect(result).toBeInstanceOf(Constructable);
    expect(resolved).toBe(true);
  });

  it("Should only call async method once if marked as singleton (indirect)", async () => {
    @injectable()
    class UseDate implements UseDate {
      public currentDate: Date;
      constructor(@inject("Date") currentDate: Date) {
        expect(currentDate).toBeInstanceOf(Date);

        this.currentDate = currentDate;
      }
      public doSomething() {
        return this.currentDate;
      }
    }

    const container: Container = new Container();
    container.bind<UseDate>("UseDate").to(UseDate);
    container
      .bind<Date>("Date")
      .toDynamicValue(async () => Promise.resolve(new Date()))
      .inSingletonScope();

    const subject1: UseDate = await container.getAsync<UseDate>("UseDate");
    const subject2: UseDate = await container.getAsync<UseDate>("UseDate");
    expect(subject1.doSomething() === subject2.doSomething()).toBe(true);
  });

  it("Should support async singletons when using autoBindInjectable", async () => {
    @injectable()
    class AsyncValue {
      public date: Date;
      constructor(@inject("Date") date: Date) {
        this.date = date;
      }
    }

    @injectable()
    class MixedDependency {
      public asyncValue: AsyncValue;
      public date!: Date;
      constructor(@inject(AsyncValue) asyncValue: AsyncValue) {
        expect(asyncValue).toBeInstanceOf(AsyncValue);

        this.asyncValue = asyncValue;
      }
    }

    const container: Container = new Container({
      autoBindInjectable: true,
      defaultScope: "Singleton",
    });
    container
      .bind<Date>("Date")
      .toDynamicValue(async () => Promise.resolve(new Date()))
      .inSingletonScope();

    const object1: MixedDependency = await container.getAsync<MixedDependency>(
      MixedDependency
    );
    const object2: MixedDependency = await container.getAsync<MixedDependency>(
      MixedDependency
    );

    expect(object1).toBe(object2);
  });

  it("Should support shared async singletons when using autoBindInjectable", async () => {
    @injectable()
    class AsyncValue {
      public date: Date;
      constructor(@inject("Date") date: Date) {
        this.date = date;
      }
    }

    @injectable()
    class MixedDependency {
      public asyncValue: AsyncValue;
      constructor(@inject(AsyncValue) asyncValue: AsyncValue) {
        expect(asyncValue).toBeInstanceOf(AsyncValue);

        this.asyncValue = asyncValue;
      }
    }

    const container: Container = new Container({
      autoBindInjectable: true,
      defaultScope: "Singleton",
    });
    container
      .bind<Date>("Date")
      .toDynamicValue(async () => Promise.resolve(new Date()))
      .inSingletonScope();

    const async: AsyncValue = await container.getAsync<AsyncValue>(AsyncValue);

    const object1: MixedDependency = await container.getAsync<MixedDependency>(
      MixedDependency
    );

    expect(async).toBe(object1.asyncValue);
  });

  it("Should support async dependencies in multiple layers", async () => {
    @injectable()
    class AsyncValue {
      public date: Date;
      constructor(@inject("Date") date: Date) {
        this.date = date;
      }
    }

    @injectable()
    class MixedDependency {
      public asyncValue: AsyncValue;
      public date: Date;
      constructor(
        @inject(AsyncValue) asyncValue: AsyncValue,
        @inject("Date") date: Date
      ) {
        expect(asyncValue).toBeInstanceOf(AsyncValue);
        expect(date).toBeInstanceOf(Date);

        this.date = date;
        this.asyncValue = asyncValue;
      }
    }

    const container: Container = new Container({ autoBindInjectable: true });
    container
      .bind<Date>("Date")
      .toDynamicValue(async () => Promise.resolve(new Date()))
      .inSingletonScope();

    const subject1: MixedDependency = await container.getAsync<MixedDependency>(
      MixedDependency
    );
    expect(subject1.date).toBeInstanceOf(Date);
    expect(subject1.asyncValue).toBeInstanceOf(AsyncValue);
  });

  it("Should support async values already in cache", async () => {
    const container: Container = new Container({ autoBindInjectable: true });
    container
      .bind<Date>("Date")
      .toDynamicValue(async () => Promise.resolve(new Date()))
      .inSingletonScope();

    expect(await container.getAsync<Date>("Date")).toBeInstanceOf(Date); // causes container to cache singleton as Lazy object
    expect(await container.getAsync<Date>("Date")).toBeInstanceOf(Date);
  });

  it("Should support async values already in cache when there dependencies", async () => {
    @injectable()
    class HasDependencies {
      constructor(@inject("Date") date: Date) {
        expect(date).toBeInstanceOf(Date);
      }
    }

    const container: Container = new Container({ autoBindInjectable: true });
    container
      .bind<Date>("Date")
      .toDynamicValue(async () => Promise.resolve(new Date()))
      .inSingletonScope();

    expect(await container.getAsync<Date>("Date")).toBeInstanceOf(Date); // causes container to cache singleton as Lazy object
    await container.getAsync<HasDependencies>(HasDependencies);
  });

  it("Should support async values already in cache when there are transient dependencies", async () => {
    @injectable()
    class Parent {
      constructor(@inject("Date") date: Date) {
        expect(date).toBeInstanceOf(Date);
      }
    }

    @injectable()
    class Child {
      constructor(@inject(Parent) parent: Parent, @inject("Date") date: Date) {
        expect(parent).toBeInstanceOf(Parent);
        expect(date).toBeInstanceOf(Date);
      }
    }

    const container: Container = new Container({ autoBindInjectable: true });
    container
      .bind<Date>("Date")
      .toDynamicValue(async () => Promise.resolve(new Date()))
      .inSingletonScope();

    expect(await container.getAsync<Date>("Date")).toBeInstanceOf(Date); // causes container to cache singleton as Lazy object
    await container.getAsync<Child>(Child);
  });

  it("Should be able to mix async bindings with non-async values", async () => {
    @injectable()
    class UseDate implements UseDate {
      public currentDate: Date;
      public foobar: string;

      constructor(
        @inject("Date") currentDate: Date,
        @inject("Static") foobar: string
      ) {
        expect(currentDate).toBeInstanceOf(Date);

        this.currentDate = currentDate;
        this.foobar = foobar;
      }
    }

    const container: Container = new Container();
    container.bind<UseDate>("UseDate").to(UseDate);
    container
      .bind<Date>("Date")
      .toDynamicValue(async () => Promise.resolve(new Date()));
    container.bind<string>("Static").toConstantValue("foobar");

    const subject1: UseDate = await container.getAsync<UseDate>("UseDate");
    expect(subject1.foobar).toBe("foobar");
  });

  it("Should throw exception if using sync API with async dependencies", async () => {
    @injectable()
    class UseDate implements UseDate {
      public currentDate: Date;
      constructor(@inject("Date") currentDate: Date) {
        expect(currentDate).toBeInstanceOf(Date);

        this.currentDate = currentDate;
      }
      public doSomething() {
        return this.currentDate;
      }
    }

    const container: Container = new Container();
    container.bind<UseDate>("UseDate").to(UseDate);
    container
      .bind<Date>("Date")
      .toDynamicValue(async () => Promise.resolve(new Date()));

    expect(() => container.get<UseDate>("UseDate")).toThrow(
      `You are attempting to construct 'UseDate' in a synchronous way but it has asynchronous dependencies.`
    );
  });

  it("Should be able to resolve indirect Promise bindings", async () => {
    @injectable()
    class UseDate implements UseDate {
      public currentDate: Date;
      constructor(@inject("Date") currentDate: Date) {
        expect(currentDate).toBeInstanceOf(Date);

        this.currentDate = currentDate;
      }
      public doSomething() {
        return this.currentDate;
      }
    }

    const container: Container = new Container();
    container.bind<UseDate>("UseDate").to(UseDate);
    container
      .bind<Date>("Date")
      .toDynamicValue(async () => Promise.resolve(new Date()));

    const subject1: UseDate = await container.getAsync<UseDate>("UseDate");
    const subject2: UseDate = await container.getAsync<UseDate>("UseDate");
    expect(subject1.doSomething() === subject2.doSomething()).toBe(false);
  });

  it("Should be able to resolve direct promise bindings", async () => {
    const container: Container = new Container();
    container
      .bind<string>("async")
      .toDynamicValue(async () => Promise.resolve("foobar"));

    const value: string = await container.getAsync<string>("async");
    expect(value).toBe("foobar");
  });

  it("Should error if trying to resolve an promise in sync API", () => {
    const container: Container = new Container();
    container
      .bind<string>("async")
      .toDynamicValue(async () => Promise.resolve("foobar"));

    expect(() => container.get<string>("async")).toThrow(
      `You are attempting to construct 'async' in a synchronous way but it has asynchronous dependencies.`
    );
  });

  it("Should cache a a resolved value on singleton when possible", async () => {
    const container: Container = new Container();

    const asyncServiceIdentifier = "async";

    const asyncServiceDynamicResolvedValue = "foobar";
    const asyncServiceDynamicValue: Promise<string> = Promise.resolve(
      asyncServiceDynamicResolvedValue
    );
    const asyncServiceDynamicValueCallback: sinon.SinonSpy<
      [],
      Promise<string>
    > = sinon.spy(async () => asyncServiceDynamicValue);

    container
      .bind<string>(asyncServiceIdentifier)
      .toDynamicValue(asyncServiceDynamicValueCallback)
      .inSingletonScope();

    const serviceFromGetAsync: unknown = await container.getAsync(
      asyncServiceIdentifier
    );

    await asyncServiceDynamicValue;

    const serviceFromGet: unknown = container.get(asyncServiceIdentifier);

    expect(asyncServiceDynamicValueCallback.callCount).toBe(1);
    expect(serviceFromGetAsync).toBe(asyncServiceDynamicResolvedValue);
    expect(serviceFromGet).toBe(asyncServiceDynamicResolvedValue);
  });

  it("Should resolve bindings with container property and its dependencies", async () => {
    @injectable()
    class Foo {}

    @injectable()
    class Bar {
      constructor(@inject(Foo) public foo: Foo) {}
    }

    @injectable()
    class Baz {
      constructor(@inject(Bar) public bar: Bar) {}
    }

    const container1: Container = new Container();
    container1.bind(Foo).toSelf();
    container1.bind(Bar).toSelf();
    container1.bind(Baz).toSelf();

    const container2: Container = new Container();

    container2.copyBindings(container1, [Baz]);

    const context: interfaces.Context = plan(
      new MetadataReader(),
      container2,
      false,
      TargetTypeEnum.Variable,
      Baz
    );
    const baz: Baz = resolveTyped<Baz>(context);

    expect(baz.bar.foo).toBeInstanceOf(Foo);
  });
});
