export default {
    type: 'image',
    name: 'figure',
    options: {
      hotspot: true,
    },
    fields: [
      {
        name: 'caption',
        type: 'text',
        title: 'Caption',
        rows: 2,
      },
      {
        name: 'altText',
        type: 'string',
        title: 'Alt Text',
      },
      {
        name: 'outline',
        type: 'boolean',
        title: 'Outline',
        description:
          'Give images with white backgrounds a light outline to help them not disappear onto the page at the edges',
        initialValue: false,
        options: {
          layout: 'checkbox',
        },
      },
    ],
  }