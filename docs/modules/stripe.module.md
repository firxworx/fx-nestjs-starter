# StripeModule

To import `StripeModule` into a given module, add the following to its `imports` array:

```ts
@Module({
  imports: [
    // ...
    StripeModule.register({
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

This module supports async registration for cases where you may need to import other modules and inject their exported members.

A common requirement is to import `ConfigService` using NestJS' DI implementation.

The following example imports `ConfigModule` and injects it as arguments of the `useFactory` function. The `useFactory` property supports both async and non-async (synchronous) functions.

```ts
@Module({
  imports: [
    // ...
    StripeModule.registerAsync({
      imports: [ConfigModule], // this line is only required if ConfigModule is not globally imported in the app
      inject: [ConfigService],
      useFactory: (config: ConfigService): StripeModuleOptions => {
        const stripeConfig = config.get<StripeConfig>('stripe')

        if (!stripeConfig) {
          throw new Error('Error resolving Stripe config')
        }

        return {
          ...stripeConfig,
        }
      },
    }),
    // ...
  ]
})
```

Both `StripeConfig` and `StripeModuleOptions` can be found in `src/modules/stripe/types`.
