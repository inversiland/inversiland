/* eslint-disable @typescript-eslint/no-explicit-any */
import { Container } from "inversify";
import Provider, {
  ClassProvider,
  ConstructorProvider,
  FactoryProvider,
  ValueProvider,
} from "../types/Provider";
import isConstructorProvider from "./validation/isConstructorProvider";
import isClassProvider from "./validation/isClassProvider";
import isValueProvider from "./validation/isValueProvider";
import isFactoryProvider from "./validation/isFactoryProvider";
import setScope from "./setScope";

const bindProvider = (provider: Provider, container: Container) => {
  if (isConstructorProvider(provider)) {
    const constructorProvider = provider as ConstructorProvider;

    container.bind(constructorProvider).toSelf().inSingletonScope();
  } else if (isClassProvider(provider)) {
    const classProvider = provider as ClassProvider;
    setScope(
      classProvider.provide
        ? container.bind(classProvider.provide).to(classProvider.useClass)
        : container.bind(classProvider.useClass).toSelf(),
      classProvider.scope
    );
  } else if (isValueProvider(provider)) {
    const valueProvider = provider as ValueProvider;
    container
      .bind(valueProvider.provide)
      .toConstantValue(valueProvider.useValue);
  } else if (isFactoryProvider(provider)) {
    const factoryProvider = provider as FactoryProvider;
    container
      .bind(factoryProvider.provide)
      .toFactory(factoryProvider.useFactory);
  }
};

export default bindProvider;
