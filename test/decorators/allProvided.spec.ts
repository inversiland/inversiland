import { injectable } from "inversify";
import {
  InversifySugar,
  PROVIDED_TAG,
  getModuleContainer,
  module,
} from "../../src";
import allProvided from "../../src/decorators/allProvided";

describe("@allProvided", () => {
  afterAll(() => {
    InversifySugar.reset();
  });

  it("Should inject all the services provided with the same identifier.", () => {
    @injectable()
    class TestService {}

    @injectable()
    class TestController {
      constructor(
        @allProvided(TestService) public readonly testServices: TestService[]
      ) {}
    }

    @module({
      providers: [TestService, TestService, TestService, TestController],
    })
    class AppModule {}

    InversifySugar.run(AppModule);

    const appModuleContainer = getModuleContainer(AppModule);

    expect(
      appModuleContainer.getTagged(TestController, PROVIDED_TAG, true)
        .testServices
    ).toHaveLength(3);
  });
});
