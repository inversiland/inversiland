import { Container, interfaces } from "@inversiland/inversify";

import bindProviderToContainer from "../binding/bindProviderToContainer";
import { IMPORTED_TAG, PROVIDED_TAG } from "../constants";
import Inversiland from "../inversiland/Inversiland";
import { debugMiddleware } from "../middlewares";
import { Provider } from "../types";

/**
 * @description Wrapper for inversify container to handle meaningful concern of provider.
 */
export default class ModuleContainer {
  private container: Container;

  constructor() {
    (this.container = Inversiland.globalContainer.createChild()),
      this.container.applyMiddleware(debugMiddleware);
  }

  get innerContainer() {
    return this.container;
  }

  isBound(serviceIdentifier: interfaces.ServiceIdentifier) {
    return this.container.isBound(serviceIdentifier);
  }

  isCurrentBound(serviceIdentifier: interfaces.ServiceIdentifier) {
    return this.container.isCurrentBound(serviceIdentifier);
  }

  isProvided(serviceIdentifier: interfaces.ServiceIdentifier) {
    return this.container.isBoundTagged(serviceIdentifier, PROVIDED_TAG, true);
  }

  isCurrentProvided(serviceIdentifier: interfaces.ServiceIdentifier) {
    return this.container.isCurrentBoundTagged(
      serviceIdentifier,
      PROVIDED_TAG,
      true
    );
  }

  isImported(serviceIdentifier: interfaces.ServiceIdentifier) {
    return this.container.isBoundTagged(serviceIdentifier, IMPORTED_TAG, true);
  }

  isCurrentImported(serviceIdentifier: interfaces.ServiceIdentifier) {
    return this.container.isCurrentBoundTagged(
      serviceIdentifier,
      IMPORTED_TAG,
      true
    );
  }

  bindProvider(provider: Provider) {
    bindProviderToContainer(provider, this.container);
  }

  copyBindings(
    container: ModuleContainer,
    serviceIdentifiers: interfaces.ServiceIdentifier[],
    metadata?: interfaces.Metadata,
    newConstraint?: interfaces.ConstraintFunction
  ) {
    this.container.copyBindings(
      container.container,
      serviceIdentifiers,
      metadata,
      newConstraint
    );
  }

  get<T = unknown>(serviceIdentifier: interfaces.ServiceIdentifier<T>) {
    return this.container.get<T>(serviceIdentifier);
  }

  getAll<T = unknown>(serviceIdentifier: interfaces.ServiceIdentifier<T>) {
    return this.container.getAll<T>(serviceIdentifier);
  }

  getProvided<T = unknown>(serviceIdentifier: interfaces.ServiceIdentifier<T>) {
    return this.container.getTagged<T>(serviceIdentifier, PROVIDED_TAG, true);
  }

  getAllProvided<T = unknown>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>
  ) {
    return this.container.getAllTagged<T>(
      serviceIdentifier,
      PROVIDED_TAG,
      true
    );
  }

  getImported<T = unknown>(serviceIdentifier: interfaces.ServiceIdentifier<T>) {
    return this.container.getTagged<T>(serviceIdentifier, IMPORTED_TAG, true);
  }

  getAllImported<T = unknown>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>
  ) {
    return this.container.getAllTagged<T>(
      serviceIdentifier,
      IMPORTED_TAG,
      true
    );
  }

  async unbindAllAsync() {
    await this.container.unbindAllAsync();
  }
}
