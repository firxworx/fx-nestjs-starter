export class UiContextResponseDto {
  user!: {
    uuid: string
    email: string | null
    name: string | null
    timeZone: string | null
  }
  data!: Record<string, unknown>
}
