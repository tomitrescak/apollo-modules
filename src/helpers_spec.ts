import { expect } from 'chai';

import { ioSchema, modificationSchema } from './helpers';

describe('helpers', () => {
  it('creates io schema', () => {
    const result = ioSchema('test$Input');
    expect(result).to.match(/type test/);
    expect(result).to.match(/input testInput/);
  });

  it('provides modification properties', () => {
    expect(modificationSchema()).to.equal(`
    createdById: String
    createdBy: String
    createdAt: Date
    updatedById: String
    updatedBy: String
    updatedAt: Date
  `);
  });
});
