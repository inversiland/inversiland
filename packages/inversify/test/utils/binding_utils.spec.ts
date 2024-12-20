import { Binding } from "../../src/bindings/binding";
import { getFactoryDetails } from "../../src/utils/binding_utils";

describe("getFactoryDetails", () => {
  it("should thrown an exception non factory binding.type", () => {
    const binding: Binding<unknown> = new Binding("", "Singleton");
    binding.type = "Instance";
    expect(() => getFactoryDetails(binding)).toThrow(
      "Unexpected factory type Instance"
    );
  });
});
