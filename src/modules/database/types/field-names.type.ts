/**
 * Field (property) names, where all property names are of type `string` of the given object `T`.
 */
export type FieldNames<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [P in keyof T]: T[P] extends Function ? never : P // (...args: any[]) => any
}[keyof T]

// export type FieldNames<T> = Exclude<
//   {
//     // eslint-disable-next-line @typescript-eslint/ban-types
//     [P in keyof T]: T[P] extends Function ? never : P // (...args: any[]) => any
//   }[keyof T],
//   number | symbol
// >
