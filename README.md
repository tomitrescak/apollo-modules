# Apollo Modules

This set of helpers facilitates the use of GraphQL and Apollo, it allows you to define schemas splits based on domain elements (queries, mutations, resolvers)

[![npm](https://img.shields.io/npm/v/apollo-modules.svg?maxAge=1000)](https://www.npmjs.com/package/apollo-modules) 
[![Circle CI](https://circleci.com/gh/tomitrescak/apollo-modules.svg?style=shield)](https://circleci.com/gh/tomitrescak/apollo-modules) 
[![Coverage Status](https://coveralls.io/repos/github/tomitrescak/apollo-modules/badge.svg?branch=master)](https://coveralls.io/github/tomitrescak/apollo-modules?branch=master) 
![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)


# Server

```typescript
declare interface IApolloQueryDefinition {
  schema: string;
  queryText?: string;
  queries?: Object;
  resolvers?: Object;
  mutationText?: string;
  mutations?: Object;
  // allows you to modify apollo Options (e.g. context) based on current request
  modifyOptions?: (req: any, apolloOptions: ApolloOptions) => void 
}
```

Please see the section **Examples** examples on how to use the [domain element schema](#schema) and also how to use server helpers:

1. `addModules(definition: IApolloQueryDefinition[]): void`: compiles schema of several domain elements (Example: [Generating schemas](#generation))
2. `createServer(apolloOptions?: ApolloOptions, executableSchema?: any): (req: any) => IApolloOptions` provides easy initialisation of the Apollo server.
3. `ioSchema`: generates your defined schema type as both input and ouput type. This is used, when you want to be sending whole documents to GraphQL server and probably is not the best practice. When defining the IO type all you need to do is to append the $Input after the type name. (Example: [Advanced Schema](#ioschema))


# Examples

List of examples of common uses of our helpers

## Creating apollo server

In this example we load several mosules and initialise a new server instance

```ts
import dateModule from 'apollo-modules-date';
import myModule from './myApolloModule';
import { createServer, addModules } from 'apollo-modules';

const modules = addModules([ dateModule, myModule ]);
const schema = makeExecutableSchema({ typeDefs: modules.schema, resolvers: modules.resolvers });

const graphqlOptions = {
  context,
  modules, // this needs to be there if you use options
  schema
};

// init express
const app = ....
app.use('/graphql', apollo.apolloExpress(createServer(graphqlOptions)));
```


## Simple schema<a name="schema" id="schema"></a>

```typescript
import { Mongo } from 'meteor/mongo';
import { Exercises } from './exercise_schema';

export const Practicals = new Mongo.Collection<Cs.Collections.IPracticalDAO>('practicals');

const schema = `
  type Practical {
    _id: String
    name: String
    description: String
    exercises: [Exercise]
  }
`;

const queryText = `
  practical(id: String, userId: String): Practical
`;

const modifyOptions = (req: any, apolloOptions: ApolloOptions) {
  // modify context
  apolloOptions.context.myValue = "NewValue";
}

const queries = {
  practical(root: any, { id }: any, { userId }: Apollo.IApolloContext): Cs.Collections.IPracticalDAO {
    if (!userId) {
      return;
    }
    return Practicals.findOne({ _id: id });
  }
};

const resolvers = {
  Practical: {
    exercises(practical: Cs.Collections.IPracticalDAO) {
      return Exercises.find({ _id: { $in: practical.exercises } }).fetch();
    }
  }
};

const definition: IApolloDefinition = {
  schema,
  resolvers,
  queries,
  queryText,
  modifyOptions
};

export default definition;
```

## Schema with input/output elements <a name="schema" id="ioschema"></a>

```typescript
import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { ioSchema } from 'apollo-mantra/server';

declare global {
  
export const Exercises = new Mongo.Collection<Cs.Collections.IExerciseDAO>('exercises');
export const Questions = new Mongo.Collection<Cs.Collections.IQuestionDAO>('questions');
export const Possibilities = new Mongo.Collection<Cs.Collections.IQuestionPossibilitiesDAO>('possibilities');
export const Solutions = new Mongo.Collection<Cs.Collections.ISolutionDAO>('solutions');

const schema = `
  ${ioSchema(`Exercise$Input {
    _id: String
    name: String
    instructions: String
    group: String
    questions: [Question$Input]
  }`)}

  ${ioSchema(`Question$Input {
    _id: String
    description: String
    question: String
    expectedAnswer: String
    validation: String
    control: String
    possibilities: [Possibility$Input]
    points: Float
  }`)}

  ${ioSchema(`Possibility$Input {
    question: String
    answer: String
  }`)}

  type Solution {
    _id: String
    userId: String
    user: String
    semesterId: String
    practicalId: String
    exerciseId: String
    questionId: String
    userQuestion: String
    expectedAnswer: String
    userAnswer: String
    mark: Float
    created: Date
    modified: Date
    finished: Boolean
    tutorComment: String
  }
`;

const queryText = `
  exercise(id: String, userId: String): Exercise
  practicalSolutions(semesterId: String, practicalId: String, userId: String): [Solution]
  markingSolutions(semesterId: String, practicalId: String, lastModification: Date, userId: String): [Solution]
`;

const queries = {
  exercise(root: any, { id }: any, { user, userId }: Apollo.IApolloContext): Cs.Collections.IExerciseDAO {
    if (!user) {
      return null;
    }
    return Exercises.findOne({ _id: id });
  },
  markingSolutions(root: any, { semesterId, practicalId, lastModification }: any, { user }: Apollo.IApolloContext): Cs.Collections.ISolutionDAO[] {
    if (!user || user.roles.indexOf('tutor') === -1) {
      return [];
    }
    console.log(lastModification);
    return Solutions.find({ semesterId, practicalId, modified: { $gt: lastModification } }).fetch();
  },
  practicalSolutions(root: any, { semesterId, practicalId }: any, { userId, user }: Apollo.IApolloContext): Cs.Collections.ISolutionDAO[] {
    const options = { fields: { expectedAnswer: 0 } };
    return Solutions.find({ userId, semesterId, practicalId }, options).fetch();
  }
};

const mutationText = `
  mark(solutionIds: [String]!, comments: [String]!, marks: [Float]!): Boolean
  save(exercise: ExerciseInput): Boolean
`;

interface IActionAnswer {
  solutionIds: string[];
  userAnswers: string[];
  finished: boolean;
}

interface IActionMark {
  solutionIds: string[];
  comments: string[];
  marks: number[];
}

interface IActionSave {
  exercise: Cs.Entities.IExercise;
}

const mutations = {
  mark(root: any, { solutionIds, comments, marks }: IActionMark, { user, userId }: Apollo.IApolloContext) {
    // check for tutor
    if (!user.roles.find((r) => r === 'tutor')) {
      return;
    }

    let total = 0;
    for (let i = 0; i < solutionIds.length; i++) {
      let cm = marks[i] ? marks[i] : 0;
      Solutions.update({ _id: solutionIds[i] }, {
        $set: {
          mark: cm,
          tutorComment: comments[i]
        }
      });
    }
  },
  save(root: any, { exercise }: IActionSave, { user }: Apollo.IApolloContext) {
    if (!user.roles.find((r) => r === 'tutor')) {
      return;
    }

    // first update the exercise 
    Exercises.update({ _id: exercise._id }, {
      $set: {
        name: exercise.name,
        instructions: exercise.instructions,
        group: exercise.group,
        questions: exercise.questions.map((e) => e._id)
      }
    });

    // then update all questions
    for (let question of exercise.questions) {
      Questions.upsert({ _id: question._id }, { $set: question });
    }
  }
};

const resolvers = {
  Exercise: {
    questions(exercise: Cs.Collections.IExerciseDAO, params: any, { user }: Apollo.IApolloContext): Cs.Collections.IQuestionDAO[] {
      let options = {};
      if (!user.roles || user.roles.indexOf('tutor') === -1) {
        options = { fields: { expectedAnswer: 0, validation: 0, possibilities: 0 } };
      }
      return Questions.find({ _id: { $in: exercise.questions } }, options).fetch();
    }
  },
  Question: {
    possibilities(question: Cs.Collections.IQuestionDAO): Cs.Collections.IQuestionPossibilityDAO[] {
      if (question.possibilitiesGroupId) {
        return Possibilities.findOne({ _id: question.possibilitiesGroupId }).possibilities;
      } else {
        return null;
      }
    }
  }
};

const definition: IApolloDefinition = {
  schema,
  resolvers,
  queries,
  queryText,
  mutationText,
  mutations
};

export default definition;
```

