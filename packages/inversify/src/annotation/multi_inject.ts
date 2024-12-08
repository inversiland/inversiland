import { LazyServiceIdentifier } from "@inversiland/common";

import { interfaces } from "../";
import * as METADATA_KEY from "../constants/metadata_keys";
import { DecoratorTarget } from "./decorator_utils";
import { injectBase } from "./inject_base";

const multiInject: <T = unknown>(
  serviceIdentifier: interfaces.ServiceIdentifier<T> | LazyServiceIdentifier<T>
) => (
  target: DecoratorTarget,
  targetKey?: string | symbol,
  indexOrPropertyDescriptor?: number | TypedPropertyDescriptor<T>
) => void = injectBase(METADATA_KEY.MULTI_INJECT_TAG);

export { multiInject };
