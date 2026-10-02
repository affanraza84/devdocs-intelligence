import {defineField, defineType} from 'sanity'

export const apiReference = defineType({
  name: 'apiReference',
  title: 'API Reference',
  type: 'document',

  fields: [
    defineField({
      name: 'name',
      title: 'API Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'product',
      title: 'Product',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'version',
      title: 'Version',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'apiType',
      title: 'API Type',
      type: 'string',
      options: {
        list: ['Function', 'Component', 'Hook', 'Class', 'CLI', 'Configuration', 'Other'],
      },
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 5,
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'parameters',
      title: 'Parameters',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              title: 'Name',
              type: 'string',
            },
            {
              name: 'type',
              title: 'Type',
              type: 'string',
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
            },
            {
              name: 'required',
              title: 'Required',
              type: 'boolean',
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'type',
            },
          },
        },
      ],
    }),

    defineField({
      name: 'example',
      title: 'Example',
      type: 'text',
      rows: 10,
    }),

    defineField({
      name: 'limitations',
      title: 'Limitations',
      type: 'array',
      of: [{type: 'string'}],
    }),

    defineField({
      name: 'relatedDocumentation',
      title: 'Related Documentation',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'documentation'}],
        },
      ],
    }),

    defineField({
      name: 'relatedMigrations',
      title: 'Related Migration Guides',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'migrationGuide'}],
        },
      ],
    }),

    defineField({
      name: 'sourceTitle',
      title: 'Source Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'sourceUrl',
      title: 'Source URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'product',
    },
  },
})
