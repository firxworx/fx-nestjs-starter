# StripeModule

The Stripe Module exports a `StripeService` that implements common Stripe features using the Stripe SDK. You can import it in your controllers, services, etc.

To use the `StripeService`, import `StripeModule` into your module by adding it to `imports` array of your module's meta data.

To make the `StripeService` available globally, add it to the `AppModule` imports and pass the configuration option `global: true`.

Then inject an instance of `StripeService` into your controller/service/etc via NestJS DI by adding it as an argument to your constructor:

```ts
export class ExampleService {
  constructor(private readonly stripeService: StripeService) {}
  //
}
```

To import `StripeModule` in a given module, add the following to its `imports` array:

```ts
@Module({
  imports: [
    // ...
    StripeModule.register({
      // global: true // if importing in AppModule as a global import
      apiKey:
        'XXXX',
      stripeConfig: {
        apiVersion: '2020-08-27',
      },
    }),
    // ...
  ]
})
```

The `StripeModule` supports async registration for cases where you may need to import other modules and inject their exported members.

A common requirement is to import `ConfigService` using NestJS' DI implementation.

The following example imports `ConfigModule` and injects it as arguments of the `useFactory` function. The `useFactory` property supports both async and non-async (synchronous) functions.

```ts
@Module({
  imports: [
    // ...
    StripeModule.registerAsync({
      imports: [ConfigModule], // this line is only required if ConfigModule is not already imported globally
      inject: [ConfigService],
      useFactory: (config: ConfigService): StripeModuleOptions => {
        const stripeConfig = config.get<StripeConfig>('stripe')

        if (!stripeConfig) {
          throw new Error('Error resolving Stripe config')
        }

        return {
          // global: true // if importing in AppModule as a global import
          ...stripeConfig,
        }
      },
    }),
    // ...
  ]
})
```

Both `StripeConfig` and `StripeModuleOptions` can be found in `src/modules/stripe/types`.
