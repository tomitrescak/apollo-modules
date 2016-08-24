module.exports = function(wallaby) {
  return {
    files: [
      'src/*.ts',
      '!src/*_spec.ts',
    ],

    tests: [
      'src/*_spec.ts'
    ],

    compilers: {
      '*.ts': wallaby.compilers.typeScript()
    },

    env: {
      type: 'node'
    },

    testFramework: 'mocha',
  };
};