import "reflect-metadata";

export const PARAM_METADATA = Symbol("PARAM_METADATA");

export enum FunctionParamType {
  CTX = "ctx",
  INPUT = "input",
  BODY = "body",
}

export interface FunctionParamMetadata {
  index: number;
  type: FunctionParamType;
}

/**
 * Create a parameter decorator for extension functions
 */
function createParamDecorator(type: FunctionParamType): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey === undefined) {
      throw new Error("Parameter decorators can only be used on method parameters");
    }

    const existingParams: FunctionParamMetadata[] =
      Reflect.getMetadata(PARAM_METADATA, target.constructor, propertyKey) ?? [];

    existingParams.push({
      index: parameterIndex,
      type,
    });

    Reflect.defineMetadata(PARAM_METADATA, existingParams, target.constructor, propertyKey);
  };
}

/**
 * Inject function context into the parameter
 *
 * @example
 * ```typescript
 * @Function("getAvailability")
 * async getAvailability(@Ctx() ctx: Context) {
 *   console.log(ctx.channel.id);
 * }
 * ```
 */
export const Ctx = (): ParameterDecorator => createParamDecorator(FunctionParamType.CTX);

/**
 * Inject validated input parameters
 *
 * @example
 * ```typescript
 * @Function("createBooking")
 * @InputSchema(CreateBookingInput)
 * async createBooking(@Ctx() ctx: Context, @Input() params: CreateBookingParams) {
 *   console.log(params.date);
 * }
 * ```
 */
export const Input = (): ParameterDecorator => createParamDecorator(FunctionParamType.INPUT);

/**
 * Inject raw request body
 *
 * @example
 * ```typescript
 * @Function("handleRaw")
 * async handleRaw(@Body() body: FunctionCallRequest) {
 *   console.log(body.method);
 * }
 * ```
 */
export const Body = (): ParameterDecorator => createParamDecorator(FunctionParamType.BODY);
