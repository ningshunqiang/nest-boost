import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from "class-validator";

export function IsGreaterThanOrEqual(
  relatedPropertyKey: string,
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return (target: unknown, propertyKey: string) => {
    registerDecorator({
      name: "isGreaterThanOrEqual",
      target: target.constructor,
      propertyName: propertyKey,
      constraints: [relatedPropertyKey],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyKey] = args.constraints;
          const relatedValue = args.object[relatedPropertyKey];

          return Number(value) >= Number(relatedValue);
        },
        defaultMessage(args?: ValidationArguments): string {
          const [relatedPropertyKey] = args.constraints;

          return `${propertyKey} has to be greater than or equal ${relatedPropertyKey}`;
        },
      },
    });
  };
}
