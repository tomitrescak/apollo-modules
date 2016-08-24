export function ioSchema(body: string) {
  return `
  type ${body.replace(/\$Input/g, '')}
  input ${body.replace(/\$Input/g, 'Input')}
  `;
}

export function modificationSchema() {
  return `
    createdById: String
    createdBy: String
    createdAt: Date
    updatedById: String
    updatedBy: String
    updatedAt: Date
  `;
}
