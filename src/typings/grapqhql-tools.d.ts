declare module 'graphql-tools' {
  interface IExecutableSchemaDefinition {
    typeDefs: any[];
    resolvers: any[];
  }
  export function makeExecutableSchema(definition: IExecutableSchemaDefinition): any;
}