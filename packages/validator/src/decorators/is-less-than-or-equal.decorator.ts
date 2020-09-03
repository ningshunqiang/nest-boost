import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from "class-validator";

export function IsLessThanOrEqual(
  relatedPropertyKey: string,
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return (target: unknown, propertyKey: string) => {
    registerDecorator({
      name: "isLessThanOrEqual",
      target: target.constructor,
      propertyName: propertyKey,
      constraints: [relatedPropertyKey],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyKey] = args.constraints;
          const relatedValue = args.object[relatedPropertyKey];

          return (
            typeof value === "number" &&
            typeof relatedValue === "number" &&
            value < relatedValue
          );
        },
        defaultMessage(args?: ValidationArguments): string {
          const [relatedPropertyKey] = args.constraints;

          return `${propertyKey} has to be less than or equal ${relatedPropertyKey}`;
        },
      },
    });
  };
}
