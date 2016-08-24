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
    resolvers: any;
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
  let resolvers: any = {
  };

  for (let apolloDefinition of apolloDefinitions) {
    if (apolloDefinition.modifyOptions) {
      options.push(apolloDefinition.modifyOptions);
    }

    if (apolloDefinition.schema) {
      schema.push(apolloDefinition.schema);
    }

    if (apolloDefinition.queries) {
      if (!resolvers['RootQuery']) {
        resolvers['RootQuery'] = {};
      }
      Object.assign(resolvers['RootQuery'], apolloDefinition.queries);
    }

    if (apolloDefinition.mutations) {
      if (!resolvers['RootMutation']) {
        resolvers['RootMutation'] = {};
      }
      Object.assign(resolvers['RootMutation'], apolloDefinition.mutations);
    }

    if (apolloDefinition.resolvers) {
      Object.assign(resolvers, apolloDefinition.resolvers);
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
    resolvers,
    options
  };
}

export function createServer(apolloOptions?: ApolloOptions) {
  const { schema, resolvers, options } = apolloOptions.modules;

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
