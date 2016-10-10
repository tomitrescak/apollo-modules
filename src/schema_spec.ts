import { expect } from 'chai';

import { addModules, createServer, init, IApolloModule } from './schema';

describe('create schema', () => {
  beforeEach(() => { init(); });

  it('adds options text', () => {
    const schema: IApolloModule = {
      schema: '',
      modifyOptions: (req: any, options: any) => null
    };
    const result = addModules([schema]);
    expect(result.options.length).to.equal(1);
    expect(result.options[0](null, null)).to.be.null;
  });

  it('adds schema text', () => {
    const schema: IApolloModule = {
      schema: 'schemaText'
    };
    const result = addModules([schema]);
    expect(result.schema[0]).to.equal('schemaText');
    expect(result.schema[1]).to.match(/type Query {\W*}/);
  });

  it('adds query text', () => {
    const schema: IApolloModule = {
      schema: '',
      queryText: 'query'
    };
    const result = addModules([schema]);
    expect(result.schema.length).to.equal(1);
    expect(result.schema[0]).to.match(/type Query {\W*query/);
  });

  it('adds queries', () => {
    const schema: IApolloModule = {
      schema: '',
      queries: {
        query_1() { /* */ }
      }
    };
    const result = addModules([schema]);
    expect(result.resolvers.Query).to.exist;
    expect(result.resolvers.Query.query_1).to.exist;
    expect(result.resolvers.Mutation).not.to.exist;
  });

  it('adds mutation text', () => {
    const schema: IApolloModule = {
      schema: '',
      mutationText: 'mutation'
    };
    const result = addModules([schema]);
    expect(result.schema.length).to.equal(2);
    expect(result.schema[0]).to.match(/type Query {\W*}/);
    expect(result.schema[1]).to.match(/type Mutation {\W*mutation/);
  });

  it('adds mutations', () => {
    const schema: IApolloModule = {
      schema: '',
      mutations: {
        mutation_1() {/* */ }
      }
    };
    const result = addModules([schema]);
    expect(result.resolvers.Query).not.to.exist;
    expect(result.resolvers.Mutation).to.exist;
    expect(result.resolvers.Mutation.mutation_1).to.exist;
  });

  it('adds resolvers', () => {
    const schema: IApolloModule = {
      schema: '',
      resolvers: {
        resolver_1() { /* */ }
      }
    };
    const result = addModules([schema]);
    expect(result.resolvers.Query).not.to.exist;
    expect(result.resolvers.Mutation).not.to.exist;
    expect(result.resolvers.resolver_1).to.exist;
  });
});

describe('createServer', () => {
  it('creates schema and processes every request', () => {
    init();
    const schema: IApolloModule = {
      schema: '',
      queryText: 'getA: String',
    };
    const modules = addModules([schema]);
    const optionModifier = createServer({ rootValue: 1, modules });
    const options = optionModifier();

    expect(options.rootValue).to.equal(1);
  });

  it('processes options request', () => {
    init();
    const schema: IApolloModule = {
      schema: '',
      queryText: 'getA: String',
      modifyOptions: (req: any, options: any) => { options.A = true; return options; }
    };
    const modules = addModules([schema]);
    const optionModifier = createServer({ rootValue: 1, modules });
    const options = optionModifier();

    expect(options['A']).to.equal(true);
  });

  it('processes multiple options request', () => {
    init();
    const schema1: IApolloModule = {
      schema: '',
      queryText: 'getA: String',
      modifyOptions: (req: any, options: any) => { options.A = true; return options; }
    };
    const schema2: IApolloModule = {
      schema: '',
      queryText: 'getB: String',
      modifyOptions: (req: any, options: any) => { options.B = true; return options; }
    };
    const modules = addModules([schema1, schema2]);
    const optionModifier = createServer({ rootValue: 1, modules });
    const options = optionModifier();

    expect(options['A']).to.equal(true);
    expect(options['B']).to.equal(true);
  });
});
