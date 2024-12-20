import { ServiceIdentifier } from "@inversiland/common";

import { BindingMetadata } from "./BindingMetadata";
import { BindingType } from "./BindingType";

export interface BaseBinding<TType extends BindingType, TActivated> {
  readonly id: number;
  readonly moduleId: number | undefined;
  readonly serviceIdentifier: ServiceIdentifier<TActivated>;
  readonly type: TType;

  isSatisfiedBy(metadata: BindingMetadata): boolean;
}
