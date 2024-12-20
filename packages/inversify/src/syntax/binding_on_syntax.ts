import { interfaces } from "../";
import { BindingWhenSyntax } from "./binding_when_syntax";

class BindingOnSyntax<T> implements interfaces.BindingOnSyntax<T> {
  private readonly _binding: interfaces.Binding<T>;

  constructor(binding: interfaces.Binding<T>) {
    this._binding = binding;
  }

  public onActivation(
    handler: interfaces.BindingActivation<T>
  ): interfaces.BindingWhenSyntax<T> {
    this._binding.onActivation = handler;
    return new BindingWhenSyntax<T>(this._binding);
  }

  public onDeactivation(
    handler: interfaces.BindingDeactivation<T>
  ): interfaces.BindingWhenSyntax<T> {
    this._binding.onDeactivation = handler;
    return new BindingWhenSyntax<T>(this._binding);
  }
}

export { BindingOnSyntax };
