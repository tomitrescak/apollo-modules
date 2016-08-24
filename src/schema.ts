import { makeExecutableSchema } from 'graphql-tools';

import './polyfills';

interface ApolloOptions {
  schema?: any;
  context?: any; // value to be used as context in resolvers
  rootValue?: any;
  formatError?: Function; // function used to format errors before returning them to clients
  validationRules?: Array<any>; // additional validation rules to be applied to client-specified queries
  formatParams?: Function; // function applied for each query in a batch to format parameters before passing them to `runQuery`
  formatResponse?: Function; // function applied to each response before returning data to clients
  modules: {
    schema: any[];
    resolver: any;
    options: any[];
  };
};

interface IApolloOption {
  (req: any, apolloOptions: ApolloOptions): ApolloOptions;
}

export interface IApolloModule {
  schema: string;
  queries?: Object;
  resolvers?: Object;
  mutations?: Object;
  queryText?: string;
  mutationText?: string;
  modifyOptions?: IApolloOption;
}


export function init() {
  // schema = [];
  // resolver = {};
}

// export function schemas() { return schema; }
// export function resolvers() { return resolver; }
export function addModules(apolloDefinitions: IApolloModule[]) {
  let queries = '';
  let mutations = '';
  let options: IApolloOption[] = [];

  let schema: any[] = [];
  let resolver: any = {
  };

  for (let apolloDefinition of apolloDefinitions) {
    if (apolloDefinition.modifyOptions) {
      options.push(apolloDefinition.modifyOptions);
    }

    if (apolloDefinition.schema) {
      schema.push(apolloDefinition.schema);
    }

    if (apolloDefinition.queries) {
      if (!resolver['RootQuery']) {
        resolver['RootQuery'] = {};
      }
      Object.assign(resolver['RootQuery'], apolloDefinition.queries);
    }

    if (apolloDefinition.mutations) {
      if (!resolver['RootMutation']) {
        resolver['RootMutation'] = {};
      }
      Object.assign(resolver['RootMutation'], apolloDefinition.mutations);
    }

    if (apolloDefinition.resolvers) {
      Object.assign(resolver, apolloDefinition.resolvers);
    }

    if (apolloDefinition.queryText) {
      queries += apolloDefinition.queryText + '\n';
    }

    if (apolloDefinition.mutationText) {
      mutations += apolloDefinition.mutationText + '\n';
    }
  }

  // add all the queries and mutations

  queries = `
    type RootQuery {
      ${queries}
    }
    `;
  schema.push(queries);


  if (mutations) {
    mutations = `
    type RootMutation {
      ${mutations}
    }
    `;
    schema.push(mutations);
  }

  schema.push(`
    schema {
      ${queries ? 'query: RootQuery' : ''}
      ${mutations ? 'mutation: RootMutation' : ''}
    }
  `);

  return {
    schema,
    resolver,
    options
  };
}

export function createServer(apolloOptions?: ApolloOptions, executableSchema?: any) {
  const { schema, resolver, options } = apolloOptions.modules;

  apolloOptions.schema = executableSchema ? executableSchema : makeExecutableSchema({ typeDefs: schema, resolvers: resolver });

  return function (req?: any) {
    // process all option modifiers
    if (options.length === 1) {
      options[0](req, apolloOptions);
    } else if (options.length > 1) {
      options.forEach((o) => o(req, apolloOptions));
    }

    return apolloOptions;
  };
}
